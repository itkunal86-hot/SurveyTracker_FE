import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Database, Users, Activity, FileText, History, ArrowLeft, Map, UserPlus } from "lucide-react";
import SurveyCategoriesManagement from "./SurveyCategoriesManagement";
import SurveyManagement from "./SurveyManagement";
import DeviceAssignmentPanel from "./DeviceAssignmentPanel";
import SurveyAttributesMaster from "./SurveyAttributesMaster";
import SurveyHistoryLog from "./SurveyHistoryLog";
import AssetTypeManagement from "./AssetTypeManagement";
import UserManagement from "./UserManagement";

interface AdminStats {
  totalCategories: number;
  totalSurveys: number;
  activeSurveys: number;
  totalDevices: number;
  assignedDevices: number;
  totalAttributes: number;
}

const mockStats: AdminStats = {
  totalCategories: 4,
  totalSurveys: 12,
  activeSurveys: 8,
  totalDevices: 6,
  assignedDevices: 4,
  totalAttributes: 15,
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Survey Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage survey categories, surveys, devices, and attributes
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Admin Panel
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="surveys" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Surveys
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="attributes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Attributes
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Survey Categories</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalCategories}</div>
                <p className="text-xs text-muted-foreground">
                  Active categories configured
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalSurveys}</div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.activeSurveys} active, {mockStats.totalSurveys - mockStats.activeSurveys} closed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Device Assignments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.assignedDevices}/{mockStats.totalDevices}</div>
                <p className="text-xs text-muted-foreground">
                  Devices currently assigned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
                <Activity className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{mockStats.activeSurveys}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running surveys
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Survey Attributes</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalAttributes}</div>
                <p className="text-xs text-muted-foreground">
                  Configured attribute fields
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">Operational</div>
                <p className="text-xs text-muted-foreground">
                  All systems running normally
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks for survey management
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <div
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate("/")}
              >
                <Map className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Survey Dashboard</h3>
                <p className="text-sm text-muted-foreground">Go to main survey interface</p>
              </div>

              <div
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveTab("users")}
              >
                <UserPlus className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-muted-foreground">Create managers & survey managers</p>
              </div>

              <div
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveTab("categories")}
              >
                <Database className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Add Category</h3>
                <p className="text-sm text-muted-foreground">Create new survey category</p>
              </div>

              <div
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveTab("surveys")}
              >
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">New Survey</h3>
                <p className="text-sm text-muted-foreground">Create and configure survey</p>
              </div>

              <div
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveTab("devices")}
              >
                <Users className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Assign Device</h3>
                <p className="text-sm text-muted-foreground">Assign Trimble device to survey</p>
              </div>

              <div
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setActiveTab("history")}
              >
                <History className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">View History</h3>
                <p className="text-sm text-muted-foreground">Check device usage logs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="categories">
          <SurveyCategoriesManagement />
        </TabsContent>

        <TabsContent value="surveys">
          <SurveyManagement />
        </TabsContent>

        <TabsContent value="devices">
          <DeviceAssignmentPanel />
        </TabsContent>

        <TabsContent value="assets">
          <AssetTypeManagement />
        </TabsContent>

        <TabsContent value="attributes">
          <SurveyAttributesMaster />
        </TabsContent>

        <TabsContent value="history">
          <SurveyHistoryLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
