import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationConfig } from "@/hooks/use-table";

interface PaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  className?: string;
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      config,
      onPageChange,
      onPageSizeChange,
      onFirstPage,
      onLastPage,
      onNextPage,
      onPreviousPage,
      canGoNext,
      canGoPrevious,
      pageSizeOptions = [5, 10, 20, 50],
      showPageSizeSelector = true,
      className,
      ...props
    },
    ref,
  ) => {
    const { currentPage, totalPages, totalItems, pageSize } = config;

    // Calculate visible page numbers
    const getVisiblePages = () => {
      const maxVisible = 5;
      const pages: (number | string)[] = [];

      if (totalPages <= maxVisible) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first, last, and pages around current
        pages.push(1);

        if (currentPage > 3) {
          pages.push("...");
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (currentPage < totalPages - 2) {
          pages.push("...");
        }

        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }

      return pages;
    };

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4",
          className,
        )}
        {...props}
      >
        {/* Results info */}
        <div className="text-sm text-muted-foreground">
          Showing {totalItems > 0 ? startItem : 0} to {endItem} of {totalItems}{" "}
          results
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          {/* Page size selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onFirstPage}
              disabled={!canGoPrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={!canGoPrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getVisiblePages().map((page, index) =>
                typeof page === "number" ? (
                  <Button
                    key={index}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ) : (
                  <span
                    key={index}
                    className="h-8 w-8 flex items-center justify-center text-muted-foreground"
                  >
                    {page}
                  </span>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={!canGoNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onLastPage}
              disabled={!canGoNext}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

Pagination.displayName = "Pagination";

export { Pagination };
