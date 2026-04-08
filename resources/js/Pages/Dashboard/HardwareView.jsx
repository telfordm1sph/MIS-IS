import { StackedBarChart } from "./Charts";
import { SummaryCard } from "./SummaryCard";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/Components/ui/card";

const STATUS_META = {
    active: {
        label: "Active",
        color: "#10b981",
        description: "Currently in use",
    },
    new: {
        label: "New",
        color: "#3b82f6",
        description: "Recently acquired, not yet deployed",
    },
    inactive: {
        label: "Inactive",
        color: "#f59e0b",
        description: "Not in use but functional",
    },
    defective: {
        label: "Defective",
        color: "#ef4444",
        description: "Damaged or needs repair",
    },
};

export function HardwareView({ data, loading }) {
    const cards = Object.entries(data.counts).map(([key, total]) => ({
        key,
        total: Number(total),
        ...(STATUS_META[key] ?? {
            label: key,
            color: "#6b7280",
            description: "—",
        }),
    }));

    const totalAll = cards.reduce((sum, s) => sum + s.total, 0);

    const cardsWithPct = cards.map((card) => ({
        ...card,
        pct: totalAll > 0 ? Math.round((card.total / totalAll) * 100) : 0,
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
                        Hardware by Category &amp; Status
                    </CardTitle>
                    <CardDescription>
                        Each bar shows the status breakdown within a category
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StackedBarChart
                        data={data.chartData}
                        categoryKey="category"
                        bars={Object.entries(STATUS_META).map(
                            ([key, { label, color }]) => ({
                                key,
                                label,
                                color,
                            }),
                        )}
                        loading={loading}
                    />
                </CardContent>
            </Card>
        </>
    );
}
