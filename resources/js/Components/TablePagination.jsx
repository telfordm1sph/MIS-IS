import { Button } from "@/components/ui/button";
import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const TablePagination = ({ pagination, onChange, onChangePerPage }) => {
    if (!pagination) return null;

    const currentPage = pagination.current_page ?? pagination.currentPage ?? 1;
    const lastPage = pagination.last_page ?? pagination.lastPage ?? 1;
    const total = pagination.total ?? 0;
    const perPage = pagination.per_page ?? pagination.perPage ?? 15;
    const from = pagination.from ?? (currentPage - 1) * perPage + 1;
    const to = pagination.to ?? Math.min(currentPage * perPage, total);

    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(lastPage, currentPage + delta);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const perPageOptions = [10, 15, 25, 50, 100];

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 py-3 text-sm text-muted-foreground">
            {/* Left: Showing records & Rows per page */}
            <div className="flex items-center gap-4">
                <span>
                    Showing {total === 0 ? 0 : from}–{to} of {total} records
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Rows</span>
                    <Select
                        value={String(perPage)} // use perPage instead of undefined pageSize
                        onChange={(e) =>
                            onChangePerPage?.(parseInt(e.target.value))
                        }
                    >
                        <SelectTrigger className="h-7 w-16 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 15, 25, 50, 100].map(
                                (
                                    s, // align with your perPageOptions
                                ) => (
                                    <SelectItem key={s} value={String(s)}>
                                        {s}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Right: Pagination buttons */}
            <div className="flex items-center gap-1">
                {/* Previous */}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs rounded-md"
                    disabled={currentPage <= 1}
                    onClick={() => onChange(currentPage - 1)}
                >
                    Previous
                </Button>

                {/* Page window */}
                {start > 1 && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-xs rounded-md"
                            onClick={() => onChange(1)}
                        >
                            1
                        </Button>
                        {start > 2 && (
                            <span className="px-1 text-muted-foreground/40">
                                …
                            </span>
                        )}
                    </>
                )}

                {pages.map((page) => (
                    <Button
                        key={page}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs rounded-md"
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => onChange(page)}
                    >
                        {page}
                    </Button>
                ))}

                {end < lastPage && (
                    <>
                        {end < lastPage - 1 && (
                            <span className="px-1 text-muted-foreground/40">
                                …
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-xs rounded-md"
                            onClick={() => onChange(lastPage)}
                        >
                            {lastPage}
                        </Button>
                    </>
                )}

                {/* Next */}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs rounded-md"
                    disabled={currentPage >= lastPage}
                    onClick={() => onChange(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default TablePagination;
