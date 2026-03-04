import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Smartphone, HardDrive, Loader2 } from "lucide-react";
import { API_BASE_PATH } from "@/lib/api";

interface Device {
  deviceName?: string;
  surveyorName?: string;
  surveyor?: string;
  name?: string;
  type?: string;
  status?: string;
}

interface ActiveDeviceListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summaryData?: any;
  selectedZone?: string;
  selectedCircle?: string;
  selectedTime?: string;
  customStartDate?: string | null;
  customEndDate?: string | null;
}

export const ActiveDeviceListModal = ({
  open,
  onOpenChange,
  summaryData,
  selectedZone = "all",
  selectedCircle = "all",
  selectedTime = "7-days",
  customStartDate,
  customEndDate,
}: ActiveDeviceListModalProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDateRangeFromValue = (value: string) => {
    if (value === "all") {
      return { startDate: null, endDate: null };
    }

    const endDate = new Date();
    const startDate = new Date();

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

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  useEffect(() => {
    if (open) {
      fetchActiveDevices();
    }
  }, [open, selectedZone, selectedCircle, selectedTime, customStartDate, customEndDate]);

  const fetchActiveDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use custom dates if available, otherwise use selectedTime
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        const dateRange = getDateRangeFromValue(selectedTime);
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      }

      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "1000");
      if (startDate) params.append("startDate", String(startDate));
      if (endDate) params.append("endDate", String(endDate));
      params.append("zone", selectedZone);
      params.append("circle", selectedCircle);

      const response = await fetch(
        `${API_BASE_PATH}/DeviceLog/getdeviceactivelog?${params.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch active devices: ${response.statusText}`);
      }

      const data = await response.json();

      // Get the summary data which contains all devices
      const summaryData = data?.data?.summary || data?.summary || {};

      // Extract all devices from various possible response formats
      let deviceList: Device[] = [];

      // Try different possible locations for the device list
      if (summaryData?.alldeviceSummary && Array.isArray(summaryData.alldeviceSummary)) {
        deviceList = summaryData.alldeviceSummary;
      } else if (summaryData?.devices && Array.isArray(summaryData.devices)) {
        deviceList = summaryData.devices;
      } else if (Array.isArray(summaryData)) {
        deviceList = summaryData;
      } else if (data?.data?.items && Array.isArray(data.data.items)) {
        // Fallback to items array if summary doesn't contain devices
        deviceList = data.data.items;
      } else if (Array.isArray(data?.data)) {
        deviceList = data.data;
      }

      setDevices(deviceList);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load active devices";
      setError(message);
      console.error("Error fetching active devices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Active Devices</DialogTitle>
          <DialogDescription>
            List of all active devices and their assigned surveyors
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading devices...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        ) : devices.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No active devices found
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {device.type === "DA2" || device.type?.includes("DA2") ? (
                      <HardDrive className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {device.deviceName || device.name || "Unknown Device"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.type || "Device"}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-medium text-sm">
                    {device.surveyorName || device.surveyor || "-"}
                  </p>
                  {device.status && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {device.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Total devices: {devices.length}
        </div>
      </DialogContent>
    </Dialog>
  );
};
