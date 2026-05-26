"""
Transition/animation module: chained frame generation -> animated GIF per exercise.

Each frame is generated with the PREVIOUS frame fed back as context, plus the canonical
FRAME-0 (to anchor camera/scale/equipment) and the style + character references. Only the
moving joints advance a small, natural increment per frame -> smooth motion, no drift.

Motion types (drive frame count and how the GIF loops):
  rep    : start -> end, GIF plays forward then reverses (ping-pong) = one full up/down rep
  cyclic : a seamless loop (end ~= start), GIF plays straight through and repeats
  hold   : isometric, single frame, no GIF

Usage:
  python scripts/animate_gemini.py air-squat
  python scripts/animate_gemini.py air-squat puente-gluteo-banda --fps 8
  python scripts/animate_gemini.py air-squat --frames 9     # override keyframe count
"""
import os
import sys
import json
import time
from pathlib import Path

from google import genai
from google.genai import types

# Reuse the validated single-frame placement specs & style rules.
from test_gemini import (
    ROOT, STYLE_REF, CHAR_REF_PATH, MODEL, IMAGE_SIZE, ASPECT,
    CHAR_PROFILE, STYLE_RULES, NEGATIVE, FRAMING, PLACEMENT,
    part_from_file, generate,
)

ANIM_DIR = ROOT / "anim"
ANIM_DIR.mkdir(exist_ok=True)

# Per-exercise animation metadata. start/end come from PLACEMENT; here we add how the
# movement is paced and what visibly moves (so in-between frames interpolate naturally).
ANIM = {
    "air-squat": {
        "motion_type": "rep", "n_frames": 7,
        "moving_parts": "the hips sink straight down and back while the knees bend forward "
                        "over the toes and the torso leans slightly forward; the feet stay "
                        "planted and the arms stay extended forward at shoulder height",
    },
    "puente-gluteo-banda": {
        "motion_type": "rep", "n_frames": 5,
        "moving_parts": "the pelvis/hips lift straight up off the mat into a bridge (hip "
                        "extension) while shoulders and feet stay planted and the knees "
                        "stay bent over the feet",
    },
    "extension-cuadriceps": {
        "motion_type": "rep", "n_frames": 5,
        "moving_parts": "the knees extend, swinging the lower legs and the padded ankle "
                        "roller forward and up from hanging-down to nearly-straight; the "
                        "thighs, seat, backrest and hands stay fixed",
    },
    "elev-lateral-polea-strap": {
        "motion_type": "rep", "n_frames": 6,
        "moving_parts": "the left arm abducts, rising out to the side from hanging at the "
                        "hip up to shoulder height; the strap stays on the upper arm, the "
                        "hand stays empty, the cable stretches taut, everything else fixed",
    },
}

FPS_DEFAULT = 8
HOLD_ENDS = 2  # repeat first/last frame N times so reps pause naturally at top & bottom


def frame_prompt(slug: str, frac: float) -> str:
    """Prompt for the next chained frame at fraction `frac` of START->END (0<frac<=1)."""
    spec, a = PLACEMENT[slug], ANIM[slug]
    pct = round(frac * 100)
    return (
        "You are drawing the NEXT frame of a smooth, frame-by-frame exercise animation. "
        "Attached, in order: (1) the style reference, (2) the character reference, (3) the "
        "FIRST frame which defines the canonical camera, scale, figure location and "
        "equipment position, and (4) the PREVIOUS frame. "
        "Produce ONE new frame that is IDENTICAL to the previous frame in camera angle, "
        "scale, figure position, equipment type and exact position, and line style. Change "
        "ONLY the moving body parts, by a SMALL natural increment from the previous frame "
        "(a single in-between step of the movement), with anatomically correct intermediate "
        "joint angles. "
        f"WHAT MOVES: {a['moving_parts']}. "
        f"TARGET for THIS frame: about {pct}% of the way from the START position to the END "
        f"position. (START = {spec['start']} END = {spec['end']}) "
        f"SUBJECT unchanged: {CHAR_PROFILE}, same woman as the character reference. "
        f"CAMERA & ORIENTATION (unchanged): {spec['view']} "
        f"EQUIPMENT (unchanged, exact same place): {spec['equipment']} "
        f"{FRAMING} {STYLE_RULES} {NEGATIVE}"
    )


def start_prompt(slug: str) -> str:
    """Frame-0 (START) from scratch if no validated start image is reused."""
    spec = PLACEMENT[slug]
    return (
        "Draw a precise fitness-manual line illustration. Follow every direction literally. "
        f"SUBJECT: {CHAR_PROFILE}, in the START position of the exercise. Same woman as the "
        "attached character reference. "
        f"CAMERA & ORIENTATION: {spec['view']} BODY (exact): {spec['start']} "
        f"EQUIPMENT (exact placement, never omit): {spec['equipment']} "
        f"{FRAMING} {STYLE_RULES} {NEGATIVE}"
    )


def build_gif(frames: list[Path], out: Path, motion_type: str, fps: int, max_px: int = 600):
    from PIL import Image
    imgs = []
    for p in frames:
        im = Image.open(p).convert("RGB")
        im.thumbnail((max_px, max_px))
        imgs.append(im)
    if motion_type == "rep":
        # forward + reverse (skip duplicating the two endpoints), hold at top & bottom
        seq = ([imgs[0]] * HOLD_ENDS + imgs[1:-1]
               + [imgs[-1]] * HOLD_ENDS + imgs[-2:0:-1])
    else:  # cyclic / hold -> straight through
        seq = imgs
    dur = int(1000 / fps)
    seq[0].save(out, save_all=True, append_images=seq[1:], duration=dur, loop=0, disposal=2)
    return len(seq)


def animate(client, slug: str, style_part, char_part, fps: int, frames_override=None):
    if slug not in PLACEMENT or slug not in ANIM:
        print(f"[skip] no placement/anim spec for {slug}")
        return
    a = ANIM[slug]
    mt = a["motion_type"]
    out_dir = ANIM_DIR / slug
    out_dir.mkdir(exist_ok=True)

    if mt == "hold":
        # single isometric frame; reuse validated start if present, else generate
        f0 = out_dir / "frame00.png"
        reuse = ROOT / "tests" / f"{slug}_start.png"
        if reuse.exists():
            f0.write_bytes(reuse.read_bytes())
        else:
            r = generate(client, [style_part, char_part, start_prompt(slug)], f"{slug}_hold")
            if r["ok"]:
                f0.write_bytes(r["img"])
        print(f"[{slug}] hold -> 1 frame (no GIF)")
        return

    n = frames_override or a["n_frames"]
    frame_paths = []

    # Frame 0 (START): reuse the validated test start if available, else generate.
    f0 = out_dir / "frame00.png"
    reuse = ROOT / "tests" / f"{slug}_start.png"
    if reuse.exists():
        f0.write_bytes(reuse.read_bytes())
        print(f"[{slug}] frame00 = reused validated start")
    else:
        r = generate(client, [style_part, char_part, start_prompt(slug)], f"{slug}_f00")
        if not r["ok"]:
            print(f"  FAIL start: {r.get('finish_reason')} {r.get('text')!r}")
            return
        f0.write_bytes(r["img"])
        print(f"[{slug}] frame00 generated ({r['seconds']}s)")
    frame_paths.append(f0)
    frame0_part = part_from_file(f0)

    # Frames 1..n-1: chained from previous + anchored to frame 0.
    prev_part = frame0_part
    for i in range(1, n):
        frac = i / (n - 1)
        contents = [style_part, char_part, frame0_part, prev_part, frame_prompt(slug, frac)]
        r = generate(client, contents, f"{slug}_f{i:02d}")
        fp = out_dir / f"frame{i:02d}.png"
        if r["ok"]:
            fp.write_bytes(r["img"])
            frame_paths.append(fp)
            prev_part = part_from_file(fp)
            print(f"[{slug}] frame{i:02d} @ {round(frac*100)}%  ({r['seconds']}s)")
        else:
            print(f"  WARN frame{i:02d}: {r.get('finish_reason')} {r.get('text')!r}")

    gif = ANIM_DIR / f"{slug}.gif"
    nseq = build_gif(frame_paths, gif, mt, fps)
    print(f"[{slug}] GIF -> {gif.name}  ({len(frame_paths)} keyframes, {nseq} gif frames, {fps}fps, {mt})")


def main():
    args = sys.argv[1:]
    fps = FPS_DEFAULT
    frames_override = None
    if "--fps" in args:
        i = args.index("--fps"); fps = int(args[i + 1]); del args[i:i + 2]
    if "--frames" in args:
        i = args.index("--frames"); frames_override = int(args[i + 1]); del args[i:i + 2]
    slugs = args or ["air-squat"]

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit("GEMINI_API_KEY not set")
    if not CHAR_REF_PATH.exists():
        sys.exit(f"character ref missing: {CHAR_REF_PATH} (run test_gemini.py first)")

    client = genai.Client(api_key=api_key)
    style_part = part_from_file(STYLE_REF)
    char_part = part_from_file(CHAR_REF_PATH)

    for slug in slugs:
        animate(client, slug, style_part, char_part, fps, frames_override)


if __name__ == "__main__":
    main()
