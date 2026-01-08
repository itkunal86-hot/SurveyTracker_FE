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
import { API_BASE_PATH, apiClient, type Zone, type Device } from "@/lib/api";
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

// Helper function to calculate statistics from device log data
const calculateStatisticsFromDevices = (devices: Device[]): DeviceStatisticsData => {
  if (!devices || devices.length === 0) {
    return {
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
    };
  }

  const totalDeviceCount = devices.length;
  const totalActiveDeviceCount = devices.filter(d => d.status === "ACTIVE").length;
  const totalInactiveDeviceCount = devices.filter(d => d.status === "INACTIVE").length;

  // Usage classification based on battery level
  const BATTERY_THRESHOLD = 50; // Battery % threshold for normal usage
  const normalUsage = devices.filter(d => d.batteryLevel !== undefined && d.batteryLevel >= BATTERY_THRESHOLD).length;
  const underUsage = devices.filter(d => d.batteryLevel !== undefined && d.batteryLevel < BATTERY_THRESHOLD).length;

  // Accuracy classification
  const ACCURACY_THRESHOLD = 10; // Accuracy threshold in meters
  const accuracyValues = devices
    .map(d => d.accuracy)
    .filter((acc) => acc !== undefined && typeof acc === "number") as number[];

  const normalAccuracy = accuracyValues.filter(acc => acc <= ACCURACY_THRESHOLD).length;
  const belowAverageAccuracy = accuracyValues.filter(acc => acc > ACCURACY_THRESHOLD).length;
  const normalAccuracyPercentage = accuracyValues.length > 0
    ? Math.round((normalAccuracy / accuracyValues.length) * 100)
    : 0;

  // Time to Achieve Accuracy (represented by accuracy values in meters/minutes)
  const minimumTTFA = accuracyValues.length > 0 ? Math.min(...accuracyValues) : 0;
  const maximumTTFA = accuracyValues.length > 0 ? Math.max(...accuracyValues) : 0;
  const averageTTFA = accuracyValues.length > 0
    ? Math.round(accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length)
    : 0;

  return {
    totalDeviceCount,
    totalActiveDeviceCount,
    totalInactiveDeviceCount,
    normalUsage,
    underUsage,
    normalAccuracy,
    belowAverageAccuracy,
    normalAccuracyPercentage,
    minimumTTFA,
    averageTTFA,
    maximumTTFA,
  };
};

type TimeRange ="all" | "7days" | "1month" | "3months";
type ZoneSelection = "all" | string;

const TIME_RANGE_OPTIONS = [
  { value: "all", label: "Select" },
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
  onZoneSelect?: (zone: ZoneSelection) => void;
  selectedTime?: string;
  onSelectedTimeChange?: (time: string) => void;
  timeOptions?: TimeOption[];
}

export const DeviceStatisticsAnalytics = ({
  onSummaryTypeSelect,
  onZoneSelect,
  selectedTime = "5",
  onSelectedTimeChange,
  timeOptions = []
}: DeviceStatisticsAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
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
  const [loadingDeviceLog, setLoadingDeviceLog] = useState(false);


  const handleTimeRangeChange = async (value: string) => {
    setTimeRange(value as TimeRange);

    // Update parent component's selected time to trigger grid refresh
    if (onSelectedTimeChange) {
      onSelectedTimeChange(value);
    }

    setLoadingDeviceLog(true);

    try {
      const { startDate, endDate } = (() => {
        const end = new Date();
        const start = new Date();

        switch (value) {
          case "all":
            return { startDate: null, endDate: null };
          case "7days":
            start.setDate(start.getDate() - 7);
            return { startDate: start, endDate: end };
          case "1month":
            start.setMonth(start.getMonth() - 1);
            return { startDate: start, endDate: end };
          case "3months":
            start.setMonth(start.getMonth() - 3);
            return { startDate: start, endDate: end };
          default:
            return { startDate: null, endDate: null };
        }
      })();

      // Fetch device active log and calculate statistics from it
      const response = await apiClient.getDeviceActiveLog({
        page: 1,
        limit: 100,
        startDate,
        endDate,
        zone: selectedZone,
      });

      if (response && response.success && response.data) {
        // Calculate statistics from device data
        const calculatedStats = calculateStatisticsFromDevices(response.data);
        setStatistics(calculatedStats);
        toast.success("Device statistics updated successfully");
      } else {
        toast.error("Failed to fetch device active log");
      }
    } catch (error) {
      console.error("Error fetching device active log:", error);
      toast.error("Error fetching device active log");
    } finally {
      setLoadingDeviceLog(false);
    }
  };

  const handleZoneChange = async (zone: string) => {
    setSelectedZone(zone as ZoneSelection);
    if (onZoneSelect) {
      onZoneSelect(zone as ZoneSelection);
    }

    setLoadingDeviceLog(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Fetch device active log and calculate statistics from it
      const response = await apiClient.getDeviceActiveLog({
        page: 1,
        limit: 100,
        startDate,
        endDate,
        zone,
      });

      if (response && response.success && response.data) {
        // Calculate statistics from device data
        const calculatedStats = calculateStatisticsFromDevices(response.data);
        setStatistics(calculatedStats);
        toast.success("Device statistics updated for selected zone");
      } else {
        toast.error("Failed to fetch device active log");
      }
    } catch (error) {
      console.error("Error fetching device active log:", error);
      toast.error("Error fetching device active log");
    } finally {
      setLoadingDeviceLog(false);
    }
  };

  const handleStatItemClick = (section: string, label: string, value: string | number,summaryType: string) => {
    setSelectedSummaryType(summaryType);

    // Notify parent component to refresh DeviceLogGrid with new summaryType
    if (onSummaryTypeSelect) {
      onSummaryTypeSelect(summaryType);
    }

    toast.success(`${section}: ${label} = ${value}`);
  };
  // const handleStatItemClick = (summaryType: string) => {
  //   setSelectedSummaryType(summaryType);

  //   // Notify parent component to refresh DeviceLogGrid with new summaryType
  //   if (onSummaryTypeSelect) {
  //     onSummaryTypeSelect(summaryType);
  //   }

  //   toast.success(`Loaded devices: ${summaryType}`);
  // };

  useEffect(() => {
    const fetchInitialData = async () => {
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

    // Fetch initial statistics from device log
    const fetchStatistics = async () => {
      try {
        setLoadingStats(true);
        const response = await apiClient.getDeviceActiveLog({
          page: 1,
          limit: 100,
          zone: selectedZone,
          startDate: null,
          endDate: null,
        });

        if (response && response.success && response.data) {
          // Calculate statistics from device data
          const calculatedStats = calculateStatisticsFromDevices(response.data);
          setStatistics(calculatedStats);
        }
      } catch (error) {
        console.error("Error fetching device active log:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchInitialData();
    fetchStatistics();
  }, []);

  const getDateRange = () => {
    var endDate = new Date();
    var startDate = new Date();

    switch (timeRange) {
       case "all":
        startDate= null;
        endDate=null;
        break;
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
            <Select value={timeRange} onValueChange={handleTimeRangeChange} disabled={loadingDeviceLog}>
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
            <Select
              value={selectedZone}
              onValueChange={handleZoneChange}
              disabled={loadingDeviceLog || loadingZones}
            >
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
                    <SelectItem key={zone.name} value={zone.name}>
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
                onClick={() => handleStatItemClick("Device Status","Total Devices",`${statistics.totalDeviceCount}m`,"totalDevice")}
              />
              <StatItem
                label="Active Devices"
                value={statistics.totalActiveDeviceCount}
                color="text-green-600"
                icon={<Activity className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Device Status","Active Devices",`${statistics.totalActiveDeviceCount}m`,"activeDevice")}
              />
              <StatItem
                label="Inactive Devices"
                value={statistics.totalInactiveDeviceCount}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("Device Status","Inactive Devices",`${statistics.totalInactiveDeviceCount}m`,"inactiveDevice")}
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
                onClick={() => handleStatItemClick("Total Active Devices","Active Device",`${statistics.totalActiveDeviceCount}m`,"activeDevice")}
              />
              <StatItem
                label="Normal Usage"
                value={`${statistics.normalUsage} (${usagePercentage}%)`}
                color="text-green-600"
                icon={<TrendingUp className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Total Active Devices","Normal Usage",`${statistics.normalUsage}m`,"normalUsage")}
              />
              <StatItem
                label="Under Usage"
                value={statistics.underUsage}
                color="text-yellow-600"
                icon={<AlertCircle className="h-3 w-3 text-yellow-500" />}
                onClick={() => handleStatItemClick("Total Active Devices","Under Usage",`${statistics.underUsage}m`,"underUsage")}
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
                onClick={() => handleStatItemClick("Accuracy Performance","Normal Accuracy", `${statistics.normalAccuracy}m`,"normalAccuracy")}
              />
              <StatItem
                label="Below Average Accuracy"
                value={statistics.belowAverageAccuracy}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("Accuracy Performance","Under Accuracy", `${statistics.normalAccuracy}m`,"underAccuracy")}
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
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Minimum TTFA", `${statistics.minimumTTFA}m`,"minimumTTFA")}
              />
              <StatItem
                label="Average TTFA"
                value={`${statistics.averageTTFA}m`}
                color="text-blue-600"
                icon={<Clock className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Average TTFA", `${statistics.averageTTFA}m`,"averageTTFA")}
              />
              <StatItem
                label="Maximum TTFA"
                value={`${statistics.maximumTTFA}m`}
                color="text-orange-600"
                icon={<Clock className="h-3 w-3 text-orange-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Maximum TTFA", `${statistics.maximumTTFA}m`,"maximumTTFA")}
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
