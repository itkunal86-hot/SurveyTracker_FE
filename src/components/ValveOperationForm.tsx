import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, AlertTriangle } from "lucide-react";
import { ValveOperation, Valve, Catastrophe } from "@/types/valve";

interface ValveOperationFormProps {
  valves: Valve[];
  catastrophes: Catastrophe[];
  getValveCurrentStatus: (valveId: string) => 'open' | 'closed';
  onSave: (operation: Omit<ValveOperation, 'id'>) => void;
  onCancel: () => void;
}

export const ValveOperationForm = ({ 
  valves, 
  catastrophes, 
  getValveCurrentStatus, 
  onSave, 
  onCancel 
}: ValveOperationFormProps) => {
  const [formData, setFormData] = useState({
    catastropheId: "",
    valveId: "",
    actionType: "" as 'open' | 'close',
    actionTimestamp: new Date(),
    performedBy: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.catastropheId) {
      newErrors.catastropheId = "Catastrophe is required";
    }

    if (!formData.valveId) {
      newErrors.valveId = "Valve is required";
    }

    if (!formData.actionType) {
      newErrors.actionType = "Action type is required";
    }

    if (!formData.performedBy.trim()) {
      newErrors.performedBy = "Operator name is required";
    }

    if (formData.actionTimestamp > new Date()) {
      newErrors.actionTimestamp = "Timestamp cannot be in future";
    }

    // Validate valve state logic
    if (formData.valveId && formData.actionType) {
      const currentStatus = getValveCurrentStatus(formData.valveId);
      
      if (formData.actionType === 'close' && currentStatus === 'closed') {
        newErrors.actionType = "Cannot close valve that is already closed";
      }
      
      if (formData.actionType === 'open' && currentStatus === 'open') {
        newErrors.actionType = "Cannot open valve that is already open";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getValveStatus = (valveId: string) => {
    if (!valveId) return null;
    return getValveCurrentStatus(valveId);
  };

  const selectedValveStatus = getValveStatus(formData.valveId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Valve Operation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catastrophe Selection */}
            <div className="space-y-2">
              <Label htmlFor="catastrophe">Related Catastrophe *</Label>
              <Select
                value={formData.catastropheId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, catastropheId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select catastrophe" />
                </SelectTrigger>
                <SelectContent>
                  {catastrophes.map((catastrophe) => (
                    <SelectItem key={catastrophe.id} value={catastrophe.id}>
                      {catastrophe.id} - {catastrophe.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.catastropheId && (
                <p className="text-sm text-destructive">{errors.catastropheId}</p>
              )}
            </div>

            {/* Valve Selection */}
            <div className="space-y-2">
              <Label htmlFor="valve">Valve *</Label>
              <Select
                value={formData.valveId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, valveId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select valve" />
                </SelectTrigger>
                <SelectContent>
                  {valves.map((valve) => (
                    <SelectItem key={valve.id} value={valve.id}>
                      {valve.id} - {valve.name} ({getValveCurrentStatus(valve.id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.valveId && (
                <p className="text-sm text-destructive">{errors.valveId}</p>
              )}
            </div>
          </div>

          {/* Current Valve Status Display */}
          {selectedValveStatus && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedValveStatus === 'open' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedValveStatus.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Type */}
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type *</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value: 'open' | 'close') => setFormData(prev => ({ ...prev, actionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open Valve</SelectItem>
                  <SelectItem value="close">Close Valve</SelectItem>
                </SelectContent>
              </Select>
              {errors.actionType && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.actionType}
                </p>
              )}
            </div>

            {/* Timestamp */}
            <div className="space-y-2">
              <Label htmlFor="timestamp">Action Timestamp *</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.actionTimestamp.toISOString().slice(0, 16)}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  actionTimestamp: new Date(e.target.value)
                }))}
              />
              {errors.actionTimestamp && (
                <p className="text-sm text-destructive">{errors.actionTimestamp}</p>
              )}
            </div>
          </div>

          {/* Operator Name */}
          <div className="space-y-2">
            <Label htmlFor="performedBy">Performed By *</Label>
            <Input
              id="performedBy"
              placeholder="Enter operator name"
              value={formData.performedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, performedBy: e.target.value }))}
            />
            {errors.performedBy && (
              <p className="text-sm text-destructive">{errors.performedBy}</p>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Additional notes about this operation..."
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Save Operation
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};