import { Button } from "@/components/ui/button";

export const TablePagination = ({ pagination, onChange }) => {
    if (!pagination) return null;

    const currentPage = pagination.current_page ?? pagination.currentPage ?? 1;
    const lastPage = pagination.last_page ?? pagination.lastPage ?? 1;
    const total = pagination.total ?? 0;
    const perPage = pagination.per_page ?? pagination.perPage ?? 15;
    const from = pagination.from ?? (currentPage - 1) * perPage + 1;
    const to = pagination.to ?? Math.min(currentPage * perPage, total);

    // Centred window of up to 5 page buttons
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(lastPage, currentPage + delta);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return (
        <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
            <span>
                Showing {total === 0 ? 0 : from}–{to} of {total} records
            </span>

            <div className="flex items-center gap-1">
                {/* Previous */}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={currentPage <= 1}
                    onClick={() => onChange(currentPage - 1)}
                >
                    Previous
                </Button>

                {/* First page + left ellipsis */}
                {start > 1 && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 text-xs"
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

                {/* Page window */}
                {pages.map((page) => (
                    <Button
                        key={page}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => onChange(page)}
                    >
                        {page}
                    </Button>
                ))}

                {/* Right ellipsis + last page */}
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
                            className="h-7 w-7 p-0 text-xs"
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
                    className="h-7 px-2 text-xs"
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
