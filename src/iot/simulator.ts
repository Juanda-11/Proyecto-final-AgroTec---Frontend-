import type { Alert, Reading, SensorKey } from "../data/types";
import { cropRange } from "../ai/localRules";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const jitter = (amount: number) => (Math.random() * 2 - 1) * amount;

export const SENSOR_META: Record<SensorKey, { label: string; unit: string; icon: string; min: number; max: number; decimals: number }> = {
  soilMoisture: { label: "Humedad del suelo", unit: "%", icon: "water", min: 0, max: 100, decimals: 0 },
  temperature: { label: "Temperatura", unit: "°C", icon: "thermometer", min: 0, max: 40, decimals: 1 },
  ph: { label: "pH del suelo", unit: "pH", icon: "flask", min: 3.5, max: 9, decimals: 1 },
  uv: { label: "Radiación UV", unit: "UV", icon: "sunny", min: 0, max: 100, decimals: 0 },
  rain: { label: "Prob. de lluvia", unit: "%", icon: "rainy", min: 0, max: 100, decimals: 0 },
};
export const SENSOR_ORDER: SensorKey[] = ["soilMoisture", "temperature", "ph", "uv"];

export function initialReading(): Reading {
  return { soilMoisture: 52, temperature: 19, ph: 6.1, uv: 40, rain: 25, timestamp: Date.now() };
}

/** Caminata aleatoria con regresión suave a la media: se ve como un sensor real, no ruido blanco. */
export function nextReading(prev: Reading, drift?: Partial<Record<SensorKey, number>>): Reading {
  const pull = (v: number, mean: number, k: number) => v + (mean - v) * k;
  return {
    soilMoisture: clamp(pull(prev.soilMoisture, 50, 0.04) + jitter(3.2) + (drift?.soilMoisture ?? 0), 5, 95),
    temperature: clamp(pull(prev.temperature, 19, 0.05) + jitter(0.9) + (drift?.temperature ?? 0), 6, 36),
    ph: clamp(pull(prev.ph, 6.1, 0.06) + jitter(0.12) + (drift?.ph ?? 0), 4, 8.5),
    uv: clamp(pull(prev.uv, 45, 0.05) + jitter(5) + (drift?.uv ?? 0), 0, 100),
    rain: clamp(pull(prev.rain, 30, 0.05) + jitter(7) + (drift?.rain ?? 0), 0, 100),
    timestamp: Date.now(),
  };
}

/** Estado de cada sensor según el cultivo en foco. */
export function sensorRisk(key: SensorKey, v: number, crop: string): "BAJO" | "MEDIO" | "ALTO" {
  const c = cropRange(crop);
  switch (key) {
    case "soilMoisture":
      return v < c.moist - 15 ? "ALTO" : v < c.moist ? "MEDIO" : "BAJO";
    case "temperature":
      return v > c.tempMax + 3 ? "ALTO" : v > c.tempMax ? "MEDIO" : "BAJO";
    case "ph":
      return v < c.phMin - 0.4 || v > c.phMax + 0.4 ? "ALTO" : v < c.phMin || v > c.phMax ? "MEDIO" : "BAJO";
    case "uv":
      return v > 85 ? "ALTO" : v > 70 ? "MEDIO" : "BAJO";
    case "rain":
      return v > 85 ? "ALTO" : v > 70 ? "MEDIO" : "BAJO";
  }
}

let seq = 0;
export function alertsFor(r: Reading, crop: string): Alert[] {
  return (Object.keys(SENSOR_META) as SensorKey[])
    .map((key) => ({ key, risk: sensorRisk(key, r[key], crop) }))
    .filter((x) => x.risk !== "BAJO")
    .map(({ key, risk }) => ({
      id: `a${Date.now()}-${seq++}`,
      sensor: key,
      title: `${SENSOR_META[key].label} · ${risk}`,
      message: `Valor ${r[key].toFixed(SENSOR_META[key].decimals)} ${SENSOR_META[key].unit} (${crop})`,
      severity: risk,
      timestamp: r.timestamp,
    }));
}
