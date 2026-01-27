// @/Hooks/useTableConfig.js
import { useMemo } from "react";

export const useTableConfig = ({
    filters,
    pagination,
    renderCategory = null,
    columnDefinitions,
    tableOptions = {},
}) => {
    const {
        bordered = true,
        scroll = { y: "70vh" },
        rowKey = "id",
        pageSizeOptions = ["10", "20", "50", "100"],
    } = tableOptions;

    // Generate columns
    const columns = useMemo(() => {
        return columnDefinitions.map((col) => {
            const baseConfig = { ...col };

            if (col.sorter) {
                baseConfig.sorter = true;
                baseConfig.sortOrder =
                    filters.sortField === col.dataIndex
                        ? filters.sortOrder === "asc"
                            ? "ascend"
                            : "descend"
                        : null;
            }

            if (col.isCategory && renderCategory) {
                baseConfig.render = (value) =>
                    renderCategory(value, col.uppercase);
            }

            return baseConfig;
        });
    }, [
        filters.sortField,
        filters.sortOrder,
        renderCategory,
        columnDefinitions,
    ]);

    // Generate pagination config
    const paginationConfig = useMemo(
        () => ({
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions,
            showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
        }),
        [
            pagination.current,
            pagination.pageSize,
            pagination.total,
            pageSizeOptions,
        ]
    );

    return {
        columns,
        paginationConfig,
        bordered,
        scroll,
        rowKey,
    };
};
