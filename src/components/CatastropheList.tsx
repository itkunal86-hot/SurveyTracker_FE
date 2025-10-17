import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Edit, MapPin, Calendar } from "lucide-react";
import { Catastrophe } from "./CatastropheManagement";

interface CatastropheListProps {
  catastrophes: Catastrophe[];
  onEdit: (catastrophe: Catastrophe) => void;
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    leak: "destructive",
    "pressure-drop": "secondary",
    "pipe-damage": "destructive",
    "valve-failure": "default",
    corrosion: "secondary",
    environmental: "default",
    other: "outline",
  };
  return colors[type] || "outline";
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    leak: "Gas Leak",
    "pressure-drop": "Pressure Drop",
    "pipe-damage": "Pipe Damage",
    "valve-failure": "Valve Failure",
    corrosion: "Corrosion",
    environmental: "Environmental Hazard",
    other: "Other",
  };
  return labels[type] || type;
};

export const CatastropheList = ({
  catastrophes,
  onEdit,
}: CatastropheListProps) => {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Use the table hook for sorting and pagination
  const { tableConfig, sortedAndPaginatedData } = useTable(
    catastrophes,
    10,
    "id",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Catastrophe Records</span>
          <Badge variant="secondary">{catastrophes.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {catastrophes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground p-6">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No catastrophes recorded yet.</p>
            <p className="text-sm">Click "Add Catastrophe" to get started.</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      sortKey="id"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      ID
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="segmentId"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Segment
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="type"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Type
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="description"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Description
                    </SortableTableHead>
                    <SortableTableHead sortable={false}>
                      Location
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="reportedDate"
                      currentSortKey={tableConfig.sortConfig.key as string}
                      sortDirection={tableConfig.sortConfig.direction}
                      onSort={tableConfig.handleSort}
                    >
                      Reported Date
                    </SortableTableHead>
                    <SortableTableHead sortable={false} className="text-right">
                      Actions
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndPaginatedData.map((catastrophe) => (
                    <TableRow key={catastrophe.id}>
                      <TableCell className="font-mono text-sm">
                        {catastrophe.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{catastrophe.segmentId}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getTypeColor(catastrophe.type) as
                              | "destructive"
                              | "secondary"
                              | "default"
                              | "outline"
                          }
                        >
                          {getTypeLabel(catastrophe.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div
                          className="truncate"
                          title={catastrophe.description}
                        >
                          {catastrophe.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="font-mono">
                            {catastrophe.location.lat.toFixed(4)},{" "}
                            {catastrophe.location.lng.toFixed(4)}
                          </span>
                        </div>
                        {catastrophe.location.address && (
                          <div className="text-xs text-muted-foreground truncate">
                            {catastrophe.location.address}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(catastrophe.reportedDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(catastrophe)}
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </TableCell>
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
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
