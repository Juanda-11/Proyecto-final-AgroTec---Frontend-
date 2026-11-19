import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_LOTS } from "../data/farm";
import type { Alert, ChatMessage, DeviceStatus, Lot, Reading, SensorKey, SensorSource } from "../data/types";
import * as api from "../services/api";
import { clearState, loadState, saveState } from "../services/storage";
import { alertsFor, initialReading, nextReading } from "../iot/simulator";
import { DoublyLinkedList, Queue, SinglyLinkedList, Stack } from "../structures";

interface ConfigChange {
  lotId: string;
  from: number;
  to: number;
}

interface FarmValue {
  reading: Reading;
  series: Reading[];
  crop: string;
  setCrop: (c: string) => void;
  auto: boolean;
  setAuto: (v: boolean) => void;
  tick: (drift?: Partial<Record<keyof Reading, number>>) => void;
  /** Where readings come from: the built-in simulator or the physical ESP32 node. */
  source: SensorSource;
  setSource: (s: SensorSource) => void;
  deviceStatus: DeviceStatus;
  /** Cola FIFO de alertas pendientes. */
  pending: Alert[];
  attendNext: () => Alert | undefined;
  /** Pila de alertas atendidas (más reciente primero). */
  attended: Alert[];
  /** Historial navegable (lista doble). */
  history: { current: Reading | undefined; position: number; size: number; hasPrev: boolean; hasNext: boolean };
  historyPrev: () => void;
  historyNext: () => void;
  historyLatest: () => void;
  /** Registro secuencial (lista simple). */
  logSize: number;
  lots: Lot[];
  /** Códigos de parcelas añadidas por el usuario al índice AVL. */
  extraParcels: number[];
  addParcel: (code: number) => void;
  chat: ChatMessage[];
  setChat: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  /** Borra datos guardados y restablece lotes, chat y parcelas. */
  resetData: () => void;
  setMoistureTarget: (id: string, value: number) => void;
  undoConfig: () => ConfigChange | undefined;
  canUndo: boolean;
}

const Ctx = createContext<FarmValue | null>(null);
const MAX_SERIES = 30;
const MAX_CHAT = 40;
export const WELCOME: ChatMessage = {
  id: "w",
  role: "assistant",
  text: "¡Hola! Soy AgroIA 🌱. Conozco las lecturas de tu finca y puedo ayudarte con riego, plagas, pH y fertilización.",
};
const MAX_LOG = 300;

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const queue = useRef(new Queue<Alert>()).current;
  const attendedStack = useRef(new Stack<Alert>(20)).current;
  const undoStack = useRef(new Stack<ConfigChange>(30)).current;
  const log = useRef(new SinglyLinkedList<Reading>()).current;
  const hist = useRef(new DoublyLinkedList<Reading>()).current;

  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  // Historial inicial de 12 lecturas para que gráficos y navegación tengan datos desde el primer momento.
  const seed = useRef<Reading[]>(null as unknown as Reading[]);
  if (!seed.current) {
    const now = Date.now();
    const arr: Reading[] = [];
    let cur = initialReading();
    for (let i = 11; i >= 0; i--) {
      cur = { ...nextReading(cur), timestamp: now - i * 5000 };
      arr.push(cur);
      log.prepend(cur);
      hist.append(cur);
    }
    hist.toLatest();
    seed.current = arr;
  }
  const [reading, setReading] = useState<Reading>(() => seed.current[seed.current.length - 1]!);
  const [series, setSeries] = useState<Reading[]>(seed.current);
  const [crop, setCrop] = useState("Papa");
  const [auto, setAuto] = useState(true);
  const [lots, setLots] = useState<Lot[]>(INITIAL_LOTS);
  const [source, setSourceState] = useState<SensorSource>("simulated");
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({ state: "unknown", realKeys: [] });

  const [extraParcels, setExtraParcels] = useState<number[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([WELCOME]);
  const [hydrated, setHydrated] = useState(false);

  // Cargar lo guardado al abrir la app
  useEffect(() => {
    let alive = true;
    loadState().then((saved) => {
      if (!alive) return;
      if (saved.crop) setCrop(saved.crop);
      if (saved.targets) {
        const t = saved.targets;
        setLots((cur) => cur.map((l) => (typeof t[l.id] === "number" ? { ...l, moistureTarget: t[l.id]! } : l)));
      }
      if (Array.isArray(saved.extraParcels)) setExtraParcels(saved.extraParcels.filter((n) => Number.isInteger(n)));
      if (Array.isArray(saved.chat) && saved.chat.length) setChat(saved.chat);
      if (saved.source === "device" || saved.source === "simulated") setSourceState(saved.source);
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  // Guardar cuando cambia algo relevante
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      saveState({
        crop,
        targets: Object.fromEntries(lots.map((l) => [l.id, l.moistureTarget])),
        extraParcels,
        chat: chat.slice(-MAX_CHAT),
        source,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, crop, lots, extraParcels, chat, source]);

  const addParcel = useCallback((code: number) => {
    setExtraParcels((cur) => (cur.includes(code) ? cur : [...cur, code]));
  }, []);

  const resetData = useCallback(() => {
    clearState();
    setLots(INITIAL_LOTS);
    setExtraParcels([]);
    setChat([WELCOME]);
    setCrop("Papa");
    setSourceState("simulated");
  }, []);

  const cropRef = useRef(crop);
  cropRef.current = crop;
  const lastRef = useRef(reading);

  /** Common path for simulated and real readings: log, history, alert queue and chart series. */
  const pushReading = useCallback((r: Reading) => {
    lastRef.current = r;
    log.prepend(r);
    log.truncate(MAX_LOG);
    hist.append(r);
    hist.toLatest();
    alertsFor(r, cropRef.current).forEach((a) => queue.enqueue(a));
    setReading(r);
    setSeries((s) => [...s.slice(-(MAX_SERIES - 1)), r]);
    bump();
  }, [hist, log, queue]);

  const tick = useCallback((drift?: Partial<Record<keyof Reading, number>>) => {
    pushReading(nextReading(lastRef.current, drift));
  }, [pushReading]);

  const setSource = useCallback((next: SensorSource) => {
    setSourceState(next);
    if (next === "simulated") setDeviceStatus({ state: "unknown", realKeys: [] });
  }, []);

  // Simulator: only while the source is "simulated"
  useEffect(() => {
    if (source !== "simulated" || !auto) return;
    const id = setInterval(() => tick(), 5000);
    return () => clearInterval(id);
  }, [source, auto, tick]);

  // Physical node: poll the backend while the source is "device"
  const lastDeviceTs = useRef(0);
  useEffect(() => {
    if (source !== "device") return;
    let alive = true;
    const poll = async () => {
      try {
        const latest = await api.fetchDeviceLatest();
        if (!alive) return;
        const d = latest.reading;
        if (!d) {
          setDeviceStatus({ state: "nodata", realKeys: [] });
          return;
        }
        const realKeys: SensorKey[] = ["soilMoisture", "temperature"];
        if (d.ph !== null) realKeys.push("ph");
        if (d.uv !== null) realKeys.push("uv");
        if (d.rain !== null) realKeys.push("rain");
        setDeviceStatus({ state: latest.online ? "online" : "offline", deviceId: d.device_id, ageSeconds: latest.age_seconds, realKeys });
        if (d.timestamp !== lastDeviceTs.current) {
          lastDeviceTs.current = d.timestamp;
          // Sensors the node does not have keep a simulated value so the dashboard stays complete.
          const sim = nextReading(lastRef.current);
          pushReading({
            soilMoisture: d.soil_moisture,
            temperature: d.temperature,
            ph: d.ph ?? sim.ph,
            uv: d.uv ?? sim.uv,
            rain: d.rain ?? sim.rain,
            timestamp: d.timestamp,
          });
        }
      } catch {
        if (alive) setDeviceStatus((cur) => ({ ...cur, state: "error" }));
      }
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [source, pushReading]);

  const attendNext = useCallback(() => {
    const a = queue.dequeue();
    if (a) attendedStack.push(a);
    bump();
    return a;
  }, [attendedStack, queue]);

  const setMoistureTarget = useCallback((id: string, value: number) => {
    setLots((cur) =>
      cur.map((l) => {
        if (l.id !== id) return l;
        const to = Math.min(90, Math.max(20, value));
        if (to !== l.moistureTarget) undoStack.push({ lotId: id, from: l.moistureTarget, to });
        return { ...l, moistureTarget: to };
      })
    );
    bump();
  }, [undoStack]);

  const undoConfig = useCallback(() => {
    const change = undoStack.pop();
    if (change) setLots((cur) => cur.map((l) => (l.id === change.lotId ? { ...l, moistureTarget: change.from } : l)));
    bump();
    return change;
  }, [undoStack]);

  const value = useMemo<FarmValue>(
    () => ({
      reading, series, crop, setCrop, auto, setAuto, tick, source, setSource, deviceStatus,
      pending: queue.toArray(),
      attendNext,
      attended: attendedStack.toArray(),
      history: {
        current: hist.current(),
        position: hist.position(),
        size: hist.size,
        hasPrev: hist.hasPrev(),
        hasNext: hist.hasNext(),
      },
      historyPrev: () => { hist.prev(); bump(); },
      historyNext: () => { hist.next(); bump(); },
      historyLatest: () => { hist.toLatest(); bump(); },
      logSize: log.size,
      lots, extraParcels, addParcel, chat, setChat, resetData,
      setMoistureTarget, undoConfig, canUndo: !undoStack.isEmpty(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, reading, series, crop, auto, source, deviceStatus, lots, extraParcels, chat, tick, attendNext, setMoistureTarget, undoConfig, addParcel, resetData]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFarm(): FarmValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFarm debe usarse dentro de FarmProvider");
  return v;
}
