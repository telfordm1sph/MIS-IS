import React, { useState, useEffect, useRef } from "react";
import { Modal, Timeline, Tag, Typography, Card, Spin, Empty } from "antd";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;

const HIDDEN_FIELDS = [
    "id",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
];

const DEFAULT_ACTION_COLORS = {
    created: "green",
    updated: "blue",
    deleted: "red",
    attached: "cyan",
    detached: "orange",
    assigned: "purple",
    unassigned: "magenta",
    maintenance: "gold",
    repaired: "lime",
};

const ActivityLogsModal = ({
    visible,
    onClose,
    entityId,
    entityType = "Entity",
    apiRoute,
    title = "Activity Logs Timeline",
    actionColors = {},
    perPage = 10,
    renderCustomContent = null,
}) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalLogs, setTotalLogs] = useState(0);
    const scrollRef = useRef(null);

    // Merge custom action colors with defaults
    const mergedActionColors = { ...DEFAULT_ACTION_COLORS, ...actionColors };

    // Reset and fetch initial data when modal opens
    useEffect(() => {
        if (visible && entityId && apiRoute) {
            setLogs([]);
            setPage(1);
            setHasMore(true);
            setTotalLogs(0);
            fetchLogs(1, true);
        }
    }, [visible, entityId, apiRoute]);

    // Fetch logs from API
    const fetchLogs = async (pageNum, reset = false) => {
        if (loading || (!hasMore && !reset)) return;

        setLoading(true);

        try {
            const response = await axios.get(route(apiRoute, entityId), {
                params: {
                    page: pageNum,
                    per_page: perPage,
                },
            });

            const result = response.data;

            setLogs((prev) =>
                reset ? result.data : [...prev, ...result.data],
            );
            setHasMore(result.has_more);
            setTotalLogs(result.total);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle scroll for infinite loading
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Load more when 80% scrolled
        if (scrollPercentage > 0.8 && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchLogs(nextPage);
        }
    };

    const formatKey = (key) => {
        return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const renderValues = (values) => {
        if (!values) return null;

        const filtered = Object.entries(values).filter(
            ([key]) => !HIDDEN_FIELDS.includes(key),
        );

        if (filtered.length === 0) return null;

        return (
            <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
                {filtered.map(([key, val]) => {
                    if (val && typeof val === "object") {
                        return (
                            <li key={key} style={{ marginBottom: 4 }}>
                                <Text strong>{formatKey(key)}:</Text>
                                {renderValues(val)}
                            </li>
                        );
                    }
                    return (
                        <li key={key} style={{ marginBottom: 4 }}>
                            <Text strong>{formatKey(key)}:</Text>{" "}
                            {val?.toString() || "-"}
                        </li>
                    );
                })}
            </ul>
        );
    };

    const getActionColor = (actionType) => {
        // Normalize action type (remove underscores, lowercase)
        const normalizedAction = actionType?.toLowerCase().replace(/_/g, "");

        // Try to find matching color
        const colorKey = Object.keys(mergedActionColors).find(
            (key) => key.toLowerCase().replace(/_/g, "") === normalizedAction,
        );

        return mergedActionColors[colorKey] || "gray";
    };

    const renderDefaultContent = (log) => (
        <Card
            size="small"
            style={{
                marginBottom: 12,
                borderRadius: 10,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <Text strong style={{ fontSize: 15 }}>
                        {log.loggable_type || entityType}{" "}
                        <Tag color={getActionColor(log.action_type)}>
                            {formatKey(log.action_type)}
                        </Tag>
                    </Text>
                </div>
            </div>

            <div style={{ marginTop: 4 }}>
                <Text type="secondary">
                    {dayjs(log.action_at).format("MMM DD YYYY • hh:mm A")}
                    {" • "}
                    {log.action_by ? `By ${log.action_by}` : "System"}
                </Text>
            </div>

            {log.remarks && (
                <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    <Text strong>Remarks:</Text> {log.remarks}
                </Paragraph>
            )}

            {log.old_values && renderValues(log.old_values) && (
                <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    <Text strong>Old Values:</Text>
                    {renderValues(log.old_values)}
                </Paragraph>
            )}

            {log.new_values && renderValues(log.new_values) && (
                <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    <Text strong>New Values:</Text>
                    {renderValues(log.new_values)}
                </Paragraph>
            )}
        </Card>
    );

    const timelineItems = logs.map((log) => ({
        key: log.id,
        color: getActionColor(log.action_type),
        content: renderCustomContent
            ? renderCustomContent(log, {
                  getActionColor,
                  formatKey,
                  renderValues,
              })
            : renderDefaultContent(log),
    }));

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={850}
            title={
                <div>
                    {title}
                    {totalLogs > 0 && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                            {logs.length} / {totalLogs}
                        </Tag>
                    )}
                </div>
            }
        >
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                    maxHeight: "65vh",
                    overflowY: "auto",
                    padding: "0 8px",
                }}
            >
                {logs.length === 0 && !loading ? (
                    <Empty
                        description="No logs found"
                        style={{ padding: "40px 0" }}
                    />
                ) : (
                    <>
                        <Timeline items={timelineItems} />
                        {loading && (
                            <div style={{ textAlign: "center", padding: 20 }}>
                                <Spin tip="Loading more logs...">
                                    <div style={{ height: 20 }} />
                                </Spin>
                            </div>
                        )}

                        {!hasMore && logs.length > 0 && (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: 20,
                                    color: "#999",
                                }}
                            >
                                • End of logs •
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ActivityLogsModal;
