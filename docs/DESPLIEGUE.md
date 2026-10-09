# Despliegue en Vercel (orden recomendado)

La app se despliega como **dos proyectos de Vercel**: primero el backend (para obtener su URL) y luego el frontend.

## 0. Rama que Vercel debe desplegar
Hoy el código está en la rama `claude/agrotec-project-review-gnk3m0`. Elige una opción:
- **A (recomendada):** fusionar esa rama en `main` con un Pull Request en GitHub y dejar `main` como *Production Branch*.
- **B (rápida):** en Vercel → *Settings → Git → Production Branch*, escribir `claude/agrotec-project-review-gnk3m0`.

## 1. Backend (repo *Backend*)
1. Vercel → *Add New → Project* → importar el repo del backend.
2. *Framework Preset*: **Other**. No cambies Build/Output (el repo ya trae `vercel.json` y `api/index.py`).
3. *Environment Variables*:
   | Nombre | Valor |
   |---|---|
   | `GEMINI_API_KEY` | tu clave (**nueva**, de https://aistudio.google.com/apikey) |
   | `GEMINI_MODEL` | `gemini-flash-latest` |
   | `CORS_ORIGINS` | `*` al inicio; luego la URL del frontend |
4. *Deploy*. Comprueba `https://TU-BACKEND.vercel.app/api/health` → `{"status":"ok","gemini":true,...}`.

## 2. Frontend (repo *Frontend*)
1. Vercel → *Add New → Project* → importar el repo del frontend (el `vercel.json` ya define build y salida).
2. *Environment Variables* → `EXPO_PUBLIC_API_URL` = `https://TU-BACKEND.vercel.app` (sin `/` al final).
   Esta variable se incrusta **al compilar**: si la cambias, hay que *Redeploy*.
3. *Deploy* y abre la URL desde el celular (en escritorio se ve dentro de un marco de teléfono).
4. Vuelve al backend y cambia `CORS_ORIGINS` por la URL del frontend; *Redeploy*.

## 3. Instalarla como app en el celular
Abre la URL en Chrome/Safari → menú → *Añadir a pantalla de inicio*.

## 4. Cambios posteriores
Cada `git push` a la rama de producción redespliega solo. Las ramas y Pull Requests generan *Preview deployments* con URL propia para probar antes de publicar.
