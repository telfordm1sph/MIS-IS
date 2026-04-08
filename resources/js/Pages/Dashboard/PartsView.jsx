import { StackedBarChart, getConditionColor } from "./Charts";
import { SummaryCard } from "./SummaryCard";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/Components/ui/card";

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
            {/* ── Summary Cards ── */}
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

            {/* ── Chart Card ── */}
            <Card className="transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        Parts by Type &amp; Condition
                    </CardTitle>
                    <CardDescription>
                        Each bar shows the condition breakdown within a part
                        type
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StackedBarChart
                        data={data.chartData}
                        categoryKey="part_type"
                        bars={bars}
                        loading={loading}
                    />
                </CardContent>
            </Card>
        </>
    );
}
