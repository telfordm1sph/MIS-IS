export const getPaginationConfig = (pagination) => ({
    current: pagination.current || pagination.currentPage,
    pageSize: pagination.pageSize || pagination.perPage,
    total: pagination.total,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ["10", "20", "50", "100"],
    showTotal: (total, range) =>
        `Showing ${range[0]}-${range[1]} of ${total} entries`,
});
