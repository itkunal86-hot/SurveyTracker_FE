import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeafletMap } from "@/components/LeafletMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";
import { Pagination } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTable } from "@/hooks/use-table";
import {
  Calendar as CalendarIcon,
  Download,
  MapPin,
  Clock,
  Gauge,
  Filter,
  RefreshCw,
  User,
  Activity,
  Layers,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { API_BASE_PATH, apiClient } from "@/lib/api";
import { useSurveyContext } from "@/contexts/SurveyContext";

interface Device {
  id: string;
  name: string;
  type: string;
}

// Dynamic snapshot row from API
type SnapshotRow = Record<string, any>;

interface CoordinatePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

interface SnapshotEntry {
  coords: CoordinatePoint;
  timestamp: Date | null;
  snapshot: SnapshotRow;
  index: number;
}

const LATITUDE_KEYS = [
  "lat",
  "latitude",
  "latDeg",
  "latitudeDeg",
  "latitudeDegree",
  "latDegrees",
  "gpsLat",
  "lat_value",
  "latValue",
];
const LONGITUDE_KEYS = [
  "lng",
  "lon",
  "long",
  "longitude",
  "longitudeDeg",
  "longitudeDegree",
  "lngDegrees",
  "gpsLng",
  "long_value",
  "lonValue",
];
const ELEVATION_KEYS = ["elevation", "elev", "altitude", "alt", "height", "z"];
const COORDINATE_CONTAINER_KEYS = [
  "coordinates",
  "coordinate",
  "location",
  "Location",
  "LOCATION",
  "position",
  "geo",
  "gps",
  "point",
  "latlng",
  "locationPoint",
  "locationInfo",
  "geometry",
  "lastKnownLocation",
  "geoCoordinates",
  "geo_location",
];
const TIMESTAMP_KEYS = [
  "timestamp",
  "time",
  "date",
  "entryDate",
  "entryTime",
  "installedDate",
  "Installed Date",
  "installationDate",
  "recordedAt",
  "createdAt",
  "updatedAt",
  "startTime",
  "endTime",
  "logTime",
  "capturedAt",
  "loggedAt",
];
const VALVE_CONTAINER_KEYS = ["valve", "valveInfo", "valveDetails", "valveData"];
const DIAMETER_KEYS = ["pipeDiameter", "diameter", "Diameter", "DIAMETER", "pipelineDiameter", "diameterMm", "diameterMM", "pipe_diameter"];
const DEPTH_KEYS = ["pipeDepth", "depth", "Depth", "DEPTH", "pipelineDepth", "depthMeters", "depthM", "burialDepth"];

const parseMaybeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const sanitized = value.trim().replace(/[^0-9.+-]/g, "");
    if (!sanitized) return null;
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractCoordinateFromCandidate = (candidate: any): CoordinatePoint | null => {
  if (!candidate) return null;

  if (Array.isArray(candidate)) {
    const [latRaw, lngRaw, elevRaw] = candidate;
    const lat = parseMaybeNumber(latRaw);
    const lng = parseMaybeNumber(lngRaw);
    if (lat == null || lng == null) return null;
    const elevation = parseMaybeNumber(elevRaw);
    return {
      lat,
      lng,
      ...(elevation != null ? { elevation } : {}),
    };
  }

  if (typeof candidate === "string") {
    const numericParts = candidate
      .split(/[,;\s]+/)
      .map((part) => parseMaybeNumber(part))
      .filter((part): part is number => part != null);

    if (numericParts.length >= 2) {
      const [lat, lng, elevation] = numericParts;
      return {
        lat,
        lng,
        ...(typeof elevation === "number" ? { elevation } : {}),
      };
    }
    const matches = candidate.match(/-?\d+(\.\d+)?/g);
    if (matches && matches.length >= 2) {
      const lat = parseMaybeNumber(matches[0]);
      const lng = parseMaybeNumber(matches[1]);
      if (lat != null && lng != null) {
        const elevation = matches[2] ? parseMaybeNumber(matches[2]) : null;
        return {
          lat,
          lng,
          ...(elevation != null ? { elevation } : {}),
        };
      }
    }
    return null;
  }

  if (typeof candidate === "object") {
    for (const key of COORDINATE_CONTAINER_KEYS) {
      const nested = (candidate as Record<string, any>)[key];
      if (nested && nested !== candidate) {
        const resolved = extractCoordinateFromCandidate(nested);
        if (resolved) return resolved;
      }
    }

    const latKey = LATITUDE_KEYS.find((key) => parseMaybeNumber((candidate as Record<string, any>)[key]) != null);
    const lngKey = LONGITUDE_KEYS.find((key) => parseMaybeNumber((candidate as Record<string, any>)[key]) != null);

    if (latKey && lngKey) {
      const lat = parseMaybeNumber((candidate as Record<string, any>)[latKey])!;
      const lng = parseMaybeNumber((candidate as Record<string, any>)[lngKey])!;
      const elevationKey = ELEVATION_KEYS.find(
        (key) => parseMaybeNumber((candidate as Record<string, any>)[key]) != null,
      );
      const elevation = elevationKey != null ? parseMaybeNumber((candidate as Record<string, any>)[elevationKey]) : null;

      return {
        lat,
        lng,
        ...(elevation != null ? { elevation } : {}),
      };
    }
  }

  return null;
};

const extractCoordinateFromSnapshot = (snapshot: Record<string, any> | null | undefined): CoordinatePoint | null => {
  if (!snapshot || typeof snapshot !== "object") return null;
  return extractCoordinateFromCandidate(snapshot);
};

const parseDateValue = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1e12) return new Date(value);
    if (value > 1e9) return new Date(value * 1000);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const getTimestampFromSnapshot = (snapshot: Record<string, any>): Date | null => {
  for (const key of TIMESTAMP_KEYS) {
    if (snapshot[key] != null) {
      const parsed = parseDateValue(snapshot[key]);
      if (parsed) return parsed;
    }
  }

  const nestedContainers = ["metadata", "details", "summary", "info", "context"];
  for (const container of nestedContainers) {
    const nested = snapshot[container];
    if (nested && typeof nested === "object") {
      for (const key of TIMESTAMP_KEYS) {
        const parsed = parseDateValue((nested as Record<string, any>)[key]);
        if (parsed) return parsed;
      }
    }
  }

  return null;
};

const normalizeDeviceStatus = (value: unknown): "active" | "offline" | "maintenance" | "error" => {
  if (typeof value === "number") {
    if (value <= 0) return "offline";
    if (value === 2) return "maintenance";
  }
  const text = typeof value === "string" ? value.toLowerCase() : "";
  if (text.includes("maint")) return "maintenance";
  if (text.includes("error") || text.includes("fault") || text.includes("critical") || text.includes("alarm")) return "error";
  if (text.includes("inactive") || text.includes("offline") || text.includes("lost") || text.includes("disconnect")) return "offline";
  return "active";
};

const normalizePipelineStatus = (value: unknown): "normal" | "warning" | "maintenance" | "critical" => {
  const text = typeof value === "string" ? value.toLowerCase() : "";
  if (text.includes("maint")) return "maintenance";
  if (text.includes("warn") || text.includes("caution")) return "warning";
  if (text.includes("critical") || text.includes("fault") || text.includes("alarm")) return "critical";
  return "normal";
};

const normalizeValveType = (value: unknown): "control" | "emergency" | "isolation" | "station" => {
  const text = typeof value === "string" ? value.toLowerCase() : "";
  if (text.includes("emerg")) return "emergency";
  if (text.includes("iso")) return "isolation";
  if (text.includes("station") || text.includes("hub")) return "station";
  return "control";
};

const normalizeValveStatus = (value: unknown): "open" | "closed" | "maintenance" | "fault" => {
  const text = typeof value === "string" ? value.toLowerCase() : "";
  if (text.includes("clos")) return "closed";
  if (text.includes("maint")) return "maintenance";
  if (text.includes("fault") || text.includes("error") || text.includes("fail")) return "fault";
  return "open";
};

// Flexible survey data structure
interface SurveyDataDynamic {
  snapshots: SnapshotRow[];
  totalDataPoints?: number;
  startTime?: string;
  endTime?: string;
  pipeDiameters?: number[];
  averageDepth?: number;
  locationsCovered?: string[];
  pipelineEntries?: number;
  valveOperations?: number;
  totalPerimeterSurveyed?: number;
}

export const DailyPersonalMaps = () => {
  const [searchParams] = useSearchParams();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyDataDynamic | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isDevicesLoading, setIsDevicesLoading] = useState(false);
  const { currentSurvey } = useSurveyContext();

  // Table functionality for survey snapshots
  const snapshots = useMemo<SnapshotRow[]>(() => surveyData?.snapshots || [], [surveyData]);
  const selectedDeviceInfo = useMemo(() => {
    if (!selectedDevice) return undefined;
    return devices.find((device) => device.id === selectedDevice);
  }, [devices, selectedDevice]);
  const selectedDeviceLabel = selectedDeviceInfo?.name || selectedDevice || "";
  const selectedDeviceType = selectedDeviceInfo?.type;

  // Compute dynamic columns from snapshot keys
  const snapshotKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of snapshots) {
      Object.keys(s || {}).forEach((k) => keys.add(k));
    }
    const preferredOrder = [
      "timestamp",
      "time",
      "date",
      "entryDate",
      "entryTime",
      "activity",
      "pipelineName",
      "pipelineId",
      "valveName",
      "valveId",
      "coordinates",
      "lat",
      "lng",
    ];
    const ordered = preferredOrder.filter((k) => keys.has(k));
    const remaining = Array.from(keys).filter((k) => !ordered.includes(k)).sort();
    const combined = [...ordered, ...remaining];
    if (combined.includes("id")) {
      return ["id", ...combined.filter((key) => key !== "id")];
    }
    return combined;
  }, [snapshots]);

  const initialSortKey = useMemo(() => {
    return (snapshotKeys.find((k) => /timestamp|time|date/i.test(k)) || snapshotKeys[0]) as keyof SnapshotRow | undefined;
  }, [snapshotKeys]);

  const { tableConfig, sortedAndPaginatedData, allSortedData } = useTable<SnapshotRow>(
    snapshots,
    10,
    (initialSortKey as any) ?? undefined,
  );

  // Read URL parameters and set initial values
  useEffect(() => {
    const deviceParam = searchParams.get("device");
    const dateParam = searchParams.get("date");

    if (deviceParam) {
      setSelectedDevice(deviceParam);
    }

    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }

    // Auto-load data if both device and date are provided
    if (deviceParam && dateParam) {
      setTimeout(() => {
        handleLoadSurveyData(deviceParam, new Date(dateParam));
      }, 500);
    }
  }, [searchParams]);

  // Ensure a sensible default sort when data loads
  useEffect(() => {
    if (snapshots.length && !tableConfig.sortConfig.key && initialSortKey) {
      tableConfig.setSortConfig({ key: initialSortKey as any, direction: "asc" });
    }
  }, [snapshots, initialSortKey]);

  // Load devices for current survey
  useEffect(() => {
    const loadDevices = async () => {
      setIsDevicesLoading(true);
      try {
        const surveyId = currentSurvey?.id || undefined;
        const res = await apiClient.getDeviceLogs({ surveyId });
        const items: Device[] = (res.data || []).map((d: any) => ({
          id: String(d.id),
          name: String(d.name || d.serialNumber || d.modelName || d.id),
          type: String(d.type || "DEVICE"),
        }));
        const selected = selectedDevice || searchParams.get("device") || "";
        let merged = items;
        if (selected && !items.find(x => x.id === selected)) {
          merged = [{ id: selected, name: selected, type: "DEVICE" }, ...items];
        }
        setDevices(merged);
        if (!selected && merged.length > 0) {
          setSelectedDevice(merged[0].id);
        }
      } catch (e) {
        const selected = selectedDevice || searchParams.get("device") || "";
        const fallback: Device[] = selected ? [{ id: selected, name: selected, type: "DEVICE" }] : [];
        setDevices(fallback);
      } finally {
        setIsDevicesLoading(false);
      }
    };
    loadDevices();
  }, [currentSurvey?.id]);

  // Devices are loaded from API based on selected survey

  const handleLoadSurveyData = async (deviceId?: string, date?: Date, endDate?: Date) => {
    const targetDevice = deviceId || selectedDevice;
    const targetDate = date || selectedDate;
    const targetEndDate = endDate || selectedEndDate;

    if (!targetDevice || !targetDate) return;

    setIsLoading(true);
    try {
      const resp = await apiClient.getAssetPropertyEntriesByDevice({ deviceId: targetDevice, entryDate: targetDate, endDate: targetEndDate });
      const snapshots = Array.isArray(resp.snapshots) ? resp.snapshots : [];

      const raw = (resp as any)?.raw;
      const summaryCandidates = [raw?.data?.summary, raw?.summary, raw?.data, raw].filter((s: any) => s && typeof s === "object");
      let summary: any = {};
      for (const s of summaryCandidates) {
        if (
          Object.prototype.hasOwnProperty.call(s, "totalDataPoints") ||
          Object.prototype.hasOwnProperty.call(s, "startTime") ||
          Object.prototype.hasOwnProperty.call(s, "endTime") ||
          Object.prototype.hasOwnProperty.call(s, "averageDepth") ||
          Object.prototype.hasOwnProperty.call(s, "pipeDiameters")
        ) {
          summary = s;
          break;
        }
      }

      // Derive simple summary fields as fallback from snapshots
      const keys = new Set<string>();
      snapshots.forEach((s) => Object.keys(s || {}).forEach((k) => keys.add(k)));
      const timeKey = ["timestamp", "time", "date", "entryDate", "entryTime"].find((k) => keys.has(k));

      let derivedStart: string | undefined;
      let derivedEnd: string | undefined;
      if (timeKey) {
        const times = snapshots
          .map((s) => s?.[timeKey!])
          .filter((v) => v != null)
          .map((v) => new Date(v))
          .filter((d) => !Number.isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());
        if (times.length) {
          derivedStart = format(times[0], "p");
          derivedEnd = format(times[times.length - 1], "p");
        }
      }

      const diameterKey = ["pipeDiameter", "diameter"].find((k) => keys.has(k));
      const derivedPipeDiameters = diameterKey
        ? Array.from(new Set(snapshots.map((s) => s?.[diameterKey]).filter((v) => typeof v === "number")))
        : [];

      const depthKey = ["pipeDepth", "depth"].find((k) => keys.has(k));
      const avgDepthVals = depthKey
        ? snapshots.map((s) => s?.[depthKey]).filter((v) => typeof v === "number")
        : [];
      const derivedAverageDepth = avgDepthVals.length
        ? Number((avgDepthVals.reduce((a: number, b: number) => a + b, 0) / avgDepthVals.length).toFixed(2))
        : undefined;

      // Normalize locationsCovered from summary if present
      const normalizeLocations = (val: any): string[] | undefined => {
        if (!val) return undefined;
        const arr = Array.isArray(val) ? val : [];
        return arr
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const lat = (item as any).lat ?? (item as any).latitude;
              const lng = (item as any).lng ?? (item as any).lon ?? (item as any).longitude;
              if (typeof lat === "number" && typeof lng === "number") {
                return `${lat}, ${lng}`;
              }
            }
            if (Array.isArray(item) && item.length >= 2 && typeof item[0] === "number" && typeof item[1] === "number") {
              return `${item[0]}, ${item[1]}`;
            }
            return String(item);
          })
          .filter((s) => typeof s === "string" && s.length > 0);
      };

      const totalDataPoints = typeof summary.totalDataPoints === "number" ? summary.totalDataPoints : snapshots.length;
      const startTime = typeof summary.startTime === "string" && summary.startTime ? summary.startTime : derivedStart;
      const endTime = typeof summary.endTime === "string" && summary.endTime ? summary.endTime : derivedEnd;
      const pipeDiameters = Array.isArray(summary.pipeDiameters) && summary.pipeDiameters.every((n: any) => typeof n === "number")
        ? summary.pipeDiameters
        : derivedPipeDiameters;
      const averageDepth = typeof summary.averageDepth === "number" ? summary.averageDepth : derivedAverageDepth;
      const locationsCovered = normalizeLocations(summary.locationsCovered);
      const pipelineEntries = typeof summary.pipelineEntries === "number" ? summary.pipelineEntries : undefined;
      const valveOperations = typeof summary.valveOperations === "number" ? summary.valveOperations : undefined;
      const totalPerimeterSurveyed = typeof summary.totalPerimeterSurveyed === "number" ? summary.totalPerimeterSurveyed : undefined;

      setSurveyData({
        snapshots,
        totalDataPoints,
        startTime,
        endTime,
        pipeDiameters,
        averageDepth,
        locationsCovered,
        pipelineEntries,
        valveOperations,
        totalPerimeterSurveyed,
      });
    } catch (e) {
      setSurveyData({ snapshots: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // const handleExportPDF = () => {
  //   // Mock PDF export
  //   const blob = new Blob(
  //     ["PDF export functionality would be implemented here"],
  //     { type: "application/pdf" },
  //   );
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `survey-trail-${selectedDevice}-${selectedDate ? format(selectedDate, "yyyy-MM-dd") : "unknown"}.pdf`;
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // };

const handleExportXML = async () => {
  try {
    // ✅ Determine deviceId
    let deviceId = selectedDevice;
    if (!deviceId && devices.length > 0) {
      deviceId = devices[0].id;
    }

    if (!deviceId) {
      alert("Please select a device first.");
      return;
    }

    if (!selectedDate) {
      alert("Please select a date before exporting.");
      return;
    }

    // ✅ Fix timezone issue — ensure correct YYYY-MM-DD
    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString("en-CA"); // e.g., 2025-10-01

    // ✅ Use XML format in the URL
    //const exportUrl = `https://localhost:7215/api/AssetProperties/summary/ExportSnapshots?deviceId=${deviceId}&entryDate=${formattedDate}&format=xml`;
    const exportUrl = `${API_BASE_PATH}/AssetProperties/summary/ExportSnapshots?deviceId=${deviceId}&entryDate=${formattedDate}&format=xml`;
    const response = await fetch(exportUrl, {
      method: "GET",
      headers: { "Accept": "application/xml" },
    });

    if (!response.ok) {
      throw new Error("Failed to export XML file");
    }

    // ✅ Handle XML download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Snapshots_${deviceId}_${formattedDate}.xml`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting XML:", error);
    alert("An error occurred while exporting the XML. Please try again.");
  }
};




  const handleExportShapefile = () => {
    // Mock Shapefile export
    const blob = new Blob(
      ["Shapefile export functionality would be implemented here"],
      { type: "application/zip" },
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-trail-${selectedDevice}-${selectedDate ? format(selectedDate, "yyyy-MM-dd") : "unknown"}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const canLoadData = selectedDevice && selectedDate;
  const hasData = !!(surveyData && surveyData.snapshots && surveyData.snapshots.length);

  const mapData = useMemo(() => {
    if (!snapshots.length) {
      return { devices: [], pipelines: [], valves: [] };
    }

    const entries = snapshots
      .map<SnapshotEntry | null>((snapshot, index) => {
        const coords = extractCoordinateFromSnapshot(snapshot);
        if (!coords) return null;
        const timestamp = getTimestampFromSnapshot(snapshot);
        return {
          coords,
          timestamp,
          snapshot,
          index,
        };
      })
      .filter((entry): entry is SnapshotEntry => entry !== null);

    if (!entries.length) {
      return { devices: [], pipelines: [], valves: [] };
    }

    const pipelineCoordinates = entries.map((entry) => ({
      lat: entry.coords.lat,
      lng: entry.coords.lng,
      ...(entry.coords.elevation != null ? { elevation: entry.coords.elevation } : {}),
    }));

    let pipelineDiameter: number | null = surveyData?.pipeDiameters?.[0] ?? null;
    if (pipelineDiameter == null) {
      for (const entry of entries) {
        const candidate = DIAMETER_KEYS.map((key) => parseMaybeNumber(entry.snapshot[key])).find((val) => val != null);
        if (candidate != null) {
          pipelineDiameter = candidate;
          break;
        }
      }
    }

    let pipelineDepth: number | null = surveyData?.averageDepth ?? null;
    if (pipelineDepth == null) {
      for (const entry of entries) {
        const candidate = DEPTH_KEYS.map((key) => parseMaybeNumber(entry.snapshot[key])).find((val) => val != null);
        if (candidate != null) {
          pipelineDepth = candidate;
          break;
        }
      }
    }

    const getFieldCI = (obj: Record<string, any>, candidates: string[]): any => {
      const keys = Object.keys(obj || {});
      for (const cand of candidates) {
        // Exact match first
        if (cand in obj) return obj[cand];
        const normalized = cand.replace(/\s|_/g, "").toLowerCase();
        const matched = keys.find(k => k.replace(/\s|_/g, "").toLowerCase() === normalized);
        if (matched) return obj[matched];
      }
      return undefined;
    };

    const pipelineIdEntry = entries.find((entry) => getFieldCI(entry.snapshot, ["pipelineId", "pipeline_id", "Linked Segment", "linkedSegment", "segment", "Segment"]) != null);
    const pipelineNameEntry = entries.find((entry) => getFieldCI(entry.snapshot, ["pipelineName", "pipeline_name", "Linked Segment", "linkedSegment"]) != null);

    const deviceNameFallback = selectedDeviceLabel || selectedDevice || "Selected Device";
    const pipelineId = pipelineIdEntry ? String(getFieldCI(pipelineIdEntry.snapshot, ["pipelineId", "pipeline_id", "Linked Segment", "linkedSegment", "segment", "Segment"])) : `trail-${selectedDevice || "device"}`;
    const pipelineName = pipelineNameEntry ? String(getFieldCI(pipelineNameEntry.snapshot, ["pipelineName", "pipeline_name", "Linked Segment", "linkedSegment"])) : `${deviceNameFallback} Trail`;

    const pipelineStatusEntry = [...entries].reverse().find((entry) => entry.snapshot.pipelineStatus != null || entry.snapshot.status != null);
    const pipelineStatus = normalizePipelineStatus(
      pipelineStatusEntry?.snapshot.pipelineStatus ?? pipelineStatusEntry?.snapshot.status,
    );

    const diameterValue = pipelineDiameter != null && Number.isFinite(pipelineDiameter) ? Number(pipelineDiameter) : 100;
    const depthValue = pipelineDepth != null && Number.isFinite(pipelineDepth) ? Number(pipelineDepth) : 0;

    const pipelines = pipelineCoordinates.length >= 2
      ? [
        {
          id: pipelineId,
          name: pipelineName,
          diameter: diameterValue,
          depth: depthValue,
          status: pipelineStatus,
          coordinates: pipelineCoordinates,
        },
      ]
      : [];

    const lastEntry = entries[entries.length - 1];
    const rawDeviceStatus =
      lastEntry.snapshot.deviceStatus ??
      lastEntry.snapshot.status ??
      lastEntry.snapshot.activityStatus ??
      lastEntry.snapshot.operationalStatus;
    const deviceStatus = normalizeDeviceStatus(rawDeviceStatus);
    const lastTimestamp = lastEntry.timestamp;
    const fallbackPing =
      lastEntry.snapshot.lastKnown ??
      lastEntry.snapshot.lastSync ??
      lastEntry.snapshot.entryTime ??
      lastEntry.snapshot.entryDate ??
      "";
    const lastPing = lastTimestamp
      ? format(lastTimestamp, "PPpp")
      : fallbackPing
        ? String(fallbackPing)
        : "Latest recorded position";
    const batteryCandidate = parseMaybeNumber(
      lastEntry.snapshot.batteryLevel ?? lastEntry.snapshot.battery ?? lastEntry.snapshot.battery_percentage,
    );

    const devices = [
      {
        id: selectedDevice || "selected-device",
        name: deviceNameFallback,
        lat: lastEntry.coords.lat,
        lng: lastEntry.coords.lng,
        status: deviceStatus,
        lastPing,
        type: selectedDeviceType,
        batteryLevel: batteryCandidate ?? undefined,
      },
    ];

    const valvesMap = new Map<
      string,
      {
        id: string;
        name: string;
        type: "control" | "emergency" | "isolation" | "station";
        status: "open" | "closed" | "maintenance" | "fault";
        segmentId: string;
        coordinates?: { lat: number; lng: number; elevation?: number };
      }
    >();

    for (const entry of entries) {
      let valveSource: any;
      for (const key of VALVE_CONTAINER_KEYS) {
        if (entry.snapshot[key]) {
          valveSource = entry.snapshot[key];
          break;
        }
      }

      let valveIdRaw = valveSource?.id ?? entry.snapshot.valveId ?? entry.snapshot.valveID;
      let valveName: string | undefined = valveSource?.name ?? entry.snapshot.valveName;
      let valveTypeText: any = valveSource?.type ?? entry.snapshot.valveType ?? entry.snapshot.Type;
      let valveStatusText: any = valveSource?.status ?? entry.snapshot.valveStatus;
      let valveSegmentRaw: any = valveSource?.pipelineId ?? entry.snapshot.pipelineId;

      // Fallback to snapshot row itself (for datasets where each row is a valve point)
      if (!valveIdRaw) valveIdRaw = entry.snapshot.id ?? `VAL-${entry.index + 1}`;
      if (!valveName) valveName = String(entry.snapshot["Linked Segment"] ?? valveIdRaw);
      if (!valveSegmentRaw) valveSegmentRaw = entry.snapshot["Linked Segment"] ?? pipelineId;

      const valveId = String(valveIdRaw);
      if (valvesMap.has(valveId)) continue;

      const valveCoord =
        extractCoordinateFromCandidate(valveSource?.coordinates) ??
        extractCoordinateFromCandidate(entry.snapshot.valveCoordinates) ??
        extractCoordinateFromSnapshot(valveSource) ??
        entry.coords;

      const valveType = normalizeValveType(valveTypeText);
      const valveStatus = normalizeValveStatus(valveStatusText);
      const valveSegment = String(valveSegmentRaw);

      valvesMap.set(valveId, {
        id: valveId,
        name: valveName,
        type: valveType,
        status: valveStatus,
        segmentId: valveSegment,
        coordinates: valveCoord
          ? {
            lat: valveCoord.lat,
            lng: valveCoord.lng,
            ...(valveCoord.elevation != null ? { elevation: valveCoord.elevation } : {}),
          }
          : undefined,
      });
    }

    const valves = Array.from(valvesMap.values());

    return {
      devices,
      pipelines,
      valves,
    };
  }, [snapshots, surveyData, selectedDevice, selectedDeviceLabel, selectedDeviceType]);

  const mapDevices = mapData.devices;
  const mapPipelines = mapData.pipelines;
  const mapValves = mapData.valves;

  /* // Demo data for map
  const demoDevices = [
    {
      id: "T001",
      name: "Trimble R12i Unit 1",
      lat: 40.7589,
      lng: -73.9851,
      status: "active" as const,
      lastPing: "2 min ago",
    },
    {
      id: "T002",
      name: "Trimble R12i Unit 2",
      lat: 40.7614,
      lng: -73.9776,
      status: "active" as const,
      lastPing: "1 min ago",
    },
    {
      id: "T003",
      name: "Trimble TSC7 Controller",
      lat: 40.7505,
      lng: -73.9934,
      status: "offline" as const,
      lastPing: "15 min ago",
    },
  ];

  const demoPipelines = [
    { id: "PS-001", diameter: 200, depth: 1.5, lat: 40.7589,
      lng: -73.9851, status: "normal" as const },
    { id: "PS-002", diameter: 150, depth: 2.0, lat: 40.7614,
      lng: -73.9776, status: "normal" as const },
    { id: "PS-003", diameter: 300, depth: 1.8,  lat: 40.7505,
      lng: -73.9934, status: "normal" as const },
  ];

  const demoValves = [
    {
      id: "VLV-001",
      type: "control" as const,
      status: "open" as const,
      segmentId: "PS-001",
    },
    {
      id: "VLV-002",
      type: "emergency" as const,
      status: "closed" as const,
      segmentId: "PS-002",
    },
    {
      id: "VLV-003",
      type: "isolation" as const,
      status: "maintenance" as const,
      segmentId: "PS-003",
    },
  ];
  */

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case "enter_pipeline":
        return <Layers className="w-4 h-4 text-primary" />;
      case "exit_pipeline":
        return <Layers className="w-4 h-4 text-muted-foreground" />;
      case "valve_operation":
        return <Settings className="w-4 h-4 text-warning" />;
      case "depth_measurement":
        return <Gauge className="w-4 h-4 text-success" />;
      case "perimeter_survey":
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (activity: string) => {
    switch (activity) {
      case "enter_pipeline":
        return "Pipeline Entry";
      case "exit_pipeline":
        return "Pipeline Exit";
      case "valve_operation":
        return "Valve Operation";
      case "depth_measurement":
        return "Depth Measurement";
      case "perimeter_survey":
        return "Perimeter Survey";
      default:
        return "Unknown Activity";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Instrument Details
          </h1>
          <p className="text-muted-foreground">
            View detailed survey activity trails for any Trimble device
            {searchParams.get("surveyor") && (
              <span className="ml-2">
                • Surveyor: <strong>{searchParams.get("surveyor")}</strong>
              </span>
            )}
          </p>
        </div>
        {hasData && (
          <div className="flex space-x-2">
            <Button onClick={handleExportXML} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export EXCEL
            </Button>
            {/* <Button onClick={handleExportShapefile} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Shapefile
            </Button> */}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter & Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Device Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Device Name</label>
              <div className="rounded-md border border-input bg-background px-3 py-2">
                {isDevicesLoading ? (
                  <span className="text-sm text-muted-foreground">Loading devices...</span>
                ) : selectedDeviceLabel ? (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-foreground">{selectedDeviceLabel}</span>
                    {selectedDeviceType && (
                      <span className="text-xs text-muted-foreground">{selectedDeviceType}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No device information available</span>
                )}
              </div>
            </div>

            {/* Date Selection - Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Selection - End Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedEndDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedEndDate ? format(selectedEndDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={setSelectedEndDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Load Button */}
            <div className="space-y-2 flex flex-col justify-end">
              <Button
                onClick={() => handleLoadSurveyData()}
                disabled={!canLoadData || isLoading}
                className="w-full"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Loading..." : "Load Survey Data"}
              </Button>
            </div>
          </div>

          {!canLoadData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {isDevicesLoading
                  ? "Loading device information..."
                  : selectedDevice
                    ? "Please pick a date to load survey trail data."
                    : "No device information available for this survey."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Survey Trail Map
                {selectedDevice && selectedDate && (
                  <Badge variant="secondary" className="ml-2">
                    {(selectedDeviceLabel || selectedDevice)} - {format(selectedDate, "MMM dd, yyyy")}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <LeafletMap
                  devices={[]}
                  pipelines={mapPipelines}
                  valves={mapValves}
                  showDevices={false}
                  showPipelines={mapPipelines.length > 0}
                  showValves={mapValves.length > 0}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        {/* <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Survey Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasData ? (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Data Points
                    </span>
                    <span className="font-semibold text-lg">
                      {surveyData.totalDataPoints ?? surveyData.snapshots.length}
                    </span>
                  </div>

                  {surveyData.startTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Start Time</span>
                      <span className="font-medium">{surveyData.startTime}</span>
                    </div>
                  )}

                  {surveyData.endTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">End Time</span>
                      <span className="font-medium">{surveyData.endTime}</span>
                    </div>
                  )}

                  {typeof surveyData.pipelineEntries !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pipeline Entries</span>
                      <span className="font-medium">{surveyData.pipelineEntries}</span>
                    </div>
                  )}

                  {typeof surveyData.valveOperations !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Valve Operations</span>
                      <span className="font-medium">{surveyData.valveOperations}</span>
                    </div>
                  )}

                  {typeof surveyData.averageDepth !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Depth</span>
                      <span className="font-medium">{surveyData.averageDepth}m</span>
                    </div>
                  )}

                  {typeof surveyData.totalPerimeterSurveyed !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Perimeter</span>
                      <span className="font-medium">{surveyData.totalPerimeterSurveyed}m</span>
                    </div>
                  )}

                  {Array.isArray(surveyData.locationsCovered) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Locations Covered</span>
                      <span className="font-medium">{surveyData.locationsCovered.length}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {hasData && surveyData.pipeDiameters && surveyData.pipeDiameters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="w-5 h-5 mr-2" />
                  Pipe Diameters Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {surveyData.pipeDiameters.map((diameter, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Diameter {index + 1}</span>
                      <Badge variant="outline">{diameter}mm</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div> */}
      </div>

      {/* Detailed Survey Activity Log */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Survey Activity Log
              <Badge variant="secondary" className="ml-2">
                {surveyData.snapshots.length} snapshots
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {snapshotKeys.map((key) => {
                    const firstVal = snapshots[0]?.[key];
                    const isComplex = firstVal && (typeof firstVal === "object");
                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/_/g, " ")
                      .replace(/^\w/, (c) => c.toUpperCase());
                    return (
                      <SortableTableHead
                        key={key}
                        sortKey={key}
                        currentSortKey={tableConfig.sortConfig.key as any}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={(k) => tableConfig.handleSort(k as any)}
                        sortable={!isComplex}
                      >
                        {label}
                      </SortableTableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndPaginatedData.map((row, idx) => (
                  <TableRow key={row.id ?? idx}>
                    {snapshotKeys.map((key) => {
                      const val = row[key];
                      const renderValue = () => {
                        if (key === "activity") {
                          return (
                            <div className="flex items-center space-x-2">
                              {getActivityIcon(String(val) as any)}
                              <span className="text-sm">{getActivityLabel(String(val) as any)}</span>
                            </div>
                          );
                        }
                        if (key === "coordinates" && Array.isArray(val) && val.length >= 2 && typeof val[0] === "number" && typeof val[1] === "number") {
                          return (
                            <span className="font-mono text-xs text-muted-foreground">
                              {val[0].toFixed(4)}, {val[1].toFixed(4)}
                            </span>
                          );
                        }
                        if (typeof val === "number") {
                          return <span className="font-mono text-sm">{Number.isInteger(val) ? val : Number(val.toFixed(2))}</span>;
                        }
                        if (val instanceof Date) {
                          return <span className="font-mono text-sm">{format(val, "Pp")}</span>;
                        }
                        if (typeof val === "string") {
                          const dt = new Date(val);
                          if (!Number.isNaN(dt.getTime()) && /time|date/i.test(key)) {
                            return <span className="font-mono text-sm">{format(dt, "Pp")}</span>;
                          }
                          return <span className="text-sm">{val}</span>;
                        }
                        if (Array.isArray(val)) {
                          return <span className="text-xs text-muted-foreground">{JSON.stringify(val)}</span>;
                        }
                        if (val && typeof val === "object") {
                          return <span className="text-xs text-muted-foreground">{JSON.stringify(val)}</span>;
                        }
                        return <span className="text-sm text-muted-foreground">—</span>;
                      };

                      return (
                        <TableCell key={key}>
                          {renderValue()}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Pagination
                config={tableConfig.paginationConfig}
                onPageChange={tableConfig.setCurrentPage}
                onPageSizeChange={tableConfig.setPageSize}
                onFirstPage={tableConfig.goToFirstPage}
                onLastPage={tableConfig.goToLastPage}
                onNextPage={tableConfig.goToNextPage}
                onPreviousPage={tableConfig.goToPreviousPage}
                canGoNext={tableConfig.canGoNext}
                canGoPrevious={tableConfig.canGoPrevious}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
