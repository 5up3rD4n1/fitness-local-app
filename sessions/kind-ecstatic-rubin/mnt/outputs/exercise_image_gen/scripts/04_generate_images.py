"""
Drive ComfyUI to generate one image per (exercise, phase) pair using:
  - Flux.1 dev/schnell
  - Style LoRA (lnart_style_v1)
  - ControlNet OpenPose (skeleton per exercise+phase)
  - PuLID / IP-Adapter (character reference)

Outputs raw_poses/{slug}_{phase}.png
"""
import json
import yaml
import uuid
import time
import urllib.request
import urllib.parse
import websocket
from pathlib import Path
from tqdm import tqdm

ROOT = Path(__file__).parent.parent
CONFIG = yaml.safe_load((ROOT / "config.yaml").read_text())
PROMPTS = json.loads((ROOT / "prompts.json").read_text())
WORKFLOW = json.loads((ROOT / CONFIG["comfyui"]["workflow_path"]).read_text())
OUT_DIR = ROOT / CONFIG["output"]["raw_dir"]
OUT_DIR.mkdir(exist_ok=True)
SKELETONS = ROOT / "pose_skeletons"

COMFY_HOST = CONFIG["comfyui"]["host"].replace("http://", "")
CLIENT_ID = str(uuid.uuid4())


def queue_prompt(workflow):
    p = {"prompt": workflow, "client_id": CLIENT_ID}
    data = json.dumps(p).encode("utf-8")
    req = urllib.request.Request(f"http://{COMFY_HOST}/prompt", data=data)
    return json.loads(urllib.request.urlopen(req).read())


def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"http://{COMFY_HOST}/view?{url_values}") as r:
        return r.read()


def wait_for_completion(prompt_id):
    ws = websocket.WebSocket()
    ws.connect(f"ws://{COMFY_HOST}/ws?clientId={CLIENT_ID}")
    while True:
        out = ws.recv()
        if isinstance(out, str):
            msg = json.loads(out)
            if msg.get("type") == "executing":
                d = msg.get("data", {})
                if d.get("node") is None and d.get("prompt_id") == prompt_id:
                    break
    ws.close()


def fetch_history(prompt_id):
    with urllib.request.urlopen(f"http://{COMFY_HOST}/history/{prompt_id}") as r:
        return json.loads(r.read())[prompt_id]


def build_workflow(prompt_pos, prompt_neg, skeleton_path, seed):
    """Patch the workflow template with current parameters.
    Node IDs are project-specific — adjust the keys to match workflows/flux_openpose.json.
    """
    wf = json.loads(json.dumps(WORKFLOW))  # deep copy
    # The exact node IDs depend on the workflow JSON. Conventions used:
    #   "6": positive CLIP text encode
    #   "7": negative CLIP text encode
    #   "20": LoadImage for control net (openpose skeleton)
    #   "3": KSampler (seed lives here)
    wf["6"]["inputs"]["text"] = prompt_pos
    wf["7"]["inputs"]["text"] = prompt_neg
    wf["20"]["inputs"]["image"] = str(skeleton_path)
    wf["3"]["inputs"]["seed"] = seed
    return wf


def main():
    seed_base = 42
    for ex in tqdm(PROMPTS, desc="Generating images"):
        if "error" in ex:
            continue
        for phase in ("start", "end"):
            out_path = OUT_DIR / f"{ex['slug']}_{phase}.png"
            if out_path.exists():
                continue
            skeleton = SKELETONS / f"{ex['slug']}_{phase}.png"
            if not skeleton.exists():
                print(f"  SKIP {ex['slug']}_{phase}: missing skeleton at {skeleton}")
                continue
            pos = ex["prompts"][phase]
            neg = ex["prompts"]["negative"]
            seed = seed_base + hash((ex["slug"], phase)) % (10**6)
            wf = build_workflow(pos, neg, skeleton, seed)
            try:
                resp = queue_prompt(wf)
                wait_for_completion(resp["prompt_id"])
                hist = fetch_history(resp["prompt_id"])
                # Find first output image
                for node_id, node_out in hist["outputs"].items():
                    if "images" in node_out:
                        img = node_out["images"][0]
                        data = get_image(img["filename"], img.get("subfolder", ""), img["type"])
                        out_path.write_bytes(data)
                        break
            except Exception as e:
                print(f"  WARN {ex['slug']}_{phase}: {e}")
                time.sleep(2)


if __name__ == "__main__":
    main()
