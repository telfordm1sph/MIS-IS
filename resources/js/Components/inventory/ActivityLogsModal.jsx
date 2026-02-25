import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    Timeline,
    Tag,
    Typography,
    Card,
    Spin,
    Empty,
    Row,
    Col,
    Divider,
    Avatar,
    Space,
} from "antd";
import {
    ClockCircleOutlined,
    UserOutlined,
    PlusCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    QuestionCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

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
    title = "Activity History",
    actionColors = {},
    perPage = 10,
}) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalLogs, setTotalLogs] = useState(0);
    const scrollRef = useRef(null);

    const mergedActionColors = { ...DEFAULT_ACTION_COLORS, ...actionColors };

    useEffect(() => {
        if (visible && entityId && apiRoute) {
            setLogs([]);
            setPage(1);
            setHasMore(true);
            fetchLogs(1, true);
        }
    }, [visible, entityId, apiRoute]);

    const fetchLogs = async (pageNum, reset = false) => {
        if (loading || (!hasMore && !reset)) return;
        setLoading(true);
        try {
            const url =
                typeof route === "function"
                    ? route(apiRoute, entityId)
                    : `${apiRoute}/${entityId}`;
            const response = await axios.get(url, {
                params: { page: pageNum, per_page: perPage },
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

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (
            scrollHeight - scrollTop <= clientHeight + 50 &&
            hasMore &&
            !loading
        ) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchLogs(nextPage);
        }
    };

    const formatKey = (key) =>
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    // --- FIX FOR [object Object] ---
    const renderValue = (val) => {
        if (val === null || val === undefined) return "-";

        // If it's an array, join items or stringify them
        if (Array.isArray(val)) {
            return val
                .map((item) =>
                    typeof item === "object"
                        ? JSON.stringify(item)
                        : String(item),
                )
                .join(", ");
        }

        // If it's an object, stringify it so it doesn't crash/show [object Object]
        if (typeof val === "object") {
            return (
                <pre
                    style={{
                        fontSize: "11px",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {JSON.stringify(val, null, 2)}
                </pre>
            );
        }

        // If it's a boolean
        if (typeof val === "boolean") return val ? "True" : "False";

        return String(val);
    };

    const getActionIcon = (action) => {
        const act = action?.toLowerCase();
        if (act?.includes("create")) return <PlusCircleOutlined />;
        if (act?.includes("update") || act?.includes("edit"))
            return <EditOutlined />;
        if (act?.includes("delete")) return <DeleteOutlined />;
        return <QuestionCircleOutlined />;
    };

    const DiffSection = ({ oldVals, newVals }) => {
        const keys = Array.from(
            new Set([
                ...Object.keys(oldVals || {}),
                ...Object.keys(newVals || {}),
            ]),
        ).filter((k) => !HIDDEN_FIELDS.includes(k));

        if (keys.length === 0) return null;

        return (
            <div
                style={{
                    marginTop: 12,
                    padding: "12px",
                    background: "rgba(125,125,125,0.05)",
                    borderRadius: 8,
                }}
            >
                <Row gutter={16} style={{ marginBottom: 8 }}>
                    <Col span={8}>
                        <Text
                            type="secondary"
                            strong
                            style={{ fontSize: "11px" }}
                        >
                            FIELD
                        </Text>
                    </Col>
                    <Col span={8}>
                        <Text
                            type="secondary"
                            strong
                            style={{ fontSize: "11px" }}
                        >
                            OLD VALUE
                        </Text>
                    </Col>
                    <Col span={8}>
                        <Text
                            type="secondary"
                            strong
                            style={{ fontSize: "11px" }}
                        >
                            NEW VALUE
                        </Text>
                    </Col>
                </Row>
                {keys.map((key) => (
                    <Row
                        gutter={16}
                        key={key}
                        style={{
                            marginBottom: 6,
                            borderBottom: "1px solid rgba(125,125,125,0.1)",
                            paddingBottom: 4,
                        }}
                    >
                        <Col span={8}>
                            <Text style={{ fontSize: "12px", fontWeight: 500 }}>
                                {formatKey(key)}
                            </Text>
                        </Col>
                        <Col span={8}>
                            <Text
                                delete
                                type="danger"
                                style={{ fontSize: "12px" }}
                            >
                                {renderValue(oldVals?.[key])}
                            </Text>
                        </Col>
                        <Col span={8}>
                            <Text
                                type="success"
                                strong
                                style={{ fontSize: "12px" }}
                            >
                                {renderValue(newVals?.[key])}
                            </Text>
                        </Col>
                    </Row>
                ))}
            </div>
        );
    };

    const renderDefaultContent = (log) => (
        <Card
            size="small"
            bordered
            style={{ borderRadius: 10, marginBottom: 8 }}
        >
            <Row justify="space-between" align="middle">
                <Col>
                    <Space size="small">
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text strong>{log.action_by || "System"}</Text>
                        <Tag
                            color={
                                mergedActionColors[log.action_type] || "gray"
                            }
                        >
                            {formatKey(log.action_type)}
                        </Tag>
                    </Space>
                </Col>
                <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(log.action_at).format("MMM DD, YYYY • hh:mm A")}
                    </Text>
                </Col>
            </Row>

            {log.remarks && (
                <Paragraph
                    style={{
                        marginTop: 10,
                        padding: "8px",
                        borderLeft: "3px solid #d9d9d9",
                        background: "rgba(125,125,125,0.03)",
                    }}
                >
                    <Text italic>"{log.remarks}"</Text>
                </Paragraph>
            )}

            <DiffSection oldVals={log.old_values} newVals={log.new_values} />
        </Card>
    );

    const timelineItems = logs.map((log) => ({
        key: log.id,
        dot: getActionIcon(log.action_type),
        color: mergedActionColors[log.action_type] || "gray",
        children: renderDefaultContent(log),
    }));

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={850}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{title}</span>
                    {totalLogs > 0 && (
                        <Tag color="processing">
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
                    padding: "10px 10px 0 10px",
                }}
            >
                {logs.length === 0 && !loading ? (
                    <Empty description="No history found" />
                ) : (
                    <Timeline items={timelineItems} />
                )}

                {loading && (
                    <div style={{ textAlign: "center", padding: 20 }}>
                        <Spin tip="Fetching..." />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ActivityLogsModal;
