import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SurveyCategory { id: string; name: string; description?: string }
import { apiClient, type AssetType } from "@/lib/api";

const API = "";

export default function AssetTypeManagement() {
  const [categories, setCategories] = useState<SurveyCategory[]>([]);
  const [items, setItems] = useState<AssetType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "">("");
  const ALL_VALUE = "__ALL__";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssetType | null>(null);
  const [form, setForm] = useState({ name: "", isSurveyElement: false, surveyCategoryId: "", menuName: "", menuOrder: "" as any });
  const [errors, setErrors] = useState<{ name?: string; menuOrder?: string; surveyCategoryId?: string }>({});

  // Load categories and asset types
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API}/survey-categories?limit=100`);
        if (res.ok) {
          const json = await res.json();
          setCategories(json.data || []);
        }
      } catch {}
    };
    fetchCategories();
  }, []);

  const loadItems = async (categoryId?: string) => {
    const res = await apiClient.getAssetTypes({ limit: 100, surveyCategoryId: categoryId, search: searchTerm });
    setItems(res.data || []);
  };

  useEffect(() => {
    loadItems(selectedCategory || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(term) || (i.menuName || "").toLowerCase().includes(term));
  }, [items, searchTerm]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", isSurveyElement: false, surveyCategoryId: selectedCategory || "", menuName: "", menuOrder: "" });
    setErrors({});
    setIsDialogOpen(false);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.menuOrder !== "" && isNaN(Number(form.menuOrder))) e.menuOrder = "Menu order must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      isSurveyElement: !!form.isSurveyElement,
      surveyCategoryId: form.surveyCategoryId || null,
      menuName: form.menuName?.trim() || null,
      menuOrder: form.menuOrder === "" ? null : Number(form.menuOrder),
    };
    if (editing) {
      await apiClient.updateAssetType(editing.id, payload as any);
      await loadItems(selectedCategory || undefined);
      resetForm();
    } else {
      await apiClient.createAssetType(payload as any);
      await loadItems(selectedCategory || undefined);
      resetForm();
    }
  };

  const onEdit = (item: AssetType) => {
    setEditing(item);
    setForm({ name: item.name, isSurveyElement: item.isSurveyElement, surveyCategoryId: item.surveyCategoryId || "", menuName: item.menuName || "", menuOrder: item.menuOrder == null ? "" : String(item.menuOrder) });
    setIsDialogOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this asset type?")) return;
    await apiClient.deleteAssetType(id);
    await loadItems(selectedCategory || undefined);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Asset Types</CardTitle>
            <CardDescription>Manage asset types linked to survey categories</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Asset Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Asset Type" : "Add Asset Type"}</DialogTitle>
                <DialogDescription>{editing ? "Update asset type details" : "Create a new asset type for a survey category"}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Survey Category</Label>
                  <Select value={form.surveyCategoryId} onValueChange={(v) => setForm({ ...form, surveyCategoryId: v })}>
                    <SelectTrigger id="category"><SelectValue placeholder="Select category (optional)" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menuName">Menu Name</Label>
                  <Input id="menuName" value={form.menuName} onChange={(e) => setForm({ ...form, menuName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menuOrder">Menu Order</Label>
                  <Input id="menuOrder" value={form.menuOrder} onChange={(e) => setForm({ ...form, menuOrder: e.target.value })} />
                  {errors.menuOrder && <p className="text-sm text-destructive">{errors.menuOrder}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input id="isSurveyElement" type="checkbox" checked={form.isSurveyElement} onChange={(e) => setForm({ ...form, isSurveyElement: e.target.checked })} />
                  <Label htmlFor="isSurveyElement">Is Survey Element</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={onSubmit}>{editing ? "Update" : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={selectedCategory === "" ? ALL_VALUE : selectedCategory} onValueChange={(v) => setSelectedCategory(v === ALL_VALUE ? "" : v)}>
              <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Categories</SelectItem>
                {categories.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadItems(selectedCategory || undefined)}>Refresh</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm ? "No asset types found for your search." : "No asset types found. Create your first asset type to get started."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Survey Element</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {item.name}
                      <Badge variant="secondary" className="text-xs">{item.id}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.surveyCategoryId ? categories.find(c => c.id === item.surveyCategoryId)?.name || item.surveyCategoryId : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{item.menuName || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{item.menuOrder ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{item.isSurveyElement ? <Badge className="bg-success text-success-foreground">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                    <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(item)} className="gap-1"><Pencil className="h-3 w-3" />Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => onDelete(item.id)} className="gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" />Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filtered.length} of {items.length} asset types</span>
          <span>Admin Only Access</span>
        </div>
      </CardContent>
    </Card>
  );
}
