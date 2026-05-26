"""
Use Llama 3.2 Vision (via Ollama) to validate each raw image against criteria.
If it fails, optionally trigger a regeneration with revised parameters.

Outputs:
  - approved_poses/{slug}_{phase}.png (copies that passed)
  - qa_report.json with verdicts
"""
import json
import base64
import shutil
import yaml
import ollama
from pathlib import Path
from tqdm import tqdm

ROOT = Path(__file__).parent.parent
CONFIG = yaml.safe_load((ROOT / "config.yaml").read_text())
RAW = ROOT / CONFIG["output"]["raw_dir"]
APPROVED = ROOT / CONFIG["output"]["approved_dir"]
APPROVED.mkdir(exist_ok=True)
PROMPTS = json.loads((ROOT / "prompts.json").read_text())
REPORT = ROOT / "qa_report.json"

QA_SYSTEM = """You are a strict visual QA reviewer for an exercise illustration pipeline.
You will receive (a) one generated image and (b) a description of what should be in it.
Reply ONLY with a JSON object:
{
  "pose_correct": true|false,
  "equipment_correct": true|false,
  "style_correct": true|false,
  "no_artifacts": true|false,
  "overall_pass": true|false,
  "issues": ["concise list of problems if any"]
}

Pass criteria for style_correct: clean black line art on white/near-white background, no photorealism, no heavy shading, no color, no text overlay.
Pass criteria for no_artifacts: no deformed hands, no extra limbs, equipment intact, only one person.
overall_pass = all four booleans true.
"""


def encode_image(p: Path) -> str:
    return base64.b64encode(p.read_bytes()).decode("utf-8")


def review(image_path: Path, description: str) -> dict:
    client = ollama.Client(host=CONFIG["ollama"]["host"])
    r = client.chat(
        model=CONFIG["ollama"]["vision_model"],
        messages=[
            {"role": "system", "content": QA_SYSTEM},
            {
                "role": "user",
                "content": f"Required content:\n{description}\n\nEvaluate the attached image.",
                "images": [encode_image(image_path)],
            },
        ],
        format="json",
        options={"temperature": 0.1},
    )
    return json.loads(r["message"]["content"])


def main():
    report = []
    for ex in tqdm(PROMPTS, desc="QA"):
        if "prompts" not in ex:
            continue
        for phase in ("start", "end"):
            img_path = RAW / f"{ex['slug']}_{phase}.png"
            if not img_path.exists():
                continue
            desc = ex["prompts"][phase]
            try:
                verdict = review(img_path, desc)
            except Exception as e:
                verdict = {"overall_pass": False, "issues": [f"reviewer error: {e}"]}
            entry = {"slug": ex["slug"], "phase": phase, "verdict": verdict}
            report.append(entry)
            if verdict.get("overall_pass"):
                shutil.copy(img_path, APPROVED / img_path.name)

    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    passed = sum(1 for e in report if e["verdict"].get("overall_pass"))
    print(f"Passed: {passed}/{len(report)}")


if __name__ == "__main__":
    main()
