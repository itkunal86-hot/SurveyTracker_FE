//import { useEffect, useState } from "react";
import { useEffect, useRef, useState } from "react";
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
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_BASE_PATH, apiClient, type Zone, type Device, type Circle } from "@/lib/api";
import { toast } from "sonner";
import { Toggle } from "@/components/ui/toggle";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";


interface DeviceStatisticsData {
  totalDeviceCount: number;
  totalActiveDeviceCount: number;
  totalInactiveDeviceCount: number;
  normalUsage: number;
  underUsage: number;
  normalUsagePercent: 0,
  normalAccuracy: number;
  belowAverageAccuracy: number;
  normalAccuracyPercentage: number;
  minimumTTFA: number;
  averageTTFA: number;
  maximumTTFA: number;
  usageSummary?: string[];
  accuracySummary?: string[];
  timeToAchive?:string[];
}

// Helper function to calculate statistics from device log data
const calculateStatisticsFromDevices = (devices: any): DeviceStatisticsData => {
  if (!devices || (Array.isArray(devices) && devices.length === 0)) {
    return {
      totalDeviceCount: 0,
      totalActiveDeviceCount: 0,
      totalInactiveDeviceCount: 0,
      normalUsage: 0,
      underUsage: 0,
      normalUsagePercent: 0,
      normalAccuracy: 0,
      belowAverageAccuracy: 0,
      normalAccuracyPercentage: 0,
      minimumTTFA: 0,
      averageTTFA: 0,
      maximumTTFA: 0,
    };
  }

  const totalDeviceCount = devices.totalDeviceCount ?? 0;
  const totalActiveDeviceCount = devices.totalActiveDeviceCount ?? 0;
  const totalInactiveDeviceCount = devices.totalInactiveDeviceCount ?? 0;

  // Extract usage statistics from usageSummary array
  // Format: "Below Avarage      1(100%)", "Normal      0(0%)", etc.
  const parseUsageSummary = () => {
    let normalUsage = 0;
    let underUsage = 0;
    let normalUsagePercent = 0;

    if (Array.isArray(devices.usageSummary)) {
      devices.usageSummary.forEach((summary: string) => {
        const match = summary.match(/(\d+)\((\d+)%\)/);
        if (match) {
          const count = parseInt(match[1], 10);
          const percent = parseInt(match[2], 10);

          if (summary.toLowerCase().includes("normal") && !summary.toLowerCase().includes("avarage")) {
            normalUsage += count;
            normalUsagePercent += percent;
          } else {
            underUsage += count;
          }
        }
      });
    }

    return { normalUsage, underUsage, normalUsagePercent };
  };

  // Extract accuracy statistics from accuracySummary array
  const parseAccuracySummary = () => {
    let normalAccuracy = 0;
    let belowAverageAccuracy = 0;
    let normalAccuracyPercentage = 0;

    if (Array.isArray(devices.accuracySummary)) {
      devices.accuracySummary.forEach((summary: string) => {
        const match = summary.match(/(\d+)\((\d+)%\)/);
        if (match) {
          const count = parseInt(match[1], 10);
          const percent = parseInt(match[2], 10);

          if (summary.toLowerCase().includes("normal")) {
            normalAccuracy += count;
            normalAccuracyPercentage += percent;
          } else {
            belowAverageAccuracy += count;
          }
        }
      });
    }

    return { normalAccuracy, belowAverageAccuracy, normalAccuracyPercentage };
  };

  const { normalUsage, underUsage, normalUsagePercent } = parseUsageSummary();
  const { normalAccuracy, belowAverageAccuracy, normalAccuracyPercentage } = parseAccuracySummary();

  // Time to Achieve Accuracy
  const minimumTTFA = devices.minimumTTFA ?? 0;
  const maximumTTFA = devices.maximumTTFA ?? 0;
  const averageTTFA = devices.averageTTFA ?? 0;
  return {
    totalDeviceCount,
    totalActiveDeviceCount,
    totalInactiveDeviceCount,
    normalUsage,
    underUsage,
    normalUsagePercent,
    normalAccuracy,
    belowAverageAccuracy,
    normalAccuracyPercentage,
    minimumTTFA,
    averageTTFA,
    maximumTTFA,
    usageSummary: devices.usageSummary,
    accuracySummary: devices.accuracySummary,
    timeToAchive:devices.timeToAchive,
  };
};

type TimeRange = "all" | "7-days" | "1-month" | "3-months";
type ZoneSelection = string | string[];

const FALLBACK_TIME_RANGE_OPTIONS = [
  { value: "7-days", label: "Last 7 Days" },
  { value: "1-month", label: "Last 1 Month" },
  { value: "3-months", label: "Last 3 Months" },
];

const SURVEY_POINT_THRESHOLD = 100;

// Helper function to extract category name from summary string
// E.g., "Below Avarage      15(88.24%)" -> "Below Avarage"
const extractCategoryFromSummary = (summary: string): string => {
  return summary.trim().split(/\s+/).slice(0, -1).join(" ") || summary;
};

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
type SummarySelection = [string, string];
interface DeviceStatisticsAnalyticsProps {
  onSummaryTypeSelect?: (value: SummarySelection) => void;
  onZoneSelect?: (zone: ZoneSelection) => void;
  onCircleSelect?: (circle: ZoneSelection) => void;
  selectedTime?: string;
  onSelectedTimeChange?: (time: string) => void;
  timeOptions?: TimeOption[];
  onCustomDateRangeChange?: (startDate: string | null, endDate: string | null) => void;
  onDeviceSelect?: (deviceIds: string[]) => void;
  deviceLogSummary?: any;
}

export const DeviceStatisticsAnalytics = ({
  onSummaryTypeSelect,
  onZoneSelect,
  onCircleSelect,
  selectedTime = "7-days",
  onSelectedTimeChange,
  timeOptions = [],
  onCustomDateRangeChange,
  onDeviceSelect,
  deviceLogSummary
}: DeviceStatisticsAnalyticsProps) => {
  const didInitRef = useRef(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("7-days");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>(["all"]);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [zoneSearchTerm, setZoneSearchTerm] = useState("");
  const [selectedCircles, setSelectedCircles] = useState<string[]>(["all"]);
  const [showCircleDropdown, setShowCircleDropdown] = useState(false);
  const [circleSearchTerm, setCircleSearchTerm] = useState("");
  const [timeRangeOptions, setTimeRangeOptions] = useState<TimeOption[]>(FALLBACK_TIME_RANGE_OPTIONS);
  const [loadingTimeRanges, setLoadingTimeRanges] = useState(true);
  const [statistics, setStatistics] = useState<DeviceStatisticsData>({
    totalDeviceCount: 0,
    totalActiveDeviceCount: 0,
    totalInactiveDeviceCount: 0,
    normalUsage: 0,
    underUsage: 0,
    normalUsagePercent: 0,
    normalAccuracy: 0,
    belowAverageAccuracy: 0,
    normalAccuracyPercentage: 0,
    minimumTTFA: 0,
    averageTTFA: 0,
    maximumTTFA: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);  
  const [selectedSummaryType, setSelectedSummaryType] = useState<[string,string]>(["",""]);
  const [loadingDeviceLog, setLoadingDeviceLog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);


  const handleTimeRangeChange = (value: string) => {
    console.log("DeviceStatisticsAnalytics - Time range changed to:", value);
    setTimeRange(value as TimeRange);

    if (onSelectedTimeChange) {
      console.log("DeviceStatisticsAnalytics - Sending selectedTime to parent:", value);
      onSelectedTimeChange(value);
    }
    // API call is now handled exclusively by DeviceLogGrid component
  };


  const updateZones = (newZones: string[]) => {
    setSelectedZones(newZones);

    // Prepare zone parameter - send comma-separated zone names or "all" if selected
    let zoneParam: string;
    if (newZones.length === 1 && newZones[0] === "all") {
      zoneParam = "all";
    } else {
      zoneParam = newZones.join(",");
    }

    // Always pass a string to the parent component
    if (onZoneSelect) {
      onZoneSelect(zoneParam);
    }

    // API call is now handled exclusively by DeviceLogGrid component
  };

  const toggleZoneSelection = (zoneName: string) => {
    let newZones: string[];

    if (zoneName === "all") {
      // If "all" is selected, clear other selections
      newZones = ["all"];
    } else {
      newZones = selectedZones.filter(z => z !== "all");

      if (newZones.includes(zoneName)) {
        newZones = newZones.filter(z => z !== zoneName);
      } else {
        newZones = [...newZones, zoneName];
      }

      // If no zones are selected, default to "all"
      newZones = newZones.length === 0 ? ["all"] : newZones;
    }

    updateZones(newZones);
  };

  const updateCircles = (newCircles: string[]) => {
    setSelectedCircles(newCircles);

    // Prepare circle parameter - send comma-separated circle names or "all" if selected
    let circleParam: string;
    if (newCircles.length === 1 && newCircles[0] === "all") {
      circleParam = "all";
    } else {
      circleParam = newCircles.join(",");
    }

    // Always pass a string to the parent component
    if (onCircleSelect) {
      onCircleSelect(circleParam);
    }

    // API call is now handled exclusively by DeviceLogGrid component
  };

  const toggleCircleSelection = (circleName: string) => {
    let newCircles: string[];

    if (circleName === "all") {
      // If "all" is selected, clear other selections
      newCircles = ["all"];
    } else {
      newCircles = selectedCircles.filter(c => c !== "all");

      if (newCircles.includes(circleName)) {
        newCircles = newCircles.filter(c => c !== circleName);
      } else {
        newCircles = [...newCircles, circleName];
      }

      // If no circles are selected, default to "all"
      newCircles = newCircles.length === 0 ? ["all"] : newCircles;
    }

    updateCircles(newCircles);
  };

  // const handleDeviceChange = async (deviceIds: string[]) => {
  //   setSelectedDeviceIds(deviceIds);
  //   if (onDeviceSelect) {
  //     onDeviceSelect(deviceIds);
  //   }
  //   try {
  //     const { startDate, endDate } = getDateRange();

  //     // Prepare zone parameter
  //     let zoneParam: string | undefined;
  //     if (selectedZones.length > 0 && !(selectedZones.length === 1 && selectedZones[0] === "all")) {
  //       zoneParam = selectedZones.join(",");
  //     }

  //     const response = await apiClient.getDeviceActiveLog({
  //       page: 1,
  //       limit: 100,
  //       startDate,
  //       endDate,
  //       zone: zoneParam,
  //       deviceIds: selectedDeviceIds.length > 0 ? selectedDeviceIds : undefined,
  //     });

  //     if (response?.success && response?.data) {
  //       debugger;
  //       console.log("here",response);
  //       const calculatedStats = calculateStatisticsFromDevices(response.summery);
  //       console.log("3",calculatedStats);
  //       setStatistics(calculatedStats);
  //       toast.success("Device statistics updated successfully");
  //     } else {
  //       toast.error("Failed to fetch device active log");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching device active log:", error);
  //     toast.error("Error fetching device active log");
  //   } finally {
  //     setLoadingDeviceLog(false);
  //   }
  //   toast.success(`Selected ${deviceIds.length} device(s)`);
  // };

  // const toggleDeviceSelection = (deviceId: string) => {
  //   setSelectedDeviceIds(prev => {
  //     const newIds = prev.includes(deviceId)
  //       ? prev.filter(id => id !== deviceId)
  //       : [...prev, deviceId];
  //     handleDeviceChange(newIds);
  //     return newIds;
  //   });
  // };

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };
  const handleDeviceChange = (deviceIds: string[]) => {
    setSelectedDeviceIds(deviceIds);
  };
  useEffect(() => {
    if (selectedDeviceIds.length === 0) return;

    // Notify parent of device selection
    onDeviceSelect?.(selectedDeviceIds);
    toast.success(`Selected ${selectedDeviceIds.length} device(s)`);

    // API call is now handled exclusively by DeviceLogGrid component
  }, [selectedDeviceIds]);
    

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(deviceSearchTerm.toLowerCase())
  );

  const filteredZones = zones.filter(z =>
    z.name.toLowerCase().includes(zoneSearchTerm.toLowerCase())
  );

  const filteredCircles = circles.filter(c =>
    c.name.toLowerCase().includes(circleSearchTerm.toLowerCase())
  );

  const handleStatItemClick = (section: string, label: string, value: string | number, summaryType: string, summaryKey: string) => {
    setSelectedSummaryType([summaryType,summaryKey]);  
    // Notify parent component to refresh DeviceLogGrid with new summaryType
    if (onSummaryTypeSelect) {
      onSummaryTypeSelect([summaryType,summaryKey]);
    }

    toast.success(`${section}: ${label} = ${value}`);
  };

  const handleStartDateChange = async (selectedDate: Date | undefined) => {
    setStartDate(selectedDate);

    // If both dates are selected, fetch the data
    if (selectedDate && endDate) {
      await fetchDataWithDateRange(selectedDate, endDate);
    }
  };

  const handleEndDateChange = async (selectedDate: Date | undefined) => {
    setEndDate(selectedDate);

    // If both dates are selected, fetch the data
    if (startDate && selectedDate) {
      await fetchDataWithDateRange(startDate, selectedDate);
    }
  };

  const fetchDataWithDateRange = (start: Date, end: Date) => {
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    if (onCustomDateRangeChange) {
      onCustomDateRangeChange(startISO, endISO);
    }

    // API call is now handled exclusively by DeviceLogGrid component
    toast.success("Custom date range applied");
  };

  const handleExportDeviceSummary = async () => {
    setExportLoading(true);

    try {
      // Get current date range
      const { startDate: startISO, endDate: endISO } = getDateRange();

      // Prepare zone parameter
      let zoneParam: string | undefined;
      if (selectedZones.length > 0 && !(selectedZones.length === 1 && selectedZones[0] === "all")) {
        zoneParam = selectedZones.join(",");
      }

      // Call the export API
      const blob = await apiClient.exportDeviceSummary({
        page: 1,
        limit: 100,
        startDate: startISO ? new Date(startISO) : undefined,
        endDate: endISO ? new Date(endISO) : undefined,
        zone: zoneParam,
        deviceIds: selectedDeviceIds.length > 0 ? selectedDeviceIds : undefined,
      });

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `device-summary-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Device summary exported successfully");
    } catch (error) {
      console.error("Error exporting device summary:", error);
      toast.error("Failed to export device summary");
    } finally {
      setExportLoading(false);
    }
  };

  // const handleStatItemClick = (summaryType: string) => {
  //   setSelectedSummaryType(summaryType);

  //   // Notify parent component to refresh DeviceLogGrid with new summaryType
  //   if (onSummaryTypeSelect) {
  //     onSummaryTypeSelect(summaryType);
  //   }

  //   toast.success(`Loaded devices: ${summaryType}`);
  // };

  // Sync selectedTime prop with timeRange state
  useEffect(() => {
    if (selectedTime && selectedTime !== timeRange) {
      console.log("DeviceStatisticsAnalytics - Syncing selectedTime from prop:", selectedTime);
      setTimeRange(selectedTime as TimeRange);
    }
  }, [selectedTime]);

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
    //fetchStatistics();
  }, []);

  // Fetch circles for the circle dropdown
  useEffect(() => {
    const fetchCircles = async () => {
      try {
        setLoadingCircles(true);
        const response = await apiClient.getCircles({ limit: 100 });
        setCircles(response.data || []);
      } catch (error) {
        console.error("Error fetching circles:", error);
        setCircles([]);
      } finally {
        setLoadingCircles(false);
      }
    };

    fetchCircles();
  }, []);

  // Fetch devices for the device dropdown
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoadingDevices(true);
        const response = await apiClient.getDevices({ limit: 200 });
        setDevices(response.data || []);
      } catch (error) {
        console.error("Error fetching devices:", error);
        setDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
  const fetchTimeRangeOptions = async () => {
    try {
      setLoadingTimeRanges(true);

      // ✅ Already scoped by key
      const response = await apiClient.getSettingByKey("SETTING_DAY_DDL_FILTTER");

      const settings = response?.data || [];
      //console.log(settings)
      if (settings.length > 0) {
        const options: TimeOption[] = settings.map((setting: any) => {
          const settingValue = setting.settingValue || "";

          // "DAYS=7,TEXT=Last 7 Days"
          const parts = settingValue.split(",");

          const parsed: Record<string, string> = {};
          parts.forEach((part: string) => {
            const [key, value] = part.split("=");
            if (key && value) {
              parsed[key.trim().toUpperCase()] = value.trim();
            }
          });

          const unit = parsed["DAYS"]
            ? "days"
            : parsed["MONTH"]
            ? "months"
            : "days";

          const amount = parsed["DAYS"] || parsed["MONTH"] || "7";
          const label = parsed["TEXT"] || `Last ${amount} ${unit}`;
          const value = `${amount}-${unit}`;

          return { value, label };
        });

        setTimeRangeOptions(options);
      } else {
        setTimeRangeOptions(FALLBACK_TIME_RANGE_OPTIONS);
      }
    } catch (error) {
      console.error("Error fetching time range options:", error);
      setTimeRangeOptions(FALLBACK_TIME_RANGE_OPTIONS);
    } finally {
      setLoadingTimeRanges(false);
    }
  };

  fetchTimeRangeOptions();
}, []);


  const getDateRange = () => {
    var endDate = new Date();
    var startDate = new Date();

    switch (timeRange) {
      case "all":
        startDate = null;
        endDate = null;
        break;
      case "7-days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "1-month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3-months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    return { startDate, endDate };
  };
  const getDateRangeFromValue = (value: string) => {
    if (value === "all") {
      return { startDate: null, endDate: null };
    }

    const endDate = new Date();
    const startDate = new Date();

    // Expected formats: "5-Days", "3-Months", "1-Days"
    const [amountStr, unitRaw] = value.split("-");
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount)) {
      return { startDate: null, endDate: null };
    }

    const unit = unitRaw?.toLowerCase();

    switch (unit) {
      case "day":
      case "days":
        startDate.setDate(startDate.getDate() - amount);
        break;

      case "month":
      case "months":
        startDate.setMonth(startDate.getMonth() - amount);
        break;

      default:
        return { startDate: null, endDate: null };
    }

    return { startDate, endDate };
  };

  // NOTE: API call for getdeviceactivelog is now handled exclusively by DeviceLogGrid.tsx
  // to avoid duplicate endpoint calls. Statistics display now populated from deviceLogSummary prop.

  // Sync deviceLogSummary data to statistics state
  useEffect(() => {
    if (deviceLogSummary) {
      const syncedStats = calculateStatisticsFromDevices(deviceLogSummary);
      setStatistics(syncedStats);
    }
  }, [deviceLogSummary]);

  useEffect(() => {
    setLoadingStats(false);
  }, [timeRange, selectedZones]);

  // Auto-select first time range option when options are loaded
  useEffect(() => {
    if (timeRangeOptions.length > 0 && !loadingTimeRanges && !hasAutoSelected) {
      const firstOption = timeRangeOptions[0].value;
      setTimeRange(firstOption as TimeRange);
      setHasAutoSelected(true);
      // Notify parent to trigger data fetch in DeviceLogGrid
      if (onSelectedTimeChange) {
        onSelectedTimeChange(firstOption);
      }
    }
  }, [timeRangeOptions, loadingTimeRanges, hasAutoSelected]);

  const usagePercentage =
    statistics.totalActiveDeviceCount > 0
      ? Math.round(
        (statistics.normalUsage / statistics.totalActiveDeviceCount) * 100
      )
      : statistics.normalUsage > 0
        ? 100
        : 0;

  const accuracyPercentage = statistics.normalAccuracyPercentage || 0;

  // Check if summary arrays are empty - indicates no devices in selection criteria
  const isSummaryEmpty =
    (!deviceLogSummary?.usageSummary || deviceLogSummary.usageSummary.length === 0) &&
    (!deviceLogSummary?.accuracySummary || deviceLogSummary.accuracySummary.length === 0) &&
    (!deviceLogSummary?.timeToAchive || deviceLogSummary.timeToAchive.length === 0);

  return (
    <div className="space-y-4">
      {/* Title Section */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Device Statistics & Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Time-based operational overview of GNSS devices
        </p>
      </div>

      {/* Filters Card */}
      <Card className="bg-white border-gray-200">
        <CardContent className="pt-6">
          <div className="flex gap-3 items-center flex-wrap">
          {/* {timeOptions.length > 0 && (
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
          )} */}
          <div className="flex items-center gap-2">
            {!showCalendar ? (
              <div className="w-48">
                {/* <Select value={timeRange}  onValueChange={setTimeRange}  disabled={loadingDeviceLog}> */}

                <Select value={timeRange} onValueChange={handleTimeRangeChange} disabled={loadingDeviceLog}>

                  <SelectTrigger>
                    <SelectValue placeholder={loadingTimeRanges ? "Loading..." : "Select time range"} />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={loadingDeviceLog}
                      className="w-40"
                    >
                      {startDate ? startDate.toLocaleDateString() : "Start Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={loadingDeviceLog}
                      className="w-40"
                    >
                      {endDate ? endDate.toLocaleDateString() : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <Toggle
              pressed={showCalendar}
              onPressedChange={setShowCalendar}
              className="px-3"
              title="Toggle between dropdown and calendar view"
            >
              <span className="text-xs font-medium">📅 Calendar</span>
            </Toggle>
          </div>
          {/* Zone Dropdown - Multiselect with Autocomplete */}
          <Popover open={showZoneDropdown} onOpenChange={setShowZoneDropdown}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                //disabled={loadingZones || loadingDeviceLog}
                className="w-48 justify-start text-left"
              >
                {selectedZones.length === 0 || (selectedZones.length === 1 && selectedZones[0] === "all")
                  ? "All Zones"
                  : selectedZones.length === 1
                    ? selectedZones[0]
                    : `${selectedZones.length} zones`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {loadingZones ? (
                  <div className="text-sm text-muted-foreground">
                    Loading zones...
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No zones available
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search zones..."
                      className="w-full px-2 py-1 border rounded text-sm"
                      value={zoneSearchTerm}
                      onChange={(e) => setZoneSearchTerm(e.target.value)}
                    />
                    <div className="space-y-1">
                      <div
                        className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer"
                        onClick={() => updateZones(["all"])}
                      >
                        <input
                          type="checkbox"
                          id="zone-all"
                          checked={selectedZones.length === 1 && selectedZones[0] === "all"}
                          onChange={() => updateZones(["all"])}
                          className="rounded pointer-events-none"
                        />
                        <label
                          htmlFor="zone-all"
                          className="flex-1 text-sm cursor-pointer font-semibold pointer-events-none"
                        >
                          All Zones
                        </label>
                      </div>
                      {filteredZones.map((zone) => (
                        <div
                          key={zone.name}
                          className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`zone-${zone.name}`}
                            checked={selectedZones.includes(zone.name)}
                            onChange={() => toggleZoneSelection(zone.name)}
                            //disabled={selectedZones.length === 1 && selectedZones[0] === "all"}
                            className="rounded"
                          />
                          <label
                            htmlFor={`zone-${zone.name}`}
                            className="flex-1 text-sm cursor-pointer truncate"
                          >
                            {zone.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Circle Dropdown - Multiselect with Autocomplete */}
          <Popover open={showCircleDropdown} onOpenChange={setShowCircleDropdown}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                //disabled={loadingCircles || loadingDeviceLog}
                className="w-48 justify-start text-left"
              >
                {selectedCircles.length === 0 || (selectedCircles.length === 1 && selectedCircles[0] === "all")
                  ? "All Circles"
                  : selectedCircles.length === 1
                    ? selectedCircles[0]
                    : `${selectedCircles.length} circles`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {loadingCircles ? (
                  <div className="text-sm text-muted-foreground">
                    Loading circles...
                  </div>
                ) : circles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No circles available
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search circles..."
                      className="w-full px-2 py-1 border rounded text-sm"
                      value={circleSearchTerm}
                      onChange={(e) => setCircleSearchTerm(e.target.value)}
                    />
                    <div className="space-y-1">
                      <div
                        className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer"
                        onClick={() => updateCircles(["all"])}
                      >
                        <input
                          type="checkbox"
                          id="circle-all"
                          checked={selectedCircles.length === 1 && selectedCircles[0] === "all"}
                          onChange={() => updateCircles(["all"])}
                          className="rounded pointer-events-none"
                        />
                        <label
                          htmlFor="circle-all"
                          className="flex-1 text-sm cursor-pointer font-semibold pointer-events-none"
                        >
                          All Circles
                        </label>
                      </div>
                      {filteredCircles.map((circle) => (
                        <div
                          key={circle.name}
                          className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`circle-${circle.name}`}
                            checked={selectedCircles.includes(circle.name)}
                            onChange={() => toggleCircleSelection(circle.name)}
                            className="rounded"
                          />
                          <label
                            htmlFor={`circle-${circle.name}`}
                            className="flex-1 text-sm cursor-pointer truncate"
                          >
                            {circle.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Device Dropdown - Multiselect with Autocomplete */}
          <Popover open={showDeviceDropdown} onOpenChange={setShowDeviceDropdown}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={loadingDevices}
                className="w-48 justify-start text-left"
              >
                {selectedDeviceIds.length === 0
                  ? "Select devices"
                  : selectedDeviceIds.length === 1
                    ? `1 device`
                    : `${selectedDeviceIds.length} devices`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {loadingDevices ? (
                  <div className="text-sm text-muted-foreground">
                    Loading devices...
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No devices available
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search devices..."
                      className="w-full px-2 py-1 border rounded text-sm"
                      value={deviceSearchTerm}
                      onChange={(e) => setDeviceSearchTerm(e.target.value)}
                    />
                    <div className="space-y-1">
                      {filteredDevices.length > 0 ? (
                        filteredDevices.map((device) => (
                          <div key={device.id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer">
                            <input
                              type="checkbox"
                              id={`device-${device.id}`}
                              checked={selectedDeviceIds.includes(device.id)}
                              onChange={() => toggleDeviceSelection(device.id)}
                              className="rounded"
                            />
                            <label
                              htmlFor={`device-${device.id}`}
                              className="flex-1 text-sm cursor-pointer truncate"
                            >
                              {device.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-2">
                          No devices match your search
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleExportDeviceSummary}
            disabled={exportLoading}
            variant="outline"
            className="flex items-center gap-2"
            title="Export device summary"
          >
            <Download className="h-4 w-4" />
            {exportLoading ? "Exporting..." : "Export Summary"}
          </Button>
        </div>
        </CardContent>
      </Card>

      {isSummaryEmpty ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-600 mb-4" />
            <p className="text-center text-lg font-semibold text-amber-900">
              No Active Devices
            </p>
            <p className="text-center text-sm text-amber-800 mt-2">
              No active devices found in the selected criteria range.
            </p>
            <p className="text-center text-xs text-amber-700 mt-4">
              Try adjusting your time range, zone, or device filters to see results.
            </p>
          </CardContent>
        </Card>
      ) : (
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
                onClick={() => handleStatItemClick("Device Status", "Total Devices", `${statistics.totalDeviceCount}m`, "totalDevice", "Device_Status")}
              />
              <StatItem
                label="Active Devices"
                value={statistics.totalActiveDeviceCount}
                color="text-green-600"
                icon={<Activity className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Device Status", "Active Devices", `${statistics.totalActiveDeviceCount}m`, "activeDevice", "Device_Status")}
              />
              <StatItem
                label="Inactive Devices"
                value={statistics.totalInactiveDeviceCount}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("Device Status", "Inactive Devices", `${statistics.totalInactiveDeviceCount}m`, "inactiveDevice", "Device_Status")}
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
              {statistics.usageSummary && statistics.usageSummary.length > 0 ? (
                statistics.usageSummary.map((summary, index) => {
                  const categoryText = extractCategoryFromSummary(summary);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-2 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50 rounded"
                      onClick={() => handleStatItemClick("Device Usage Classification", categoryText, categoryText, categoryText,"SETTING_USAGE_SA_FILTTER")}
                    >
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">{summary}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <StatItem
                    label="Total Active Devices"
                    value={statistics.totalActiveDeviceCount}
                    color="text-blue-600"
                    icon={<Activity className="h-3 w-3 text-blue-500" />}
                    onClick={() => handleStatItemClick("Total Active Devices", "Active Device", `${statistics.totalActiveDeviceCount}m`, "activeDevice","SETTING_USAGE_SA_FILTTER")}
                  />
                  <StatItem
                    label="Normal Usage"
                    value={`${statistics.normalUsage} (${usagePercentage}%)`}
                    color="text-green-600"
                    icon={<TrendingUp className="h-3 w-3 text-green-500" />}
                    onClick={() => handleStatItemClick("Total Active Devices", "Normal Usage", `${statistics.normalUsage}m`, "normalUsage","SETTING_USAGE_SA_FILTTER")}
                  />
                  <StatItem
                    label="Under Usage"
                    value={statistics.underUsage}
                    color="text-yellow-600"
                    icon={<AlertCircle className="h-3 w-3 text-yellow-500" />}
                    onClick={() => handleStatItemClick("Total Active Devices", "Under Usage", `${statistics.underUsage}m`, "underUsage","SETTING_USAGE_SA_FILTTER")}
                  />
                </>
              )}
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
              {statistics.accuracySummary && statistics.accuracySummary.length > 0 ? (
                statistics.accuracySummary.map((summary, index) => {
                  const categoryText = extractCategoryFromSummary(summary);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-2 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50 rounded"
                      onClick={() => handleStatItemClick("Accuracy Performance", categoryText, categoryText, categoryText,"SETTING_ACCURACY_SA_FILTTER")}
                    >
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">{summary}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <StatItem
                    label="Normal Accuracy"
                    value={`${statistics.normalAccuracy} (${accuracyPercentage}%)`}
                    color="text-green-600"
                    icon={<Target className="h-3 w-3 text-green-500" />}
                    onClick={() => handleStatItemClick("Accuracy Performance", "Normal Accuracy", `${statistics.normalAccuracy}m`, "normalAccuracy","SETTING_ACCURACY_SA_FILTTER")}
                  />
                  <StatItem
                    label="Below Average Accuracy"
                    value={statistics.belowAverageAccuracy}
                    color="text-red-600"
                    icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                    onClick={() => handleStatItemClick("Accuracy Performance", "Under Accuracy", `${statistics.normalAccuracy}m`, "underAccuracy","SETTING_ACCURACY_SA_FILTTER")}
                  />
                </>
              )}
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
              {statistics.timeToAchive && statistics.timeToAchive.length > 0 ? (
                statistics.timeToAchive.map((summary, index) => {
                  const categoryText = extractCategoryFromSummary(summary);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-2 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50 rounded"
                      onClick={() => handleStatItemClick("Time to Achieve Accuracy", categoryText, categoryText, categoryText,"DEVICE_TIME_ACCURACY")}
                    >
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">{summary}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <StatItem
                    label="Minimum TTFA"
                    value={`${statistics.minimumTTFA}m`}
                    color="text-green-600"
                    icon={<Clock className="h-3 w-3 text-green-500" />}
                    onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Minimum TTFA", `${statistics.minimumTTFA}m`, "minimumTTFA","DEVICE_TIME_ACCURACY")}
                  />
                  <StatItem
                    label="Average TTFA"
                    value={`${statistics.averageTTFA}m`}
                    color="text-blue-600"
                    icon={<Clock className="h-3 w-3 text-blue-500" />}
                    onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Average TTFA", `${statistics.averageTTFA}m`, "averageTTFA","DEVICE_TIME_ACCURACY")}
                  />
                  <StatItem
                    label="Maximum TTFA"
                    value={`${statistics.maximumTTFA}m`}
                    color="text-orange-600"
                    icon={<Clock className="h-3 w-3 text-orange-500" />}
                    onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Maximum TTFA", `${statistics.maximumTTFA}m`, "maximumTTFA","DEVICE_TIME_ACCURACY")}
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
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
};
