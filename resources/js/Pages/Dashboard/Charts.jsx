import { Typography } from "antd";
import {
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from "recharts";

const { Text } = Typography;

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

// ✅ Exported so consumers can create their own label-aware tooltips
export const makeTooltip =
    (metaResolver) =>
    ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);

        return (
            <div className="bg-base-300 border border-gray-200 rounded-lg p-3 shadow-lg min-w-[170px]">
                <p className="text-base text-sm mb-2">{label}</p>
                {payload.map((p) => (
                    <div
                        key={p.dataKey}
                        className="flex items-center justify-between gap-3 mb-1"
                    >
                        <span className="flex items-center gap-1.5 text-gray-600">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: p.fill }}
                            />
                            {metaResolver(p.dataKey) ?? p.dataKey}
                        </span>
                        <span className="text-base">{p.value}</span>
                    </div>
                ))}
                <div className="border-t border-gray-100 mt-1.5 pt-1.5 flex justify-between">
                    <Text type="secondary" className="text-xs">
                        Total
                    </Text>
                    <span className="text-base">{total}</span>
                </div>
            </div>
        );
    };

// ✅ Generic fallbacks — just pass the raw key as the label
export const HardwareTooltip = makeTooltip((key) => key);
export const PartsTooltip = makeTooltip((key) => key);

export function StackedBarChart({
    data,
    categoryKey,
    bars,
    tooltipContent,
    loading,
}) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-[360px]">
                Loading chart data...
            </div>
        );
    }

    if (!data?.length) {
        return (
            <div className="flex justify-center items-center h-[360px]">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={360}>
            <BarChart
                data={data}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
                barSize={44}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey={categoryKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                />
                {/* ✅ tooltipContent is a function reference, not a JSX element */}
                <Tooltip content={tooltipContent} />
                <Legend iconType="circle" iconSize={8} />
                {bars.map(({ key, color, label }, i) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        name={label ?? key}
                        stackId="a"
                        fill={color}
                        radius={
                            i === bars.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                        }
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
