import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DownloadIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// Sample data - replace with real data from your API
const surveyActivityData = [
  { hour: "00:00", surveys: 12 },
  { hour: "02:00", surveys: 8 },
  { hour: "04:00", surveys: 15 },
  { hour: "06:00", surveys: 32 },
  { hour: "08:00", surveys: 68 },
  { hour: "10:00", surveys: 84 },
  { hour: "12:00", surveys: 76 },
  { hour: "14:00", surveys: 92 },
  { hour: "16:00", surveys: 85 },
  { hour: "18:00", surveys: 45 },
  { hour: "20:00", surveys: 28 },
  { hour: "22:00", surveys: 18 },
];

const deviceUtilizationData = [
  { device: "Trimble-001", surveys: 156, percentage: 32 },
  { device: "Trimble-002", surveys: 124, percentage: 25 },
  { device: "Trimble-003", surveys: 98, percentage: 20 },
  { device: "Trimble-004", surveys: 87, percentage: 18 },
  { device: "Idle/Others", surveys: 25, percentage: 5 },
];

const pipelineDiameterData = [
  { diameter: "200mm", length: 1250, count: 45 },
  { diameter: "250mm", length: 2100, count: 78 },
  { diameter: "300mm", length: 1800, count: 62 },
  { diameter: "400mm", length: 950, count: 28 },
  { diameter: "500mm", length: 650, count: 18 },
];

const valveStatusData = [
  { status: "Open", count: 145, color: "#22c55e" },
  { status: "Closed", count: 89, color: "#ef4444" },
  { status: "Maintenance", count: 12, color: "#f59e0b" },
  { status: "Unknown", count: 8, color: "#6b7280" },
];

const catastropheTimelineData = [
  { month: "Jan", events: 3 },
  { month: "Feb", events: 1 },
  { month: "Mar", events: 5 },
  { month: "Apr", events: 2 },
  { month: "May", events: 4 },
  { month: "Jun", events: 6 },
];

const topSurveyorsData = [
  { surveyor: "John Smith", points: 245 },
  { surveyor: "Sarah Johnson", points: 218 },
  { surveyor: "Mike Wilson", points: 192 },
  { surveyor: "Emma Davis", points: 167 },
  { surveyor: "Tom Anderson", points: 143 },
];

const recentValveOperations = [
  {
    id: "V001",
    location: "Pipeline Sector A-12",
    action: "Open",
    operator: "John Smith",
    timestamp: "2024-01-15 14:30:22",
    reason: "Routine Maintenance",
    status: "completed",
  },
  {
    id: "V024",
    location: "Pipeline Sector B-05",
    action: "Close",
    operator: "Sarah Johnson",
    timestamp: "2024-01-15 13:45:18",
    reason: "Emergency Response",
    status: "completed",
  },
  {
    id: "V007",
    location: "Pipeline Sector C-18",
    action: "Close",
    operator: "Mike Wilson",
    timestamp: "2024-01-15 12:20:45",
    reason: "Pressure Anomaly",
    status: "in_progress",
  },
  {
    id: "V013",
    location: "Pipeline Sector A-08",
    action: "Open",
    operator: "Emma Davis",
    timestamp: "2024-01-15 11:15:30",
    reason: "Post-Inspection",
    status: "completed",
  },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export const ReportsDashboard = () => {
  const [timeRange, setTimeRange] = useState("today");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your gas pipeline survey operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Daily Snapshots
            </CardTitle>
            <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Devices
            </CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4/5</div>
            <p className="text-xs text-muted-foreground">1 device offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Valves</CardTitle>
            <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">254</div>
            <p className="text-xs text-muted-foreground">12 need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Area</CardTitle>
            <div className="h-4 w-4 bg-purple-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">of planned surveys</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Survey Activity Chart */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Daily Survey Activity</CardTitle>
                <CardDescription>
                  Number of survey points captured throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={surveyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="surveys"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Device Utilization</CardTitle>
                <CardDescription>
                  Survey points captured by each Trimble device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceUtilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device, percentage }) =>
                        `${device}: ${percentage}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="surveys"
                    >
                      {deviceUtilizationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Valve Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Valve Status Summary</CardTitle>
                <CardDescription>
                  Current operational state of all valves
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={valveStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {valveStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Surveyors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Surveyors</CardTitle>
                <CardDescription>
                  Most productive surveyors by data points captured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSurveyorsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="surveyor" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="points" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Catastrophe Events Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Catastrophe Events Timeline</CardTitle>
                <CardDescription>
                  Pipeline issues reported over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={catastropheTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="events"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Valve Operations */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Valve Operations</CardTitle>
                <CardDescription>
                  Latest valve operations with operator details and timestamps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentValveOperations.map((operation) => (
                    <div
                      key={operation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(operation.status)}
                        <div>
                          <div className="font-medium">
                            Valve {operation.id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {operation.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge
                          variant={
                            operation.action === "Open"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {operation.action}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {operation.operator}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {operation.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Diameter Distribution */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Pipeline Diameter Distribution</CardTitle>
                <CardDescription>
                  Distribution of pipe sizes across the surveyed network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineDiameterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="diameter" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="length"
                      fill="#8884d8"
                      name="Total Length (m)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="count"
                      fill="#82ca9d"
                      name="Number of Segments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
