import { Card, CardContent } from "@/Components/ui/card";
import { Skeleton } from "@/Components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";

export function SummaryCard({
    label,
    total,
    color,
    description,
    pct,
    loading,
}) {
    if (loading) {
        return (
            <div className="rounded-xl p-4 h-[140px] flex flex-col justify-between border border-border/40 shadow-md">
                <Skeleton className="h-3 w-20" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-8" />
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={300}>
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-2xl border-border/40 h-[140px]">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                    {/* Label */}
                    <div className="flex items-center gap-2">
                        <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: color }}
                        />
                        <span
                            className="text-xs font-bold uppercase tracking-wider truncate"
                            style={{ color }}
                        >
                            {label}
                        </span>
                    </div>

                    {/* Total + progress bar */}
                    <div>
                        <div className="text-3xl font-bold text-foreground tabular-nums">
                            {total}
                        </div>
                        {/* Custom progress bar — shadcn doesn't have one, this is cleaner */}
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${pct}%`,
                                    background: `linear-gradient(90deg, ${color}, ${color}80)`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Description + pct */}
                    <div className="flex items-center justify-between gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground truncate min-w-0 flex-1 cursor-default">
                                    {description}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {description}
                            </TooltipContent>
                        </Tooltip>
                        <span className="text-xs font-semibold text-foreground flex-shrink-0">
                            {pct}%
                        </span>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
