import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Survey, SurveyCategory } from "@/types/admin";
import { useSurveyMasters, useCreateSurveyMaster, useUpdateSurveyMaster, useDeleteSurveyMaster } from "@/hooks/useApiQueries";


export default function SurveyManagement() {
  const { data: surveysResp } = useSurveyMasters({ limit: 1000 });
  const surveys: Survey[] = surveysResp?.data ?? [];
  const [categories] = useState<SurveyCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE" as Survey["status"],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const createSurvey = useCreateSurveyMaster();
  const updateSurvey = useUpdateSurveyMaster();
  const deleteSurvey = useDeleteSurveyMaster();

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch = 
      survey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.categoryName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || survey.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Survey name is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingSurvey) {
        await updateSurvey.mutateAsync({ id: editingSurvey.id, payload: { ...formData } });
      } else {
        await createSurvey.mutateAsync({ ...formData });
      }
      resetForm();
    } catch (error) {
      setErrors({ name: (error as Error).message || "Failed to save survey" });
    }
  };

  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setFormData({
      name: survey.name,
      categoryId: survey.categoryId,
      startDate: survey.startDate,
      endDate: survey.endDate,
      status: survey.status,
    });
    setIsDialogOpen(true);
  };

  const handleCloseSurvey = (id: string) => {
    if (confirm("Are you sure you want to close this survey? This action cannot be undone.")) {
      updateSurvey.mutate({ id, payload: { status: "CLOSED" } });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this survey? This action cannot be undone.")) {
      deleteSurvey.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      categoryId: "",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
    });
    setEditingSurvey(null);
    setIsDialogOpen(false);
    setErrors({});
  };

  const getStatusBadge = (status: Survey["status"]) => {
    return status === "ACTIVE" ? (
      <Badge className="bg-success text-success-foreground">Active</Badge>
    ) : (
      <Badge variant="secondary">Closed</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Survey Management</CardTitle>
            <CardDescription>
              Create and manage individual surveys under each category
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSurvey(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Survey
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSurvey ? "Edit Survey" : "Add New Survey"}
                </DialogTitle>
                <DialogDescription>
                  {editingSurvey 
                    ? "Update the survey information below." 
                    : "Create a new survey. Select category and define timeline."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Survey Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Mumbai Gas Main Line Survey"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className={errors.startDate ? "border-destructive" : ""}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-destructive">{errors.startDate}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className={errors.endDate ? "border-destructive" : ""}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-destructive">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value as Survey["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingSurvey ? "Update Survey" : "Create Survey"}
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
              placeholder="Search surveys..."
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
              <SelectItem value="CLOSED">Closed Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredSurveys.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm || statusFilter !== "ALL" 
                ? "No surveys found matching your filters." 
                : "No surveys found. Create your first survey to get started."
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Survey Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {survey.name}
                        <Badge variant="outline" className="text-xs">
                          {survey.id}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {survey.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(survey.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {new Date(survey.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(survey.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {survey.createdBy}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(survey)}
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      {survey.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseSurvey(survey.id)}
                          className="gap-1 text-warning hover:text-warning"
                        >
                          Close
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(survey.id)}
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
            Showing {filteredSurveys.length} of {surveys.length} surveys
          </span>
          <span>
            Admin Only Access
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
