/**
 * Respaldo local (sin red) que replica las reglas del backend.
 * Se usa cuando la API no responde, para que la app siempre funcione.
 */
import type { Assessment, DiagnoseResult, ForecastResult, Reading, Risk } from "../data/types";

const RANGES: Record<string, { moist: number; phMin: number; phMax: number; tempMax: number }> = {
  papa: { moist: 40, phMin: 5.0, phMax: 6.5, tempMax: 24 },
  café: { moist: 45, phMin: 5.0, phMax: 6.5, tempMax: 28 },
  cafe: { moist: 45, phMin: 5.0, phMax: 6.5, tempMax: 28 },
  hortalizas: { moist: 50, phMin: 6.0, phMax: 7.0, tempMax: 26 },
  maíz: { moist: 40, phMin: 5.8, phMax: 7.0, tempMax: 30 },
  maiz: { moist: 40, phMin: 5.8, phMax: 7.0, tempMax: 30 },
  fresa: { moist: 55, phMin: 5.5, phMax: 6.5, tempMax: 25 },
};
const DEFAULT = { moist: 40, phMin: 5.4, phMax: 7.4, tempMax: 28 };

export const DISCLAIMER =
  "Orientación de apoyo para un prototipo académico; no reemplaza la visita de un agrónomo o de la UMATA/ICA.";

export const cropRange = (crop: string) => RANGES[crop.trim().toLowerCase()] ?? DEFAULT;
export const level = (score: number): Risk => (score >= 5 ? "ALTO" : score >= 2 ? "MEDIO" : "BAJO");

export function assess(r: Reading, crop: string): Assessment {
  const c = cropRange(crop);
  let score = 0;
  const messages: string[] = [];
  if (r.soilMoisture < c.moist - 15) {
    score += 3;
    messages.push(`Humedad crítica (${r.soilMoisture.toFixed(0)}%): riesgo de estrés hídrico.`);
  } else if (r.soilMoisture < c.moist) {
    score += 1;
    messages.push(`Humedad por debajo del objetivo para ${crop} (${c.moist}%).`);
  }
  if (r.temperature > c.tempMax) {
    score += 2;
    messages.push(`Temperatura alta (${r.temperature.toFixed(1)} °C) para ${crop}.`);
  }
  if (r.ph < c.phMin || r.ph > c.phMax) {
    score += 2;
    messages.push(`pH ${r.ph.toFixed(1)} fuera del rango ${c.phMin}-${c.phMax}.`);
  }
  if (r.rain > 70) {
    score += 1;
    messages.push("Alta probabilidad de lluvia: vigile encharcamiento y hongos.");
  }
  if (r.uv > 80) {
    score += 1;
    messages.push("Radiación UV muy alta: proteja plántulas y cultivos bajo invernadero.");
  }
  const irrigation =
    r.soilMoisture < c.moist - 20 ? "URGENTE" : r.soilMoisture < c.moist && r.rain < 40 ? "RECOMENDADO" : "NINGUNO";
  if (!messages.length) messages.push("Condiciones dentro de los rangos esperados.");
  const advice = {
    URGENTE: "Riegue hoy en las horas frescas (temprano o al atardecer) y revise de nuevo en 2 horas.",
    RECOMENDADO: "Programe un riego ligero; evite regar si se espera lluvia en las próximas horas.",
    NINGUNO: "No es necesario regar. Mantenga el monitoreo.",
  }[irrigation];
  return { risk: level(score), score, irrigation, messages, advice, source: "reglas" };
}

const REPLIES: Array<[string[], string]> = [
  [["humedad", "riego", "regar"], "Si la humedad del suelo baja del objetivo de su cultivo, programe riego en horas frescas. Con lluvia probable, espere antes de regar."],
  [["plaga", "mosca", "ácaro", "acaro", "gusano"], "Para plagas, inspeccione el envés de las hojas, aísle plantas afectadas y consulte al ICA/UMATA antes de aplicar productos."],
  [["tizón", "tizon", "roya", "hongo"], "Hongos como el tizón tardío o la roya prosperan con humedad alta. Mejore la ventilación, retire hojas afectadas y consulte por fungicidas autorizados."],
  [["fertiliz", "abono", "nutrient"], "La fertilización depende del cultivo, la etapa y el análisis de suelo. Evite aplicar antes de lluvias fuertes."],
  [[" ph", "ph ", "ácido", "acido", "cal "], "Un pH fuera de rango limita la absorción de nutrientes. Un análisis de suelo indica si necesita encalar o corregir."],
];

export function keywordReply(message: string): string {
  const low = ` ${message.toLowerCase()} `;
  for (const [keys, reply] of REPLIES) if (keys.some((k) => low.includes(k))) return reply;
  return "Puedo ayudarte con riego, plagas, enfermedades, pH y fertilización. Cuéntame el cultivo y qué observas.";
}

const SYMPTOMS: Array<[string[], string, Risk]> = [
  [["amarill", "clorosis"], "Deficiencia de nitrógeno o exceso de agua", "MEDIO"],
  [["mancha", "tizón", "tizon", "negr"], "Hongo foliar (p. ej. tizón tardío)", "ALTO"],
  [["enroll"], "Estrés hídrico, ácaros o virus", "MEDIO"],
  [["mosca blanca", "polvillo", "insecto", "pulgon", "pulgón"], "Plaga chupadora (mosca blanca, pulgón)", "MEDIO"],
  [["podr", "pudri", "raíz", "raiz", "marchit"], "Pudrición radicular por exceso de humedad", "ALTO"],
  [["roya", "naranja"], "Roya", "ALTO"],
];

export function ruleDiagnosis(crop: string, symptoms: string): DiagnoseResult {
  const low = symptoms.toLowerCase();
  const rank: Record<Risk, number> = { BAJO: 0, MEDIO: 1, ALTO: 2 };
  const order: Risk[] = ["BAJO", "MEDIO", "ALTO"];
  let top = 0;
  const causes: string[] = [];
  for (const [keys, cause, urg] of SYMPTOMS)
    if (keys.some((k) => low.includes(k))) {
      causes.push(cause);
      top = Math.max(top, rank[urg]);
    }
  if (!causes.length) causes.push("Síntomas inespecíficos: se requiere inspección en campo");
  return {
    probableCauses: causes,
    recommendation: `Para ${crop}: aísle la zona afectada, evite regar sobre el follaje, tome fotos del avance y solicite visita técnica antes de aplicar agroquímicos.`,
    urgency: order[top]!,
    disclaimer: DISCLAIMER,
    source: "reglas",
  };
}

/** Regresión lineal por mínimos cuadrados. */
export function forecast(values: number[], horizon = 6, criticalBelow: number | null = 30): ForecastResult {
  const n = values.length;
  const mx = (n - 1) / 2;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0, sst = 0;
  values.forEach((y, x) => {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    sst += (y - my) ** 2;
  });
  const slope = sxx ? sxy / sxx : 0;
  const intercept = my - slope * mx;
  let ssr = 0;
  values.forEach((y, x) => (ssr += (y - (intercept + slope * x)) ** 2));
  const r2 = sst ? 1 - ssr / sst : 1;
  const preds = Array.from({ length: horizon }, (_, i) => Math.max(0, +(intercept + slope * (n + i)).toFixed(2)));
  let hoursToCritical: number | null = null;
  if (criticalBelow !== null && slope < 0) {
    const last = values[n - 1]!;
    hoursToCritical = last <= criticalBelow ? 0 : +((last - criticalBelow) / -slope).toFixed(1);
  }
  const trend = Math.abs(slope) < 0.05 ? "ESTABLE" : slope > 0 ? "SUBE" : "BAJA";
  return { forecast: preds, slope: +slope.toFixed(4), r2: +r2.toFixed(3), hoursToCritical, trend };
}
