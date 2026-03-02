import { Skeleton } from "@/components/ui/skeleton";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

// ─── Condition meta ───────────────────────────────────────────────────────────

export const CONDITION_META = {
    New: { color: "#3b82f6" },
    Good: { color: "#10b981" },
    Defective: { color: "#ef4444" },
    Used: { color: "#f59e0b" },
    Refurbished: { color: "#a855f7" },
    Active: { color: "#10b981" },
    InActive: { color: "#6b7280" },
};

const FALLBACK_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

export const getConditionColor = (condition, index) =>
    CONDITION_META[condition]?.color ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length];

// ─── Build chartConfig from bars array ───────────────────────────────────────
// shadcn charts require a config object: { [dataKey]: { label, color } }

const buildChartConfig = (bars) =>
    bars.reduce((acc, { key, label, color }) => {
        acc[key] = { label: label ?? key, color };
        return acc;
    }, {});

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const ChartSkeleton = () => (
    <div className="flex items-end gap-3 h-[360px] px-4 pb-6 pt-4">
        {[65, 85, 45, 75, 55, 90, 40, 70, 60].map((h, i) => (
            <Skeleton
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%` }}
            />
        ))}
    </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const ChartEmpty = () => (
    <div className="flex flex-col items-center justify-center h-[360px] gap-2">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <svg
                className="w-5 h-5 text-muted-foreground/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
            </svg>
        </div>
        <p className="text-sm text-muted-foreground">No data available</p>
    </div>
);

// ─── Main chart ───────────────────────────────────────────────────────────────

export function StackedBarChart({ data, categoryKey, bars, loading }) {
    if (loading) return <ChartSkeleton />;
    if (!data?.length) return <ChartEmpty />;

    const chartConfig = buildChartConfig(bars);

    return (
        <ChartContainer config={chartConfig} className="h-[360px] w-full">
            <BarChart
                data={data}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
                barSize={44}
                accessibilityLayer
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border/60"
                />
                <XAxis
                    dataKey={categoryKey}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickMargin={4}
                    allowDecimals={false}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            // show the label (category) at the top
                            labelKey={categoryKey}
                            // show total at bottom
                            indicator="dot"
                        />
                    }
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                />
                <ChartLegend content={<ChartLegendContent />} />

                {bars.map(({ key, color }, i) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        stackId="a"
                        fill={`var(--color-${key})`}
                        radius={
                            i === bars.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                        }
                    />
                ))}
            </BarChart>
        </ChartContainer>
    );
}
