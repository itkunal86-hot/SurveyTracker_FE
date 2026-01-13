import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { API_BASE_PATH } from "@/lib/api";
import { LeafletMap } from "@/components/LeafletMap";

interface CoordinatePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

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

const extractCoordinateFromString = (coordinateString: string): CoordinatePoint | null => {
  if (!coordinateString || coordinateString === "-") return null;

  const numericParts = coordinateString
    .split(/[,;\s]+/)
    .map((part) => parseMaybeNumber(part))
    .filter((part): part is number => part != null);

  if (numericParts.length >= 2) {
    const [lat, lng, elevation] = numericParts;
    return {
      lat,
      lng,
      ...(elevation != null ? { elevation } : {}),
    };
  }

  const matches = coordinateString.match(/-?\d+(\.\d+)?/g);
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
};

interface SurveyActivityEntry {
  id?: string;
  time: string;
  activity: string;
  surveyorName?: string;
  date: string;
  accuracy?: number;
  coordinates?: string;
  [key: string]: any;
}

export const SurveyDetails = () => {
  const [searchParams] = useSearchParams();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [entries, setEntries] = useState<SurveyActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Get deviceLogId from URL parameters
  const deviceLogId = searchParams.get("deviceLogId") || "";

  // Fetch survey activity entries
  const fetchEntries = async (page: number = 1) => {
    if (!deviceLogId) {
      setError("Device Log ID is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        deviceLogId,
        page: String(page),
        // limit: String(pagination.limit),
        // ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        // ...(endDate && { endDate: endDate.toISOString().split('T')[0] }),
        limit: String(pagination.limit),
        ...(startDate && { startDate: formatDateOnly(startDate) }),
        ...(endDate && { endDate: formatDateOnly(endDate) }),
      });


      const response = await fetch(
        `${API_BASE_PATH}/AssetProperties/summary/EntriesByDeviceLog?${params.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle various response formats
      const rawItems = Array.isArray(data?.data?.items)
        ? data.data.items
        : Array.isArray(data?.data?.data)
          ? data.data.data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

      // Map API response to our interface
      const mappedEntries: SurveyActivityEntry[] = rawItems.map((item: any, index: number) => ({
        id: String(item.ShId ?? item.ID ?? `entry-${index}`),
        time: String(item.timestamp ?? "-"),
        activity: String(item.action ?? item.Activity ?? item.activityType ?? item.ActivityType ?? "-"),
        surveyorName: String(item.performedBy ?? item.SurveyorName ?? item.surveyor ?? item.Surveyor ?? "-"),
        date: String(item.timestamp ?? item.Date ?? item.entryDate ?? item.EntryDate ?? "-"),
        accuracy: Number(item.accuracy ?? item.Accuracy ?? item.accuracyPercent ?? 0) || undefined,
        coordinates: String(item.coordinates ?? "-"),
        ...item, // Include all other fields
      }));

      setEntries(mappedEntries);
      setPagination({
        page,
        limit: pagination.limit,
        total: data?.data?.pagination?.total || data?.pagination?.total || mappedEntries.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load entries";
      setError(message);
      console.error("Error fetching entries:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const formatDateOnly = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch on component mount and when parameters change
  useEffect(() => {
    if (deviceLogId) {
      fetchEntries(1);
    }
  }, [deviceLogId]);

  const handleDateFilterChange = () => {
    fetchEntries(1);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString || dateString === "-") return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "PPP");
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string): string => {
    if (!timeString || timeString === "-") return "-";
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      return format(date, "p");
    } catch {
      return timeString;
    }
  };

  const formatAccuracy = (accuracy?: number): string => {
    if (accuracy === undefined) return "-";
    return `${accuracy}%`;
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Build map data from survey entries
  const mapData = useMemo(() => {
    const validEntries = entries
      .map((entry) => {
        const coords = extractCoordinateFromString(entry.coordinates || "");
        return coords ? { coords, entry } : null;
      })
      .filter((item): item is { coords: CoordinatePoint; entry: SurveyActivityEntry } => item !== null);

    if (validEntries.length === 0) {
      return { devices: [], pipelines: [] };
    }

    // Build pipeline coordinates from all valid entries
    const pipelineCoordinates = validEntries.map((item) => ({
      lat: item.coords.lat,
      lng: item.coords.lng,
      ...(item.coords.elevation != null ? { elevation: item.coords.elevation } : {}),
    }));

    // Create a pipeline segment if we have at least 2 points
    const pipelines = pipelineCoordinates.length >= 2
      ? [
        {
          id: `survey-${deviceLogId || "unknown"}`,
          name: `Survey Trail - Device Log ${deviceLogId}`,
          diameter: 100,
          depth: 0,
          status: "normal" as const,
          coordinates: pipelineCoordinates,
        },
      ]
      : [];

    return {
      devices: [],
      pipelines,
    };
  }, [entries, deviceLogId]);

  const mapPipelines = mapData.pipelines;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Survey Activity Log
          </h1>
          <p className="text-muted-foreground">
            Detailed view of all survey activities for the selected device log
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Device Log ID Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Device Log ID</label>
              <div className="rounded-md border border-input bg-background px-3 py-2">
                <span className="text-sm font-medium text-foreground">{deviceLogId || "Not specified"}</span>
              </div>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filter Button */}
          <div className="mt-4">
            <Button
              onClick={handleDateFilterChange}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Loading..." : "Apply Filters"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Survey Activity Map
            {entries.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {entries.length} locations
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <LeafletMap
              devices={[]}
              pipelines={mapPipelines}
              valves={[]}
              showDevices={false}
              showPipelines={mapPipelines.length > 0}
              showValves={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Survey Activity Log
              <Badge variant="secondary">{pagination.total} entries</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEntries(pagination.page)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!deviceLogId && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              Please provide a Device Log ID in the URL parameters
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Surveyor Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Coordinates</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Loading survey activity data...
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No survey activity entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{formatTime(entry.time)}</TableCell>
                      <TableCell className="text-sm">{entry.activity}</TableCell>
                      <TableCell className="text-sm">{entry.surveyorName}</TableCell>
                      <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                      <TableCell className="text-sm">{formatAccuracy(entry.accuracy)}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{entry.coordinates}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {!isLoading && entries.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {totalPages} ({pagination.total} total entries)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEntries(pagination.page - 1)}
                  disabled={isLoading || pagination.page === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">Page</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pagination.page}
                    onChange={(e) => {
                      const pageNum = Math.max(1, Math.min(parseInt(e.target.value) || 1, totalPages));
                      fetchEntries(pageNum);
                    }}
                    className="w-12 px-2 py-1 border rounded text-center text-sm"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground">of {totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEntries(pagination.page + 1)}
                  disabled={isLoading || pagination.page >= totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
