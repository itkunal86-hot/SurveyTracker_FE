import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface TableConfig<T> {
  sortConfig: SortConfig<T>;
  paginationConfig: PaginationConfig;
  setSortConfig: (config: SortConfig<T>) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  handleSort: (key: keyof T) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function useTable<T>(
  data: T[],
  initialPageSize: number = 10,
  initialSortKey?: keyof T,
  initialSortDirection: SortDirection = "asc",
): {
  tableConfig: TableConfig<T>;
  sortedAndPaginatedData: T[];
  allSortedData: T[];
} {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialSortKey || null,
    direction: initialSortDirection,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Sort the data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return [...data];
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === "desc" ? comparison * -1 : comparison;
    });
  }, [data, sortConfig]);

  // Calculate pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Ensure current page is valid
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, validCurrentPage, pageSize]);

  // Handle sorting
  const handleSort = (key: keyof T) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        // Cycle through: asc -> desc -> null -> asc
        switch (prevConfig.direction) {
          case "asc":
            return { key, direction: "desc" };
          case "desc":
            return { key: null, direction: null };
          default:
            return { key, direction: "asc" };
        }
      } else {
        return { key, direction: "asc" };
      }
    });
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Pagination controls
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));

  const canGoNext = validCurrentPage < totalPages;
  const canGoPrevious = validCurrentPage > 1;

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const tableConfig: TableConfig<T> = {
    sortConfig,
    paginationConfig: {
      currentPage: validCurrentPage,
      pageSize,
      totalItems,
      totalPages,
    },
    setSortConfig,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    handleSort,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious,
  };

  return {
    tableConfig,
    sortedAndPaginatedData: paginatedData,
    allSortedData: sortedData,
  };
}
