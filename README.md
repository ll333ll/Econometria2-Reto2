# Del barrio al trabajo 🍊 · Informalidad en la Comuna 3 (Manrique)

Sitio web interactivo del **Reto 2 · Econometría II**: un estudio sobre informalidad laboral y movilidad en la **Comuna 3 (Manrique)** de Medellín, a partir de la Encuesta de Calidad de Vida (ECV) 2025 y de una salida de campo sobre la Avenida Carlos Gardel (la 45).

**Autores:** José Alejandro Jiménez Vásquez · Anny Aristizábal · Dulce María Franco · Elisa Medina

## 🌐 Sitio publicado

Una vez habilitado GitHub Pages: **https://ll333ll.github.io/Econometria2-Reto2/**

## ✨ Qué incluye

- **Trabajo escrito**: pregunta de investigación, hipótesis, relato de la salida de campo y conclusiones.
- **Econometría ejecutable**: todo el código R del documento Quarto, por secciones, con resaltado de sintaxis y botón de copiar. El fuente `.qmd` está disponible para descargar y renderizar.
- **Resultados visuales**: gráficos interactivos (Chart.js) que ilustran el modelo probit y sus efectos marginales.
- **Explorador de datos**: perfiles comparables de las personas entrevistadas.
- **Entrevistas con reproductor persistente**: play/pausa, adelantar/retroceder 10 s, velocidad (0.75×–2×), volumen y barra de progreso; sigue sonando mientras navegas.
- **Galería** con *likes anónimos* (guardados en `localStorage`), *lightbox* y **editor de fotos** con filtros + descarga.
- **Mapa interactivo** (Leaflet) de Manrique con puntos de interés e historia del barrio.
- **Revisión de literatura** y fuentes de información con enlaces.

Paleta morada y rosada, diseño **responsive**, animaciones en cada interacción y accesibilidad (focus visible, `prefers-reduced-motion`, etiquetas ARIA).

## 🗂️ Estructura

```
index.html                 Página principal (todas las secciones)
assets/css/styles.css       Estilos, paleta morada/rosada, animaciones, responsive
assets/js/app.js            Interactividad: player, galería, lightbox, mapa, charts, etc.
assets/js/econ-data.js      Código R del análisis, agrupado por secciones
assets/img/                 Fotos de la salida de campo
assets/audio/               Entrevistas (Andrés, Jessica)
assets/data/                data.txt y el documento fuente .qmd
```

## 🔬 Reproducir el análisis

```bash
quarto render assets/data/Reto2_Informalidad_Manrique.qmd
```

Requiere R y los paquetes listados en la primera pestaña de código (tidyverse, marginaleffects, mfx, pROC, survey, modelsummary, car, plotly, etc.), más los archivos `ECV_2025.xlsx` y `Diccionario-de-Datos-2025.xlsx` en la misma carpeta.

## 🚀 Despliegue

El sitio es estático. Se publica con **GitHub Pages** mediante el workflow en `.github/workflows/pages.yml`, que despliega la raíz del repositorio en cada push a `main`.
