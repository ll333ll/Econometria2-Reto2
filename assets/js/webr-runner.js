/* ============================================================
   webr-runner.js — Consola de R en vivo con WebR (WebAssembly)
   Ejecuta en el navegador EL MODELO REAL del trabajo: el mismo
   probit de informalidad, sus efectos marginales, la bondad de
   ajuste y la corrección por endogeneidad (función de control).

   La base oficial ECV Medellín 2025 (20.408 personas) no puede
   viajar al navegador, así que se reconstruye una muestra de los
   460 ocupados de Manrique que conserva la estructura y los signos
   del modelo (informalidad ≈ 53 %; el tiempo de viaje, la educación
   y el transporte público reducen la informalidad; el estrato 2
   protege). El código ejecutado es el del propio .qmd; las cifras
   exactas se obtienen con la base completa (ver el informe en
   Documentos).
   ============================================================ */

// Preámbulo: reconstruye la muestra de Manrique y las utilidades.
// Se antepone a cada bloque para que corra de forma independiente.
const PREAMBULO = `
set.seed(2025)
n <- 460
# --- covariables con la estructura de los ocupados de Manrique ---
edad       <- pmin(pmax(round(rnorm(n, 38, 12)), 15), 70)
educ_anios <- pmin(pmax(round(rnorm(n, 10.5, 3.5)), 0), 21)
mujer        <- rbinom(n, 1, 0.47)
casado_union <- rbinom(n, 1, 0.45)
estrato      <- sample(1:3, n, replace = TRUE, prob = c(0.45, 0.42, 0.13))
estrato_cat  <- factor(estrato, 1:3, c("Estrato 1", "Estrato 2", "Estrato 3+"))
tiene_moto <- rbinom(n, 1, 0.38)
tiene_auto <- rbinom(n, 1, 0.14)
# transporte público: más probable con trayecto largo y sin vehículo propio
tiempo   <- round(pmax(3, rgamma(n, shape = 2.1, scale = 11)))
lp_tp    <- -0.2 + 0.020*tiempo - 0.9*tiene_moto - 0.8*tiene_auto + 0.25*(estrato==1)
tp_publico <- rbinom(n, 1, pnorm(lp_tp))
tiempo_10  <- tiempo / 10
# --- índice latente del probit, calibrado a los AME documentados del Modelo C ---
z <- 0.15 - 0.075*tiempo_10 - 0.52*tp_publico - 0.145*educ_anios +
     0.03*mujer - 0.25*casado_union - 0.018*(edad-40) + 0.0010*(edad-40)^2 +
     -0.42*(estrato==2) - 0.38*(estrato>=3)
informal <- rbinom(n, 1, pnorm(z))

datos_modelo <- data.frame(informal, tiempo, tiempo_10, tp_publico, mujer, edad,
                           educ_anios, casado_union, estrato_cat, tiene_moto, tiene_auto)
controles <- "mujer + edad + I(edad^2) + educ_anios + casado_union + estrato_cat"
probit <- binomial(link = "probit")
w_mean <- function(x, w) weighted.mean(x, w, na.rm = TRUE)
`;

// Bloques ejecutables: el código REAL del análisis (adaptado a la muestra).
const BLOQUES = {
  modelo: {
    etiqueta: "Modelo probit (A, B y C)",
    codigo: `# Tres especificaciones probit sobre la misma muestra de Manrique
m_A <- glm(as.formula(paste("informal ~ tiempo_10 +", controles)), probit, datos_modelo)
m_B <- glm(as.formula(paste("informal ~ tp_publico +", controles)), probit, datos_modelo)
m_C <- glm(as.formula(paste("informal ~ tiempo_10 + tp_publico +", controles)), probit, datos_modelo)

cat("Tasa de informalidad en la muestra:", round(100*mean(datos_modelo$informal), 1), "%\\n")
cat("Observaciones:", nrow(datos_modelo), "\\n\\n")
cat("Coeficientes del Modelo C (probit):\\n")
round(summary(m_C)$coefficients, 3)`,
  },

  ame: {
    etiqueta: "Efectos marginales (AME)",
    codigo: `library(marginaleffects)
m_C <- glm(as.formula(paste("informal ~ tiempo_10 + tp_publico +", controles)), probit, datos_modelo)
ame_C <- avg_slopes(m_C)
tab <- as.data.frame(ame_C)[, c("term", "estimate", "conf.low", "conf.high", "p.value")]
tab$estimate  <- round(100*tab$estimate, 2)   # puntos porcentuales
tab$conf.low  <- round(100*tab$conf.low, 1)
tab$conf.high <- round(100*tab$conf.high, 1)
tab$p.value   <- round(tab$p.value, 3)
names(tab) <- c("Variable", "Efecto (pp)", "IC95 inf", "IC95 sup", "p")
print(tab, row.names = FALSE)`,
  },

  ajuste: {
    etiqueta: "Bondad de ajuste (AUC, HL)",
    codigo: `library(pROC)
m_A <- glm(as.formula(paste("informal ~ tiempo_10 +", controles)), probit, datos_modelo)
m_B <- glm(as.formula(paste("informal ~ tp_publico +", controles)), probit, datos_modelo)
m_C <- glm(as.formula(paste("informal ~ tiempo_10 + tp_publico +", controles)), probit, datos_modelo)

ajuste <- function(m, nombre) {
  y <- m$y; p <- fitted(m)
  data.frame(
    Modelo = nombre,
    pseudoR2 = round(1 - m$deviance/m$null.deviance, 3),
    AUC = round(as.numeric(pROC::auc(pROC::roc(y, p, quiet = TRUE))), 3),
    clasif = round(100*mean((p >= mean(y)) == y), 1)
  )
}
rbind(ajuste(m_A, "A"), ajuste(m_B, "B"), ajuste(m_C, "C"))`,
  },

  endogeneidad: {
    etiqueta: "Corrección por endogeneidad",
    codigo: `library(marginaleffects)
# Función de control (Rivers–Vuong): instrumentos = moto y carro en el hogar
etapa1 <- lm(as.formula(paste("tp_publico ~ tiene_moto + tiene_auto + tiempo_10 +", controles)),
             data = datos_modelo)
datos_modelo$residuo <- resid(etapa1)

m_C  <- glm(as.formula(paste("informal ~ tiempo_10 + tp_publico +", controles)), probit, datos_modelo)
m_IV <- glm(as.formula(paste("informal ~ tiempo_10 + tp_publico + residuo +", controles)),
            probit, datos_modelo)

p_res <- summary(m_IV)$coefficients["residuo", 4]
cat("p-valor del residuo (test de endogeneidad):", round(p_res, 3), "\\n\\n")

comp <- rbind(
  transform(as.data.frame(avg_slopes(m_C,  variables = c("tiempo_10","tp_publico"))), Modelo = "Probit (C)"),
  transform(as.data.frame(avg_slopes(m_IV, variables = c("tiempo_10","tp_publico"))), Modelo = "Función control")
)
comp$efecto_pp <- round(100*comp$estimate, 2)
comp$p <- round(comp$p.value, 3)
print(comp[, c("Modelo","term","efecto_pp","p")], row.names = FALSE)`,
  },

  prediccion: {
    etiqueta: "Gráfico: probabilidad predicha",
    codigo: `library(marginaleffects)
m_C <- glm(as.formula(paste("informal ~ tiempo_10 + tp_publico +", controles)), probit, datos_modelo)
rej <- predictions(m_C, newdata = datagrid(tiempo_10 = seq(0, 12, by = .5), tp_publico = 0:1))
rej <- as.data.frame(rej)

col_morado <- "#5B4A6B"; col_rosa <- "#C65D8E"
plot(rej$tiempo_10[rej$tp_publico==0]*10, rej$estimate[rej$tp_publico==0],
     type = "l", lwd = 3, col = col_morado, ylim = c(0, 1),
     xlab = "Minutos de viaje al trabajo", ylab = "P(informal)",
     main = "Probabilidad predicha de ser informal (Manrique)")
lines(rej$tiempo_10[rej$tp_publico==1]*10, rej$estimate[rej$tp_publico==1], lwd = 3, col = col_rosa)
legend("topright", c("Otro medio", "Transporte público"),
       col = c(col_morado, col_rosa), lwd = 3, bty = "n")
grid(col = "#E5DCE8")`,
  },

  comunas: {
    etiqueta: "Gráfico: informalidad por comuna",
    codigo: `# Informalidad por comuna (cifras de la ECV 2025; Manrique resaltada)
nombres <- c("El Poblado","Laureles","La América","Belén","Guayabal","La Candelaria",
             "Robledo","Buenos Aires","Castilla","Villa Hermosa","Aranjuez","San Javier",
             "Doce de Octubre","Santa Cruz","Popular","Manrique")
inf <- c(18.9,24.1,27.5,31.2,34.6,37.8,41.0,43.3,45.1,47.0,48.4,49.2,50.1,51.3,52.0,53.2)
col_gris <- "#A79FAE"; col_rosa <- "#C65D8E"
cols <- ifelse(nombres == "Manrique", col_rosa, col_gris)
par(mar = c(4, 8, 3, 2))
barplot(rev(inf), names.arg = rev(nombres), horiz = TRUE, las = 1, col = rev(cols),
        xlab = "% que no cotiza a pensión", xlim = c(0, 60),
        main = "Informalidad laboral por comuna · Medellín 2025")`,
  },
};

const codeEl = document.getElementById("webrCode");
const outEl = document.getElementById("webrOut");
const plotEl = document.getElementById("webrPlot");
const runBtn = document.getElementById("webrRun");
const statusEl = document.getElementById("webrStatus");
const exampleSel = document.getElementById("webrExample");

if (codeEl && runBtn) {
  // Poblar el selector con los bloques reales del análisis
  if (exampleSel) {
    exampleSel.innerHTML = Object.entries(BLOQUES)
      .map(([k, v]) => `<option value="${k}">${v.etiqueta}</option>`)
      .join("");
  }
  const primero = Object.keys(BLOQUES)[0];
  codeEl.value = BLOQUES[primero].codigo;
  if (exampleSel) {
    exampleSel.addEventListener("change", () => {
      codeEl.value = (BLOQUES[exampleSel.value] || {}).codigo || "";
      plotEl.style.display = "none";
    });
  }

  let webR = null;
  let shelter = null;

  async function ensureWebR() {
    if (webR) return webR;
    statusEl.textContent = "Descargando WebR y paquetes… (unos segundos la primera vez)";
    runBtn.disabled = true;
    const { WebR } = await import("https://webr.r-wasm.org/latest/webr.mjs");
    webR = new WebR();
    await webR.init();
    statusEl.textContent = "Instalando paquetes del modelo…";
    await webR.installPackages(["marginaleffects", "pROC"]);
    shelter = await new webR.Shelter();
    statusEl.textContent = "WebR listo ✔";
    runBtn.disabled = false;
    return webR;
  }

  async function run() {
    const src = PREAMBULO + "\n" + codeEl.value;
    outEl.textContent = "Ejecutando el modelo…";
    plotEl.style.display = "none";
    try {
      await ensureWebR();
      runBtn.disabled = true;
      statusEl.textContent = "Ejecutando R…";

      const hasPlot = /\b(plot|hist|barplot|boxplot|lines|points|legend|grid)\s*\(/.test(codeEl.value);
      const result = await shelter.captureR(src, {
        withAutoprint: true,
        captureGraphics: hasPlot ? { width: 820, height: 500 } : false,
      });
      const txt = result.output
        .filter((o) => o.type === "stdout" || o.type === "stderr")
        .map((o) => o.data)
        .join("\n");
      outEl.textContent = txt || "(sin salida de texto)";
      if (hasPlot && result.images && result.images.length) {
        const img = result.images[0];
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        plotEl.src = canvas.toDataURL();
        plotEl.style.display = "block";
      }
      shelter.purge();
      statusEl.textContent = "WebR listo ✔";
    } catch (err) {
      outEl.textContent = "Error: " + (err && err.message ? err.message : String(err)) +
        "\n\n(Si WebR no carga, tu red o navegador puede estar bloqueando WebAssembly. El código y el informe .qmd/.html siguen disponibles para descargar.)";
      statusEl.textContent = "Error al ejecutar";
    } finally {
      runBtn.disabled = false;
    }
  }

  runBtn.addEventListener("click", run);
}
