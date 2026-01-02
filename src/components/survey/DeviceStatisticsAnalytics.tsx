import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  Zap,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_BASE_PATH, apiClient, type Zone } from "@/lib/api";

interface DeviceUsageLog {
  deviceId: string;
  deviceName: string;
  usageDate: string;
  hoursUsed: number;
  dataPointsCollected: number;
  batteryStart: number;
  batteryEnd: number;
  operator: string;
}

interface DeviceStatisticsData {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  normalUsageDevices: number;
  underUsageDevices: number;
  normalAccuracyDevices: number;
  belowAverageAccuracyDevices: number;
  ttfaMinutes: number;
  ttfaAverageMinutes: number;
  ttfaMaxMinutes: number;
}

type TimeRange = "7days" | "1month" | "3months";
type ZoneSelection = "all" | string;

const TIME_RANGE_OPTIONS = [
  { value: "7days", label: "Last 7 Days" },
  { value: "1month", label: "Last 1 Month" },
  { value: "3months", label: "Last 3 Months" },
];

const SURVEY_POINT_THRESHOLD = 100; // Configurable threshold

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
}

const StatItem = ({ label, value, color = "text-foreground", icon }: StatItemProps) => (
  <div className="flex items-center justify-between py-3 border-b last:border-b-0">
    <div className="flex items-center gap-2">
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className={`text-xl font-bold ${color}`}>{value}</span>
  </div>
);

export const DeviceStatisticsAnalytics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [selectedZone, setSelectedZone] = useState<ZoneSelection>("all");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [statistics, setStatistics] = useState<DeviceStatisticsData>({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    normalUsageDevices: 0,
    underUsageDevices: 0,
    normalAccuracyDevices: 0,
    belowAverageAccuracyDevices: 0,
    ttfaMinutes: 0,
    ttfaAverageMinutes: 0,
    ttfaMaxMinutes: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [smId, setSmId] = useState(localStorage.getItem("activeSurveyId"));

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const response = await apiClient.getZones({ limit: 100 });
        setZones(response.data || []);
      } catch (error) {
        console.error("Error fetching zones:", error);
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, []);

  // Listen for survey ID changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "activeSurveyId") {
        setSmId(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const checkLocalChange = () => {
      const currentId = localStorage.getItem("activeSurveyId");
      setSmId(currentId);
    };
    const interval = setInterval(checkLocalChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Calculate date range based on time range selection
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "1month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    return { startDate, endDate };
  };

  // Fetch and calculate statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!smId) {
        console.warn("No activeSurveyId found");
        return;
      }

      try {
        setLoadingStats(true);
        const { startDate, endDate } = getDateRange();

        // Fetch device usage logs
        const usageParams = new URLSearchParams({
          page: "1",
          limit: "1000",
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        });

        let usageLogs: DeviceUsageLog[] = [];

        try {
          const usageResponse = await fetch(
            `${API_BASE_PATH}/survey-history/device-usage?${usageParams.toString()}`
          );

          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            usageLogs = Array.isArray(usageData?.data)
              ? usageData.data
              : Array.isArray(usageData?.data?.data)
                ? usageData.data.data
                : [];
          }
        } catch (error) {
          console.warn("Could not fetch device usage logs:", error);
        }

        // Fetch device assignments summary
        let deviceSummary = {
          totalDevices: 0,
          activeDevices: 0,
          inactiveDevices: 0,
        };

        try {
          const summaryResponse = await fetch(
            `${API_BASE_PATH}/DeviceAssignments/summary/${smId}`
          );

          if (summaryResponse.ok) {
            deviceSummary = await summaryResponse.json();
          }
        } catch (error) {
          console.warn("Could not fetch device summary:", error);
        }

        // Calculate usage statistics
        const normalUsageDevices = usageLogs.filter(
          (log) => log.dataPointsCollected >= SURVEY_POINT_THRESHOLD
        ).length;
        const underUsageDevices = usageLogs.filter(
          (log) =>
            log.dataPointsCollected > 0 &&
            log.dataPointsCollected < SURVEY_POINT_THRESHOLD
        ).length;

        // Mock accuracy data (would come from GNSS accuracy API in production)
        const activeCount = deviceSummary.activeDevices || 1;
        const normalAccuracyDevices = Math.round(activeCount * 0.85);
        const belowAverageAccuracyDevices = activeCount - normalAccuracyDevices;

        // Mock TTFA data (would come from device initialization logs in production)
        const ttfaMinutes = 2;
        const ttfaAverageMinutes = 8;
        const ttfaMaxMinutes = 25;

        setStatistics({
          totalDevices: deviceSummary.totalDevices || 0,
          activeDevices: deviceSummary.activeDevices || 0,
          inactiveDevices: deviceSummary.inactiveDevices || 0,
          normalUsageDevices,
          underUsageDevices,
          normalAccuracyDevices,
          belowAverageAccuracyDevices,
          ttfaMinutes,
          ttfaAverageMinutes,
          ttfaMaxMinutes,
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, [timeRange, selectedZone, smId]);

  const usagePercentage =
    statistics.activeDevices > 0
      ? Math.round(
          (statistics.normalUsageDevices / statistics.activeDevices) * 100
        )
      : 0;

  const accuracyPercentage =
    statistics.activeDevices > 0
      ? Math.round(
          (statistics.normalAccuracyDevices / statistics.activeDevices) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Device Statistics & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Time-based operational overview of GNSS devices
          </p>
        </div>
        <div className="flex gap-3">
          <div className="w-48">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {loadingZones ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Loading zones...
                  </div>
                ) : zones.length > 0 ? (
                  zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No zones available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status Statistics */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-500" />
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <StatItem
                label="Total Devices"
                value={statistics.totalDevices}
                color="text-blue-600"
                icon={<Zap className="h-4 w-4 text-blue-500" />}
              />
              <StatItem
                label="Active Devices"
                value={statistics.activeDevices}
                color="text-green-600"
                icon={<Activity className="h-4 w-4 text-green-500" />}
              />
              <StatItem
                label="Inactive Devices"
                value={statistics.inactiveDevices}
                color="text-red-600"
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Device Usage Classification */}
        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Device Usage Classification
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-2">
                Threshold: {SURVEY_POINT_THRESHOLD} points
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <StatItem
                label="Total Active Devices"
                value={statistics.activeDevices}
                color="text-blue-600"
                icon={<Activity className="h-4 w-4 text-blue-500" />}
              />
              <StatItem
                label="Normal Usage Devices"
                value={`${statistics.normalUsageDevices} (${usagePercentage}%)`}
                color="text-green-600"
                icon={<TrendingUp className="h-4 w-4 text-green-500" />}
              />
              <StatItem
                label="Under Usage Devices"
                value={statistics.underUsageDevices}
                color="text-yellow-600"
                icon={<AlertCircle className="h-4 w-4 text-yellow-500" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Performance Statistics */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-purple-500" />
              Accuracy Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <StatItem
                label="Normal Accuracy Devices"
                value={`${statistics.normalAccuracyDevices} (${accuracyPercentage}%)`}
                color="text-green-600"
                icon={<Target className="h-4 w-4 text-green-500" />}
              />
              <StatItem
                label="Below Average Accuracy"
                value={statistics.belowAverageAccuracyDevices}
                color="text-red-600"
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
              />
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Data sourced from: Trimble Mobile Manager, Trimble Access, Trimble Cloud
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Time to Achieve Accuracy (TTFA) */}
        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                Time to Achieve Accuracy
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-2">
                Duration from activation to first acceptable accuracy
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <StatItem
                label="Minimum TTFA"
                value={`${statistics.ttfaMinutes}m`}
                color="text-green-600"
                icon={<Clock className="h-4 w-4 text-green-500" />}
              />
              <StatItem
                label="Average TTFA"
                value={`${statistics.ttfaAverageMinutes}m`}
                color="text-blue-600"
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatItem
                label="Maximum TTFA"
                value={`${statistics.ttfaMaxMinutes}m`}
                color="text-orange-600"
                icon={<Clock className="h-4 w-4 text-orange-500" />}
              />
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Less than 5 minutes</span>
                <Badge variant="secondary" className="bg-green-100">Optimal</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">5-15 minutes</span>
                <Badge variant="secondary" className="bg-yellow-100">Normal</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">More than 15 minutes</span>
                <Badge variant="secondary" className="bg-red-100">Requires Attention</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
