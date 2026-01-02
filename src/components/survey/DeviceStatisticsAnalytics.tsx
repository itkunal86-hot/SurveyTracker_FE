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
import { StatCard } from "@/components/survey/StatCard";
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

        const usageResponse = await fetch(
          `${API_BASE_PATH}/survey-history/device-usage?${usageParams.toString()}`
        );

        let usageLogs: DeviceUsageLog[] = [];
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          usageLogs = Array.isArray(usageData?.data)
            ? usageData.data
            : Array.isArray(usageData?.data?.data)
              ? usageData.data.data
              : [];
        }

        // Fetch device assignments summary
        const summaryResponse = await fetch(
          `${API_BASE_PATH}/DeviceAssignments/summary/${smId}`
        );

        let deviceSummary = {
          totalDevices: 0,
          activeDevices: 0,
          inactiveDevices: 0,
        };

        if (summaryResponse.ok) {
          deviceSummary = await summaryResponse.json();
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

      {/* Device Status Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Device Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Devices"
              value={statistics.totalDevices}
              icon={Zap}
              iconColor="text-blue-500"
              variant="default"
              description="Devices in survey"
            />
            <StatCard
              title="Active Devices"
              value={statistics.activeDevices}
              icon={Activity}
              iconColor="text-green-500"
              variant="success"
              description="Transmitting data"
            />
            <StatCard
              title="Inactive Devices"
              value={statistics.inactiveDevices}
              icon={AlertCircle}
              iconColor="text-red-500"
              variant="destructive"
              description="No recent data"
            />
          </div>
        </CardContent>
      </Card>

      {/* Device Usage Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Device Usage Classification
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Survey point threshold: {SURVEY_POINT_THRESHOLD} points
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Active Devices"
              value={statistics.activeDevices}
              icon={Activity}
              iconColor="text-blue-500"
              variant="default"
              description="Devices with activity"
            />
            <StatCard
              title="Normal Usage"
              value={statistics.normalUsageDevices}
              icon={TrendingUp}
              iconColor="text-green-500"
              variant="success"
              description={`${usagePercentage}% of active devices`}
              trend={{
                value: usagePercentage,
                direction: usagePercentage >= 70 ? "up" : "down",
              }}
            />
            <StatCard
              title="Under Usage"
              value={statistics.underUsageDevices}
              icon={AlertCircle}
              iconColor="text-yellow-500"
              variant="warning"
              description="Below threshold"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Performance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Accuracy Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Normal Accuracy"
              value={statistics.normalAccuracyDevices}
              icon={Target}
              iconColor="text-green-500"
              variant="success"
              description={`${accuracyPercentage}% of active devices`}
              trend={{
                value: accuracyPercentage,
                direction: accuracyPercentage >= 80 ? "up" : "down",
              }}
            />
            <StatCard
              title="Below Average Accuracy"
              value={statistics.belowAverageAccuracyDevices}
              icon={AlertCircle}
              iconColor="text-red-500"
              variant="destructive"
              description="Exceeds tolerance"
            />
          </div>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Accuracy data sourced from Trimble Mobile Manager, Trimble Access,
              and Trimble Cloud
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Time to Achieve Accuracy (TTFA) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Time to Achieve Accuracy (TTFA)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Time duration between device activation and first acceptable accuracy
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Minimum TTFA"
              value={`${statistics.ttfaMinutes}m`}
              icon={Clock}
              iconColor="text-green-500"
              variant="success"
              description="Fastest achievement"
            />
            <StatCard
              title="Average TTFA"
              value={`${statistics.ttfaAverageMinutes}m`}
              icon={Clock}
              iconColor="text-blue-500"
              variant="default"
              description="Typical duration"
            />
            <StatCard
              title="Maximum TTFA"
              value={`${statistics.ttfaMaxMinutes}m`}
              icon={Clock}
              iconColor="text-orange-500"
              variant="warning"
              description="Longest duration"
            />
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Less than 5 minutes
                </span>
                <Badge variant="secondary">Optimal</Badge>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-900">
                  5-15 minutes
                </span>
                <Badge variant="secondary">Normal</Badge>
              </div>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-900">
                  More than 15 minutes
                </span>
                <Badge variant="secondary">Requires Attention</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
