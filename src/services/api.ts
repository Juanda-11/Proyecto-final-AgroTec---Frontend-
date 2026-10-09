import { assess, forecast as localForecast, keywordReply, ruleDiagnosis } from "../ai/localRules";
import type { Assessment, ChatMessage, DiagnoseResult, ForecastResult, Reading } from "../data/types";

/** Define EXPO_PUBLIC_API_URL (p. ej. https://agrotec-api.vercel.app). Sin ella se usa solo IA local. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function post<T>(path: string, body: unknown, timeoutMs = 35000): Promise<T> {
  if (!API_URL) throw new Error("API no configurada");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

const toApi = (r: Reading) => ({
  soil_moisture: r.soilMoisture,
  temperature: r.temperature,
  ph: r.ph,
  uv: r.uv,
  rain: r.rain,
});

export async function checkBackend(): Promise<"gemini" | "reglas" | "offline"> {
  if (!API_URL) return "offline";
  try {
    const res = await fetch(`${API_URL}/api/health`);
    const j = (await res.json()) as { gemini: boolean };
    return j.gemini ? "gemini" : "reglas";
  } catch {
    return "offline";
  }
}

export async function analyze(reading: Reading, crop: string): Promise<Assessment> {
  try {
    return await post<Assessment>("/api/analyze", { reading: toApi(reading), crop });
  } catch {
    return assess(reading, crop);
  }
}

export async function chat(message: string, history: ChatMessage[], reading: Reading, crop: string) {
  try {
    const r = await post<{ reply: string; source: "gemini" | "reglas" }>("/api/chat", {
      message,
      history: history.slice(-10).map((m) => ({ role: m.role, text: m.text })),
      reading: toApi(reading),
      crop,
    });
    return r;
  } catch {
    return { reply: keywordReply(message), source: "reglas" as const };
  }
}

export async function diagnose(crop: string, symptoms: string, image?: { base64: string; mime: string }): Promise<DiagnoseResult> {
  try {
    const r = await post<{
      probable_causes: string[];
      recommendation: string;
      urgency: DiagnoseResult["urgency"];
      disclaimer: string;
      source: DiagnoseResult["source"];
    }>("/api/diagnose", { crop, symptoms, image_base64: image?.base64, image_mime: image?.mime ?? "image/jpeg" }, 30000);
    return { probableCauses: r.probable_causes, recommendation: r.recommendation, urgency: r.urgency, disclaimer: r.disclaimer, source: r.source };
  } catch {
    return ruleDiagnosis(crop, symptoms);
  }
}

export async function forecast(values: number[], criticalBelow = 30): Promise<ForecastResult> {
  try {
    const r = await post<{ forecast: number[]; slope: number; r2: number; hours_to_critical: number | null; trend: ForecastResult["trend"] }>(
      "/api/forecast",
      { values, horizon: 6, critical_below: criticalBelow }
    );
    return { forecast: r.forecast, slope: r.slope, r2: r.r2, hoursToCritical: r.hours_to_critical, trend: r.trend };
  } catch {
    return localForecast(values, 6, criticalBelow);
  }
}

export async function summarize(alerts: string[]): Promise<{ summary: string; source: "gemini" | "reglas" }> {
  try {
    return await post("/api/summary", { alerts });
  } catch {
    return {
      summary: alerts.length ? `${alerts.length} alertas pendientes. Atienda primero: ${alerts[0]}.` : "Sin alertas pendientes. Todo en orden.",
      source: "reglas",
    };
  }
}
