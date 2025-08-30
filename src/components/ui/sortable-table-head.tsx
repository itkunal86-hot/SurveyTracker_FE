import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";
import { SortDirection } from "@/hooks/use-table";

interface SortableTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey?: string;
  currentSortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  children: React.ReactNode;
  sortable?: boolean;
}

const SortableTableHead = React.forwardRef<
  HTMLTableCellElement,
  SortableTableHeadProps
>(
  (
    {
      className,
      sortKey,
      currentSortKey,
      sortDirection,
      onSort,
      children,
      sortable = true,
      ...props
    },
    ref,
  ) => {
    const isSorted = sortKey && currentSortKey === sortKey;
    const isClickable = sortable && sortKey && onSort;

    const getSortIcon = () => {
      if (!isSorted || !sortDirection) {
        return <ChevronsUpDown className="ml-2 h-4 w-4" />;
      }

      return sortDirection === "asc" ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronDown className="ml-2 h-4 w-4" />
      );
    };

    const handleClick = () => {
      if (isClickable) {
        onSort(sortKey);
      }
    };

    return (
      <TableHead
        ref={ref}
        className={cn(
          isClickable &&
            "cursor-pointer select-none hover:bg-muted/50 transition-colors",
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-center">
          <span>{children}</span>
          {sortable && sortKey && getSortIcon()}
        </div>
      </TableHead>
    );
  },
);

SortableTableHead.displayName = "SortableTableHead";

export { SortableTableHead };
