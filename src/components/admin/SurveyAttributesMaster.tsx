import { useState } from "react";
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SurveyAttribute, SurveyCategory } from "@/types/admin";

const mockCategories: SurveyCategory[] = [
  { id: "CAT_001", name: "Gas Pipeline", description: "", createdAt: "", updatedAt: "" },
  { id: "CAT_002", name: "Fiber Optics", description: "", createdAt: "", updatedAt: "" },
  { id: "CAT_003", name: "Waterline", description: "", createdAt: "", updatedAt: "" },
  { id: "CAT_004", name: "Electrical", description: "", createdAt: "", updatedAt: "" },
];

const mockAttributes: SurveyAttribute[] = [
  {
    id: "ATTR_001",
    categoryId: "CAT_001",
    categoryName: "Gas Pipeline",
    name: "Pipe Diameter",
    dataType: "NUMBER",
    isRequired: true,
    order: 1,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ATTR_002",
    categoryId: "CAT_001", 
    categoryName: "Gas Pipeline",
    name: "Material Type",
    dataType: "DROPDOWN",
    dropdownOptions: ["Steel", "HDPE", "PVC", "Concrete"],
    isRequired: true,
    order: 2,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ATTR_003",
    categoryId: "CAT_001",
    categoryName: "Gas Pipeline", 
    name: "Installation Date",
    dataType: "DATE",
    isRequired: false,
    order: 3,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ATTR_004",
    categoryId: "CAT_002",
    categoryName: "Fiber Optics",
    name: "Core Count",
    dataType: "NUMBER",
    isRequired: true,
    order: 1,
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T09:30:00Z",
  },
  {
    id: "ATTR_005",
    categoryId: "CAT_002",
    categoryName: "Fiber Optics",
    name: "Cable Type",
    dataType: "DROPDOWN",
    dropdownOptions: ["Single Mode", "Multi Mode", "Armored", "Aerial"],
    isRequired: true,
    order: 2,
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T09:30:00Z",
  },
];

export default function SurveyAttributesMaster() {
  const [attributes, setAttributes] = useState<SurveyAttribute[]>(mockAttributes);
  const [categories] = useState<SurveyCategory[]>(mockCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<SurveyAttribute | null>(null);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    dataType: "TEXT" as SurveyAttribute["dataType"],
    dropdownOptions: [] as string[],
    dropdownOptionsText: "",
    isRequired: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const filteredAttributes = attributes
    .filter((attr) => {
      const matchesSearch = 
        attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.categoryName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || attr.categoryId === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        return a.categoryName?.localeCompare(b.categoryName || "") || 0;
      }
      return a.order - b.order;
    });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.categoryId) {
      newErrors.categoryId = "Category selection is required";
    }
    
    if (!formData.name.trim()) {
      newErrors.name = "Attribute name is required";
    } else if (attributes.some(attr => 
      attr.name.toLowerCase() === formData.name.toLowerCase() && 
      attr.categoryId === formData.categoryId &&
      attr.id !== editingAttribute?.id
    )) {
      newErrors.name = "Attribute name must be unique within the category";
    }
    
    if (formData.dataType === "DROPDOWN") {
      if (!formData.dropdownOptionsText.trim()) {
        newErrors.dropdownOptionsText = "Dropdown options are required";
      } else {
        const options = formData.dropdownOptionsText.split(',').map(o => o.trim()).filter(o => o);
        if (options.length < 2) {
          newErrors.dropdownOptionsText = "At least 2 dropdown options are required";
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const categoryName = categories.find(cat => cat.id === formData.categoryId)?.name || "";
    const dropdownOptions = formData.dataType === "DROPDOWN" 
      ? formData.dropdownOptionsText.split(',').map(o => o.trim()).filter(o => o)
      : undefined;

    if (editingAttribute) {
      setAttributes(attributes.map(attr => 
        attr.id === editingAttribute.id 
          ? { 
              ...attr, 
              ...formData,
              categoryName,
              dropdownOptions,
              updatedAt: new Date().toISOString() 
            }
          : attr
      ));
    } else {
      const maxOrder = Math.max(
        0, 
        ...attributes
          .filter(a => a.categoryId === formData.categoryId)
          .map(a => a.order)
      );
      
      const newAttribute: SurveyAttribute = {
        id: `ATTR_${Date.now()}`,
        ...formData,
        categoryName,
        dropdownOptions,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAttributes([...attributes, newAttribute]);
    }

    resetForm();
  };

  const handleEdit = (attribute: SurveyAttribute) => {
    setEditingAttribute(attribute);
    setFormData({
      categoryId: attribute.categoryId,
      name: attribute.name,
      dataType: attribute.dataType,
      dropdownOptions: attribute.dropdownOptions || [],
      dropdownOptionsText: attribute.dropdownOptions?.join(', ') || "",
      isRequired: attribute.isRequired,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this attribute? This action cannot be undone.")) {
      setAttributes(attributes.filter(attr => attr.id !== id));
    }
  };

  const handleMoveOrder = (id: string, direction: "up" | "down") => {
    const attr = attributes.find(a => a.id === id);
    if (!attr) return;

    const categoryAttrs = attributes
      .filter(a => a.categoryId === attr.categoryId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = categoryAttrs.findIndex(a => a.id === id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= categoryAttrs.length) return;

    const updatedAttributes = attributes.map(a => {
      if (a.id === categoryAttrs[currentIndex].id) {
        return { ...a, order: categoryAttrs[newIndex].order };
      } else if (a.id === categoryAttrs[newIndex].id) {
        return { ...a, order: categoryAttrs[currentIndex].order };
      }
      return a;
    });

    setAttributes(updatedAttributes);
  };

  const resetForm = () => {
    setFormData({
      categoryId: "",
      name: "",
      dataType: "TEXT",
      dropdownOptions: [],
      dropdownOptionsText: "",
      isRequired: false,
    });
    setEditingAttribute(null);
    setIsDialogOpen(false);
    setErrors({});
  };

  const getDataTypeBadge = (dataType: SurveyAttribute["dataType"]) => {
    const variants = {
      TEXT: "default",
      NUMBER: "secondary",
      DATE: "outline",
      DROPDOWN: "destructive",
    } as const;

    return (
      <Badge variant={variants[dataType]}>
        {dataType}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Survey Asset Attribute Master</CardTitle>
            <CardDescription>
              Manage which attributes are tracked per survey category
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingAttribute(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Attribute
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAttribute ? "Edit Attribute" : "Add New Attribute"}
                </DialogTitle>
                <DialogDescription>
                  {editingAttribute 
                    ? "Update the attribute configuration below." 
                    : "Create a new attribute for tracking survey data. Attribute names must be unique within each category."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select survey category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Attribute Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Pipe Diameter, Core Count"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataType">Data Type *</Label>
                  <Select 
                    value={formData.dataType} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      dataType: value as SurveyAttribute["dataType"],
                      dropdownOptionsText: value !== "DROPDOWN" ? "" : formData.dropdownOptionsText
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="NUMBER">Number</SelectItem>
                      <SelectItem value="DATE">Date</SelectItem>
                      <SelectItem value="DROPDOWN">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.dataType === "DROPDOWN" && (
                  <div className="space-y-2">
                    <Label htmlFor="dropdownOptions">Dropdown Options *</Label>
                    <Textarea
                      id="dropdownOptions"
                      placeholder="Steel, HDPE, PVC, Concrete (comma-separated)"
                      value={formData.dropdownOptionsText}
                      onChange={(e) => setFormData({ ...formData, dropdownOptionsText: e.target.value })}
                      className={errors.dropdownOptionsText ? "border-destructive" : ""}
                      rows={3}
                    />
                    {errors.dropdownOptionsText && (
                      <p className="text-sm text-destructive">{errors.dropdownOptionsText}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Separate options with commas. Each option will be available in the dropdown.
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                  />
                  <Label htmlFor="isRequired">Required field</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingAttribute ? "Update Attribute" : "Create Attribute"}
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
              placeholder="Search attributes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {categories.length === 0 && (
          <Alert>
            <AlertDescription>
              No survey categories found. Please create categories first before adding attributes.
            </AlertDescription>
          </Alert>
        )}

        {filteredAttributes.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm || categoryFilter !== "ALL" 
                ? "No attributes found matching your filters." 
                : "No survey attributes found. Create your first attribute to get started."
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attribute Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttributes.map((attribute) => (
                  <TableRow key={attribute.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {attribute.name}
                        {attribute.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {attribute.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getDataTypeBadge(attribute.dataType)}
                    </TableCell>
                    <TableCell>
                      {attribute.isRequired ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{attribute.order}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleMoveOrder(attribute.id, "up")}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleMoveOrder(attribute.id, "down")}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {attribute.dropdownOptions && (
                        <div className="flex flex-wrap gap-1">
                          {attribute.dropdownOptions.slice(0, 3).map((option, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                          {attribute.dropdownOptions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{attribute.dropdownOptions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(attribute)}
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(attribute.id)}
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
            Showing {filteredAttributes.length} of {attributes.length} attributes
          </span>
          <span>
            Admin Only Access
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
