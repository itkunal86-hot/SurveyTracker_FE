// import { useEffect, useMemo, useState } from "react";
// import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// import { apiClient, type AssetType, type AssetProperty } from "@/lib/api";
// import { useToast } from "@/hooks/use-toast";

// const API = "/api";

// export default function AssetPropertyManagement() {
//   const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
//   const [items, setItems] = useState<AssetProperty[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedAssetType, setSelectedAssetType] = useState<string>("");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editing, setEditing] = useState<AssetProperty | null>(null);
//   const [form, setForm] = useState({ name: "", dataType: "", isRequired: false, order: "" as any, options: "", valueUnit: "", assetTypeId: "" });
//   const { toast } = useToast();
//   const [errors, setErrors] = useState<{ name?: string; dataType?: string; assetTypeId?: string; order?: string }>({});
//   const ALL_VALUE = "__ALL__";

//   useEffect(() => {
//     const loadAssetTypes = async () => {
//       try {
//         const res = await apiClient.getAssetTypes({ limit: 200 });
//         setAssetTypes(res.data || []);
//       } catch {}
//     };
//     loadAssetTypes();
//   }, []);

//   // const loadItems = async () => {
//   //   const res = await apiClient.getAssetProperties({ limit: 200, assetTypeId: selectedAssetType || undefined, search: searchTerm || undefined });
//   //   setItems(res.data || []);
//   // };

//   const loadItems = async () => {
//   const res = await apiClient.getAssetProperties({
//     limit: 200,
//     assetTypeId: selectedAssetType || undefined,  // filter applied on API side
//     search: searchTerm || undefined,              // pass search to API
//   });
//   setItems(res.data || []);
//   };


//   useEffect(() => {
//     loadItems();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedAssetType]);

//   // const filtered = useMemo(() => {
//   //   const term = searchTerm.toLowerCase();
//   //   return items.filter(i => i.name.toLowerCase().includes(term));
//   // }, [items, searchTerm]);

//   const filtered = useMemo(() => {
//   const term = searchTerm.toLowerCase();
//   return items
//     .filter(i => i.name.toLowerCase().includes(term))
//     .filter(i => {
//       if (!selectedAssetType) return true;
//       const assetTypeName = assetTypes.find(a => a.id === i.assetTypeId)?.name;
//       return assetTypeName?.toLowerCase() === selectedAssetType.toLowerCase();
//     });
// }, [items, searchTerm, selectedAssetType, assetTypes]);



//   const resetForm = () => {
//     setEditing(null);
//     setForm({ name: "", dataType: "", isRequired: false, order: "", options: "", valueUnit: "", assetTypeId: selectedAssetType || "" });
//     setErrors({});
//     setIsDialogOpen(false);
//   };

//   const validate = () => {
//     const e: typeof errors = {};
//     if (!form.name.trim()) e.name = "Name is required";
//     if (form.dataType === "" || isNaN(Number(form.dataType))) e.dataType = "Data type is required";
//     if (!form.assetTypeId) e.assetTypeId = "Asset type is required";
//     if (form.order !== "" && isNaN(Number(form.order))) e.order = "Order must be a number";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const onSubmit = async () => {
//     if (!validate()) return;
//     const payload = {
//       name: form.name.trim(),
//       dataType: Number(form.dataType),
//       isRequired: !!form.isRequired,
//       order: form.order === "" ? null : Number(form.order),
//       options: form.options?.trim() || null,
//       valueUnit: form.valueUnit?.trim() || null,
//       atId: form.assetTypeId,
//     };
//     if (editing) {
//       await apiClient.updateAssetProperty(editing.id, payload as any);
//       await loadItems();
//       toast({ title: "Attribute updated" });
//       resetForm();
//     } else {
//       await apiClient.createAssetProperty(payload as any);
//       await loadItems();
//       toast({ title: "Attribute created" });
//       resetForm();
//     }
//   };

//   const onEdit = (item: AssetProperty) => {
//     setEditing(item);
//     setForm({ name: item.name, dataType: String(item.dataType), isRequired: item.isRequired, order: item.order == null ? "" : String(item.order), options: item.options || "", valueUnit: item.valueUnit || "", assetTypeId: item.assetTypeId });
//     setIsDialogOpen(true);
//   };

//   const onDelete = async (id: string) => {
//     if (!confirm("Delete this property?")) return;
//     await apiClient.deleteAssetProperty(id);
//     await loadItems();
//     toast({ title: "Attribute deleted" });
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle className="flex items-center gap-2"><Tags className="h-4 w-4" /> Asset Attributes</CardTitle>
//             <CardDescription>Define attributes (properties) for each asset type</CardDescription>
//           </div>
//           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//             <DialogTrigger asChild>
//               <Button onClick={() => { setEditing(null); setIsDialogOpen(true); }}>
//                 <Plus className="h-4 w-4 mr-2" /> Add Attribute
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-[520px]">
//               <DialogHeader>
//                 <DialogTitle>{editing ? "Edit Attribute" : "Add Attribute"}</DialogTitle>
//                 <DialogDescription>{editing ? "Update property details" : "Create a new property for an asset type"}</DialogDescription>
//               </DialogHeader>
//               <div className="grid gap-4 py-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="assetType">Asset Type *</Label>
//                   <Select value={form.assetTypeId} onValueChange={(v) => setForm({ ...form, assetTypeId: v })}>
//                     <SelectTrigger id="assetType"><SelectValue placeholder="Select asset type" /></SelectTrigger>
//                     <SelectContent>
//                       {assetTypes.map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
//                     </SelectContent>
//                   </Select>
//                   {errors.assetTypeId && <p className="text-sm text-destructive">{errors.assetTypeId}</p>}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="name">Name *</Label>
//                   <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
//                   {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="dataType">Data Type *</Label>
//                   <Select value={form.dataType} onValueChange={(v) => setForm({ ...form, dataType: v })}>
//                     <SelectTrigger id="dataType"><SelectValue placeholder="Select data type" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="1">Number</SelectItem>
//                       <SelectItem value="2">Text</SelectItem>
//                       <SelectItem value="3">Select</SelectItem>
//                       <SelectItem value="4">Boolean</SelectItem>
//                       <SelectItem value="5">Date</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   {errors.dataType && <p className="text-sm text-destructive">{errors.dataType}</p>}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="order">Order</Label>
//                   <Input id="order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
//                   {errors.order && <p className="text-sm text-destructive">{errors.order}</p>}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="valueUnit">Value Unit</Label>
//                   <Input id="valueUnit" value={form.valueUnit} onChange={(e) => setForm({ ...form, valueUnit: e.target.value })} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="options">Options (JSON or CSV)</Label>
//                   <Input id="options" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder='e.g. ["A","B"] or A,B' />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <input id="isRequired" type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />
//                   <Label htmlFor="isRequired">Required</Label>
//                 </div>
//               </div>
//               <DialogFooter>
//                 <Button variant="outline" onClick={resetForm}>Cancel</Button>
//                 <Button onClick={onSubmit}>{editing ? "Update" : "Create"}</Button>
//               </DialogFooter>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="flex flex-wrap items-center gap-2">
//           <div className="flex items-center space-x-2">
//             <Search className="h-4 w-4 text-muted-foreground" />
//             <Input placeholder="Search properties..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
//           </div>
//           <div className="ml-auto flex items-center gap-2">
//             <Select value={selectedAssetType === "" ? ALL_VALUE : selectedAssetType} onValueChange={(v) => setSelectedAssetType(v === ALL_VALUE ? "" : v)}>
//               <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by asset type" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value={ALL_VALUE}>All Asset Types</SelectItem>
//                 {assetTypes.map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
//               </SelectContent>
//             </Select>
//             {/* <Button variant="outline" onClick={() => loadItems()}>Refresh</Button> */}

//             <Button
//   variant="outline"
//   onClick={() => {
//     setSelectedAssetType("");  // reset filter to All
//     setSearchTerm("");         // clear search
//     loadItems();               // reload all
//   }}
// >
//   Refresh
// </Button>
//           </div>
//         </div>

//         {filtered.length === 0 ? (
//           <Alert>
//             <AlertDescription>
//               {searchTerm ? "No properties found for your search." : "No properties found. Create your first property to get started."}
//             </AlertDescription>
//           </Alert>
//         ) : (
//           <div className="border rounded-lg overflow-hidden">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Asset Type</TableHead>
//                   <TableHead>Data Type</TableHead>
//                   <TableHead>Unit</TableHead>
//                   <TableHead>Order</TableHead>
//                   <TableHead>Required</TableHead>
//                   <TableHead>Created</TableHead>
//                   <TableHead>Last updated</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filtered.map((item) => (
//                   <TableRow key={item.id}>
//                     <TableCell className="font-medium flex items-center gap-2">
//                       {item.name}
//                       <Badge variant="secondary" className="text-xs">{item.id}</Badge>
//                     </TableCell>
//                     <TableCell>{assetTypes.find(a => a.id === item.assetTypeId)?.name || item.assetTypeId}</TableCell>
//                     <TableCell>{item.dataType}</TableCell>
//                     <TableCell>{item.valueUnit || <span className="text-muted-foreground">—</span>}</TableCell>
//                     <TableCell>{item.order ?? <span className="text-muted-foreground">—</span>}</TableCell>
//                     <TableCell>{item.isRequired ? <Badge className="bg-success text-success-foreground">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
//                     <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</TableCell>
//                     <TableCell>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}</TableCell>
//                     <TableCell className="text-right space-x-2">
//                       <Button variant="outline" size="sm" onClick={() => onEdit(item)} className="gap-1"><Pencil className="h-3 w-3" />Edit</Button>
//                       <Button variant="outline" size="sm" onClick={() => onDelete(item.id)} className="gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" />Delete</Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//         <div className="flex items-center justify-between text-sm text-muted-foreground">
//           <span>Showing {filtered.length} of {items.length} properties</span>
//           <span>Admin Only Access</span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }




import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { apiClient, type AssetType, type AssetProperty } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

export default function AssetPropertyManagement() {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [items, setItems] = useState<AssetProperty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>(""); // ✅ will now store the asset type NAME
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssetProperty | null>(null);
  const [form, setForm] = useState({ name: "", dataType: "", isRequired: false, order: "" as any, options: "", valueUnit: "", assetTypeId: "" });
  const { toast } = useToast();
  const [errors, setErrors] = useState<{ name?: string; dataType?: string; assetTypeId?: string; order?: string }>({});
  const ALL_VALUE = "__ALL__";

  useEffect(() => {
    const loadAssetTypes = async () => {
      try {
        const res = await apiClient.getAssetTypes({ limit: 200 });
        setAssetTypes(res.data || []);
      } catch {}
    };
    loadAssetTypes();
  }, []);

  // ✅ No filtering at API side anymore, load all
  const loadItems = async () => {
    const res = await apiClient.getAssetProperties({
      limit: 200,
      search: searchTerm || undefined,  // keep search
    });
    setItems(res.data || []);
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ UPDATED FILTER: also filter by asset type NAME (Valve, Pump, etc.)
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items
      .filter(i => i.name.toLowerCase().includes(term))
      .filter(i => {
        if (!selectedAssetType) return true; // show all if not selected
        const assetTypeName = assetTypes.find(a => a.id === i.assetTypeId)?.name;
        return assetTypeName?.toLowerCase() === selectedAssetType.toLowerCase();
      });
  }, [items, searchTerm, selectedAssetType, assetTypes]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", dataType: "", isRequired: false, order: "", options: "", valueUnit: "", assetTypeId: "" });
    setErrors({});
    setIsDialogOpen(false);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.dataType === "" || isNaN(Number(form.dataType))) e.dataType = "Data type is required";
    if (!form.assetTypeId) e.assetTypeId = "Asset type is required";
    if (form.order !== "" && isNaN(Number(form.order))) e.order = "Order must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      dataType: Number(form.dataType),
      isRequired: !!form.isRequired,
      order: form.order === "" ? null : Number(form.order),
      options: form.options?.trim() || null,
      valueUnit: form.valueUnit?.trim() || null,
      atId: form.assetTypeId,
    };
    if (editing) {
      await apiClient.updateAssetProperty(editing.id, payload as any);
      await loadItems();
      toast({ title: "Attribute updated" });
      resetForm();
    } else {
      await apiClient.createAssetProperty(payload as any);
      await loadItems();
      toast({ title: "Attribute created" });
      resetForm();
    }
  };

  const onEdit = (item: AssetProperty) => {
    setEditing(item);
    setForm({ 
      name: item.name, 
      dataType: String(item.dataType), 
      isRequired: item.isRequired, 
      order: item.order == null ? "" : String(item.order), 
      options: item.options || "", 
      valueUnit: item.valueUnit || "", 
      assetTypeId: item.assetTypeId 
    });
    setIsDialogOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this property?")) return;
    await apiClient.deleteAssetProperty(id);
    await loadItems();
    toast({ title: "Attribute deleted" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Tags className="h-4 w-4" /> Asset Attributes</CardTitle>
            <CardDescription>Define attributes (properties) for each asset type</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Attribute
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Attribute" : "Add Attribute"}</DialogTitle>
                <DialogDescription>{editing ? "Update property details" : "Create a new property for an asset type"}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="assetType">Asset Type *</Label>
                  <Select value={form.assetTypeId} onValueChange={(v) => setForm({ ...form, assetTypeId: v })}>
                    <SelectTrigger id="assetType"><SelectValue placeholder="Select asset type" /></SelectTrigger>
                    <SelectContent>
                      {assetTypes.map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {errors.assetTypeId && <p className="text-sm text-destructive">{errors.assetTypeId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataType">Data Type *</Label>
                  <Select value={form.dataType} onValueChange={(v) => setForm({ ...form, dataType: v })}>
                    <SelectTrigger id="dataType"><SelectValue placeholder="Select data type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Number</SelectItem>
                      <SelectItem value="2">Text</SelectItem>
                      <SelectItem value="3">Select</SelectItem>
                      <SelectItem value="4">Boolean</SelectItem>
                      <SelectItem value="5">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.dataType && <p className="text-sm text-destructive">{errors.dataType}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input id="order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                  {errors.order && <p className="text-sm text-destructive">{errors.order}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valueUnit">Value Unit</Label>
                  <Input id="valueUnit" value={form.valueUnit} onChange={(e) => setForm({ ...form, valueUnit: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="options">Options (JSON or CSV)</Label>
                  <Input id="options" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder='e.g. ["A","B"] or A,B' />
                </div>
                <div className="flex items-center gap-2">
                  <input id="isRequired" type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />
                  <Label htmlFor="isRequired">Required</Label>
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
            <Input placeholder="Search properties..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* ✅ UPDATED: store asset type NAME in selectedAssetType */}
            <Select value={selectedAssetType === "" ? ALL_VALUE : selectedAssetType} onValueChange={(v) => setSelectedAssetType(v === ALL_VALUE ? "" : v)}>
              <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by asset type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Asset Types</SelectItem>
                {assetTypes.map(a => (<SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedAssetType("");  // reset filter to All
                setSearchTerm("");         // clear search
                loadItems();               // reload all
              }}
            >
              Refresh
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm ? "No properties found for your search." : "No properties found. Create your first property to get started."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last updated</TableHead>
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
                    <TableCell>{assetTypes.find(a => a.id === item.assetTypeId)?.name || item.assetTypeId}</TableCell>
                    <TableCell>{item.dataType}</TableCell>
                    <TableCell>{item.valueUnit || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{item.order ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{item.isRequired ? <Badge className="bg-success text-success-foreground">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                    <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</TableCell>
                    <TableCell>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}</TableCell>
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
          <span>Showing {filtered.length} of {items.length} properties</span>
          <span>Admin Only Access</span>
        </div>
      </CardContent>
    </Card>
  );
}

