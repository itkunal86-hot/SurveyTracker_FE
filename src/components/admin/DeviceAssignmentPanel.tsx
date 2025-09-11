import { useState } from "react";
import { Plus, Calendar, User, AlertTriangle, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DeviceAssignment, Survey } from "@/types/admin";
import type { Device } from "@/lib/api";
import { useDevices, useDeviceAssignments, useCreateDeviceAssignment, useUpdateDeviceAssignment, useSurveyMasters, useDeleteDeviceAssignment } from "@/hooks/useApiQueries";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function DeviceAssignmentPanel() {
  const { data: assignmentsResp } = useDeviceAssignments({ limit: 1000 });
  const { data: devicesResp } = useDevices({ limit: 1000 });
  const { data: surveyMastersResp } = useSurveyMasters({ limit: 1000 });

  const assignments: DeviceAssignment[] = Array.isArray(assignmentsResp?.data)
    ? (assignmentsResp!.data as DeviceAssignment[])
    : [];

  const devicesData = (devicesResp as any)?.data;
  const devices: Device[] = Array.isArray(devicesData)
    ? (devicesData as Device[])
    : Array.isArray((devicesResp as any)?.data?.data)
      ? ((devicesResp as any).data.data as Device[])
      : Array.isArray(devicesResp as any)
        ? ((devicesResp as unknown) as Device[])
        : [];

  const surveys: Survey[] = Array.isArray(surveyMastersResp?.data)
    ? (surveyMastersResp!.data as Survey[])
    : [];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    deviceId: "",
    surveyId: "",
    fromDate: "",
    toDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const createAssignment = useCreateDeviceAssignment();
  const updateAssignment = useUpdateDeviceAssignment();
  const { toast } = useToast();

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
    const safeAssignments = Array.isArray(assignments) ? assignments : [];
    const assignedDeviceIds = safeAssignments
      .filter((a) => a.isActive)
      .map((a) => a.deviceId);
    const safeDevices = Array.isArray(devices) ? devices : [];
    return safeDevices.filter((d: any) => d && String(d.id) && !assignedDeviceIds.includes(String(d.id)));
  };

  const getActiveSurveys = () => {
    const safeSurveys = Array.isArray(surveys) ? surveys : [];
    return safeSurveys.filter((s) => s.status === "ACTIVE");
  };

  const checkDateConflict = async (deviceId: string, fromDate: string, toDate: string) => {
    try {
      const res = await apiClient.getAssignmentConflicts({ deviceId, startDate: fromDate, endDate: toDate });
      return Array.isArray(res.data) && res.data.length > 0;
    } catch {
      return false;
    }
  };

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.deviceId) newErrors.deviceId = "Device selection is required";
    if (!formData.surveyId) newErrors.surveyId = "Survey selection is required";
    if (!formData.fromDate) newErrors.fromDate = "From date is required";
    if (!formData.toDate) newErrors.toDate = "To date is required";
    if (formData.fromDate && formData.toDate && formData.fromDate > formData.toDate) {
      newErrors.toDate = "To date must be after from date";
    }
    if (formData.deviceId && formData.fromDate && formData.toDate) {
      const hasConflict = await checkDateConflict(formData.deviceId, formData.fromDate, formData.toDate);
      if (hasConflict) newErrors.deviceId = "Device is already assigned during this time period";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      await createAssignment.mutateAsync({
        deviceId: formData.deviceId,
        surveyId: formData.surveyId,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        assignedBy: "Admin",
        notes: formData.notes || undefined,
      });
      toast({ title: "Device assigned" });
      resetForm();
    } catch (error) {
      setErrors({ deviceId: (error as Error).message || "Failed to create assignment" });
    }
  };

  const handleRevoke = (id: string) => {
    if (confirm("Are you sure you want to revoke this device assignment?")) {
      const nowIso = new Date().toISOString();
      updateAssignment.mutateAsync({ id, payload: { status: "COMPLETED", unassignedDate: nowIso, toDate: nowIso } }).then(() => {
        toast({ title: "Assignment revoked" });
      });
    }
  };

  const handleExtend = (id: string) => {
    const newToDate = prompt("Enter new end date (YYYY-MM-DD):");
    if (newToDate) {
      const iso = /T/.test(newToDate) ? newToDate : `${newToDate}T00:00:00Z`;
      updateAssignment.mutateAsync({ id, payload: { toDate: iso } }).then(() => {
        toast({ title: "Assignment extended" });
      });
    }
  };

  const resetForm = () => {
    setFormData({
      deviceId: "",
      surveyId: "",
      fromDate: "",
      toDate: "",
      notes: "",
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
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
