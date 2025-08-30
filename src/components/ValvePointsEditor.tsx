import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeafletMap } from "@/components/LeafletMap";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Pagination } from "@/components/ui/pagination";
import { useTable } from "@/hooks/use-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  CalendarIcon,
  Link,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ValvePoint {
  id: string;
  segmentId: string;
  type: "Control" | "Emergency" | "Safety" | "Isolation";
  location: {
    lat: number;
    lng: number;
  };
  installedDate: string;
}

const mockSegments = [
  { id: "PS-001", name: "Main Pipeline Segment 001" },
  { id: "PS-002", name: "Secondary Pipeline Segment 002" },
  { id: "PS-003", name: "Distribution Segment 003" },
];

export const ValvePointsEditor = () => {
  const [valves, setValves] = useState<ValvePoint[]>([
    {
      id: "VLV-001",
      segmentId: "PS-001",
      type: "Control",
      location: { lat: 40.7128, lng: -74.006 },
      installedDate: "2024-01-15",
    },
    {
      id: "VLV-002",
      segmentId: "PS-001",
      type: "Emergency",
      location: { lat: 40.7589, lng: -73.9851 },
      installedDate: "2024-01-22",
    },
    {
      id: "VLV-003",
      segmentId: "PS-002",
      type: "Safety",
      location: { lat: 40.7831, lng: -73.9712 },
      installedDate: "2024-02-05",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingValve, setEditingValve] = useState<ValvePoint | null>(null);
  const [formData, setFormData] = useState({
    segmentId: "",
    type: "" as ValvePoint["type"] | "",
    lat: "",
    lng: "",
    installedDate: undefined as Date | undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Demo data for map
  const demoDevices = [
    {
      id: "VLV-MON-001",
      name: "Valve Monitor 1",
      lat: 40.7589,
      lng: -73.9851,
      status: "active" as const,
      lastPing: "20 sec ago",
    },
    {
      id: "VLV-MON-002",
      name: "Valve Monitor 2",
      lat: 40.7614,
      lng: -73.9776,
      status: "active" as const,
      lastPing: "35 sec ago",
    },
    {
      id: "VLV-MON-003",
      name: "Valve Monitor 3",
      lat: 40.7505,
      lng: -73.9934,
      status: "active" as const,
      lastPing: "50 sec ago",
    },
  ];

  const demoPipelines = [
    { id: "PS-001", diameter: 200, depth: 1.5, status: "normal" as const },
    { id: "PS-002", diameter: 150, depth: 2.0, status: "normal" as const },
    { id: "PS-003", diameter: 300, depth: 1.8, status: "warning" as const },
  ];

  const demoValvesWithStatus = valves.map((valve) => ({
    id: valve.id,
    type: valve.type.toLowerCase() as "control" | "emergency" | "isolation",
    status:
      valve.type === "Emergency"
        ? ("closed" as const)
        : valve.type === "Safety"
          ? ("maintenance" as const)
          : ("open" as const),
    segmentId: valve.segmentId,
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.segmentId) {
      newErrors.segmentId = "Must select a pipeline segment";
    }

    if (!formData.type) {
      newErrors.type = "Must select a valve type";
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);

    if (!formData.lat || isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.lat = "Latitude must be between -90 and 90";
    }

    if (!formData.lng || isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.lng = "Longitude must be between -180 and 180";
    }

    if (!formData.installedDate) {
      newErrors.installedDate = "Install date is required";
    } else if (formData.installedDate > new Date()) {
      newErrors.installedDate = "Install date cannot be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);

    if (editingValve) {
      // Update existing valve
      setValves(
        valves.map((valve) =>
          valve.id === editingValve.id
            ? {
                ...valve,
                segmentId: formData.segmentId,
                type: formData.type as ValvePoint["type"],
                location: { lat, lng },
                installedDate: format(formData.installedDate!, "yyyy-MM-dd"),
              }
            : valve,
        ),
      );
      toast({ title: "Valve point updated successfully" });
    } else {
      // Add new valve
      const newValve: ValvePoint = {
        id: `VLV-${String(valves.length + 1).padStart(3, "0")}`,
        segmentId: formData.segmentId,
        type: formData.type as ValvePoint["type"],
        location: { lat, lng },
        installedDate: format(formData.installedDate!, "yyyy-MM-dd"),
      };
      setValves([...valves, newValve]);
      toast({ title: "Valve point added successfully" });
    }

    handleCloseDialog();
  };

  const handleEdit = (valve: ValvePoint) => {
    setEditingValve(valve);
    setFormData({
      segmentId: valve.segmentId,
      type: valve.type,
      lat: valve.location.lat.toString(),
      lng: valve.location.lng.toString(),
      installedDate: new Date(valve.installedDate),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (valveId: string) => {
    setValves(valves.filter((valve) => valve.id !== valveId));
    toast({ title: "Valve point deleted successfully" });
  };

  const handleAddNew = () => {
    setEditingValve(null);
    setFormData({
      segmentId: "",
      type: "",
      lat: "",
      lng: "",
      installedDate: undefined,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingValve(null);
    setFormData({
      segmentId: "",
      type: "",
      lat: "",
      lng: "",
      installedDate: undefined,
    });
    setErrors({});
  };

  const getSegmentName = (segmentId: string) => {
    const segment = mockSegments.find((s) => s.id === segmentId);
    return segment ? segment.name : segmentId;
  };

  const getTypeColor = (type: ValvePoint["type"]) => {
    switch (type) {
      case "Control":
        return "bg-blue-100 text-blue-800";
      case "Emergency":
        return "bg-red-100 text-red-800";
      case "Safety":
        return "bg-yellow-100 text-yellow-800";
      case "Isolation":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Use the table hook for sorting and pagination
  const { tableConfig, sortedAndPaginatedData } = useTable(valves, 5, "id");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Valve Points Viewer</h1>
          <p className="text-muted-foreground">
            View valve metadata and placement on pipeline segments
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valve Points List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Valve Points ({valves.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      sortKey="id"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Valve ID
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="segmentId"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Linked Segment
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="type"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Type
                    </SortableTableHead>
                    <SortableTableHead sortable={false}>
                      Location
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="installedDate"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Installed Date
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndPaginatedData.map((valve) => (
                    <TableRow key={valve.id}>
                      <TableCell className="font-medium">{valve.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          <span className="text-sm">{valve.segmentId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(valve.type)}>
                          {valve.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {valve.location.lat.toFixed(4)},{" "}
                          {valve.location.lng.toFixed(4)}
                        </span>
                      </TableCell>
                      <TableCell>{valve.installedDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <Pagination
              config={tableConfig.paginationConfig}
              onPageChange={tableConfig.setCurrentPage}
              onPageSizeChange={tableConfig.setPageSize}
              onFirstPage={tableConfig.goToFirstPage}
              onLastPage={tableConfig.goToLastPage}
              onNextPage={tableConfig.goToNextPage}
              onPreviousPage={tableConfig.goToPreviousPage}
              canGoNext={tableConfig.canGoNext}
              canGoPrevious={tableConfig.canGoPrevious}
              pageSizeOptions={[5, 10, 20]}
            />
          </CardContent>
        </Card>

        {/* Map View */}
        <Card>
          <CardHeader>
            <CardTitle>Valve Network Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <LeafletMap
                devices={demoDevices}
                pipelines={demoPipelines}
                valves={demoValvesWithStatus}
                showDevices={true}
                showPipelines={true}
                showValves={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
