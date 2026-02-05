import { useState, useMemo, useEffect } from "react";
import debounce from "lodash/debounce";
import { router } from "@inertiajs/react";

export const useInventoryFilters = ({ filters, pagination, routeName }) => {
    const [searchText, setSearchText] = useState(filters?.search || "");
    const [category, setCategory] = useState(filters?.category || "");
    const [subCategory, setSubCategory] = useState(filters?.subCategory || "");

    // Helper function to encode filters to base64
    const encodeFilters = (filterObj) => btoa(JSON.stringify(filterObj));

    // Navigate with filters
    const navigateWithFilters = (filterParams) => {
        router.get(
            route(routeName),
            { f: encodeFilters(filterParams) },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Memoized debounced search function
    const debouncedSearch = useMemo(
        () =>
            debounce((value, cat, sub) => {
                // Only trigger navigation if searchText changed
                if (value !== filters?.search) {
                    navigateWithFilters({
                        search: value,
                        pageSize: pagination.pageSize,
                        page: 1,
                        sortField: filters.sortField,
                        sortOrder: filters.sortOrder,
                        category: cat,
                        subCategory: sub,
                    });
                }
            }, 500),
        [
            filters.sortField,
            filters.sortOrder,
            filters.search,
            pagination.pageSize,
            routeName,
        ],
    );

    // Trigger debounced search when searchText, category, or subCategory changes
    useEffect(() => {
        debouncedSearch(searchText, category, subCategory);
    }, [searchText, category, subCategory, debouncedSearch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => debouncedSearch.cancel();
    }, [debouncedSearch]);

    // Handlers
    const handleSearch = (e) => setSearchText(e.target.value);

    const handleCategoryChange = (value) => {
        setCategory(value);
        setSubCategory("");
        navigateWithFilters({
            search: searchText,
            pageSize: pagination.pageSize,
            page: 1,
            sortField: filters.sortField,
            sortOrder: filters.sortOrder,
            category: value,
            subCategory: "",
        });
    };

    const handleSubCategoryChange = (value) => {
        setSubCategory(value);
        navigateWithFilters({
            search: searchText,
            pageSize: pagination.pageSize,
            page: 1,
            sortField: filters.sortField,
            sortOrder: filters.sortOrder,
            category,
            subCategory: value,
        });
    };

    const handleResetFilters = () => {
        setSearchText("");
        setCategory("");
        setSubCategory("");
        navigateWithFilters({ page: 1, pageSize: pagination.pageSize });
    };

    const handleTableChange = (paginationConfig, tableFilters, sorter) => {
        const filterParams = {
            page: paginationConfig.current,
            pageSize: paginationConfig.pageSize,
            search: searchText,
            category,
            subCategory,
            sortField: sorter.field || filters.sortField,
            sortOrder:
                sorter.field && sorter.order
                    ? sorter.order === "ascend"
                        ? "asc"
                        : "desc"
                    : filters.sortOrder,
        };
        navigateWithFilters(filterParams);
    };

    return {
        searchText,
        category,
        subCategory,
        handleSearch,
        handleCategoryChange,
        handleSubCategoryChange,
        handleResetFilters,
        handleTableChange,
    };
};
