"""
Compose the final image: start_pose + end_pose side-by-side + reps/sets text.
Output: final/{slug}.png
"""
import json
import yaml
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from tqdm import tqdm

ROOT = Path(__file__).parent.parent
CONFIG = yaml.safe_load((ROOT / "config.yaml").read_text())
APPROVED = ROOT / CONFIG["output"]["approved_dir"]
FINAL = ROOT / CONFIG["output"]["final_dir"]
FINAL.mkdir(exist_ok=True)
PROMPTS = json.loads((ROOT / "prompts.json").read_text())

W, H = CONFIG["composition"]["canvas_size"]
BG = CONFIG["composition"]["bg_color"]
COL_REPS = CONFIG["composition"]["text_color_reps"]
COL_SETS = CONFIG["composition"]["text_color_sets"]
FONT_PATH = ROOT / CONFIG["composition"]["font_path"]
FS_REPS = CONFIG["composition"]["reps_font_size"]
FS_SETS = CONFIG["composition"]["sets_font_size"]
SPACING = CONFIG["composition"]["pose_spacing"]
MAX_POSE_H = CONFIG["composition"]["pose_max_height"]


def fit(img: Image.Image, max_h: int) -> Image.Image:
    if img.height <= max_h:
        return img
    r = max_h / img.height
    return img.resize((int(img.width * r), max_h), Image.LANCZOS)


def compose(slug: str, name_en: str, reps, sets) -> bool:
    s = APPROVED / f"{slug}_start.png"
    e = APPROVED / f"{slug}_end.png"
    if not (s.exists() and e.exists()):
        return False
    a = fit(Image.open(s).convert("RGBA"), MAX_POSE_H)
    b = fit(Image.open(e).convert("RGBA"), MAX_POSE_H)
    canvas = Image.new("RGBA", (W, H), BG)
    total_w = a.width + SPACING + b.width
    x0 = (W - total_w) // 2
    y0 = 40
    canvas.paste(a, (x0, y0), a)
    canvas.paste(b, (x0 + a.width + SPACING, y0), b)

    draw = ImageDraw.Draw(canvas)
    try:
        f_reps = ImageFont.truetype(str(FONT_PATH), FS_REPS)
        f_sets = ImageFont.truetype(str(FONT_PATH), FS_SETS)
    except OSError:
        f_reps = ImageFont.load_default()
        f_sets = ImageFont.load_default()

    text_reps = f"{reps} {name_en}" if reps else name_en
    text_sets = f"x {sets} sets" if sets else ""
    text_y = y0 + MAX_POSE_H + 60
    draw.text((x0, text_y), text_reps, font=f_reps, fill=COL_REPS)
    if text_sets:
        text_x = x0 + draw.textlength(text_reps + "  ", font=f_reps)
        draw.text((text_x, text_y), text_sets, font=f_sets, fill=COL_SETS)

    out = FINAL / f"{slug}.png"
    canvas.convert("RGB").save(out, optimize=True)
    return True


def main():
    ok = 0
    for ex in tqdm(PROMPTS, desc="Composing"):
        if compose(ex["slug"], ex.get("name_en", ex["slug"]), ex.get("reps"), ex.get("sets")):
            ok += 1
    print(f"Composed: {ok}/{len(PROMPTS)}")


if __name__ == "__main__":
    main()
