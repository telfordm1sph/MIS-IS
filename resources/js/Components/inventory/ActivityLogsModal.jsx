import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Clock,
    PlusCircle,
    Pencil,
    Trash2,
    HelpCircle,
    ServerCrash,
    ArrowRight,
} from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";

// ─── Constants ────────────────────────────────────────────────────────────────

const HIDDEN_FIELDS = [
    "id",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
];

const DEFAULT_ACTION_COLORS = {
    created: {
        bg: "bg-emerald-50  dark:bg-emerald-950",
        text: "text-emerald-700  dark:text-emerald-300",
        border: "border-emerald-200  dark:border-emerald-800",
        dot: "bg-emerald-500",
    },
    updated: {
        bg: "bg-blue-50     dark:bg-blue-950",
        text: "text-blue-700     dark:text-blue-300",
        border: "border-blue-200     dark:border-blue-800",
        dot: "bg-blue-500",
    },
    deleted: {
        bg: "bg-red-50      dark:bg-red-950",
        text: "text-red-700      dark:text-red-300",
        border: "border-red-200      dark:border-red-800",
        dot: "bg-red-500",
    },
    attached: {
        bg: "bg-cyan-50     dark:bg-cyan-950",
        text: "text-cyan-700     dark:text-cyan-300",
        border: "border-cyan-200     dark:border-cyan-800",
        dot: "bg-cyan-500",
    },
    detached: {
        bg: "bg-orange-50   dark:bg-orange-950",
        text: "text-orange-700   dark:text-orange-300",
        border: "border-orange-200   dark:border-orange-800",
        dot: "bg-orange-500",
    },
    assigned: {
        bg: "bg-purple-50   dark:bg-purple-950",
        text: "text-purple-700   dark:text-purple-300",
        border: "border-purple-200   dark:border-purple-800",
        dot: "bg-purple-500",
    },
    unassigned: {
        bg: "bg-pink-50     dark:bg-pink-950",
        text: "text-pink-700     dark:text-pink-300",
        border: "border-pink-200     dark:border-pink-800",
        dot: "bg-pink-500",
    },
    maintenance: {
        bg: "bg-yellow-50   dark:bg-yellow-950",
        text: "text-yellow-700   dark:text-yellow-300",
        border: "border-yellow-200   dark:border-yellow-800",
        dot: "bg-yellow-500",
    },
    repaired: {
        bg: "bg-lime-50     dark:bg-lime-950",
        text: "text-lime-700     dark:text-lime-300",
        border: "border-lime-200     dark:border-lime-800",
        dot: "bg-lime-500",
    },
    default: {
        bg: "bg-zinc-100    dark:bg-zinc-800",
        text: "text-zinc-600     dark:text-zinc-300",
        border: "border-zinc-200     dark:border-zinc-700",
        dot: "bg-zinc-400",
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatKey = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const renderValue = (val) => {
    if (val === null || val === undefined)
        return (
            <span className="text-muted-foreground/40 italic text-[11px]">
                empty
            </span>
        );
    if (Array.isArray(val))
        return val
            .map((item) =>
                typeof item === "object" ? JSON.stringify(item) : String(item),
            )
            .join(", ");
    if (typeof val === "object")
        return (
            <pre className="text-[11px] m-0 whitespace-pre-wrap">
                {JSON.stringify(val, null, 2)}
            </pre>
        );
    if (typeof val === "boolean") return val ? "True" : "False";
    return String(val);
};

const getActionIcon = (action) => {
    const act = action?.toLowerCase();
    if (act?.includes("create")) return <PlusCircle className="h-3.5 w-3.5" />;
    if (act?.includes("update") || act?.includes("edit"))
        return <Pencil className="h-3.5 w-3.5" />;
    if (act?.includes("delete")) return <Trash2 className="h-3.5 w-3.5" />;
    return <HelpCircle className="h-3.5 w-3.5" />;
};

const getActionStyle = (actionType, overrides = {}) => {
    const key = Object.keys({ ...DEFAULT_ACTION_COLORS, ...overrides }).find(
        (k) => actionType?.toLowerCase().includes(k),
    );
    return DEFAULT_ACTION_COLORS[key] ?? DEFAULT_ACTION_COLORS.default;
};

/** Detect the "mode" of a diff: create, delete, or update */
const getDiffMode = (actionType, oldVals, newVals) => {
    const act = actionType?.toLowerCase() ?? "";
    if (
        act.includes("create") ||
        act.includes("attach") ||
        act.includes("assign")
    )
        return "created";
    if (
        act.includes("delete") ||
        act.includes("detach") ||
        act.includes("unassign")
    )
        return "deleted";
    // Fallback: infer from data shape
    const hasOld = oldVals && Object.keys(oldVals).length > 0;
    const hasNew = newVals && Object.keys(newVals).length > 0;
    if (!hasOld && hasNew) return "created";
    if (hasOld && !hasNew) return "deleted";
    return "updated";
};

/** For updates, filter to only changed fields */
const getChangedKeys = (oldVals, newVals) => {
    const allKeys = Array.from(
        new Set([...Object.keys(oldVals || {}), ...Object.keys(newVals || {})]),
    ).filter((k) => !HIDDEN_FIELDS.includes(k));

    return allKeys.filter((k) => {
        const oldStr = JSON.stringify(oldVals?.[k] ?? null);
        const newStr = JSON.stringify(newVals?.[k] ?? null);
        return oldStr !== newStr;
    });
};

// ─── Action Badge ─────────────────────────────────────────────────────────────

const ActionBadge = ({ actionType, actionColors }) => {
    const style = getActionStyle(actionType, actionColors);
    return (
        <Badge
            variant="outline"
            className={cn(
                "rounded-full text-[11px] font-semibold gap-1 px-2 py-0.5 border",
                style.bg,
                style.text,
                style.border,
            )}
        >
            <span
                className={cn(
                    "h-1.5 w-1.5 rounded-full flex-shrink-0",
                    style.dot,
                )}
            />
            {formatKey(actionType)}
        </Badge>
    );
};

// ─── Diff Section ─────────────────────────────────────────────────────────────

const DiffSection = ({ actionType, oldVals, newVals }) => {
    const mode = getDiffMode(actionType, oldVals, newVals);

    // ── Created: only new values ──────────────────────────────────────────────
    if (mode === "created") {
        const keys = Object.keys(newVals || {}).filter(
            (k) => !HIDDEN_FIELDS.includes(k),
        );
        if (!keys.length) return null;

        return (
            <div className="mt-3 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 overflow-hidden">
                <div className="grid grid-cols-2 px-3 py-2 bg-emerald-100/60 dark:bg-emerald-900/30 border-b border-emerald-200/60 dark:border-emerald-800/40">
                    {["Field", "Value"].map((h) => (
                        <span
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/70 dark:text-emerald-400/70"
                        >
                            {h}
                        </span>
                    ))}
                </div>
                {keys.map((key, i) => (
                    <div
                        key={key}
                        className={cn(
                            "grid grid-cols-2 px-3 py-2 gap-2 text-xs",
                            i % 2 === 0
                                ? "bg-background/60"
                                : "bg-emerald-50/30 dark:bg-emerald-950/10",
                        )}
                    >
                        <span className="font-medium text-foreground truncate">
                            {formatKey(key)}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium break-all">
                            {renderValue(newVals?.[key])}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // ── Deleted: only old values ──────────────────────────────────────────────
    if (mode === "deleted") {
        const keys = Object.keys(oldVals || {}).filter(
            (k) => !HIDDEN_FIELDS.includes(k),
        );
        if (!keys.length) return null;

        return (
            <div className="mt-3 rounded-lg border border-red-200/60 dark:border-red-800/40 bg-red-50/40 dark:bg-red-950/20 overflow-hidden">
                <div className="grid grid-cols-2 px-3 py-2 bg-red-100/60 dark:bg-red-900/30 border-b border-red-200/60 dark:border-red-800/40">
                    {["Field", "Value"].map((h) => (
                        <span
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-700/70 dark:text-red-400/70"
                        >
                            {h}
                        </span>
                    ))}
                </div>
                {keys.map((key, i) => (
                    <div
                        key={key}
                        className={cn(
                            "grid grid-cols-2 px-3 py-2 gap-2 text-xs",
                            i % 2 === 0
                                ? "bg-background/60"
                                : "bg-red-50/30 dark:bg-red-950/10",
                        )}
                    >
                        <span className="font-medium text-foreground truncate">
                            {formatKey(key)}
                        </span>
                        <span className="text-red-500 dark:text-red-400 line-through break-all">
                            {renderValue(oldVals?.[key])}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // ── Updated: only changed fields, 3-column diff ───────────────────────────
    const changedKeys = getChangedKeys(oldVals, newVals);
    if (!changedKeys.length) return null;

    return (
        <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] px-3 py-2 bg-muted/60 border-b border-border/60 gap-2">
                {["Field", "", "Before", "", "After"].map((h, idx) => (
                    <span
                        key={idx}
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
                    >
                        {h}
                    </span>
                ))}
            </div>

            {/* Rows */}
            {changedKeys.map((key, i) => (
                <div
                    key={key}
                    className={cn(
                        "grid grid-cols-[1fr_auto_1fr_auto_1fr] px-3 py-2 gap-2 text-xs items-center",
                        i % 2 === 0 ? "bg-background" : "bg-muted/20",
                    )}
                >
                    <span className="font-medium text-foreground truncate">
                        {formatKey(key)}
                    </span>
                    {/* spacer arrow */}
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
                    <span className="text-red-500 dark:text-red-400 line-through break-all">
                        {renderValue(oldVals?.[key])}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium break-all">
                        {renderValue(newVals?.[key])}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Log Card ─────────────────────────────────────────────────────────────────

const LogCard = ({ log, actionColors }) => {
    return (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden mb-3">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {log.action_by?.charAt(0)?.toUpperCase() ?? "S"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-foreground">
                        {log.action_by || "System"}
                    </span>
                    <ActionBadge
                        actionType={log.action_type}
                        actionColors={actionColors}
                    />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {dayjs(log.action_at).format("MMM DD, YYYY • hh:mm A")}
                </div>
            </div>

            {/* Card body */}
            <div className="px-4 py-3">
                {log.remarks && (
                    <div className="mb-3 pl-3 border-l-2 border-primary/40 italic text-sm text-muted-foreground">
                        "{log.remarks}"
                    </div>
                )}
                <DiffSection
                    actionType={log.action_type}
                    oldVals={log.old_values}
                    newVals={log.new_values}
                />
            </div>
        </div>
    );
};

// ─── Timeline Item ────────────────────────────────────────────────────────────

const TimelineItem = ({ log, actionColors, isLast }) => {
    const style = getActionStyle(log.action_type, actionColors);
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
                <div
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 border-background shadow-sm flex-shrink-0",
                        style.bg,
                        style.text,
                    )}
                >
                    {getActionIcon(log.action_type)}
                </div>
                {!isLast && (
                    <div className="w-px flex-1 bg-border/50 my-1 min-h-[16px]" />
                )}
            </div>
            <div className="flex-1 pb-1 min-w-0">
                <LogCard log={log} actionColors={actionColors} />
            </div>
        </div>
    );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const LogSkeleton = () => (
    <div className="space-y-3">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 rounded-xl border border-border/40 p-4 space-y-3">
                    <div className="flex justify-between">
                        <div className="flex gap-2 items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>
            </div>
        ))}
    </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="rounded-full bg-muted p-4">
            <ServerCrash className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">
            No activity history found
        </p>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

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

    return (
        <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="!max-w-[860px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border/60 bg-card/80">
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-base font-semibold">
                            {title}
                        </DialogTitle>
                        {totalLogs > 0 && (
                            <Badge
                                variant="secondary"
                                className="rounded-full text-xs tabular-nums"
                            >
                                {logs.length} / {totalLogs}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="max-h-[65vh] overflow-y-auto px-6 py-5"
                >
                    {logs.length === 0 && loading ? (
                        <LogSkeleton />
                    ) : logs.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div>
                            {logs.map((log, i) => (
                                <TimelineItem
                                    key={log.id}
                                    log={log}
                                    actionColors={actionColors}
                                    isLast={i === logs.length - 1}
                                />
                            ))}
                            {loading && (
                                <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                                    <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                    Fetching more activity…
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ActivityLogsModal;
