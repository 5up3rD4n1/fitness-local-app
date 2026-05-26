# SPEC: Generación local de ilustraciones de ejercicios estilo "line art"

> **Para Claude Code**: este documento es la especificación completa. Léelo entero antes de actuar. Todo lo que necesitas para ejecutar el pipeline está en este directorio.

## Objetivo

Generar **60 imágenes** (30 ejercicios × 2 poses: inicio + final) en estilo línea negra sobre fondo blanco, atleta femenina con coleta, para una app de rutina de gimnasio. Cada imagen final debe ser compuesta lado a lado con texto de series/reps en rojo.

**Estilo de referencia**: ver `reference_style.png` (a aportar por el usuario — screenshots tipo Darebee / Workout-for-Women).

## Arquitectura del pipeline

```
┌──────────────────────┐
│ exercises.json       │  (datos de entrada)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Ollama LLM           │  ← Qwen 2.5 32B (o Llama 3.3 70B si VRAM)
│ (prompt orchestrator)│    Genera prompts detallados por ejercicio+pose
└──────────┬───────────┘
           │ prompts.json
           ▼
┌──────────────────────┐
│ ComfyUI + Flux.1 dev │  ← image generation
│ + ControlNet OpenPose│    Genera cada pose con esqueleto de control
└──────────┬───────────┘
           │ raw_poses/*.png
           ▼
┌──────────────────────┐
│ Llama 3.2 Vision     │  ← QA loop (max 3 retries por pose)
│ (Ollama)             │    Valida: pose correcta, estilo coherente, no artifacts
└──────────┬───────────┘
           │ approved_poses/*.png
           ▼
┌──────────────────────┐
│ composer.py (PIL)    │  ← composición final
└──────────┬───────────┘  start_pose + end_pose + reps_text + sets_text
           │
           ▼
    final/{slug}.png   (60 imágenes finales)
```

## Pre-requisitos en la máquina con GPU

### Hardware mínimo
- **GPU**: 16 GB VRAM mínimo (recomendado 24 GB)
- **RAM**: 32 GB
- **Disco**: 100 GB libres (modelos Flux ~24 GB + SDXL backup + outputs)

### Software (instalar en orden)
1. **Python 3.11+**
2. **CUDA 12.x + cuDNN** (NVIDIA) o **ROCm 6** (AMD)
3. **PyTorch con CUDA**: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121`
4. **ComfyUI**: `git clone https://github.com/comfyanonymous/ComfyUI && cd ComfyUI && pip install -r requirements.txt`
5. **Ollama**: `curl -fsSL https://ollama.com/install.sh | sh`
6. **Modelos Ollama**:
   ```bash
   ollama pull qwen2.5:32b           # orquestador de prompts
   ollama pull llama3.2-vision:11b   # QA visual
   ```
7. **Modelos ComfyUI** (descargar a `ComfyUI/models/`):
   - **Flux.1 dev** (24 GB) → `models/unet/flux1-dev.safetensors`
     ```
     huggingface-cli download black-forest-labs/FLUX.1-dev flux1-dev.safetensors --local-dir ComfyUI/models/unet
     ```
     Alternativa free comercial: **Flux.1 schnell** (Apache 2.0)
   - **VAE Flux**: `ae.safetensors` → `models/vae/`
   - **CLIP / T5**: `clip_l.safetensors` + `t5xxl_fp16.safetensors` → `models/clip/`
   - **ControlNet OpenPose para Flux**: `Shakker-Labs/FLUX.1-dev-ControlNet-Union-Pro` → `models/controlnet/`

### Python deps adicionales
```bash
pip install -r requirements.txt
```

## Modelos seleccionados — justificación

| Componente | Modelo | Por qué |
|---|---|---|
| Image gen | **Flux.1 dev** | Mejor prompt adherence open source en 2025. Línea limpia, manejo correcto de equipamiento de gym. |
| Image gen (alt comercial) | **Flux.1 schnell** | Si necesitas licencia 100% comercial (Apache 2.0), 4 steps. |
| Pose control | **ControlNet Union Pro (Flux)** | Soporta OpenPose nativo en Flux. |
| LLM orquestador | **Qwen 2.5 32B** | Mejor instrucción-following gratuita. Genera prompts con detalle anatómico. |
| LLM QA visual | **Llama 3.2 Vision 11B** | El único vision LLM gratuito potente que corre vía Ollama. |
| Estilo consistency | **LoRA entrenado localmente** | Entrena un LoRA de 15-25 imgs ref → mantiene estilo entre ejercicios. |
| Char consistency | **PuLID Flux / IP-Adapter** | Mantiene rasgos de la atleta entre las 60 imágenes. |

## Estructura de directorios esperada

```
exercise_image_gen/
├── SPEC.md                  ← este archivo
├── README.md                ← quickstart
├── requirements.txt
├── exercises.json           ← datos de los 30 ejercicios
├── prompts.json             ← se genera con orchestrator.py
├── style_reference/         ← 15-25 imgs ref (aportar)
├── pose_skeletons/          ← OpenPose PNGs por ejercicio+fase (aportar o generar con MediaPipe)
├── character_ref.png        ← imagen de la atleta de referencia (se genera primero)
├── scripts/
│   ├── 01_train_style_lora.py     ← entrena LoRA de estilo (correr una vez)
│   ├── 02_generate_character_ref.py  ← genera la atleta canónica
│   ├── 03_orchestrate_prompts.py  ← Ollama → prompts.json
│   ├── 04_generate_images.py      ← Flux + ControlNet → raw_poses/
│   ├── 05_qa_loop.py              ← Llama Vision valida → approved_poses/
│   └── 06_compose_final.py        ← PIL compone → final/
├── workflows/
│   └── flux_openpose.json   ← ComfyUI workflow exportado
├── raw_poses/               ← output crudo
├── approved_poses/          ← tras QA
└── final/                   ← 60 imágenes finales
```

## Paso a paso de ejecución

### 0. Setup (una sola vez)
```bash
cd exercise_image_gen
pip install -r requirements.txt
ollama serve &
ollama pull qwen2.5:32b
ollama pull llama3.2-vision:11b
# Arranca ComfyUI en background
cd /path/to/ComfyUI && python main.py --listen --port 8188 &
```

### 1. Aportar referencias del estilo
- Colocar 15-25 PNGs en `style_reference/` con el look objetivo (ver screenshot del usuario).
- Esto puede tomarse de capturas existentes de apps tipo Darebee, Workout-for-Women, o screenshots públicos. **Solo para uso interno de entrenamiento del LoRA, NO redistribución.**

### 2. Entrenar LoRA de estilo
```bash
python scripts/01_train_style_lora.py
# Output: models/loras/lnart_style_v1.safetensors
# Trigger word: LNART_STYLE
# Duración: 20-40 min en RTX 4090
```

### 3. Generar atleta canónica (character reference)
```bash
python scripts/02_generate_character_ref.py
# Output: character_ref.png
# Es la imagen que se usará con IP-Adapter / PuLID en todas las generaciones
```

### 4. Generar pose skeletons
- **Opción A (fácil)**: dibujar 60 stick figures en https://posemy.art (free) y exportarlos como PNG.
- **Opción B (auto)**: pasar 60 frames de videos de YouTube (ej. los URLs de Gym Visual) por MediaPipe Pose → exportar como OpenPose PNGs.
  ```bash
  python scripts/extract_poses_from_video.py --input videos/*.mp4 --out pose_skeletons/
  ```

### 5. Orquestar prompts con Ollama
```bash
python scripts/03_orchestrate_prompts.py
# Lee exercises.json, llama a Qwen 2.5 vía Ollama, genera prompts.json
# Cada ejercicio recibe 2 prompts (start_pose, end_pose) con metadata anatómica detallada
```

### 6. Generar imágenes
```bash
python scripts/04_generate_images.py
# Recorre prompts.json, llama al workflow ComfyUI para cada ejercicio+fase
# Tiempo: ~15-30s por imagen → 60 imgs = 15-30 min
```

### 7. QA visual con Llama Vision
```bash
python scripts/05_qa_loop.py
# Cada imagen es validada por Llama 3.2 Vision contra criterios definidos
# Si falla: regenera con prompt ajustado (max 3 retries)
```

### 8. Composición final
```bash
python scripts/06_compose_final.py
# Por cada ejercicio: junta start+end horizontal, añade reps en negro y sets en rojo
# Output: final/{slug}.png
```

## Criterios de QA para Llama Vision

El prompt de validación verifica:
1. **Pose correcta**: ¿el cuerpo está en la posición descrita?
2. **Equipamiento correcto**: ¿aparece la mancuerna/máquina/banda esperada?
3. **Estilo coherente**: ¿es línea negra sobre fondo blanco sin sombras pesadas?
4. **Sin artifacts**: ¿hay manos deformes, miembros extras, equipo distorsionado?
5. **Personaje consistente**: ¿coincide con character_ref.png (coleta, contextura)?

Si CUALQUIERA falla → regenera con seed nuevo + prompt enriquecido con el feedback del vision LLM.

## Prompts base (parametrizar en orchestrator)

```
[POSITIVE]
LNART_STYLE, athletic woman with ponytail, {exercise_phase} of {exercise_name},
{detailed_body_posture}, side view, clean technical line art illustration,
white background, thin consistent black line weight, no shading,
no text, full body visible, wearing sport tank top and shorts,
{equipment_description}, fitness manual aesthetic, anatomically correct,
balanced composition

[NEGATIVE]
photorealistic, 3D render, color, shading, gradients, multiple people,
text, watermark, deformed hands, extra limbs, distorted equipment,
cluttered background, low quality, blurry

[CONTROL]
controlnet_image: pose_skeletons/{slug}_{phase}.png
controlnet_strength: 0.75
controlnet_type: openpose
```

Qwen 2.5 rellenará `{detailed_body_posture}` y `{equipment_description}` con anatomía biomecánicamente correcta.

## Composición final (PIL)

```
Layout por ejercicio (1200×900 px):
┌────────────────────────────────────────┐
│                                        │
│   [start_pose]      [end_pose]         │  ← 2 imágenes lado a lado, transparente
│                                        │
│   12 goblet squats  x 4 sets           │  ← negro 64pt + rojo 64pt (igual al ref)
│                                        │
└────────────────────────────────────────┘
```

Tipografía: usar **Roboto Bold** (free Google Fonts) o el font que el usuario indique.

## Variables tunables (config.yaml)

```yaml
flux:
  model: flux1-dev  # o flux1-schnell para uso comercial
  steps: 28
  guidance: 3.5
  resolution: 1024x1024
  lora:
    style: lnart_style_v1
    strength: 1.0
controlnet:
  type: openpose
  strength: 0.75
ipadapter:
  character_ref: character_ref.png
  strength: 0.6
ollama:
  orchestrator_model: qwen2.5:32b
  vision_model: llama3.2-vision:11b
  max_retries: 3
composition:
  canvas_size: [1200, 900]
  bg_color: "#FAFAFA"
  text_color_reps: "#000000"
  text_color_sets: "#D32F2F"
  font: Roboto-Bold.ttf
```

## Lo que NO está en este paquete y debe aportar el usuario

1. `style_reference/*.png` — 15-25 imágenes del estilo objetivo.
2. `pose_skeletons/*.png` (opcional, si no se generan automáticamente).
3. URL del CDN donde subir el output final (opcional).
4. Confirmación de licencia: usar Flux dev (free non-commercial) o Flux schnell (free comercial).

## Resultado esperado

- 60 imágenes individuales (start/end por ejercicio) en `raw_poses/` y `approved_poses/`
- 30 imágenes compuestas finales en `final/`
- `prompts.json` con histórico de prompts usados
- `qa_report.json` con resultados de validación visual
- Total de ejecución end-to-end: **2-4 horas** en RTX 4090/5090

## Estimación de costos

| Componente | Coste |
|---|---|
| Modelos | 0 USD (todo open source) |
| Compute | 0 USD (local) |
| Electricidad estimada | <1 USD (4h × 400W = 1.6 kWh) |
| **TOTAL** | **<2 USD por correr el set completo** |

## Versiones y futuras iteraciones

- v1.0: estática, 2 poses por ejercicio (este spec).
- v1.1: añadir animación interpolada (start→end) con AnimateDiff (~3 fps GIF).
- v1.2: variantes de género/somatotipo (hombre, distintos morfotipos) regenerando con character_ref distinto.
- v2.0: vista 3D rotable con TripoSR sobre la silueta 2D.
