import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Search, Settings, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    settingKey: "",
    settingValue: "",
  });
  const [errors, setErrors] = useState<{ settingKey?: string; settingValue?: string }>({});

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
    setForm({ settingKey: "", settingValue: "" });
    setErrors({});
    setIsDialogOpen(false);
  };

  const handleRefresh = async () => {
    setSearchTerm("");
    await loadSettings();
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.settingKey.trim()) e.settingKey = "Setting Key is required";
    if (!form.settingValue.trim()) e.settingValue = "Setting Value is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    const payload = {
      settingKey: form.settingKey.trim(),
      settingValue: form.settingValue.trim(),
    };

    let response;

    try {
      if (editing) {
        response = await apiClient.updateSetting(editing.settingKey, payload);
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
    setEditing(item);
    setForm({
      settingKey: item.settingKey,
      settingValue: item.settingValue,
    });
    setIsDialogOpen(true);
  };

  const onDelete = async (settingKey: string) => {
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
                    <Label htmlFor="settingKey">Setting Key *</Label>
                    <Input 
                      id="settingKey" 
                      value={form.settingKey} 
                      onChange={(e) => setForm({ ...form, settingKey: e.target.value })}
                      disabled={editing !== null}
                      placeholder="e.g., APP_TIMEOUT"
                      className={errors.settingKey ? "border-destructive" : ""} 
                    />
                    {errors.settingKey && <p className="text-sm text-destructive">{errors.settingKey}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settingValue">Setting Value *</Label>
                    <Input 
                      id="settingValue" 
                      value={form.settingValue} 
                      onChange={(e) => setForm({ ...form, settingValue: e.target.value })}
                      placeholder="e.g., 3000"
                      className={errors.settingValue ? "border-destructive" : ""} 
                    />
                    {errors.settingValue && <p className="text-sm text-destructive">{errors.settingValue}</p>}
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
                        onClick={() => onDelete(s.settingKey)} 
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
