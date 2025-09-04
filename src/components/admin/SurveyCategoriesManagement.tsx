import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SurveyCategory } from "@/types/admin";
import { apiClient } from "@/lib/api";

const mockCategories: SurveyCategory[] = [
  {
    id: "CAT_001",
    name: "Gas Pipeline",
    description: "Surveys for natural gas pipeline infrastructure",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "CAT_002", 
    name: "Fiber Optics",
    description: "Telecommunications fiber optic cable surveys",
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T09:30:00Z",
  },
  {
    id: "CAT_003",
    name: "Waterline",
    description: "Water supply and distribution pipeline surveys",
    createdAt: "2024-01-17T10:15:00Z", 
    updatedAt: "2024-01-17T10:15:00Z",
  },
  {
    id: "CAT_004",
    name: "Electrical",
    description: "Underground electrical cable and conduit surveys",
    createdAt: "2024-01-18T11:45:00Z",
    updatedAt: "2024-01-18T11:45:00Z",
  },
];

export default function SurveyCategoriesManagement() {
  const [categories, setCategories] = useState<SurveyCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SurveyCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.getSurveyCategories({ limit: 100 });
        setCategories(res.data || []);
      } catch (e) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCategories = Array.isArray(categories)
    ? categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (categories.some(cat => cat.name.toLowerCase() === formData.name.toLowerCase() && cat.id !== editingCategory?.id)) {
      newErrors.name = "Category name must be unique";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (editingCategory) {
      await apiClient.updateSurveyCategory(editingCategory.id, { ...formData });
    } else {
      await apiClient.createSurveyCategory({ ...formData });
    }

    const res = await apiClient.getSurveyCategories({ limit: 100 });
    setCategories(res.data || []);

    resetForm();
  };

  const handleEdit = (category: SurveyCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) return;
    await apiClient.deleteSurveyCategory(id);
    const res = await apiClient.getSurveyCategories({ limit: 100 });
    setCategories(res.data || []);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingCategory(null);
    setIsDialogOpen(false);
    setErrors({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Survey Categories Management</CardTitle>
            <CardDescription>
              Create and manage reusable survey categories for different infrastructure types
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCategory(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? "Update the category information below." 
                    : "Create a new survey category. Category name must be unique."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Gas Pipeline, Fiber Optics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this category is used for..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <Alert>
            <AlertDescription>Loading categories…</AlertDescription>
          </Alert>
        ) : filteredCategories.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm ? "No categories found matching your search." : "No survey categories found. Create your first category to get started."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.name}
                        <Badge variant="secondary" className="text-xs">
                          {category.id}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate" title={category.description}>
                        {category.description || "No description"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {category.createdAt ? new Date(category.createdAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      {category.updatedAt ? new Date(category.updatedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredCategories.length} of {categories.length} categories
          </span>
          <span>
            Admin Only Access
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
