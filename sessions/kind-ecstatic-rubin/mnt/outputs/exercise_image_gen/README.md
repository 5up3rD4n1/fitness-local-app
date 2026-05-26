# Exercise Image Generation — Quickstart

Lee `SPEC.md` para la spec completa. Este README es solo el lanzamiento.

## TL;DR — orden de ejecución

```bash
# Setup (una vez)
pip install -r requirements.txt
ollama serve &
ollama pull qwen2.5:32b llama3.2-vision:11b

# Arrancar ComfyUI (terminal separada)
cd /path/to/ComfyUI && python main.py --listen --port 8188

# Aportar estilo de referencia
cp /path/to/15-25-style-images/* style_reference/

# Pipeline completo
python scripts/01_train_style_lora.py
python scripts/02_generate_character_ref.py
python scripts/03_orchestrate_prompts.py
python scripts/04_generate_images.py
python scripts/05_qa_loop.py
python scripts/06_compose_final.py

# Resultado en final/*.png
```

## Para Claude Code

Si eres Claude Code recogiendo este paquete:
1. Lee `SPEC.md` completo.
2. Verifica pre-requisitos con `python scripts/check_env.py` (créalo si no existe).
3. Pide al usuario las referencias de estilo (15-25 imágenes) si `style_reference/` está vacío.
4. Ejecuta el pipeline en orden.
5. Si encuentras VRAM insuficiente para Flux dev, hacer fallback a Flux schnell o SDXL.
6. Reporta progreso paso a paso al usuario.

## Decisiones que necesitas confirmar antes de ejecutar

- [ ] ¿Flux dev (no comercial) o Flux schnell (Apache 2.0 comercial)?
- [ ] ¿Generar pose skeletons manualmente o automáticamente desde videos?
- [ ] ¿Subir el output a un CDN o solo dejar local?
- [ ] ¿Font para el texto final (Roboto, Inter, custom)?
