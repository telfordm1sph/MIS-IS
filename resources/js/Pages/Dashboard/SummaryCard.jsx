import { Card, Progress, Typography, Tooltip } from "antd";

const { Text } = Typography;

export function SummaryCard({
    label,
    total,
    color,
    description,
    pct,
    loading,
}) {
    return (
        <Card
            size="small"
            loading={loading}
            variant="borderless"
            className="transition-transform transition-shadow duration-300 hover:scale-105 hover:shadow-2xl"
            styles={{
                body: {
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: 140,
                    borderRadius: 12,
                    boxShadow:
                        "0 4px 6px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.1)",
                },
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                />
                <Text
                    strong
                    className="text-xs uppercase tracking-wider"
                    style={{ color }}
                >
                    {label}
                </Text>
            </div>

            <div className="mb-2">
                <div className="text-3xl font-bold">{total}</div>
                <Progress
                    percent={pct}
                    showInfo={false}
                    size="small"
                    className="mt-1"
                    strokeColor={{
                        "0%": color,
                        "100%": `${color}80`,
                    }}
                />
            </div>

            <div className="flex items-center mt-2" style={{ gap: 8 }}>
                <Tooltip title={description}>
                    <Text
                        type="secondary"
                        style={{
                            fontSize: 12,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        {description}
                    </Text>
                </Tooltip>
                <Text
                    strong
                    style={{
                        fontSize: 12,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                    }}
                >
                    {pct}%
                </Text>
            </div>
        </Card>
    );
}
