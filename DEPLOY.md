# 🚀 Cómo publicar el sitio en GitHub Pages

El sitio **ya está construido y subido** a este repositorio (rama `main`). Solo falta **un ajuste de permisos** que únicamente puede hacer el dueño de la cuenta `ll333ll`, porque GitHub no permite activar Pages desde un agente externo sin un token.

## Diagnóstico exacto

El workflow de despliegue (`.github/workflows/pages.yml`) se ejecutó pero falló con este error real (leído de las anotaciones públicas del run):

```
Create Pages site failed. Error: Resource not accessible by integration
```

Esto significa que el **token automático de GitHub Actions está en modo "solo lectura"** en la configuración del repositorio, por lo que no puede crear el sitio de Pages. Es un ajuste del dueño.

## Opción A — Recomendada (1 clic, deja que Actions despliegue)

1. Entra a **Settings → Actions → General**:
   `https://github.com/ll333ll/Econometria2-Reto2/settings/actions`
2. En **Workflow permissions**, selecciona **"Read and write permissions"** y guarda.
3. Entra a **Settings → Pages**:
   `https://github.com/ll333ll/Econometria2-Reto2/settings/pages`
4. En **Build and deployment → Source**, elige **"GitHub Actions"**.
5. Ve a la pestaña **Actions**, abre el workflow *"Deploy to GitHub Pages"* y pulsa **"Re-run all jobs"** (o haz cualquier push).

El sitio quedará en: **https://ll333ll.github.io/Econometria2-Reto2/**

## Opción B — Aún más simple (desplegar desde rama, sin Actions)

Ya existe una rama **`gh-pages`** con el sitio. Solo:

1. Entra a **Settings → Pages**.
2. En **Source**, elige **"Deploy from a branch"**.
3. Branch: **`gh-pages`** · carpeta: **`/ (root)`** · Save.

En 1–2 minutos el sitio estará publicado en la misma URL.

## Verificar

Cuando esté activo:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ll333ll.github.io/Econometria2-Reto2/
# debe responder 200
```

> Si prefieres que yo (el agente) lo active automáticamente, dame un **Personal Access Token** con permisos `pages:write` y `actions:write` (fine-grained, solo este repo) y lo despliego y verifico de inmediato.
