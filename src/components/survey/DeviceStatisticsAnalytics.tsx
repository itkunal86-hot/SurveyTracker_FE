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


interface DeviceStatisticsData {
  totalDeviceCount: number;
  totalActiveDeviceCount: number;
  totalInactiveDeviceCount: number;
  normalUsage: number;
  underUsage: number;
  normalAccuracy: number;
  belowAverageAccuracy: number;
  normalAccuracyPercentage: number;
  minimumTTFA: number;
  averageTTFA: number;
  maximumTTFA: number;
}

type TimeRange = "7days" | "1month" | "3months";
type ZoneSelection = "all" | string;

const TIME_RANGE_OPTIONS = [
  { value: "7days", label: "Last 7 Days" },
  { value: "1month", label: "Last 1 Month" },
  { value: "3months", label: "Last 3 Months" },
];

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

interface TimeOption {
  value: string;
  label: string;
}

interface DeviceStatisticsAnalyticsProps {
  onSummaryTypeSelect?: (summaryType: string) => void;
  selectedTime?: string;
  onSelectedTimeChange?: (time: string) => void;
  timeOptions?: TimeOption[];
}

export const DeviceStatisticsAnalytics = ({
  onSummaryTypeSelect,
  selectedTime = "5",
  onSelectedTimeChange,
  timeOptions = []
}: DeviceStatisticsAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [selectedZone, setSelectedZone] = useState<ZoneSelection>("all");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [statistics, setStatistics] = useState<DeviceStatisticsData>({
    totalDeviceCount: 0,
    totalActiveDeviceCount: 0,
    totalInactiveDeviceCount: 0,
    normalUsage: 0,
    underUsage: 0,
    normalAccuracy: 0,
    belowAverageAccuracy: 0,
    normalAccuracyPercentage: 0,
    minimumTTFA: 0,
    averageTTFA: 0,
    maximumTTFA: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState<string>("");

  const handleStatItemClick = (summaryType: string) => {
    setSelectedSummaryType(summaryType);

    // Notify parent component to refresh DeviceLogGrid with new summaryType
    if (onSummaryTypeSelect) {
      onSummaryTypeSelect(summaryType);
    }

    toast.success(`Loaded devices: ${summaryType}`);
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
      try {
        setLoadingStats(true);
        const { startDate, endDate } = getDateRange();

        const params = new URLSearchParams({
          page: "1",
          limit: "10",
          minutes: "5",
          summaryType: "",
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        });

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/DeviceLog/getdeviceactivelog?${params.toString()}`
        );

        if (response.ok) {
          const responseData = await response.json();
          const summary = responseData?.data?.summary;

          if (summary) {
            setStatistics({
              totalDeviceCount: summary.totalDeviceCount || 0,
              totalActiveDeviceCount: summary.totalActiveDeviceCount || 0,
              totalInactiveDeviceCount: summary.totalInactiveDeviceCount || 0,
              normalUsage: summary.normalUsage || 0,
              underUsage: summary.underUsage || 0,
              normalAccuracy: summary.normalAccuracy || 0,
              belowAverageAccuracy: summary.belowAverageAccuracy || 0,
              normalAccuracyPercentage: summary.normalAccuracyPercentage || 0,
              minimumTTFA: summary.minimumTTFA || 0,
              averageTTFA: summary.averageTTFA || 0,
              maximumTTFA: summary.maximumTTFA || 0,
            });
          }
        } else {
          console.error("Failed to fetch device statistics:", response.statusText);
          toast.error("Failed to fetch device statistics");
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast.error("Error fetching device statistics");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, [timeRange, selectedZone]);

  const usagePercentage =
    statistics.totalActiveDeviceCount > 0
      ? Math.round(
          (statistics.normalUsage / statistics.totalActiveDeviceCount) * 100
        )
      : statistics.normalUsage > 0
        ? 100
        : 0;

  const accuracyPercentage = statistics.normalAccuracyPercentage || 0;

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
          {timeOptions.length > 0 && (
            <div className="w-48">
              <Select value={selectedTime} onValueChange={(value) => onSelectedTimeChange?.(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
                value={statistics.totalDeviceCount}
                color="text-blue-600"
                icon={<Zap className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("totalDevice")}
              />
              <StatItem
                label="Active Devices"
                value={statistics.totalActiveDeviceCount}
                color="text-green-600"
                icon={<Activity className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("activeDevice")}
              />
              <StatItem
                label="Inactive Devices"
                value={statistics.totalInactiveDeviceCount}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("inactiveDevice")}
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
              {/* Threshold: {SURVEY_POINT_THRESHOLD} points */}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              <StatItem
                label="Total Active Devices"
                value={statistics.totalActiveDeviceCount}
                color="text-blue-600"
                icon={<Activity className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("activeDevice")}
              />
              <StatItem
                label="Normal Usage"
                value={`${statistics.normalUsage} (${usagePercentage}%)`}
                color="text-green-600"
                icon={<TrendingUp className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("normalUsage")}
              />
              <StatItem
                label="Under Usage"
                value={statistics.underUsage}
                color="text-yellow-600"
                icon={<AlertCircle className="h-3 w-3 text-yellow-500" />}
                onClick={() => handleStatItemClick("underUsage")}
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
                value={`${statistics.normalAccuracy} (${accuracyPercentage}%)`}
                color="text-green-600"
                icon={<Target className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("normalAccuracy")}
              />
              <StatItem
                label="Below Average Accuracy"
                value={statistics.belowAverageAccuracy}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("underAccuracy")}
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
                value={`${statistics.minimumTTFA}m`}
                color="text-green-600"
                icon={<Clock className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Minimum TTFA", `${statistics.minimumTTFA}m`)}
              />
              <StatItem
                label="Average TTFA"
                value={`${statistics.averageTTFA}m`}
                color="text-blue-600"
                icon={<Clock className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Average TTFA", `${statistics.averageTTFA}m`)}
              />
              <StatItem
                label="Maximum TTFA"
                value={`${statistics.maximumTTFA}m`}
                color="text-orange-600"
                icon={<Clock className="h-3 w-3 text-orange-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Maximum TTFA", `${statistics.maximumTTFA}m`)}
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
