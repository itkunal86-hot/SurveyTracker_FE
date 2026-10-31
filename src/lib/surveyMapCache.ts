import apiClient from "@/lib/api";

export const SURVEY_MAP_LAYER_NAMES = [
  "PipeLine",
  "Valve",
  "Consumer",
  "Catastrophe",
  "CNG Station",
  "DRS Station",
] as const;

export type SurveyMapLayerName = (typeof SURVEY_MAP_LAYER_NAMES)[number];

export type SurveyMapLayerKey =
  | "pipeline"
  | "valve"
  | "consumer"
  | "catastrophe"
  | "cng"
  | "drs";

const LAYER_KEYS: Record<SurveyMapLayerName, SurveyMapLayerKey> = {
  PipeLine: "pipeline",
  Valve: "valve",
  Consumer: "consumer",
  Catastrophe: "catastrophe",
  "CNG Station": "cng",
  "DRS Station": "drs",
};

export type SurveyMapLayers = Record<SurveyMapLayerKey, string | null>;
export type SurveyMapCounts = Record<SurveyMapLayerKey, number>;

export type GeoJsonMapLayer = {
  id: string;
  text: string;
  kind: "line" | "point";
  color: [number, number, number];
};

export type SurveyMapSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  layers: SurveyMapLayers;
  counts: SurveyMapCounts;
};

const EMPTY_LAYERS: SurveyMapLayers = {
  pipeline: null,
  valve: null,
  consumer: null,
  catastrophe: null,
  cng: null,
  drs: null,
};

const EMPTY_COUNTS: SurveyMapCounts = {
  pipeline: 0,
  valve: 0,
  consumer: 0,
  catastrophe: 0,
  cng: 0,
  drs: 0,
};

const DB_NAME = "altgeo-survey-map";
const STORE = "layers";

const memory = new Map<SurveyMapLayerName, string>();
const featureCounts = new Map<SurveyMapLayerName, number>();
const listeners = new Set<() => void>();
let snapshot: SurveyMapSnapshot = {
  status: "idle",
  error: null,
  layers: EMPTY_LAYERS,
  counts: EMPTY_COUNTS,
};
let loadPromise: Promise<void> | null = null;
let loadedOnce = false;

function countFeatures(text: string) {
  return (text.match(/"type"\s*:\s*"Feature"/g) || []).length;
}

function rememberLayer(name: SurveyMapLayerName, text: string) {
  memory.set(name, text);
  featureCounts.set(name, countFeatures(text));
}

function publish(next: Partial<SurveyMapSnapshot>) {
  const layers = { ...EMPTY_LAYERS };
  const counts = { ...EMPTY_COUNTS };
  for (const name of SURVEY_MAP_LAYER_NAMES) {
    const key = LAYER_KEYS[name];
    layers[key] = memory.get(name) ?? null;
    counts[key] = featureCounts.get(name) ?? 0;
  }
  snapshot = {
    status: next.status ?? snapshot.status,
    error: next.error === undefined ? snapshot.error : next.error,
    layers,
    counts,
  };
  listeners.forEach((listener) => listener());
}

export function subscribeSurveyMapCache(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSurveyMapSnapshot() {
  return snapshot;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredLayers() {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = (request.result || []) as SurveyMapLayerName[];
        if (keys.length === 0) {
          resolve();
          return;
        }
        let pending = keys.length;
        for (const key of keys) {
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            const value = getRequest.result;
            if (typeof value === "string" && value.length > 0) rememberLayer(key, value);
            pending -= 1;
            if (pending === 0) resolve();
          };
          getRequest.onerror = () => reject(getRequest.error);
        }
      };
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    // Storage can be unavailable. The network fetch still fills memory.
  }
}

async function storeLayer(name: SurveyMapLayerName, text: string) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(text, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // The in-memory copy is still used for this session.
  }
}

async function deleteStoredLayers() {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore storage cleanup failures.
  }
}

function layerText(data: unknown) {
  if (typeof data === "string") return data;
  if (data) return JSON.stringify(data);
  return "";
}

async function loadMissingLayers() {
  const missing = SURVEY_MAP_LAYER_NAMES.filter((name) => !memory.has(name));
  await Promise.all(
    missing.map(async (name) => {
      const response = await apiClient.getSurveyGeoJson(name);
      const text = layerText(response?.data);
      if (!text) return;
      rememberLayer(name, text);
      await storeLayer(name, text);
    }),
  );
}

async function loadAll(force: boolean) {
  publish({ status: "loading", error: null });
  if (force) {
    memory.clear();
    featureCounts.clear();
    await deleteStoredLayers();
  } else {
    await readStoredLayers();
    publish({ status: "loading", error: null });
  }
  try {
    await loadMissingLayers();
    loadedOnce = true;
    publish({ status: "ready", error: null });
  } catch (error) {
    loadedOnce = memory.size > 0;
    publish({
      status: memory.size > 0 ? "ready" : "error",
      error: error instanceof Error ? error.message : "Failed to load map data",
    });
  }
}

export function ensureSurveyMapCache() {
  if (loadedOnce) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = loadAll(false).finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export function refreshSurveyMapCache() {
  loadedOnce = false;
  loadPromise = loadAll(true).finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}

export async function readSurveyMapLayer(name: SurveyMapLayerName) {
  await ensureSurveyMapCache();
  return memory.get(name) || '{"type":"FeatureCollection","features":[]}';
}

export function parseGeoJsonFeatures(text: string): any[] {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed?.features) ? parsed.features : [];
  } catch {
    return [];
  }
}
