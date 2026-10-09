export type Risk = "BAJO" | "MEDIO" | "ALTO";
export type SensorKey = "soilMoisture" | "temperature" | "ph" | "uv" | "rain";

export interface Reading {
  soilMoisture: number;
  temperature: number;
  ph: number;
  uv: number;
  rain: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  sensor: SensorKey;
  title: string;
  message: string;
  severity: Risk;
  timestamp: number;
}

export interface Assessment {
  risk: Risk;
  score: number;
  irrigation: "NINGUNO" | "RECOMENDADO" | "URGENTE";
  messages: string[];
  advice: string;
  source: "gemini" | "reglas";
}

export interface DiagnoseResult {
  probableCauses: string[];
  recommendation: string;
  urgency: Risk;
  disclaimer: string;
  source: "gemini" | "reglas";
}

export interface ForecastResult {
  forecast: number[];
  slope: number;
  r2: number;
  hoursToCritical: number | null;
  trend: "SUBE" | "BAJA" | "ESTABLE";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: "gemini" | "reglas";
}

export interface Lot {
  id: string;
  code: number;
  name: string;
  crop: string;
  hectares: number;
  moistureTarget: number;
}
