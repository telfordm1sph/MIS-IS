import { Card, Typography } from "antd";
import { StackedBarChart, PartsTooltip, getConditionColor } from "./Charts";
import { SummaryCard } from "./SummaryCard";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

const COLORS = [
    "#6366f1",
    "#f97316",
    "#10b981",
    "#ef4444",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
];

export function PartsView({ data, loading }) {
    const cards = Object.entries(data.counts).map(([type, total], index) => ({
        key: type,
        label: type,
        total: Number(total),
        color: COLORS[index % COLORS.length],
        description: "Total units in inventory",
    }));

    const totalAll = cards.reduce((sum, p) => sum + p.total, 0);

    const cardsWithPct = cards.map((card) => ({
        ...card,
        pct: totalAll > 0 ? Math.round((card.total / totalAll) * 100) : 0,
    }));

    const conditionKeys =
        data.chartData.length > 0
            ? Object.keys(data.chartData[0]).filter((k) => k !== "part_type")
            : [];

    const bars = conditionKeys.map((condition, i) => ({
        key: condition,
        label: condition,
        color: getConditionColor(condition, i),
    }));

    return (
        <>
            <motion.div
                className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.07 } },
                }}
            >
                {cardsWithPct.map(({ key, ...props }) => (
                    <motion.div
                        key={key}
                        variants={{
                            hidden: { opacity: 0, scale: 0.95, y: 10 },
                            visible: { opacity: 1, scale: 1, y: 0 },
                        }}
                        transition={{ duration: 0.25 }}
                    >
                        <SummaryCard {...props} loading={loading} />
                    </motion.div>
                ))}
            </motion.div>

            <Card
                loading={loading}
                className="transition-transform transition-shadow duration-300 hover:scale-105 hover:shadow-2xl"
                styles={{
                    body: {
                        padding: 20,
                        borderRadius: 12,
                        boxShadow:
                            "0 4px 6px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                <Title level={5}>Parts by Type & Condition</Title>
                <Text type="secondary" className="block mb-6">
                    Each bar shows the condition breakdown within a part type
                </Text>
                <StackedBarChart
                    data={data.chartData}
                    categoryKey="part_type"
                    bars={bars}
                    tooltipContent={PartsTooltip}
                    loading={loading}
                />
            </Card>
        </>
    );
}
