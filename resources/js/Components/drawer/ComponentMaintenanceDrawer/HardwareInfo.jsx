import React from "react";
import { Badge } from "@/Components/ui/badge";

const HardwareInfo = ({ hardware, entity, fields }) => {
    const target = entity || hardware;

    // Default fields for hardware if not provided
    const defaultFields = [
        { label: "Hostname", key: "hostname" },
        { label: "Brand", key: "brand" },
        { label: "Model", key: "model" },
        { label: "Category", key: "category" },
        { label: "Issued To", key: "issued_to_label" },
    ];

    const displayFields = fields || defaultFields;

    // Map Ant Design color names → Tailwind badge variants / custom classes
    const statusColorMap = {
        success:
            "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
        warning:
            "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
        error: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
        processing:
            "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
        default:
            "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
        green: "bg-emerald-100 text-emerald-700 border-emerald-200",
        red: "bg-red-100 text-red-700 border-red-200",
        orange: "bg-orange-100 text-orange-700 border-orange-200",
        yellow: "bg-amber-100 text-amber-700 border-amber-200",
        cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
        purple: "bg-purple-100 text-purple-700 border-purple-200",
        geekblue: "bg-indigo-100 text-indigo-700 border-indigo-200",
        magenta: "bg-pink-100 text-pink-700 border-pink-200",
        volcano: "bg-orange-100 text-orange-700 border-orange-200",
        gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
        lime: "bg-lime-100 text-lime-700 border-lime-200",
    };

    const statusClass =
        statusColorMap[target?.status_color] || statusColorMap.default;

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-muted/40 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                    Asset Information
                </h3>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 divide-x divide-y divide-border/60">
                {displayFields.map(({ label, key }) => (
                    <div key={key} className="px-4 py-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                            {label}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {target?.[key] || "—"}
                        </p>
                    </div>
                ))}

                {/* Status spans another row */}
                <div className="px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                        Status
                    </p>
                    <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
                    >
                        {target?.status_label || "—"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default HardwareInfo;
