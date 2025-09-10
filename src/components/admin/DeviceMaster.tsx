import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Search, Smartphone, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient, type Device } from "@/lib/api";

export default function DeviceMaster() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [typeFilter, setTypeFilter] = useState<string | "">("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "SURVEY_EQUIPMENT" as Device["type"],
    status: "ACTIVE" as Device["status"],
    lat: "",
    lng: "",
    surveyor: "",
    batteryLevel: "" as string | number,
    accuracy: "" as string | number,
  });
  const [errors, setErrors] = useState<{ name?: string; lat?: string; lng?: string }>({});

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getDevices({ limit: 200 });
      setDevices(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    const loadConfig = async () => {
      try {
        const [typesRes, statusRes] = await Promise.all([
          apiClient.getDeviceTypes(),
          apiClient.getStatusOptions("device"),
        ]);
        const types = Array.isArray(typesRes?.data) ? typesRes.data.map((t: any) => String(t.value ?? t.name ?? t).toUpperCase()) : [];
        const statuses = Array.isArray(statusRes?.data) ? statusRes.data.map((s: any) => String(s.value ?? s.name ?? s).toUpperCase()) : ["ACTIVE","INACTIVE","MAINTENANCE","ERROR"];
        setDeviceTypes(types.length ? types : ["TRIMBLE_SPS986","MONITORING_STATION","SURVEY_EQUIPMENT"]);
        setStatusOptions(statuses.length ? statuses : ["ACTIVE","INACTIVE","MAINTENANCE","ERROR"]);
      } catch {
        setDeviceTypes(["TRIMBLE_SPS986","MONITORING_STATION","SURVEY_EQUIPMENT"]);
        setStatusOptions(["ACTIVE","INACTIVE","MAINTENANCE","ERROR"]);
      }
    };
    loadConfig();
  }, []);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return devices.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(t) || d.id.toLowerCase().includes(t) || (d.surveyor || "").toLowerCase().includes(t);
      const matchesStatus = !statusFilter || d.status === statusFilter;
      const matchesType = !typeFilter || d.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [devices, searchTerm, statusFilter, typeFilter]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", type: "SURVEY_EQUIPMENT", status: "ACTIVE", lat: "", lng: "", surveyor: "", batteryLevel: "", accuracy: "" });
    setErrors({});
    setIsDialogOpen(false);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.lat !== "" && isNaN(Number(form.lat))) e.lat = "Latitude must be a number";
    if (form.lng !== "" && isNaN(Number(form.lng))) e.lng = "Longitude must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    const payload: Omit<Device, "id" | "lastSeen"> = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      coordinates: {
        lat: form.lat === "" ? 0 : Number(form.lat),
        lng: form.lng === "" ? 0 : Number(form.lng),
      },
      surveyor: form.surveyor || undefined,
      batteryLevel: form.batteryLevel === "" ? undefined : Number(form.batteryLevel),
      accuracy: form.accuracy === "" ? undefined : Number(form.accuracy),
    };

    if (editing) {
      await apiClient.updateDevice(editing.id, payload);
    } else {
      await apiClient.createDevice(payload);
    }
    await loadDevices();
    resetForm();
  };

  const onEdit = (item: Device) => {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type,
      status: item.status,
      lat: String(item.coordinates?.lat ?? ""),
      lng: String(item.coordinates?.lng ?? ""),
      surveyor: item.surveyor || "",
      batteryLevel: item.batteryLevel == null ? "" : String(item.batteryLevel),
      accuracy: item.accuracy == null ? "" : String(item.accuracy),
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: Device["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-warning text-warning-foreground">Maintenance</Badge>;
      case "ERROR":
        return <Badge className="bg-destructive text-destructive-foreground">Error</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Device Master</CardTitle>
            <CardDescription>Manage master records of Trimble and related devices</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadDevices} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); setIsDialogOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Device" : "Add Device"}</DialogTitle>
                  <DialogDescription>
                    {editing ? "Update device details" : "Create a new device entry for assignment and tracking"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Device["type"] })}>
                        <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {deviceTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Device["status"] })}>
                        <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input id="lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className={errors.lat ? "border-destructive" : ""} />
                      {errors.lat && <p className="text-sm text-destructive">{errors.lat}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input id="lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className={errors.lng ? "border-destructive" : ""} />
                      {errors.lng && <p className="text-sm text-destructive">{errors.lng}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="surveyor">Surveyor</Label>
                      <Input id="surveyor" value={form.surveyor} onChange={(e) => setForm({ ...form, surveyor: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="battery">Battery %</Label>
                      <Input id="battery" value={form.batteryLevel} onChange={(e) => setForm({ ...form, batteryLevel: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accuracy">Accuracy (m)</Label>
                      <Input id="accuracy" value={form.accuracy} onChange={(e) => setForm({ ...form, accuracy: e.target.value })} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button onClick={onSubmit}>{editing ? "Update" : "Create"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search devices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {deviceTypes.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statusOptions.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <Alert><AlertDescription>Loading devices…</AlertDescription></Alert>
        ) : filtered.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm || statusFilter || typeFilter ? "No devices match your filters." : "No devices found. Add a device to get started."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Surveyor</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {d.name}
                        <Badge variant="secondary" className="text-xs">{d.id}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{d.type}</TableCell>
                    <TableCell>{getStatusBadge(d.status)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {typeof d.coordinates?.lat === "number" && typeof d.coordinates?.lng === "number" ? (
                        <span>{d.coordinates.lat.toFixed(4)}, {d.coordinates.lng.toFixed(4)}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </TableCell>
                    <TableCell>{d.surveyor || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{d.batteryLevel != null ? `${d.batteryLevel}%` : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{d.lastSeen ? new Date(d.lastSeen).toLocaleString() : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(d)} className="gap-1"><Pencil className="h-3 w-3" />Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filtered.length} of {devices.length} devices</span>
          <span>Admin Only Access</span>
        </div>
      </CardContent>
    </Card>
  );
}
