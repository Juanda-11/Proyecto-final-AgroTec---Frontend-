import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage } from "../data/types";

const KEY = "agrotec:v1";

export interface PersistedState {
  crop?: string;
  /** moistureTarget por id de lote */
  targets?: Record<string, number>;
  extraParcels?: number[];
  chat?: ChatMessage[];
}

/** Lectura tolerante: si el almacenamiento falla o está corrupto se arranca limpio. */
export async function loadState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as PersistedState;
    return typeof data === "object" && data ? data : {};
  } catch {
    return {};
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sin espacio o modo privado: la app sigue funcionando sin persistir */
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
