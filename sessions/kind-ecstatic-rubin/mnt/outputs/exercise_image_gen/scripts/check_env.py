"""
Pre-flight checks for the pipeline. Run this first.
"""
import shutil
import sys
import subprocess
import urllib.request
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
OK = "\033[92mOK\033[0m"
FAIL = "\033[91mFAIL\033[0m"
WARN = "\033[93mWARN\033[0m"


def has_cmd(name):
    return shutil.which(name) is not None


def python_pkg(name):
    try:
        __import__(name)
        return True
    except ImportError:
        return False


def gpu_info():
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
            text=True, timeout=5,
        ).strip()
        return out
    except Exception:
        return None


def ollama_ok(host="http://localhost:11434"):
    try:
        r = urllib.request.urlopen(f"{host}/api/tags", timeout=3)
        return json.loads(r.read())["models"]
    except Exception:
        return None


def comfyui_ok(host="http://localhost:8188"):
    try:
        urllib.request.urlopen(f"{host}/system_stats", timeout=3)
        return True
    except Exception:
        return False


def check(label, cond, hint=""):
    print(f"  {OK if cond else FAIL}  {label}{'' if cond else f'  → {hint}'}")
    return cond


def main():
    print("\n== Environment check ==\n")
    all_ok = True

    print("[Python]")
    all_ok &= check(f"Python {sys.version.split()[0]} >= 3.11", sys.version_info >= (3, 11),
                    "Install Python 3.11 or newer")
    for pkg in ("torch", "diffusers", "transformers", "ollama", "PIL", "yaml", "websocket"):
        all_ok &= check(f"package: {pkg}", python_pkg(pkg.replace('PIL', 'PIL').replace('yaml', 'yaml')),
                        f"pip install -r requirements.txt")

    print("\n[GPU]")
    gpu = gpu_info()
    if gpu:
        check(f"NVIDIA GPU detected: {gpu}", True)
    else:
        check("NVIDIA GPU detected", False,
              "No nvidia-smi found. Need CUDA-capable GPU (or adapt for ROCm/MPS).")
        all_ok = False

    print("\n[Ollama]")
    models = ollama_ok()
    if models is not None:
        names = [m["name"] for m in models]
        all_ok &= check("Ollama daemon running", True)
        all_ok &= check("qwen2.5:32b pulled",
                        any("qwen2.5:32b" in n for n in names),
                        "ollama pull qwen2.5:32b")
        all_ok &= check("llama3.2-vision:11b pulled",
                        any("llama3.2-vision:11b" in n for n in names),
                        "ollama pull llama3.2-vision:11b")
    else:
        check("Ollama daemon running", False, "Start with: ollama serve")
        all_ok = False

    print("\n[ComfyUI]")
    all_ok &= check("ComfyUI reachable @ :8188", comfyui_ok(),
                    "Start ComfyUI: python main.py --listen --port 8188")

    print("\n[Project files]")
    for f in ["exercises.json", "config.yaml", "workflows/flux_openpose.json"]:
        all_ok &= check(f"present: {f}", (ROOT / f).exists(),
                        f"Missing — see SPEC.md")

    for d in ["style_reference", "pose_skeletons"]:
        p = ROOT / d
        ok = p.exists() and any(p.iterdir())
        check(f"populated: {d}/", ok,
              f"Empty — needs assets before running the pipeline")

    print()
    if all_ok:
        print(f"  {OK}  Environment ready. Proceed with: python scripts/03_orchestrate_prompts.py\n")
    else:
        print(f"  {FAIL}  Fix the items above before continuing.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
