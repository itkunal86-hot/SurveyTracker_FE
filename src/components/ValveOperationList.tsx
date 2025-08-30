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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Calendar, User, X } from "lucide-react";
import {
  ValveOperation,
  Valve,
  Catastrophe,
  ValveOperationFilters,
} from "@/types/valve";

interface ValveOperationListProps {
  operations: ValveOperation[];
  valves: Valve[];
  catastrophes: Catastrophe[];
  filters: ValveOperationFilters;
  onFiltersChange: (filters: ValveOperationFilters) => void;
  onClearFilters: () => void;
}

export const ValveOperationList = ({
  operations,
  valves,
  catastrophes,
  filters,
  onFiltersChange,
  onClearFilters,
}: ValveOperationListProps) => {
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getValveName = (valveId: string) => {
    const valve = valves.find((v) => v.id === valveId);
    return valve ? `${valve.id} - ${valve.name}` : valveId;
  };

  const getCatastropheDescription = (catastropheId: string) => {
    const catastrophe = catastrophes.find((c) => c.id === catastropheId);
    return catastrophe ? catastrophe.description : catastropheId;
  };

  const hasActiveFilters =
    filters.catastropheId !== "all" ||
    filters.valveId !== "all" ||
    filters.actionType !== "all";

  // Use the table hook for sorting and pagination
  const { tableConfig, sortedAndPaginatedData } = useTable(
    operations,
    10,
    "id",
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="gap-1 ml-auto"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Catastrophe</Label>
              <Select
                value={filters.catastropheId}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, catastropheId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All catastrophes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All catastrophes</SelectItem>
                  {catastrophes.map((catastrophe) => (
                    <SelectItem key={catastrophe.id} value={catastrophe.id}>
                      {catastrophe.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valve</Label>
              <Select
                value={filters.valveId}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, valveId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All valves" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All valves</SelectItem>
                  {valves.map((valve) => (
                    <SelectItem key={valve.id} value={valve.id}>
                      {valve.id} - {valve.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={filters.actionType}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, actionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Operation Records</span>
            <Badge variant="secondary">{operations.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground p-6">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No operations found.</p>
              {hasActiveFilters ? (
                <p className="text-sm">
                  Try adjusting your filters or clear them to see all
                  operations.
                </p>
              ) : (
                <p className="text-sm">
                  Click "Add Operation" to record the first valve operation.
                </p>
              )}
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
                        Operation ID
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="catastropheId"
                        currentSortKey={tableConfig.sortConfig.key as string}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={tableConfig.handleSort}
                      >
                        Catastrophe
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="valveId"
                        currentSortKey={tableConfig.sortConfig.key as string}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={tableConfig.handleSort}
                      >
                        Valve
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="actionType"
                        currentSortKey={tableConfig.sortConfig.key as string}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={tableConfig.handleSort}
                      >
                        Action
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="actionTimestamp"
                        currentSortKey={tableConfig.sortConfig.key as string}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={tableConfig.handleSort}
                      >
                        Timestamp
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="performedBy"
                        currentSortKey={tableConfig.sortConfig.key as string}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={tableConfig.handleSort}
                      >
                        Operator
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="remarks"
                        currentSortKey={tableConfig.sortConfig.key as string}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={tableConfig.handleSort}
                      >
                        Remarks
                      </SortableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndPaginatedData.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell className="font-mono text-sm">
                          {operation.id}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline">
                              {operation.catastropheId}
                            </Badge>
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {getCatastropheDescription(
                                operation.catastropheId,
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline">{operation.valveId}</Badge>
                            <div className="text-xs text-muted-foreground">
                              {getValveName(operation.valveId).split(" - ")[1]}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              operation.actionType === "open"
                                ? "default"
                                : "destructive"
                            }
                            className="capitalize"
                          >
                            {operation.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <div>
                                {formatDateTime(operation.actionTimestamp)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {operation.performedBy}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div
                            className="text-sm text-muted-foreground truncate"
                            title={operation.remarks}
                          >
                            {operation.remarks || "-"}
                          </div>
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
    </div>
  );
};
