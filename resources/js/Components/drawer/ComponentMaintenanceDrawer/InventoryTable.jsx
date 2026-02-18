import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Input, message } from "antd";
import axios from "axios";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";

const { Search } = Input;

const InventoryTable = ({
    componentType,
    fetchEndpoint,
    selectedType,
    onSelectComponent,
    columns,
}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });
    const [searchText, setSearchText] = useState("");
    console.log("Component Type:", componentType, "Part Type:", selectedType);

    // Reset state when component type changes
    useEffect(() => {
        setData([]);
        setSearchText("");
        setPagination({ current: 1, pageSize: 5, total: 0 });
        fetchData(1, 5, "", selectedType); // pass selectedType explicitly
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
                    selected_type: st, // <-- filter by part type
                },
            });

            const responseData = response.data;
            const items = (responseData.data || []).map((item) => ({
                ...item,
                key: `${item.id}-${item.condition || "default"}-${uuidv4()}`,
            }));

            setData(items);
            setPagination({
                current: responseData.current_page || page,
                pageSize: responseData.per_page || pageSize,
                total: responseData.total || 0,
            });
        } catch (error) {
            console.error("Error fetching inventory:", error);
            message.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce((value) => fetchData(1, pagination.pageSize, value), 500),
        [pagination.pageSize, fetchEndpoint, componentType],
    );

    useEffect(() => {
        if (searchText !== undefined) {
            debouncedSearch(searchText);
        }
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchText, debouncedSearch]);

    return (
        <>
            <Search
                placeholder={`Search ${componentType || "inventory"}`}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ marginBottom: 16, width: 300 }}
            />
            <Table
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey={(record) => record.key}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showTotal: (total) => `Total ${total} items`,
                    showSizeChanger: true,
                    onChange: (page, pageSize) =>
                        fetchData(page, pageSize, searchText),
                }}
                scroll={{ x: 1000 }}
                size="small"
            />
        </>
    );
};

export default InventoryTable;
