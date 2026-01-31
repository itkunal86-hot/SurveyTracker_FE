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
}

// Helper function to calculate statistics from device log data
const calculateStatisticsFromDevices = (devices: any): DeviceStatisticsData => {
  if (!devices || devices.length === 0) {
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

  const totalDeviceCount = devices.totalDeviceCount;
  const totalActiveDeviceCount = devices.totalActiveDeviceCount;
  const totalInactiveDeviceCount = devices.totalInactiveDeviceCount;

  // Usage classification based on battery level
  const BATTERY_THRESHOLD = 50; // Battery % threshold for normal usage
  const normalUsage = devices.normalUsage;
  const underUsage = devices.underUsage;
  const normalUsagePercent = devices.normalUsagePercent;

  // Accuracy classification
  // const ACCURACY_THRESHOLD = 10; // Accuracy threshold in meters
  // const accuracyValues = devices
  //   .map(d => d.accuracy)
  //   .filter((acc) => acc !== undefined && typeof acc === "number") as number[];

  //const normalAccuracy = accuracyValues.filter(acc => acc <= ACCURACY_THRESHOLD).length;
  const normalAccuracy = devices.normalAccuracy;
  //const belowAverageAccuracy = accuracyValues.filter(acc => acc > ACCURACY_THRESHOLD).length;
  const belowAverageAccuracy = devices.underUsage;
  // const normalAccuracyPercentage = accuracyValues.length > 0
  //   ? Math.round((normalAccuracy / accuracyValues.length) * 100)
  //   : 0;
  const normalAccuracyPercentage = devices.normalAccuracyPercentage

  // Time to Achieve Accuracy (represented by accuracy values in meters/minutes)
  // const minimumTTFA = accuracyValues.length > 0 ? Math.min(...accuracyValues) : 0;
  // const maximumTTFA = accuracyValues.length > 0 ? Math.max(...accuracyValues) : 0;
  // const averageTTFA = accuracyValues.length > 0
  //   ? Math.round(accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length)
  //   : 0;
  const minimumTTFA = devices.minimumTTFA;
  const maximumTTFA = devices.maximumTTFA;
  const averageTTFA = devices.averageTTFA;
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
  };
};

type TimeRange = "all" | "7days" | "1month" | "3months";
type ZoneSelection = string | string[];

const FALLBACK_TIME_RANGE_OPTIONS = [
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
  onCustomDateRangeChange?: (startDate: string | null, endDate: string | null) => void;
  onDeviceSelect?: (deviceIds: string[]) => void;
}

export const DeviceStatisticsAnalytics = ({
  onSummaryTypeSelect,
  onZoneSelect,
  selectedTime = "7days",
  onSelectedTimeChange,
  timeOptions = [],
  onCustomDateRangeChange,
  onDeviceSelect
}: DeviceStatisticsAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>(["all"]);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [zoneSearchTerm, setZoneSearchTerm] = useState("");
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
  const [selectedSummaryType, setSelectedSummaryType] = useState<string>("");
  const [loadingDeviceLog, setLoadingDeviceLog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);


  // const handleTimeRangeChange = async (value: string) => {

  //   setTimeRange(value as TimeRange);

  //   // Update parent component's selected time to trigger grid refresh
  //   if (onSelectedTimeChange) {
  //     onSelectedTimeChange(value);
  //   }

  //   setLoadingDeviceLog(true);

  //   try {
  //     const { startDate, endDate } = (() => {
  //       const end = new Date();
  //       const start = new Date();

  //       switch (value) {
  //         case "all":
  //           return { startDate: null, endDate: null };
  //         case "7days":
  //           start.setDate(start.getDate() - 7);
  //           return { startDate: start, endDate: end };
  //         case "1month":
  //           start.setMonth(start.getMonth() - 1);
  //           return { startDate: start, endDate: end };
  //         case "3months":
  //           start.setMonth(start.getMonth() - 3);
  //           return { startDate: start, endDate: end };
  //         default:
  //           return { startDate: null, endDate: null };
  //       }
  //     })();

  //     // Fetch device active log and calculate statistics from it
  //     const response = await apiClient.getDeviceActiveLog({
  //       page: 1,
  //       limit: 100,
  //       startDate,
  //       endDate,
  //       zone: selectedZone,
  //     });

  //     if (response && response.success && response.data) {
  //       // Calculate statistics from device data
  //       console.log(response)
  //       const calculatedStats = calculateStatisticsFromDevices(response.summery);
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
  // };

  const handleTimeRangeChange = async (value: string) => {
    setTimeRange(value as TimeRange);

    if (onSelectedTimeChange) {
      onSelectedTimeChange(value);
    }

    setLoadingDeviceLog(true);

    try {
      const { startDate, endDate } = getDateRangeFromValue(value);

      // Prepare zone parameter
      let zoneParam: string | undefined;
      if (selectedZones.length > 0 && !(selectedZones.length === 1 && selectedZones[0] === "all")) {
        zoneParam = selectedZones.join(",");
      }

      const response = await apiClient.getDeviceActiveLog({
        page: 1,
        limit: 100,
        startDate,
        endDate,
        zone: zoneParam,
      });

      if (response?.success && response?.data) {
        console.log(response);
        const calculatedStats = calculateStatisticsFromDevices(response.summery);
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


  const updateZones = async (newZones: string[]) => {
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

    setLoadingDeviceLog(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Fetch device active log and calculate statistics from it
      const response = await apiClient.getDeviceActiveLog({
        page: 1,
        limit: 100,
        startDate,
        endDate,
        zone: zoneParam === "all" ? undefined : zoneParam,
        deviceIds: selectedDeviceIds.length > 0 ? selectedDeviceIds : undefined,
      });

      if (response && response.success && response.data) {
        // Calculate statistics from device data
        const calculatedStats = calculateStatisticsFromDevices(response.summery);
        setStatistics(calculatedStats);
        toast.success(`Device statistics updated for selected zone${newZones.length > 1 ? 's' : ''}`);
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

  const handleDeviceChange = (deviceIds: string[]) => {
    setSelectedDeviceIds(deviceIds);
    if (onDeviceSelect) {
      onDeviceSelect(deviceIds);
    }
    toast.success(`Selected ${deviceIds.length} device(s)`);
  };

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDeviceIds(prev => {
      const newIds = prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId];
      handleDeviceChange(newIds);
      return newIds;
    });
  };

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(deviceSearchTerm.toLowerCase())
  );

  const filteredZones = zones.filter(z =>
    z.name.toLowerCase().includes(zoneSearchTerm.toLowerCase())
  );

  const handleStatItemClick = (section: string, label: string, value: string | number, summaryType: string) => {
    setSelectedSummaryType(summaryType);

    // Notify parent component to refresh DeviceLogGrid with new summaryType
    if (onSummaryTypeSelect) {
      onSummaryTypeSelect(summaryType);
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

  const fetchDataWithDateRange = async (start: Date, end: Date) => {
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    if (onCustomDateRangeChange) {
      onCustomDateRangeChange(startISO, endISO);
    }

    setLoadingDeviceLog(true);

    try {
      // Prepare zone parameter
      let zoneParam: string | undefined;
      if (selectedZones.length > 0 && !(selectedZones.length === 1 && selectedZones[0] === "all")) {
        zoneParam = selectedZones.join(",");
      }

      const response = await apiClient.getDeviceActiveLog({
        page: 1,
        limit: 100,
        startDate: start,
        endDate: end,
        zone: zoneParam,
      });

      if (response?.success && response?.data) {
        const calculatedStats = calculateStatisticsFromDevices(response.summery);
        setStatistics(calculatedStats);
        toast.success("Device statistics updated with custom date range");
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

  // const handleStatItemClick = (summaryType: string) => {
  //   setSelectedSummaryType(summaryType);

  //   // Notify parent component to refresh DeviceLogGrid with new summaryType
  //   if (onSummaryTypeSelect) {
  //     onSummaryTypeSelect(summaryType);
  //   }

  //   toast.success(`Loaded devices: ${summaryType}`);
  // };

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

    // Fetch initial statistics from device log
    const fetchStatistics = async () => {
      try {
        setLoadingStats(true);
        const { startDate, endDate } = (() => {
          const end = new Date();
          const start = new Date();

          switch (selectedTime) {
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
        // Prepare zone parameter
        let zoneParam: string | undefined;
        if (selectedZones.length > 0 && !(selectedZones.length === 1 && selectedZones[0] === "all")) {
          zoneParam = selectedZones.join(",");
        }

        const response = await apiClient.getDeviceActiveLog({
          page: 1,
          limit: 100,
          zone: zoneParam,
          startDate: startDate,
          endDate: endDate,
        });

        if (response && response.success && response.data) {
          // Calculate statistics from device data
          const calculatedStats = calculateStatisticsFromDevices(response.summery);
          setStatistics(calculatedStats);
        }
      } catch (error) {
        console.error("Error fetching device active log:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchZones();
    fetchStatistics();
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
      debugger
      try {
        setLoadingTimeRanges(true);

        const response = await fetch(
          "https://localhost:7215/api/Settings/getsetting?limit=200"
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        const settings = data?.data?.data || [];

        const daySettings = settings.filter(
          (s: any) => s.settingKey === "SETTING_DAY_DDL_FILTTER"
        );

        if (daySettings.length > 0) {
          const options: TimeOption[] = daySettings.map((setting: any) => {
            const settingValue = setting.settingValue || "";

            // 🔹 Split by comma → ["DAYS=7", "TEXT=Last 7 Days"]
            const parts = settingValue.split(",");

            const parsed: Record<string, string> = {};

            parts.forEach((part: string) => {
              const [key, value] = part.split("=");
              if (key && value) {
                parsed[key.trim().toUpperCase()] = value.trim();
              }
            });

            // Determine unit dynamically (DAYS / MONTHS)
            const unit = parsed["DAYS"]
              ? "days"
              : parsed["MONTH"]
                ? "months"
                : "days";

            const amount =
              parsed["DAYS"] ||
              parsed["MONTH"] ||
              "7";

            const label =
              parsed["TEXT"] || `Last ${amount} ${unit}`;

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
  // to avoid duplicate endpoint calls. Statistics display shows default values.
  // In the future, statistics could be:
  // 1. Fetched via a dedicated statistics endpoint
  // 2. Computed from DeviceLogGrid data and passed via props
  // 3. Cached in shared state management

  useEffect(() => {
    // Statistics are initialized with default values and would be populated by:
    // - A dedicated statistics API endpoint (preferred)
    // - Props passed from DeviceLogGrid component
    // - Shared state management solution
    setLoadingStats(false);
  }, [timeRange, selectedZones]);

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
        <div className="flex gap-3 items-center">
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
                disabled={loadingZones || loadingDeviceLog}
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
                      <div className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          id="zone-all"
                          checked={selectedZones.length === 1 && selectedZones[0] === "all"}
                          onChange={() => updateZones(["all"])}
                          className="rounded"
                        />
                        <label
                          htmlFor="zone-all"
                          className="flex-1 text-sm cursor-pointer font-semibold"
                        >
                          All Zones
                        </label>
                      </div>
                      {filteredZones.map((zone) => (
                        <div key={zone.name} className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer">
                          <input
                            type="checkbox"
                            id={`zone-${zone.name}`}
                            checked={selectedZones.includes(zone.name)}
                            onChange={() => toggleZoneSelection(zone.name)}
                            disabled={selectedZones.length === 1 && selectedZones[0] === "all"}
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
                onClick={() => handleStatItemClick("Device Status", "Total Devices", `${statistics.totalDeviceCount}m`, "totalDevice")}
              />
              <StatItem
                label="Active Devices"
                value={statistics.totalActiveDeviceCount}
                color="text-green-600"
                icon={<Activity className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Device Status", "Active Devices", `${statistics.totalActiveDeviceCount}m`, "activeDevice")}
              />
              <StatItem
                label="Inactive Devices"
                value={statistics.totalInactiveDeviceCount}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("Device Status", "Inactive Devices", `${statistics.totalInactiveDeviceCount}m`, "inactiveDevice")}
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
                onClick={() => handleStatItemClick("Total Active Devices", "Active Device", `${statistics.totalActiveDeviceCount}m`, "activeDevice")}
              />
              <StatItem
                label="Normal Usage"
                value={`${statistics.normalUsage} (${usagePercentage}%)`}
                color="text-green-600"
                icon={<TrendingUp className="h-3 w-3 text-green-500" />}
                onClick={() => handleStatItemClick("Total Active Devices", "Normal Usage", `${statistics.normalUsage}m`, "normalUsage")}
              />
              <StatItem
                label="Under Usage"
                value={statistics.underUsage}
                color="text-yellow-600"
                icon={<AlertCircle className="h-3 w-3 text-yellow-500" />}
                onClick={() => handleStatItemClick("Total Active Devices", "Under Usage", `${statistics.underUsage}m`, "underUsage")}
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
                onClick={() => handleStatItemClick("Accuracy Performance", "Normal Accuracy", `${statistics.normalAccuracy}m`, "normalAccuracy")}
              />
              <StatItem
                label="Below Average Accuracy"
                value={statistics.belowAverageAccuracy}
                color="text-red-600"
                icon={<AlertCircle className="h-3 w-3 text-red-500" />}
                onClick={() => handleStatItemClick("Accuracy Performance", "Under Accuracy", `${statistics.normalAccuracy}m`, "underAccuracy")}
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
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Minimum TTFA", `${statistics.minimumTTFA}m`, "minimumTTFA")}
              />
              <StatItem
                label="Average TTFA"
                value={`${statistics.averageTTFA}m`}
                color="text-blue-600"
                icon={<Clock className="h-3 w-3 text-blue-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Average TTFA", `${statistics.averageTTFA}m`, "averageTTFA")}
              />
              <StatItem
                label="Maximum TTFA"
                value={`${statistics.maximumTTFA}m`}
                color="text-orange-600"
                icon={<Clock className="h-3 w-3 text-orange-500" />}
                onClick={() => handleStatItemClick("Time to Achieve Accuracy", "Maximum TTFA", `${statistics.maximumTTFA}m`, "maximumTTFA")}
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
