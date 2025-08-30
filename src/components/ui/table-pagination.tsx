import React from "react";
import { Pagination } from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { PaginationConfig } from "@/hooks/use-table";

interface TablePaginationProps {
    config: PaginationConfig;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onFirstPage: () => void;
    onLastPage: () => void;
    onNextPage: () => void;
    onPreviousPage: () => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
    pageSizeOptions?: number[];
}

export const TablePagination: React.FC<TablePaginationProps> = ({
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
}) => {
    const { currentPage, pageSize, totalItems, totalPages } = config;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push("...");
            }

            // Show current page and neighbors
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push("...");
            }

            // Show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalPages === 0) {
        return null;
    }

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Items info and page size selector */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                    Showing {startItem}-{endItem} of {totalItems} items
                </span>
                <div className="flex items-center gap-2">
                    <span>Items per page:</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange(parseInt(value))}
                    >
                        <SelectTrigger className="w-[70px]">
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
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onFirstPage}
                    disabled={!canGoPrevious}
                    className="h-8 w-8 p-0"
                >
                    <ChevronFirst className="h-4 w-4" />
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

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <div key={index}>
                            {page === "..." ? (
                                <div className="h-8 w-8 flex items-center justify-center text-muted-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </div>
                            ) : (
                                <Button
                                    variant={page === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onPageChange(page as number)}
                                    className="h-8 w-8 p-0"
                                >
                                    {page}
                                </Button>
                            )}
                        </div>
                    ))}
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
                    <ChevronLast className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};