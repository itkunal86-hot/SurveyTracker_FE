import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Search, Settings, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, type Setting } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SettingsMaster() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    timePeriod: "",
    textValue: "",
    numberValue: "",
    startValue: "",
    endValue: "",
  });
  const [errors, setErrors] = useState<{
    timePeriod?: string;
    textValue?: string;
    numberValue?: string;
    startValue?: string;
    endValue?: string;
  }>({});

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSettings({ limit: 200 });
      setSettings(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return settings.filter(s => {
      const matchesSearch = s.settingKey.toLowerCase().includes(t) || 
                           s.settingValue.toLowerCase().includes(t);
      return matchesSearch;
    });
  }, [settings, searchTerm]);

  const resetForm = () => {
    setEditing(null);
    setForm({ timePeriod: "", textValue: "", numberValue: "", startValue: "", endValue: "" });
    setErrors({});
    setIsDialogOpen(false);
  };

  const handleRefresh = async () => {
    setSearchTerm("");
    await loadSettings();
  };

  const isDeviceType = () => {
    return form.timePeriod === "DEVICE_USAGE" || form.timePeriod === "DEVICE_ACCURACY";
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.timePeriod.trim()) e.timePeriod = "Selection is required";

    if (isDeviceType()) {
      if (!form.startValue.trim()) e.startValue = "Start Value is required";
      if (!form.endValue.trim()) e.endValue = "End Value is required";
      if (!form.textValue.trim()) e.textValue = "Text Value is required";
    } else {
      if (!form.numberValue.trim()) e.numberValue = "Number Value is required";
      if (!form.textValue.trim()) e.textValue = "Text Value is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    const settingKey = form.timePeriod.trim();
    let settingValue = "";

    if (isDeviceType()) {
      settingValue = `${form.timePeriod}=${form.startValue.trim()}-${form.endValue.trim()},TEXT=${form.textValue.trim()}`;
    } else {
      settingValue = `${form.timePeriod}=${form.numberValue.trim()},TEXT=${form.textValue.trim()}`;
    }

    const payload = {
      settingKey,
      settingValue,
    };

    let response;

    try {
      if (editing) {
        response = await apiClient.updateSetting(editing.id, payload);
      } else {
        response = await apiClient.createSetting(payload);
      }

      if (response.success) {
        await loadSettings();
        toast({
          title: response.message || (editing ? "Setting updated successfully" : "Setting created successfully"),
        });
        resetForm();
      } else {
        toast({
          title: response.message || (editing ? "Failed to update setting" : "Failed to create setting"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: error?.message || (editing ? "Failed to update setting" : "Failed to create setting"),
        variant: "destructive",
      });
    }
  };

  const onEdit = (item: Setting) => {
    // Parse the settingValue: "MONTH=3,TEXT=Last 3 months"
    const parts = item.settingValue.split(",");
    const timePeriodPart = parts[0]?.split("=")[1] || "";
    const textPart = parts[1]?.split("=").slice(1).join("=") || "";

    setEditing(item);
    setForm({
      timePeriod: item.settingKey,
      numberValue: timePeriodPart,
      textValue: textPart,
    });
    setIsDialogOpen(true);
  };

  const onDelete = async (settingKey: any) => {
    if (!confirm(`Are you sure you want to delete this setting?`)) return;

    try {
      const response = await apiClient.deleteSetting(settingKey);
      if (response.success) {
        await loadSettings();
        toast({
          title: "Setting deleted successfully",
        });
      } else {
        toast({
          title: response.message || "Failed to delete setting",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: error?.message || "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</CardTitle>
            <CardDescription>Manage application settings and configuration values</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); setIsDialogOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Setting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Setting" : "Add Setting"}</DialogTitle>
                  <DialogDescription>
                    {editing ? "Update setting configuration" : "Create a new setting entry"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="timePeriod">Time Period *</Label>
                    <Select
                      value={form.timePeriod}
                      onValueChange={(value) => setForm({ ...form, timePeriod: value })}
                      disabled={editing !== null}
                    >
                      <SelectTrigger className={errors.timePeriod ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTH">MONTH</SelectItem>
                        <SelectItem value="DAYS">DAYS</SelectItem>
                        <SelectItem value="HOURS">HOURS</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.timePeriod && <p className="text-sm text-destructive">{errors.timePeriod}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberValue">Number Value *</Label>
                    <Input
                      id="numberValue"
                      type="number"
                      value={form.numberValue}
                      onChange={(e) => setForm({ ...form, numberValue: e.target.value })}
                      placeholder="e.g., 3, 7, 2"
                      className={errors.numberValue ? "border-destructive" : ""}
                    />
                    {errors.numberValue && <p className="text-sm text-destructive">{errors.numberValue}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textValue">Text Value *</Label>
                    <Input
                      id="textValue"
                      value={form.textValue}
                      onChange={(e) => setForm({ ...form, textValue: e.target.value })}
                      placeholder="e.g., Last 3 months, Last 7 Days, Last 2 hours"
                      className={errors.textValue ? "border-destructive" : ""}
                    />
                    {errors.textValue && <p className="text-sm text-destructive">{errors.textValue}</p>}
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
            <Input 
              placeholder="Search settings..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="max-w-sm" 
            />
          </div>
        </div>

        {loading ? (
          <Alert><AlertDescription>Loading settings…</AlertDescription></Alert>
        ) : filtered.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm ? "No settings match your search." : "No settings found. Add a setting to get started."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting Key</TableHead>
                  <TableHead>Setting Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.settingKey}>
                    <TableCell className="font-medium">{s.settingKey}</TableCell>
                    <TableCell className="max-w-xs truncate">{s.settingValue}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(s)} 
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onDelete(s.id)} 
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filtered.length} of {settings.length} settings</span>
          <span>Admin Only Access</span>
        </div>
      </CardContent>
    </Card>
  );
}
