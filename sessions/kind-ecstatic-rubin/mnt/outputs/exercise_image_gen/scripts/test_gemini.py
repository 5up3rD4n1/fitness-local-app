"""
Stress-test gemini-3-pro-image-preview (Nano Banana Pro) for the exercise line-art pipeline.

Validates, BEFORE committing to a 60-image run:
  1. style match   -> clean black line art, white bg, no shading/color/text
  2. character consistency -> same athlete across poses (via a generated character ref)
  3. pose correctness      -> start vs end clearly distinct & anatomically right
  4. equipment rendering   -> bands / machines / cable straps drawn correctly
  5. reliability           -> finish reasons, refusals, token usage

Usage:
  python scripts/test_gemini.py                 # char ref + default 4 test exercises
  python scripts/test_gemini.py air-squat ...   # char ref + specified slugs
  python scripts/test_gemini.py --no-charref    # skip char ref (style-ref only)
  python scripts/test_gemini.py --repeat 2 ...  # N variants per pose (variance check)
"""
import os
import sys
import json
import time
import traceback
from pathlib import Path

from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parent.parent
STYLE_REF = ROOT / "style_reference" / "darebee_style_ref_01.png"
OUT_DIR = ROOT / "tests"
OUT_DIR.mkdir(exist_ok=True)
CHAR_REF_PATH = OUT_DIR / "_character_ref.png"

MODEL = "gemini-3-pro-image-preview"
IMAGE_SIZE = "2K"          # Nano Banana Pro: 1K | 2K | 4K
ASPECT = "1:1"

DEFAULT_SLUGS = [
    "air-squat",               # bodyweight, side, standing
    "puente-gluteo-banda",     # band, side, supine
    "extension-cuadriceps",    # machine, side, seated  (hardest)
    "elev-lateral-polea-strap" # cable strap on upper arm, front (trickiest)
]

# ---- prompt building -------------------------------------------------------

STYLE_RULES = (
    "STYLE: clean technical line-art illustration matching the attached reference image "
    "EXACTLY. Pure white (#FFFFFF) background. Every form -- body, face, hair, clothing, "
    "and equipment -- is drawn with thin, consistent, slightly tapered SOLID BLACK "
    "OUTLINES ONLY. "
    "CRITICAL: nothing is filled in. The tank top and shorts are NOT solid black -- their "
    "interior stays white like the skin and background; show them with outline plus a few "
    "thin seam/fold lines only. No black fills, no silhouettes, no gray, no tone, no "
    "shading, no hatching, no gradients anywhere (not on the body, not on clothing, not on "
    "equipment). Flat fitness-manual / Darebee aesthetic: a pure black-ink contour drawing "
    "on white."
)

NEGATIVE = (
    "Do NOT include: any text, numbers, labels, captions, watermarks; more than one "
    "person; solid black fills, filled/silhouetted clothing, gray fills or shading; color; "
    "photorealism or 3D render; deformed or fused hands; extra or missing limbs; distorted "
    "equipment; cluttered background; cropping that hides any body part or the equipment."
)

CHAR_PROFILE = (
    "the SAME single athletic lean woman with a long ponytail, wearing a fitted sport "
    "tank top and shorts, mid-20s appearance"
)


def char_ref_prompt() -> str:
    return (
        f"Draw a character reference of {CHAR_PROFILE}. "
        "Standing relaxed, neutral A-pose, full body, side-3/4 view, centered, the whole "
        "figure visible with margin around it. "
        f"{STYLE_RULES} {NEGATIVE}"
    )


FRAMING = (
    "FRAMING: the ENTIRE figure (head to shoes) and ALL equipment must sit fully inside "
    "the frame with even white margin on every side; figure centered; consistent scale. "
    "Where the body rests on the floor or a mat, indicate it with a single thin straight "
    "ground line only."
)

CONSISTENCY = (
    "START/END CONSISTENCY: the START and END images are the SAME scene drawn from the "
    "SAME camera angle, at the SAME scale, with the figure in the SAME location, the same "
    "equipment in the SAME position, and the SAME working side of the body. ONLY the body "
    "parts described as moving may change between START and END. Do not flip, rotate, "
    "rescale, or relocate the figure or the equipment between the two images."
)

CONVENTIONS = (
    "NAMING & PRECISION CONVENTIONS -- follow these exactly: "
    "(a) Every 'left'/'right' below refers to the LEFT or RIGHT side of the IMAGE as the "
    "viewer sees it -- NOT the subject's own left/right. 'LEFT-of-image arm' = the arm "
    "drawn on the left side of the picture. "
    "(b) Use correct anatomy and draw exactly the named part: upper arm = humerus; forearm; "
    "elbow joint; shoulder/glenohumeral joint; trunk/torso; pelvis/hips; knee; ankle; "
    "scapula. A cuff 'on the upper arm' means around the humerus, between shoulder and "
    "elbow -- never on the forearm, wrist, or hand. "
    "(c) Joint angles are explicit and must be drawn accurately (e.g. 'shoulder abducted to "
    "90 degrees in the frontal plane', 'knee flexed to 90 degrees', 'hip extended to a "
    "neutral 180-degree line'). 0 degrees of shoulder abduction = arm hanging straight down "
    "alongside the trunk; 90 degrees = upper arm horizontal at shoulder height. "
    "(d) Equipment is fixed to the stated IMAGE corner/edge and must NOT move, mirror, or "
    "duplicate between frames. "
)

# Hyper-specific, disambiguated placement specs for the test set.
# Each: view (camera + facing), equipment (exact placement), start, end (exact body).
PLACEMENT = {
    "air-squat": {
        "view": "Strict side profile view. The woman faces LEFT; her right side is toward "
                "the camera. Full body shown in profile, standing on a thin ground line.",
        "equipment": "None (bodyweight only). Do not add any equipment, props, or floor "
                     "markings beyond a single thin ground line.",
        "start": "Standing tall and upright in profile, feet flat hip-width on the ground "
                 "line, legs straight, spine neutral, head looking forward (to the left). "
                 "BOTH arms extended straight FORWARD (to the left) and held horizontally "
                 "at shoulder height, parallel to the ground, palms facing down.",
        "end": "Lowered into a deep squat in the SAME spot: hips pushed back and down so "
               "the thighs are parallel to the ground, knees bent about 90 degrees and "
               "tracking forward over the toes, shins angled forward, heels staying flat "
               "on the ground line, torso leaning slightly forward with a long straight "
               "back and chest up. BOTH arms still extended straight forward, horizontal "
               "at shoulder height, palms down. Feet remain in the exact same position and "
               "scale as the START image.",
    },
    "puente-gluteo-banda": {
        "view": "Strict side profile view. The woman lies horizontally on a floor mat with "
                "her HEAD to the LEFT and her bent knees/feet to the RIGHT; her near side "
                "faces the camera. The mat is a single thin horizontal line under her.",
        "equipment": "A thick mini resistance band looped around BOTH thighs just ABOVE "
                     "the knees. It MUST be clearly drawn as a short band spanning between "
                     "the two thighs above the knee line. No other equipment.",
        "start": "Lying supine (flat on her back). Shoulders, upper back, arms and hips all "
                 "resting DOWN on the mat. Knees bent about 90 degrees, both feet flat on "
                 "the mat hip-width apart. Arms straight, resting on the mat alongside the "
                 "torso. Hips are DOWN, touching the mat. The band is visible across the "
                 "thighs above the knees.",
        "end": "Same supine setup with feet planted in the EXACT same spot and the shoulders "
               "still on the mat, but the HIPS are now lifted UP into a glute bridge so the "
               "body forms one straight diagonal line from the knees down to the shoulders "
               "(full hip extension), glutes squeezed. Knees stay bent ~90 degrees over the "
               "feet. The band stays around the thighs above the knees.",
    },
    "extension-cuadriceps": {
        "view": "Strict side profile view. The woman and the machine are both in profile; "
                "she faces LEFT, her right side toward the camera, seated in the machine.",
        "equipment": "A seated leg-extension machine: a seat with an upright backrest, a "
                     "weight stack at the BACK (left), and a pivoting lever arm at the "
                     "FRONT-LOWER area ending in a padded ankle roller. She sits with her "
                     "back against the backrest and both hands gripping the short side "
                     "handles by the hips. Her shins are BEHIND the padded ankle roller so "
                     "the roller sits against the front of her lower shins/ankles.",
        "start": "Seated upright against the backrest, thighs flat on the seat, knees bent "
                 "about 90 degrees with the lower legs hanging straight DOWN, the padded "
                 "ankle roller resting against the front of the lower shins.",
        "end": "Same seated position (back, thighs, hands unchanged), but the knees are now "
               "extended FORWARD to nearly straight (slight bend, not locked), swinging the "
               "padded ankle roller up and forward to about knee height, quadriceps "
               "engaged. The seat, backrest, weight stack and hand grip stay in the EXACT "
               "same place and scale as the START image.",
    },
    "elev-lateral-polea-strap": {
        "view": "Strict FRONT view: the woman faces the camera directly, standing upright, "
                "entire body from head to shoes visible. This is a cable lateral raise "
                "training the medial deltoid through shoulder (glenohumeral) ABDUCTION in "
                "the frontal plane.",
        "equipment": "ONE single low cable pulley, fixed at FLOOR level in the BOTTOM-LEFT "
                     "corner of the image; it stays in that exact corner in every frame. "
                     "From it a single straight cable runs up to a PADDED CUFF STRAP wrapped "
                     "firmly around the UPPER ARM (around the lower humerus, just ABOVE the "
                     "elbow joint) of the LEFT-of-image arm. The cuff is on the UPPER ARM "
                     "only -- NOT on the forearm, NOT on the wrist, NOT in the hand; that "
                     "hand and forearm are completely EMPTY and relaxed, gripping nothing, "
                     "with no handle drawn. Draw only this one pulley -- no second weight "
                     "stack, no extra vertical rails on the right.",
        "start": "Bottom/resting position. The LEFT-of-image arm hangs straight down "
                 "ADDUCTED against the side of the trunk: shoulder at about 0 degrees "
                 "abduction, the humerus vertical and parallel to the torso, elbow nearly "
                 "straight, hand relaxed and empty. The cable runs from the bottom-left "
                 "floor pulley diagonally up to the cuff on that upper arm, only lightly "
                 "tensioned. The RIGHT-of-image arm hangs relaxed at the side. Feet "
                 "hip-width, trunk upright and still.",
        "end": "Peak-contraction position. The SAME LEFT-of-image arm is now ABDUCTED at "
               "the shoulder to 90 degrees in the frontal plane: the upper arm (humerus) is "
               "horizontal, level with the shoulder, pointing toward the LEFT edge of the "
               "image; elbow nearly straight (about 10 degrees of flexion); the hand and "
               "forearm are still completely empty and relaxed. The padded cuff stays on "
               "the upper arm just above the elbow. The cable is now pulled TAUT in a "
               "straight diagonal line from the cuff down to the SAME bottom-left floor "
               "pulley, which has NOT moved. The RIGHT-of-image arm stays relaxed at the "
               "side. Identical camera, scale and pulley position as the START frame -- only "
               "the left-of-image arm has risen.",
    },
}


def pose_prompt(ex: dict, phase: str) -> str:
    spec = PLACEMENT.get(ex["slug"])
    if spec:
        view = spec["view"]
        equipment = spec["equipment"]
        posture = spec[phase]
    else:  # fallback to exercises.json generic fields
        view = f"{ex['view']} view."
        equipment = ex["equipment"]
        posture = ex["start_pose"] if phase == "start" else ex["end_pose"]
    return (
        "Draw a precise fitness-manual instructional illustration. Follow every direction "
        "below literally and exactly; do not reinterpret, add, remove, or rearrange "
        "anything. "
        f"{CONVENTIONS}"
        f"SUBJECT: {CHAR_PROFILE}, performing the {phase.upper()} position of "
        f"\"{ex['name_en']}\". Keep the SAME woman (face, hair, build) as the attached "
        "character reference; only her pose and the equipment may differ. "
        f"CAMERA & ORIENTATION: {view} "
        f"BODY (exact, this is the {phase.upper()} position): {posture} "
        f"EQUIPMENT (exact placement; MUST be drawn as outline, never omit it): {equipment} "
        f"{FRAMING} {CONSISTENCY} {STYLE_RULES} {NEGATIVE}"
    )


# ---- gemini plumbing -------------------------------------------------------

def part_from_file(path: Path) -> types.Part:
    return types.Part.from_bytes(data=path.read_bytes(), mime_type="image/png")


def generate(client: genai.Client, contents: list, label: str) -> dict:
    """One generate_content call. Returns dict with status + saved bytes/text."""
    cfg = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=ASPECT, image_size=IMAGE_SIZE),
        candidate_count=1,
    )
    t0 = time.time()
    resp = client.models.generate_content(model=MODEL, contents=contents, config=cfg)
    dt = time.time() - t0

    img_bytes, texts, finish = None, [], None
    for cand in (resp.candidates or []):
        finish = getattr(cand, "finish_reason", None)
        content = getattr(cand, "content", None)
        for part in (getattr(content, "parts", None) or []):
            inline = getattr(part, "inline_data", None)
            if inline and inline.data:
                img_bytes = inline.data
            elif getattr(part, "text", None):
                texts.append(part.text)

    um = getattr(resp, "usage_metadata", None)
    tokens = getattr(um, "total_token_count", None) if um else None
    return {
        "label": label,
        "ok": img_bytes is not None,
        "img": img_bytes,
        "text": " ".join(texts)[:500] if texts else None,
        "finish_reason": str(finish) if finish else None,
        "seconds": round(dt, 1),
        "total_tokens": tokens,
    }


def main():
    args = [a for a in sys.argv[1:]]
    use_charref = "--no-charref" not in args
    args = [a for a in args if a != "--no-charref"]
    reuse_charref = "--reuse-charref" in args
    args = [a for a in args if a != "--reuse-charref"]
    repeat = 1
    if "--repeat" in args:
        i = args.index("--repeat")
        repeat = int(args[i + 1])
        del args[i:i + 2]
    slugs = args or DEFAULT_SLUGS

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit("GEMINI_API_KEY not set")
    if not STYLE_REF.exists():
        sys.exit(f"style ref missing: {STYLE_REF}")

    client = genai.Client(api_key=api_key)
    exercises = {e["slug"]: e for e in json.loads((ROOT / "exercises.json").read_text())["exercises"]}
    style_part = part_from_file(STYLE_REF)
    report = []

    # 1) character reference (consistency anchor)
    char_part = None
    if use_charref and reuse_charref and CHAR_REF_PATH.exists():
        char_part = part_from_file(CHAR_REF_PATH)
        print(f"[char-ref] reusing existing {CHAR_REF_PATH.name}")
    elif use_charref:
        print(f"[char-ref] generating with {MODEL} @ {IMAGE_SIZE} ...", flush=True)
        try:
            r = generate(client, [style_part, char_ref_prompt()], "character_ref")
            if r["ok"]:
                CHAR_REF_PATH.write_bytes(r["img"])
                char_part = part_from_file(CHAR_REF_PATH)
                print(f"  OK  {r['seconds']}s  {r['total_tokens']} tok -> {CHAR_REF_PATH.name}")
            else:
                print(f"  FAIL finish={r['finish_reason']} text={r['text']!r}")
            r.pop("img", None)
            report.append(r)
        except Exception as e:
            print(f"  ERROR {e}")
            traceback.print_exc()

    # 2) test poses
    for slug in slugs:
        ex = exercises.get(slug)
        if not ex:
            print(f"[skip] unknown slug: {slug}")
            continue
        for phase in ("start", "end"):
            for n in range(repeat):
                suffix = f"_v{n+1}" if repeat > 1 else ""
                label = f"{slug}_{phase}{suffix}"
                contents = [style_part]
                if char_part is not None:
                    contents.append(char_part)
                contents.append(pose_prompt(ex, phase))
                print(f"[{label}] ...", flush=True)
                try:
                    r = generate(client, contents, label)
                    if r["ok"]:
                        (OUT_DIR / f"{label}.png").write_bytes(r["img"])
                        print(f"  OK  {r['seconds']}s  {r['total_tokens']} tok")
                    else:
                        print(f"  FAIL finish={r['finish_reason']} text={r['text']!r}")
                    r.pop("img", None)
                    report.append(r)
                except Exception as e:
                    print(f"  ERROR {e}")
                    report.append({"label": label, "ok": False, "error": str(e)})

    (OUT_DIR / "_report.json").write_text(json.dumps(report, indent=2))
    ok = sum(1 for r in report if r.get("ok"))
    print(f"\nDONE  {ok}/{len(report)} images  ->  {OUT_DIR}")
    print(f"report: {OUT_DIR / '_report.json'}")


if __name__ == "__main__":
    main()
