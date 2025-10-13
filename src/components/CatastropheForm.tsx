import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Save, X, AlertCircle } from "lucide-react";
import { Catastrophe } from "./CatastropheManagement";
import { useCatastropheTypes, usePipelineSegmentsByType } from "@/hooks/useApiQueries";
import { toast } from "sonner";

interface CatastropheFormProps {
  catastrophe?: Catastrophe | null;
  onSave: (catastrophe: Omit<Catastrophe, "id">) => void;
  onCancel: () => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

// Fallback data in case API is not available
const FALLBACK_CATASTROPHE_TYPES = [
  { value: "leak", label: "Gas Leak" },
  { value: "pressure-drop", label: "Pressure Drop" },
  { value: "pipe-damage", label: "Pipe Damage" },
  { value: "valve-failure", label: "Valve Failure" },
  { value: "corrosion", label: "Corrosion" },
  { value: "environmental", label: "Environmental Hazard" },
  { value: "other", label: "Other" },
];

export const CatastropheForm = ({
  catastrophe,
  onSave,
  onCancel,
  selectedLocation,
}: CatastropheFormProps) => {
  // API hooks
  const {
    data: catastropheTypesResponse,
    isLoading: loadingTypes,
    error: typesError,
  } = useCatastropheTypes();
  const {
    data: pipelineSegmentsResponse,
    isLoading: loadingPipelineSegments,
    error: pipelineSegmentsError,
  } = usePipelineSegmentsByType("pipeline");

  // Transform API data or use fallbacks
  const catastropheTypes =
    catastropheTypesResponse?.data?.map((type) => ({
      value: type.value.toLowerCase().replace("_", "-"),
      label: type.label,
    })) || FALLBACK_CATASTROPHE_TYPES;

  const segments = Array.isArray(pipelineSegmentsResponse?.data)
    ? pipelineSegmentsResponse.data.map((row: any, idx: number) => {
        const id = String(row?.id ?? row?.ID ?? row?.Id ?? `ROW_${idx}`);
        const linked = String(
          row?.["Linked Segment"] ?? row?.linkedSegment ?? row?.LinkedSegment ?? row?.name ?? row?.Name ?? id,
        );
        const type = row?.Type ?? row?.type;
        const diameterRaw = row?.Diameter ?? row?.diameter;
        const diameter = typeof diameterRaw === "number" ? diameterRaw : (typeof diameterRaw === "string" ? Number(diameterRaw) : undefined);
        const typePart = type != null && String(type) !== "" ? ` - ${String(type)}` : "";
        const diameterPart = diameter != null && !Number.isNaN(diameter) ? ` (${Number(diameter)}mm)` : "";
        return { value: id, label: `${linked}${typePart}${diameterPart}` };
      })
    : [];

  const [formData, setFormData] = useState({
    segmentId: catastrophe?.segmentId || "",
    type: catastrophe?.type || "",
    description: catastrophe?.description || "",
    location: {
      lat: catastrophe?.location.lat || 0,
      lng: catastrophe?.location.lng || 0,
      address: catastrophe?.location.address || "",
    },
    reportedDate: catastrophe?.reportedDate || new Date(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.segmentId) {
      newErrors.segmentId = "Segment is required";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description cannot be empty";
    }

    if (formData.location.lat === 0 || formData.location.lng === 0) {
      newErrors.location = "Location must be valid";
    }

    if (formData.reportedDate > new Date()) {
      newErrors.reportedDate = "Reported date cannot be in future";
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

  const handleLocationClick = async () => {
    if (!selectedLocation) {
      toast.warning("Please click a location on the map first.");
      return;
    }

    const { lat, lng } = selectedLocation;

    let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=16`,
        {
          headers: {
            "Accept": "application/json",
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          address = data.display_name as string;
        }
      }
    } catch {
      // Ignore network errors, fallback to lat,lng string
    }

    setFormData((prev) => ({
      ...prev,
      location: { lat, lng, address },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {catastrophe ? "Edit Catastrophe" : "Add New Catastrophe"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error States */}
          {(typesError || pipelineSegmentsError) && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Warning: Some configuration data could not be loaded
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Using fallback options. Some features may be limited.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Segment Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="segment">Pipeline Segment *</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Trimble Data
                </span>
              </div>
              <Select
                value={formData.segmentId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, segmentId: value }))
                }
                disabled={loadingPipelineSegments}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingPipelineSegments
                        ? "Loading segments..."
                        : "Select pipeline segment"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.value} value={segment.value}>
                      {segment.label}
                    </SelectItem>
                  ))}
                  {segments.length === 0 && !loadingPipelineSegments && (
                    <SelectItem value="unknown" disabled>
                      No pipeline segments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.segmentId && (
                <p className="text-sm text-destructive">{errors.segmentId}</p>
              )}
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type">Catastrophe Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                disabled={loadingTypes}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingTypes
                        ? "Loading types..."
                        : "Select catastrophe type"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {catastropheTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the catastrophe in detail..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.location.lat}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        lat: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.location.lng}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        lng: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.location.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleLocationClick}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              Click to Set Location
            </Button>
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location}</p>
            )}
          </div>

          {/* Reported Date */}
          <div className="space-y-2">
            <Label htmlFor="reportedDate">Reported Date *</Label>
            <Input
              id="reportedDate"
              type="date"
              value={formData.reportedDate.toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  reportedDate: new Date(e.target.value),
                }))
              }
            />
            {errors.reportedDate && (
              <p className="text-sm text-destructive">{errors.reportedDate}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Save Catastrophe
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
