import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileText, BarChart3, Clock, TrendingDown, Loader2 } from "lucide-react";
import { apiClient, API_BASE_PATH } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import type { Device } from "@/lib/api";

const REPORT_FORMATS = [
  { value: "excel", label: "Excel" },
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
];

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const SurveyReports = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportType, setReportType] = useState("");
  const [reportFormat, setReportFormat] = useState("excel");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [isGeneratingDeviceReport, setIsGeneratingDeviceReport] = useState(false);

  // Fetch devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      setDevicesLoading(true);
      setDevicesError(null);
      try {
        const response = await apiClient.getDevices({ page: 1, limit: 10 });
        if (response.success && response.data) {
          setDevices(response.data);
        } else {
          setDevicesError("Failed to load devices");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load devices";
        setDevicesError(errorMessage);
        console.error("Error fetching devices:", error);
      } finally {
        setDevicesLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Mock data for recent reports
  const recentReports = [
    {
      id: 1,
      name: "Monthly Usage Report - January 2024",
      type: "Usage Report",
      dateRange: "Jan 1 - Jan 31, 2024",
      generatedAt: "2024-02-01 09:00",
      format: "PDF",
      size: "2.4 MB"
    },
    {
      id: 2,
      name: "Inventory Report - Q4 2023",
      type: "Inventory Report",
      dateRange: "Oct 1 - Dec 31, 2023",
      generatedAt: "2024-01-15 14:30",
      format: "CSV",
      size: "856 KB"
    },
    {
      id: 3,
      name: "Downtime Analysis - December 2023",
      type: "Downtime Report",
      dateRange: "Dec 1 - Dec 31, 2023",
      generatedAt: "2024-01-05 11:15",
      format: "PDF",
      size: "3.1 MB"
    },
  ];

  const reportTypes = [
    {
      id: "inventory",
      name: "Inventory Report",
      description: "Complete instrument inventory with status and locations",
      icon: <BarChart3 className="w-5 h-5" />,
      formats: ["PDF", "CSV", "Excel"]
    },
    {
      id: "usage-daily",
      name: "Daily Usage Report",
      description: "Daily instrument usage statistics and patterns",
      icon: <Calendar className="w-5 h-5" />,
      formats: ["PDF", "CSV"]
    },
    {
      id: "usage-monthly",
      name: "Monthly Usage Report",
      description: "Monthly usage summary with trends and insights",
      icon: <BarChart3 className="w-5 h-5" />,
      formats: ["PDF", "Excel"]
    },
    // {
    //   id: "downtime",
    //   name: "Downtime Report",
    //   description: "Analysis of instrument downtime and maintenance needs",
    //   icon: <TrendingDown className="w-5 h-5" />,
    //   formats: ["PDF", "CSV"]
    // },
  ];

  const handleGenerateDeviceReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select a date range to generate the report",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDeviceReport(true);
    try {
      // Build the request payload for device report
      const payload = {
        startDate,
        endDate,
        deviceId: selectedDevice === "all" ? null : selectedDevice,
        format: reportFormat,
      };

      // Call the device report generation API endpoint
      const url = `${API_BASE_PATH}/DeviceLog/generatereports`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Generate filename with current timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, -5);
     
      link.download =reportFormat == "excel" ? `DeviceReport_${timestamp}.xlsx` : reportFormat == "pdf" ? `DeviceReport_${timestamp}.pdf` : `DeviceReport_${timestamp}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Success",
        description: "Device report downloaded successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate report";
      console.error("Error generating device report:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDeviceReport(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportType || !startDate || !endDate) {
      alert("Please select report type and date range");
      return;
    }

    try {
      // Build the request payload
      const payload = {
        reportType,
        startDate,
        endDate,
        deviceId: selectedDevice === "all" ? null : selectedDevice,
        format: reportFormat,
      };

      // Call the report generation API endpoint
      const url = `${API_BASE_PATH}/DeviceLog/generatereports`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Report generation response:", data);
      alert("Report generation started. You'll be notified when it's ready.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate report";
      console.error("Error generating report:", error);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDownloadReport = (reportId: number) => {
    // In real implementation, this would download the report file
    console.log("Downloading report:", reportId);
  };

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case "Inventory Report":
        return <Badge variant="secondary" className="text-blue-700 bg-blue-100">Inventory</Badge>;
      case "Usage Report":
        return <Badge variant="secondary" className="text-green-700 bg-green-100">Usage</Badge>;
      case "Downtime Report":
        return <Badge variant="secondary" className="text-red-700 bg-red-100">Downtime</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and download instrument reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Generate New Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range Selector */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Device Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Device</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice} disabled={devicesLoading}>
                <SelectTrigger>
                  {devicesLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading devices...
                    </span>
                  ) : (
                    <SelectValue placeholder="Select a device" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span>All Devices</span>
                  </SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      <span>{device.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {devicesError && (
                <p className="text-sm text-red-600">{devicesError}</p>
              )}
            </div>

            {/* Report Type Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center space-x-2">
                        {type.icon}
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {reportType && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {reportTypes.find(t => t.id === reportType)?.description}
                  </p>
                </div>
              )}
            </div>

            {/* Report Format Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Report Format</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <span>{format.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGenerateDeviceReport}
                className="w-full"
                disabled={isGeneratingDeviceReport}
              >
                {isGeneratingDeviceReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Device Report
                  </>
                )}
              </Button>
              {/* <Button
                onClick={handleGenerateReport}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Analysis Report
              </Button> */}
            </div>
          </CardContent>
        </Card>

        {/* Report Types Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Available Report Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportTypes.map((type) => (
                <div key={type.id} className="p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">{type.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-muted-foreground">Available formats:</span>
                        {type.formats.map((format) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Reports
            <Badge variant="outline">{recentReports.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      {getReportTypeBadge(report.type)}
                      <span className="text-sm text-muted-foreground">{report.dateRange}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{report.generatedAt}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {report.format}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{report.size}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report.id)}>
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Quick Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reports Generated</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Popular</p>
                <p className="text-sm font-bold">Usage Reports</p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">124 MB</p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
};
