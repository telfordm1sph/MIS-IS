import React, { useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/Components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Badge } from "@/Components/ui/badge";
import { Skeleton } from "@/Components/ui/skeleton";
import { Separator } from "@/Components/ui/separator";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Cpu, Package, Code2, ServerCrash } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Each color has light + dark mode classes for full theme support
const COLOR_MAP = {
    green: {
        classes:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
    },
    red: {
        classes:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        dot: "bg-red-500",
    },
    blue: {
        classes:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        dot: "bg-blue-500",
    },
    orange: {
        classes:
            "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
        dot: "bg-orange-500",
    },
    yellow: {
        classes:
            "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
        dot: "bg-yellow-500",
    },
    purple: {
        classes:
            "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        dot: "bg-purple-500",
    },
    cyan: {
        classes:
            "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
        dot: "bg-cyan-500",
    },
    gray: {
        classes:
            "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        dot: "bg-zinc-400",
    },
};

const renderValue = (value) => {
    if (
        value &&
        typeof value === "object" &&
        "value" in value &&
        "color" in value
    ) {
        const c = COLOR_MAP[value.color] ?? COLOR_MAP.gray;
        return (
            <Badge
                variant="outline"
                className={`gap-1.5 rounded-full font-medium text-xs px-2.5 py-0.5 border ${c.classes}`}
            >
                <span
                    className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.dot}`}
                />
                {value.value}
            </Badge>
        );
    }
    return value ?? <span className="text-muted-foreground/50 text-sm">—</span>;
};

// ---------------------------------------------------------------------------
// DescriptionItem
// ---------------------------------------------------------------------------
const DescriptionItem = ({ label, children }) => (
    <div className="group flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/70">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {label}
        </span>
        <span className="text-sm font-medium text-foreground leading-snug">
            {children}
        </span>
    </div>
);

const renderDescriptions = (fields = [], column = 2) => (
    <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))` }}
    >
        {fields.map((field, idx) => (
            <DescriptionItem key={idx} label={field.label}>
                {renderValue(field.value)}
            </DescriptionItem>
        ))}
    </div>
);

const renderObjectDescriptions = (objects = [], column = 2) =>
    objects.map((obj, idx) => (
        <div
            key={idx}
            className="rounded-xl border border-border/60 bg-card p-4 mb-3 shadow-sm"
        >
            <div
                className="grid gap-2"
                style={{
                    gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))`,
                }}
            >
                {Object.entries(obj).map(([key, value]) => (
                    <DescriptionItem key={key} label={key}>
                        {renderValue(value)}
                    </DescriptionItem>
                ))}
            </div>
        </div>
    ));

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="rounded-full bg-muted p-3">
            <ServerCrash className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
    </div>
);

// ---------------------------------------------------------------------------
// SubGroup renderer
// ---------------------------------------------------------------------------
const renderSubGroups = (subGroups = [], emptyMessage) => {
    if (!subGroups.length) return <EmptyState message={emptyMessage} />;

    return subGroups.map((sub, index) => (
        <Card key={index} className="mb-3 shadow-sm border-border/60">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-foreground">
                    {sub.title}
                </CardTitle>
                <Separator className="mt-2" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {!sub.fields?.length && !sub.subGroups?.length ? (
                    <EmptyState message={`No ${sub.title} Data`} />
                ) : (
                    <>
                        {sub.fields?.length > 0 &&
                            (sub.fields[0]?.label
                                ? renderDescriptions(sub.fields, sub.column)
                                : renderObjectDescriptions(
                                      sub.fields,
                                      sub.column,
                                  ))}
                        {sub.subGroups?.length > 0 &&
                            renderSubGroups(
                                sub.subGroups,
                                `No ${sub.title} Data`,
                            )}
                    </>
                )}
            </CardContent>
        </Card>
    ));
};

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
const DrawerSkeleton = () => (
    <div className="space-y-6 p-1 pt-2">
        <div className="flex gap-2">
            {[80, 60, 70].map((w, i) => (
                <Skeleton
                    key={i}
                    className="h-8 rounded-full"
                    style={{ width: w }}
                />
            ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-2"
                >
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Tab meta
// ---------------------------------------------------------------------------
const TAB_META = {
    hardware: { icon: Cpu, label: "Hardware" },
    parts: { icon: Package, label: "Parts" },
    software: { icon: Code2, label: "Software" },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const DetailsDrawer = ({ visible, fieldGroups = [], loading, onClose }) => {
    const getGroup = (title) => fieldGroups.find((g) => g.title === title);

    const hardwareGroup = useMemo(
        () => getGroup("Hardware Specifications"),
        [fieldGroups],
    );
    const partsGroup = useMemo(() => getGroup("Parts"), [fieldGroups]);
    const softwareGroup = useMemo(() => getGroup("Software"), [fieldGroups]);

    return (
        <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="!w-[1200px] !max-w-[1200px] p-0 flex flex-col gap-0 border-l border-border/80 shadow-2xl"
            >
                {/* ── Header ── */}
                <SheetHeader className="px-6 py-5 border-b border-border/60 bg-card/80 backdrop-blur shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Cpu className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-base font-semibold leading-tight">
                                Hardware Details
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                Specifications, parts &amp; software overview
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* ── Body ── */}
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="px-6 py-6">
                            <DrawerSkeleton />
                        </div>
                    ) : (
                        <Tabs
                            defaultValue="hardware"
                            className="flex flex-col h-full"
                        >
                            {/* Tab bar */}
                            <div className="px-6 pt-4 pb-0 shrink-0 border-b border-border/60 bg-background">
                                <TabsList className="h-auto bg-transparent p-0 gap-1 rounded-none">
                                    {Object.entries(TAB_META).map(
                                        ([key, { icon: Icon, label }]) => (
                                            <TabsTrigger
                                                key={key}
                                                value={key}
                                                className="
                        inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                        rounded-none border-b-2 border-transparent
                        text-muted-foreground bg-transparent
                        data-[state=active]:border-primary
                        data-[state=active]:text-foreground
                        data-[state=active]:bg-transparent
                        data-[state=active]:shadow-none
                        hover:text-foreground transition-colors
                      "
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {label}
                                            </TabsTrigger>
                                        ),
                                    )}
                                </TabsList>
                            </div>

                            {/* Scrollable content */}
                            <ScrollArea className="flex-1">
                                <div className="px-6 py-5">
                                    <TabsContent
                                        value="hardware"
                                        className="mt-0"
                                    >
                                        {hardwareGroup?.fields?.length ? (
                                            renderDescriptions(
                                                hardwareGroup.fields,
                                                hardwareGroup.column ?? 3,
                                            )
                                        ) : (
                                            <EmptyState message="No Hardware Data" />
                                        )}
                                    </TabsContent>

                                    <TabsContent value="parts" className="mt-0">
                                        {renderSubGroups(
                                            partsGroup?.subGroups,
                                            "No Parts Data",
                                        )}
                                    </TabsContent>

                                    <TabsContent
                                        value="software"
                                        className="mt-0"
                                    >
                                        {renderSubGroups(
                                            softwareGroup?.subGroups,
                                            "No Software Data",
                                        )}
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default DetailsDrawer;
