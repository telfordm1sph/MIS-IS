import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";

export const useInventoryFilters = ({ filters, pagination, routeName }) => {
    const [searchText, setSearchText] = useState(filters?.search || "");
    const [category, setCategory] = useState(filters?.category || "");
    const [subCategory, setSubCategory] = useState(filters?.subCategory || "");

    // Helper function to encode filters to base64
    const encodeFilters = (filterObj) => {
        const jsonString = JSON.stringify(filterObj);
        return btoa(jsonString);
    };

    // Navigate with filters
    const navigateWithFilters = (filterParams) => {
        router.get(
            route(routeName),
            {
                f: encodeFilters(filterParams),
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Debounced search with useEffect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchText !== filters?.search) {
                const filterParams = {
                    search: searchText,
                    pageSize: pagination.pageSize,
                    page: 1,
                    sortField: filters.sortField,
                    sortOrder: filters.sortOrder,
                    category: category,
                    subCategory: subCategory,
                };

                navigateWithFilters(filterParams);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchText]);

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    const handleCategoryChange = (value) => {
        setCategory(value);
        // Reset subcategory when main category changes
        setSubCategory("");

        const filterParams = {
            search: searchText,
            pageSize: pagination.pageSize,
            page: 1,
            sortField: filters.sortField,
            sortOrder: filters.sortOrder,
            category: value,
            subCategory: "", // Reset subcategory
        };

        navigateWithFilters(filterParams);
    };

    const handleSubCategoryChange = (value) => {
        setSubCategory(value);

        const filterParams = {
            search: searchText,
            pageSize: pagination.pageSize,
            page: 1,
            sortField: filters.sortField,
            sortOrder: filters.sortOrder,
            category: category,
            subCategory: value,
        };

        navigateWithFilters(filterParams);
    };

    const handleResetFilters = () => {
        setSearchText("");
        setCategory("");
        setSubCategory("");

        const filterParams = {
            page: 1,
            pageSize: pagination.pageSize,
        };

        navigateWithFilters(filterParams);
    };

    const handleTableChange = (paginationConfig, tableFilters, sorter) => {
        const filterParams = {
            page: paginationConfig.current,
            pageSize: paginationConfig.pageSize,
            search: searchText,
            category: category,
            subCategory: subCategory,
        };

        if (sorter.field) {
            filterParams.sortField = sorter.field;
            filterParams.sortOrder = sorter.order === "ascend" ? "asc" : "desc";
        } else {
            filterParams.sortField = filters.sortField;
            filterParams.sortOrder = filters.sortOrder;
        }

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
