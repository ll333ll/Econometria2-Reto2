/* ============================================================
   webr-runner.js — Consola de R en vivo con WebR (WebAssembly)
   Permite ejecutar R real en el navegador, sin instalar nada.
   Carga perezosa: WebR solo se descarga al primer "Ejecutar".
   ============================================================ */

const EXAMPLES = {
  probit: `# Modelo probit de ejemplo (datos simulados tipo ECV)
set.seed(2025)
n <- 400
tiempo_10 <- round(runif(n, 0.5, 9), 1)      # minutos de viaje / 10
tp_publico <- rbinom(n, 1, 0.55)              # usa transporte público
educ <- round(runif(n, 5, 18))               # años de educación
# probabilidad latente de informalidad
z <- -0.2 + 0.08*tiempo_10 + 0.35*tp_publico - 0.09*educ
p <- pnorm(z)
informal <- rbinom(n, 1, p)

m <- glm(informal ~ tiempo_10 + tp_publico + educ,
         family = binomial(link = "probit"))
summary(m)$coefficients`,

  descriptiva: `# Descriptiva ponderada de ejemplo
set.seed(1)
grupo <- sample(c("Formal", "Informal"), 300, replace = TRUE, prob = c(.4,.6))
peso  <- runif(300, 50, 500)        # factor de expansión
edad  <- round(rnorm(300, 38, 12))

# media ponderada de la edad por condición
w_mean <- function(x, w) sum(x*w)/sum(w)
tapply(seq_along(grupo), grupo, function(i) {
  round(w_mean(edad[i], peso[i]), 1)
})`,

  grafico: `# Gráfico base de R: tiempo de viaje vs informalidad (ejemplo)
set.seed(7)
tiempo <- seq(0, 90, by = 2)
p_inf  <- pnorm(-0.4 + 0.015*tiempo)       # curva probit creciente
plot(tiempo, p_inf, type = "l", lwd = 3, col = "#d6248c",
     xlab = "Minutos de viaje al trabajo",
     ylab = "P(informal)",
     main = "Probabilidad predicha (ejemplo)")
grid(col = "#e8d5f2")
points(tiempo, p_inf, pch = 19, col = "#7c2fc4", cex = .5)`,
};

const codeEl = document.getElementById("webrCode");
const outEl = document.getElementById("webrOut");
const plotEl = document.getElementById("webrPlot");
const runBtn = document.getElementById("webrRun");
const statusEl = document.getElementById("webrStatus");
const exampleSel = document.getElementById("webrExample");

if (codeEl && runBtn) {
  codeEl.value = EXAMPLES.probit;
  exampleSel.addEventListener("change", () => {
    codeEl.value = EXAMPLES[exampleSel.value] || "";
    plotEl.style.display = "none";
  });

  let webR = null;
  let shelter = null;

  async function ensureWebR() {
    if (webR) return webR;
    statusEl.textContent = "Descargando WebR… (puede tardar unos segundos)";
    runBtn.disabled = true;
    const { WebR } = await import("https://webr.r-wasm.org/latest/webr.mjs");
    webR = new WebR();
    await webR.init();
    shelter = await new webR.Shelter();
    statusEl.textContent = "WebR listo ✔";
    runBtn.disabled = false;
    return webR;
  }

  async function run() {
    const src = codeEl.value;
    outEl.textContent = "Ejecutando…";
    plotEl.style.display = "none";
    try {
      await ensureWebR();
      runBtn.disabled = true;
      statusEl.textContent = "Ejecutando R…";

      // Capture both console output and any plot
      const hasPlot = /\b(plot|hist|barplot|boxplot|ggplot|curve|image|lines|points)\s*\(/.test(src);
      if (hasPlot) {
        const result = await shelter.captureR(src, {
          withAutoprint: true,
          captureGraphics: { width: 760, height: 460 },
        });
        const txt = result.output
          .filter((o) => o.type === "stdout" || o.type === "stderr")
          .map((o) => o.data)
          .join("\n");
        outEl.textContent = txt || "(sin salida de texto)";
        if (result.images && result.images.length) {
          const img = result.images[0];
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext("2d").drawImage(img, 0, 0);
          plotEl.src = canvas.toDataURL();
          plotEl.style.display = "block";
        }
        shelter.purge();
      } else {
        const result = await shelter.captureR(src, { withAutoprint: true });
        const txt = result.output
          .filter((o) => o.type === "stdout" || o.type === "stderr")
          .map((o) => o.data)
          .join("\n");
        outEl.textContent = txt || "(sin salida de texto)";
        shelter.purge();
      }
      statusEl.textContent = "WebR listo ✔";
    } catch (err) {
      outEl.textContent = "Error: " + (err && err.message ? err.message : String(err)) +
        "\n\n(Si WebR no carga, tu red o navegador puede estar bloqueando WebAssembly. El código sigue siendo descargable para correr en R/RStudio.)";
      statusEl.textContent = "Error al ejecutar";
    } finally {
      runBtn.disabled = false;
    }
  }

  runBtn.addEventListener("click", run);
}
