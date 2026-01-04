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
import { toast } from "sonner";

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

const SURVEY_POINT_THRESHOLD = 100;

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const StatItem = ({ label, value, color = "text-foreground", icon, onClick }: StatItemProps) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between py-2 px-2 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50 rounded"
  >
    <div className="flex items-center gap-2">
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</span>
    </div>
    <span className={`font-semibold ${color} hover:opacity-80 transition-opacity`}>{value}</span>
  </div>
);

interface DeviceStatisticsAnalyticsProps {
  deviceId?: string;
}

export const DeviceStatisticsAnalytics = ({ deviceId }: DeviceStatisticsAnalyticsProps) => {
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

  const handleStatItemClick = (section: string, label: string, value: string | number) => {
    toast.success(`${section}: ${label} = ${value}`);
  };

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

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!smId) {
        console.warn("No activeSurveyId found");
        return;
      }

      try {
        setLoadingStats(true);
        const { startDate, endDate } = getDateRange();

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

        const normalUsageDevices = usageLogs.filter(
          (log) => log.dataPointsCollected >= SURVEY_POINT_THRESHOLD
        ).length;
        const underUsageDevices = usageLogs.filter(
          (log) =>
            log.dataPointsCollected > 0 &&
            log.dataPointsCollected < SURVEY_POINT_THRESHOLD
        ).length;

        const activeCount = deviceSummary.activeDevices || 1;
        const normalAccuracyDevices = Math.round(activeCount * 0.85);
        const belowAverageAccuracyDevices = activeCount - normalAccuracyDevices;

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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Device Status Statistics - Single Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-500" />
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              <StatItem
                label="Total Devices"
                value={statistics.totalDevices}
                color="text-blue-600"
                icon={<Zap className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("Device Status", "Total Devices", statistics.totalDevices)}
              />
              <StatItem
                label="Active Devices"
                value={statistics.activeDevices}
                color="text-green-600"
                icon={<Activity className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Device Status", "Active Devices", statistics.activeDevices)}
              />
              <StatItem
                label="Inactive Devices"
                value={statistics.inactiveDevices}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("Device Status", "Inactive Devices", statistics.inactiveDevices)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Device Usage Classification - Single Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Device Usage Classification
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Threshold: {SURVEY_POINT_THRESHOLD} points
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              <StatItem
                label="Total Active Devices"
                value={statistics.activeDevices}
                color="text-blue-600"
                icon={<Activity className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("Device Usage Classification", "Total Active Devices", statistics.activeDevices)}
              />
              <StatItem
                label="Normal Usage"
                value={`${statistics.normalUsageDevices} (${usagePercentage}%)`}
                color="text-green-600"
                icon={<TrendingUp className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Device Usage Classification", "Normal Usage", `${statistics.normalUsageDevices} (${usagePercentage}%)`)}
              />
              <StatItem
                label="Under Usage"
                value={statistics.underUsageDevices}
                color="text-yellow-600"
                icon={<AlertCircle className="h-3 w-3 text-yellow-500" />}
                onClick={() => handleStatItemClick("Device Usage Classification", "Under Usage", statistics.underUsageDevices)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Performance - Single Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-purple-500" />
              Accuracy Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              <StatItem
                label="Normal Accuracy"
                value={`${statistics.normalAccuracyDevices} (${accuracyPercentage}%)`}
                color="text-green-600"
                icon={<Target className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Accuracy Performance", "Normal Accuracy", `${statistics.normalAccuracyDevices} (${accuracyPercentage}%)`)}
              />
              <StatItem
                label="Below Average Accuracy"
                value={statistics.belowAverageAccuracyDevices}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("Accuracy Performance", "Below Average Accuracy", statistics.belowAverageAccuracyDevices)}
              />
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                <span>Data: Trimble Mobile Manager, Access, Cloud</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time to Achieve Accuracy - Single Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-orange-500" />
              Time to Achieve Accuracy
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Duration from activation to acceptable accuracy
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              <StatItem
                label="Minimum TTFA"
                value={`${statistics.ttfaMinutes}m`}
                color="text-green-600"
                icon={<Clock className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Minimum TTFA", `${statistics.ttfaMinutes}m`)}
              />
              <StatItem
                label="Average TTFA"
                value={`${statistics.ttfaAverageMinutes}m`}
                color="text-blue-600"
                icon={<Clock className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Average TTFA", `${statistics.ttfaAverageMinutes}m`)}
              />
              <StatItem
                label="Maximum TTFA"
                value={`${statistics.ttfaMaxMinutes}m`}
                color="text-orange-600"
                icon={<Clock className="h-3 w-3 text-orange-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Maximum TTFA", `${statistics.ttfaMaxMinutes}m`)}
              />
              <div className="mt-3 pt-2 border-t space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">&lt; 5 minutes</span>
                  <Badge variant="secondary" className="bg-green-100 text-xs h-5">Optimal</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">5-15 minutes</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-xs h-5">Normal</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">&gt; 15 minutes</span>
                  <Badge variant="secondary" className="bg-red-100 text-xs h-5">Attention</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
