"""
Read exercises.json, ask a local Ollama LLM (Qwen 2.5) to expand each exercise
into a pair of highly detailed prompts (start + end pose) suitable for Flux.1 + ControlNet.

Outputs: prompts.json
"""
import json
import yaml
import ollama
from pathlib import Path
from tqdm import tqdm

ROOT = Path(__file__).parent.parent
CONFIG = yaml.safe_load((ROOT / "config.yaml").read_text())
EXERCISES = json.loads((ROOT / "exercises.json").read_text())
OUT = ROOT / "prompts.json"

SYSTEM = """You are an expert prompt engineer for the Flux.1 image generation model.
Your job is to take a structured exercise description and produce two prompts:
one for the STARTING pose and one for the ENDING (peak contraction) pose.

Hard rules for every prompt you write:
- Start with the literal trigger phrase: "LNART_STYLE, athletic woman with ponytail,"
- Specify "clean black line art illustration, white background, thin consistent line weight, no shading, no text"
- Describe the exact body posture in anatomical terms (joint angles, spine position, weight distribution)
- Describe the equipment precisely as it appears in the description, including any straps/cuffs/grips
- Always specify the view (side / front / 3-quarter) given in the input
- End with: "fitness manual illustration aesthetic, anatomically correct, balanced composition"
- Keep each prompt 60-100 words.
- Output ONLY a JSON object: { "start": "...", "end": "...", "negative": "..." }
- The "negative" prompt must list: photorealistic, color, gradient shading, 3D render, multiple people, text, watermark, deformed hands, extra limbs, distorted equipment, cluttered background, low quality
- DO NOT add commentary, prose, or markdown fences. Pure JSON.
"""

USER_TMPL = """Exercise: {name_en} ({name_es})
Equipment: {equipment}
View: {view}
Primary muscles: {muscles}
Starting pose: {start_pose}
Ending pose: {end_pose}

Character profile: {char}
Style profile: {style}

Produce the JSON object now."""

def call_llm(payload):
    client = ollama.Client(host=CONFIG["ollama"]["host"])
    r = client.chat(
        model=CONFIG["ollama"]["orchestrator_model"],
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": payload},
        ],
        options={"temperature": CONFIG["ollama"]["temperature"]},
        format="json",
    )
    return json.loads(r["message"]["content"])


def main():
    char = json.dumps(EXERCISES["character_profile"], ensure_ascii=False)
    style = json.dumps(EXERCISES["style_profile"], ensure_ascii=False)
    out = []
    for ex in tqdm(EXERCISES["exercises"], desc="Generating prompts"):
        payload = USER_TMPL.format(
            name_en=ex["name_en"],
            name_es=ex["name_es"],
            equipment=ex["equipment"],
            view=ex["view"],
            muscles=", ".join(ex["primary_muscles"]),
            start_pose=ex["start_pose"],
            end_pose=ex["end_pose"],
            char=char,
            style=style,
        )
        try:
            result = call_llm(payload)
            out.append({
                "slug": ex["slug"],
                "day": ex["day"],
                "name_es": ex["name_es"],
                "name_en": ex["name_en"],
                "reps": ex["reps"],
                "sets": ex["sets"],
                "view": ex["view"],
                "prompts": result,
            })
        except Exception as e:
            print(f"  WARN: failed on {ex['slug']}: {e}")
            out.append({"slug": ex["slug"], "error": str(e)})

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"Wrote {OUT} ({len(out)} exercises)")


if __name__ == "__main__":
    main()
