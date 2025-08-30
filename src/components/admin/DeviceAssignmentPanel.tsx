import { useState } from "react";
import { Plus, Calendar, User, AlertTriangle, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DeviceAssignment, Survey } from "@/types/admin";
import { Device } from "../../types/valve";

const mockDevices: Device[] = [
  {
    id: "TRIMBLE_001",
    name: "Trimble SPS986 - Unit 1",
    type: "TRIMBLE_SPS986",
    status: "ACTIVE",
    coordinates: { lat: 19.076, lng: 72.8777 },
    batteryLevel: 85,
  },
  {
    id: "TRIMBLE_002", 
    name: "Trimble SPS986 - Unit 2",
    type: "TRIMBLE_SPS986",
    status: "ACTIVE",
    coordinates: { lat: 19.08, lng: 72.881 },
    batteryLevel: 92,
  },
  {
    id: "TRIMBLE_003",
    name: "Trimble SPS986 - Unit 3", 
    type: "SURVEY_EQUIPMENT",
    status: "MAINTENANCE",
    coordinates: { lat: 19.075, lng: 72.879 },
    batteryLevel: 45,
  },
];

const mockSurveys: Survey[] = [
  {
    id: "SUR_001",
    name: "Mumbai Gas Main Line Survey",
    categoryId: "CAT_001",
    startDate: "2024-01-15",
    endDate: "2024-03-15", 
    status: "ACTIVE",
    createdBy: "Admin User",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "SUR_002",
    name: "Fiber Network Expansion",
    categoryId: "CAT_002",
    startDate: "2024-02-01",
    endDate: "2024-04-01",
    status: "ACTIVE", 
    createdBy: "Admin User",
    createdAt: "2024-01-25T09:30:00Z",
    updatedAt: "2024-01-25T09:30:00Z",
  },
];

const mockAssignments: DeviceAssignment[] = [
  {
    id: "ASSIGN_001",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 - Unit 1",
    surveyId: "SUR_001",
    surveyName: "Mumbai Gas Main Line Survey",
    fromDate: "2024-01-15",
    toDate: "2024-03-15",
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ASSIGN_002",
    deviceId: "TRIMBLE_002", 
    deviceName: "Trimble SPS986 - Unit 2",
    surveyId: "SUR_002",
    surveyName: "Fiber Network Expansion",
    fromDate: "2024-02-01",
    toDate: "2024-04-01",
    isActive: true,
    createdAt: "2024-02-01T09:30:00Z",
  },
];

export default function DeviceAssignmentPanel() {
  const [assignments, setAssignments] = useState<DeviceAssignment[]>(mockAssignments);
  const [devices] = useState<Device[]>(mockDevices);
  const [surveys] = useState<Survey[]>(mockSurveys);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: "",
    surveyId: "",
    fromDate: "",
    toDate: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = 
      assignment.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.surveyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && assignment.isActive) ||
      (statusFilter === "INACTIVE" && !assignment.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getAvailableDevices = () => {
    const assignedDeviceIds = assignments
      .filter(a => a.isActive)
      .map(a => a.deviceId);
    return devices.filter(d => d.status === "ACTIVE" && !assignedDeviceIds.includes(d.id));
  };

  const getActiveSurveys = () => {
    return surveys.filter(s => s.status === "ACTIVE");
  };

  const checkDateConflict = (deviceId: string, fromDate: string, toDate: string) => {
    return assignments.some(assignment => 
      assignment.deviceId === deviceId &&
      assignment.isActive &&
      (
        (fromDate >= assignment.fromDate && fromDate <= assignment.toDate) ||
        (toDate >= assignment.fromDate && toDate <= assignment.toDate) ||
        (fromDate <= assignment.fromDate && toDate >= assignment.toDate)
      )
    );
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.deviceId) {
      newErrors.deviceId = "Device selection is required";
    }
    
    if (!formData.surveyId) {
      newErrors.surveyId = "Survey selection is required";
    }
    
    if (!formData.fromDate) {
      newErrors.fromDate = "From date is required";
    }
    
    if (!formData.toDate) {
      newErrors.toDate = "To date is required";
    }
    
    if (formData.fromDate && formData.toDate && formData.fromDate > formData.toDate) {
      newErrors.toDate = "To date must be after from date";
    }

    if (formData.deviceId && formData.fromDate && formData.toDate && 
        checkDateConflict(formData.deviceId, formData.fromDate, formData.toDate)) {
      newErrors.deviceId = "Device is already assigned during this time period";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const device = devices.find(d => d.id === formData.deviceId);
    const survey = surveys.find(s => s.id === formData.surveyId);

    const newAssignment: DeviceAssignment = {
      id: `ASSIGN_${Date.now()}`,
      deviceId: formData.deviceId,
      deviceName: device?.name || "",
      surveyId: formData.surveyId,
      surveyName: survey?.name || "",
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setAssignments([...assignments, newAssignment]);
    resetForm();
  };

  const handleRevoke = (id: string) => {
    if (confirm("Are you sure you want to revoke this device assignment?")) {
      setAssignments(assignments.map(assignment => 
        assignment.id === id 
          ? { ...assignment, isActive: false, toDate: new Date().toISOString().split('T')[0] }
          : assignment
      ));
    }
  };

  const handleExtend = (id: string) => {
    const newToDate = prompt("Enter new end date (YYYY-MM-DD):");
    if (newToDate) {
      setAssignments(assignments.map(assignment => 
        assignment.id === id 
          ? { ...assignment, toDate: newToDate }
          : assignment
      ));
    }
  };

  const resetForm = () => {
    setFormData({
      deviceId: "",
      surveyId: "",
      fromDate: "",
      toDate: "",
    });
    setIsDialogOpen(false);
    setErrors({});
  };

  const getStatusBadge = (assignment: DeviceAssignment) => {
    const now = new Date();
    const endDate = new Date(assignment.toDate);
    
    if (!assignment.isActive) {
      return <Badge variant="secondary">Revoked</Badge>;
    } else if (endDate < now) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      return <Badge className="bg-success text-success-foreground">Active</Badge>;
    }
  };

  const getDaysRemaining = (toDate: string) => {
    const now = new Date();
    const end = new Date(toDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Device Assignment Panel</CardTitle>
            <CardDescription>
              Assign Trimble devices to surveys and track usage history
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Assign Device
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Device to Survey</DialogTitle>
                <DialogDescription>
                  Select a device and survey, then define the assignment period. 
                  Devices cannot be double-assigned during the same time window.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="device">Device *</Label>
                  <Select 
                    value={formData.deviceId} 
                    onValueChange={(value) => setFormData({ ...formData, deviceId: value })}
                  >
                    <SelectTrigger className={errors.deviceId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select available device" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDevices().map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{device.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {device.batteryLevel}%
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.deviceId && (
                    <p className="text-sm text-destructive">{errors.deviceId}</p>
                  )}
                  {getAvailableDevices().length === 0 && (
                    <p className="text-sm text-warning">No available devices for assignment</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="survey">Survey *</Label>
                  <Select 
                    value={formData.surveyId} 
                    onValueChange={(value) => setFormData({ ...formData, surveyId: value })}
                  >
                    <SelectTrigger className={errors.surveyId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select active survey" />
                    </SelectTrigger>
                    <SelectContent>
                      {getActiveSurveys().map((survey) => (
                        <SelectItem key={survey.id} value={survey.id}>
                          {survey.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.surveyId && (
                    <p className="text-sm text-destructive">{errors.surveyId}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date *</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      className={errors.fromDate ? "border-destructive" : ""}
                    />
                    {errors.fromDate && (
                      <p className="text-sm text-destructive">{errors.fromDate}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date *</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={formData.toDate}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      className={errors.toDate ? "border-destructive" : ""}
                    />
                    {errors.toDate && (
                      <p className="text-sm text-destructive">{errors.toDate}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  Assign Device
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active Only</SelectItem>
              <SelectItem value="INACTIVE">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Available Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {getAvailableDevices().length}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for assignment
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.filter(a => a.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently deployed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devices.length}
              </div>
              <p className="text-xs text-muted-foreground">
                In device inventory
              </p>
            </CardContent>
          </Card>
        </div>

        {filteredAssignments.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm || statusFilter !== "ALL" 
                ? "No assignments found matching your filters." 
                : "No device assignments found. Create your first assignment to get started."
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Assigned Survey</TableHead>
                  <TableHead>Assignment Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {assignment.deviceName}
                        <Badge variant="outline" className="text-xs">
                          {assignment.deviceId}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{assignment.surveyName}</div>
                        <Badge variant="secondary" className="text-xs">
                          {assignment.surveyId}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.fromDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {new Date(assignment.toDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment)}
                    </TableCell>
                    <TableCell>
                      {assignment.isActive && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">
                            {getDaysRemaining(assignment.toDate)} days
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {assignment.isActive && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExtend(assignment.id)}
                            className="gap-1"
                          >
                            Extend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(assignment.id)}
                            className="gap-1 text-warning hover:text-warning"
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </span>
          <span>
            Admin Only Access
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
