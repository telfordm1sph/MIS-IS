import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Skeleton } from "@/Components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    X,
    PackageSearch,
} from "lucide-react";

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const Pagination = ({
    current,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    loading,
}) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
    const to = Math.min(current * pageSize, total);

    return (
        <div className="flex items-center justify-between px-1 pt-3 border-t border-border/50">
            {/* Total + page size */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                    {total === 0 ? "No items" : `${from}–${to} of ${total}`}
                </span>
                <div className="flex items-center gap-1.5">
                    <span>Rows</span>
                    <select
                        value={pageSize}
                        onChange={(e) =>
                            onPageSizeChange(Number(e.target.value))
                        }
                        disabled={loading}
                        className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    >
                        {PAGE_SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-1">
                {[
                    {
                        icon: ChevronsLeft,
                        label: "First",
                        onClick: () => onPageChange(1),
                        disabled: current === 1,
                    },
                    {
                        icon: ChevronLeft,
                        label: "Prev",
                        onClick: () => onPageChange(current - 1),
                        disabled: current === 1,
                    },
                    {
                        icon: ChevronRight,
                        label: "Next",
                        onClick: () => onPageChange(current + 1),
                        disabled: current === totalPages,
                    },
                    {
                        icon: ChevronsRight,
                        label: "Last",
                        onClick: () => onPageChange(totalPages),
                        disabled: current === totalPages,
                    },
                ].map(({ icon: Icon, label, onClick, disabled }) => (
                    <Button
                        key={label}
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onClick}
                        disabled={disabled || loading}
                        aria-label={label}
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </Button>
                ))}

                <span className="mx-1 text-xs text-muted-foreground tabular-nums">
                    {current} / {totalPages}
                </span>
            </div>
        </div>
    );
};

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({ searchText, componentType }) => (
    <tr>
        <td colSpan={999}>
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                    <PackageSearch className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                    {searchText
                        ? `No results for "${searchText}"`
                        : `No ${componentType || "inventory"} available`}
                </p>
            </div>
        </td>
    </tr>
);

// ── Skeleton rows ─────────────────────────────────────────────────────────────

const SkeletonRows = ({ count = 5, colCount = 4 }) =>
    Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-border/40">
            {Array.from({ length: colCount }).map((_, j) => (
                <td key={j} className="px-3 py-2.5">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    ));

// ── Main component ────────────────────────────────────────────────────────────

const InventoryTable = ({
    componentType,
    fetchEndpoint,
    selectedType,
    onSelectComponent,
    columns = [],
}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });
    const [searchText, setSearchText] = useState("");

    // Reset and refetch when type/endpoint/selectedType changes
    useEffect(() => {
        setData([]);
        setSearchText("");
        setPagination({ current: 1, pageSize: 5, total: 0 });
        fetchData(1, 5, "", selectedType);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [componentType, fetchEndpoint, selectedType]);

    const fetchData = async (
        page = 1,
        pageSize = 5,
        search = "",
        st = selectedType,
    ) => {
        if (!componentType || !fetchEndpoint) return;
        setLoading(true);
        try {
            const response = await axios.get(fetchEndpoint, {
                params: {
                    page,
                    page_size: pageSize,
                    search,
                    selected_type: st,
                },
            });
            const rd = response.data;
            setData(
                (rd.data || []).map((item) => ({
                    ...item,
                    key: `${item.id}-${item.condition || "default"}-${uuidv4()}`,
                })),
            );
            setPagination({
                current: rd.current_page || page,
                pageSize: rd.per_page || pageSize,
                total: rd.total || 0,
            });
        } catch (error) {
            console.error("Error fetching inventory:", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    // Debounced search — recreate when deps change
    const debouncedSearch = useCallback(
        debounce((value) => fetchData(1, pagination.pageSize, value), 500),
        [pagination.pageSize, fetchEndpoint, componentType],
    );

    useEffect(() => {
        if (searchText !== undefined) debouncedSearch(searchText);
        return () => debouncedSearch.cancel();
    }, [searchText, debouncedSearch]);

    const handlePageChange = (page) => {
        fetchData(page, pagination.pageSize, searchText);
        setPagination((p) => ({ ...p, current: page }));
    };

    const handlePageSizeChange = (size) => {
        fetchData(1, size, searchText);
        setPagination((p) => ({ ...p, current: 1, pageSize: size }));
    };

    const handleClearSearch = () => setSearchText("");

    // Derive column count for skeleton
    const colCount = columns.length || 4;

    return (
        <div className="space-y-3">
            {/* Search */}
            <div className="relative w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder={`Search ${componentType || "inventory"}…`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-8 pr-8 h-8 text-sm"
                />
                {searchText && (
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto" style={{ minWidth: 0 }}>
                    <table
                        className="w-full text-sm border-collapse"
                        style={{ minWidth: 1000 }}
                    >
                        {/* Head */}
                        <thead>
                            <tr className="bg-muted/60 border-b border-border">
                                {columns.map((col, i) => (
                                    <th
                                        key={col.key || col.dataIndex || i}
                                        className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                                        style={{ width: col.width }}
                                    >
                                        {col.title}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody>
                            {loading ? (
                                <SkeletonRows
                                    count={pagination.pageSize}
                                    colCount={colCount}
                                />
                            ) : data.length === 0 ? (
                                <EmptyState
                                    searchText={searchText}
                                    componentType={componentType}
                                />
                            ) : (
                                data.map((record, rowIndex) => (
                                    <tr
                                        key={record.key}
                                        className={cn(
                                            "border-b border-border/40 transition-colors",
                                            rowIndex % 2 === 0
                                                ? "bg-background"
                                                : "bg-muted/20",
                                            "hover:bg-primary/5",
                                        )}
                                    >
                                        {columns.map((col, colIndex) => (
                                            <td
                                                key={
                                                    col.key ||
                                                    col.dataIndex ||
                                                    colIndex
                                                }
                                                className="px-3 py-2.5 align-middle"
                                                style={{ width: col.width }}
                                            >
                                                {col.render
                                                    ? col.render(
                                                          col.dataIndex
                                                              ? record[
                                                                    col
                                                                        .dataIndex
                                                                ]
                                                              : undefined,
                                                          record,
                                                          rowIndex,
                                                      )
                                                    : col.dataIndex
                                                      ? record[col.dataIndex]
                                                      : null}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
            />
        </div>
    );
};

export default InventoryTable;
