import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Search, Filter, RotateCcw } from "lucide-react";

const InventoryHeaderWithFilters = ({
    title,
    categoryCounts = {},
    categoryConfig = {},
    searchText,
    category,
    subCategory,
    onSearchChange,
    onCategoryChange,
    onSubCategoryChange,
    hasActiveFilters,
    onResetFilters,
    searchPlaceholder = "Search hardware...",
    categoryPlaceholder = "Filter by category",
    subCategoryPlaceholder = "Filter by hardware type",
    showTags = true,
}) => {
    const totalCount = Object.values(categoryCounts).reduce(
        (sum, count) => sum + count,
        0,
    );

    const statusCategories = ["New", "Inactive", "Defective"];
    const showSubCategory = statusCategories.includes(category);
    const hardwareCategories = Object.keys(categoryCounts).filter(
        (cat) => !statusCategories.includes(cat),
    );

    return (
        <div className="grid gap-3 my-2">
            {/* ── Category tags ── */}
            {showTags && (
                <div className="flex flex-wrap gap-1.5">
                    {/* Total pill */}
                    <Badge
                        variant="secondary"
                        className="rounded-full text-xs font-medium px-2.5 py-0.5"
                    >
                        All: {totalCount}
                    </Badge>

                    {Object.entries(categoryCounts).map(([cat, count]) => {
                        const config =
                            categoryConfig[cat?.toLowerCase()] ||
                            categoryConfig.default ||
                            {};

                        return (
                            <Badge
                                key={cat}
                                variant="outline"
                                className={cn(
                                    "rounded-full text-xs font-medium px-2.5 py-0.5 gap-1 cursor-pointer transition-colors",
                                    category === cat
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "hover:bg-muted",
                                )}
                                onClick={() =>
                                    onCategoryChange(
                                        category === cat ? undefined : cat,
                                    )
                                }
                            >
                                {config.icon && (
                                    <span className="inline-flex items-center">
                                        {React.isValidElement(config.icon)
                                            ? React.cloneElement(config.icon, {
                                                  width: 11,
                                                  height: 11,
                                              })
                                            : config.icon}
                                    </span>
                                )}
                                {cat}: {count}
                            </Badge>
                        );
                    })}
                </div>
            )}

            {/* ── Controls row ── */}
            <div
                className={cn(
                    "grid gap-2",
                    showSubCategory
                        ? "grid-cols-[1fr_auto_auto_auto]"
                        : "grid-cols-[1fr_auto_auto]",
                )}
            >
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchText ?? ""}
                        onChange={onSearchChange}
                        className="pl-8 h-9 text-sm"
                    />
                </div>

                {/* Category select */}
                <Select
                    value={category || "__all__"}
                    onValueChange={(val) =>
                        onCategoryChange(val === "__all__" ? undefined : val)
                    }
                >
                    <SelectTrigger className="h-9 min-w-[160px] text-sm gap-1.5">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <SelectValue placeholder={categoryPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {Object.entries(categoryCounts).map(([cat, count]) => (
                            <SelectItem key={cat} value={cat}>
                                {cat} ({count})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Sub-category select */}
                {showSubCategory && (
                    <Select
                        value={subCategory || "__all__"}
                        onValueChange={(val) =>
                            onSubCategoryChange(
                                val === "__all__" ? undefined : val,
                            )
                        }
                    >
                        <SelectTrigger className="h-9 min-w-[160px] text-sm gap-1.5">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <SelectValue placeholder={subCategoryPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Types</SelectItem>
                            {hardwareCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Reset button */}
                {hasActiveFilters && (
                    <Button
                        size="sm"
                        variant="default"
                        className="h-9 gap-1.5 text-sm"
                        onClick={onResetFilters}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
};

export default InventoryHeaderWithFilters;
