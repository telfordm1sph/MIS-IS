import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";

// ─── Mini construction scene ────────────────────────────────────────────────

function HardHatWorker({ style, flip = false }) {
    return (
        <div
            className="absolute flex flex-col items-center select-none"
            style={style}
        >
            {/* Head + hat */}
            <div className="relative">
                {/* Hard hat */}
                <div
                    className="w-6 h-3 rounded-t-full bg-yellow-400 border-b-2 border-yellow-500 relative z-10"
                    style={{ transform: flip ? "scaleX(-1)" : "none" }}
                />
                {/* Face */}
                <div className="w-4 h-4 rounded-full bg-amber-200 border border-amber-300 mx-auto -mt-0.5 relative z-0" />
            </div>
            {/* Body */}
            <div
                className="w-5 h-6 rounded-sm mt-0.5 flex items-center justify-center"
                style={{
                    background: flip ? "#3b82f6" : "#f97316",
                    transform: flip ? "scaleX(-1)" : "none",
                }}
            >
                {/* Vest stripes */}
                <div className="w-full h-1 bg-yellow-300 opacity-60" />
            </div>
            {/* Legs */}
            <div className="flex gap-0.5 mt-0.5">
                <div className="w-2 h-4 bg-zinc-600 rounded-b-sm" />
                <div className="w-2 h-4 bg-zinc-600 rounded-b-sm" />
            </div>
        </div>
    );
}

function ConstructionScene({ progress }) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 400);
        return () => clearInterval(id);
    }, []);

    const hammerBob = tick % 2 === 0;
    const workerWalk = tick % 4;
    const craneSwing = Math.sin(tick * 0.3) * 8;

    // How many "blocks" are laid (0–8) based on progress
    const blocks = Math.floor((progress / 100) * 8);

    return (
        <div className="relative w-full h-36 overflow-hidden select-none mb-2">
            {/* Sky gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-sky-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl" />

            {/* Sun */}
            <div className="absolute top-3 right-8 w-7 h-7 rounded-full bg-yellow-300 shadow-lg shadow-yellow-200 dark:shadow-yellow-900/30" />

            {/* Clouds */}
            <div className="absolute top-2 left-6 flex gap-0 opacity-80">
                <div className="w-8 h-4 bg-white dark:bg-zinc-600 rounded-full" />
                <div className="w-6 h-3 bg-white dark:bg-zinc-600 rounded-full -ml-2 mt-1" />
            </div>
            <div className="absolute top-4 left-24 flex gap-0 opacity-60">
                <div className="w-5 h-3 bg-white dark:bg-zinc-600 rounded-full" />
                <div className="w-4 h-2 bg-white dark:bg-zinc-600 rounded-full -ml-1 mt-1" />
            </div>

            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-amber-100 dark:bg-zinc-700 border-t-2 border-amber-200 dark:border-zinc-600 rounded-b-xl" />

            {/* ── Building under construction ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-0.5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex gap-0.5 transition-all duration-500"
                        style={{ opacity: i < blocks ? 1 : 0.12 }}
                    >
                        {[0, 1, 2].map((j) => (
                            <div
                                key={j}
                                className="w-7 h-4 rounded-[2px] border"
                                style={{
                                    background:
                                        i < blocks
                                            ? j === 1
                                                ? "#d97706"
                                                : "#b45309"
                                            : "#e5e7eb",
                                    borderColor:
                                        i < blocks ? "#92400e" : "#d1d5db",
                                    transition: "all 0.4s ease",
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* ── Scaffold ── */}
            <div className="absolute bottom-8 left-1/2 ml-12">
                {/* Vertical poles */}
                <div
                    className="relative w-1 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                    style={{ height: 72 }}
                >
                    <div className="absolute -right-5 top-0 w-1 h-full bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                    {/* Horizontal rungs */}
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="absolute -right-5 w-6 h-0.5 bg-zinc-400 dark:bg-zinc-500"
                            style={{ top: i * 18 + 4 }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Crane ── */}
            <div
                className="absolute bottom-8 right-6"
                style={{ transformOrigin: "bottom center" }}
            >
                {/* Tower */}
                <div
                    className="relative mx-auto w-2 bg-yellow-500 dark:bg-yellow-600 rounded-sm"
                    style={{ height: 64 }}
                >
                    {/* Arm */}
                    <div
                        className="absolute -top-1 -left-10 w-14 h-1.5 bg-yellow-500 dark:bg-yellow-600 rounded-full origin-right"
                        style={{ transform: `rotate(${craneSwing}deg)` }}
                    >
                        {/* Cable */}
                        <div className="absolute right-2 top-1.5 w-px h-5 bg-zinc-500 dark:bg-zinc-400" />
                        {/* Hook load */}
                        <div
                            className="absolute right-0.5 bg-orange-500 rounded-[2px] border border-orange-600 transition-transform"
                            style={{
                                top: 7,
                                width: 10,
                                height: 8,
                                transform: `translateY(${hammerBob ? 0 : -3}px)`,
                            }}
                        />
                    </div>
                </div>
                {/* Base */}
                <div className="w-6 h-2 bg-yellow-600 dark:bg-yellow-700 rounded-sm -ml-2 -mt-px" />
            </div>

            {/* ── Worker 1: hammering on scaffold ── */}
            <HardHatWorker
                style={{
                    bottom: 44,
                    left: "calc(50% + 20px)",
                    transform: `translateY(${hammerBob ? 0 : -3}px)`,
                    transition: "transform 0.2s ease",
                }}
            />

            {/* ── Worker 2: walking with materials ── */}
            <HardHatWorker
                flip
                style={{
                    bottom: 8,
                    left: `calc(15% + ${workerWalk * 5}px)`,
                    transition: "left 0.4s linear",
                }}
            />

            {/* ── Worker 3: standing by building ── */}
            <HardHatWorker
                style={{
                    bottom: 8,
                    left: "calc(50% - 36px)",
                }}
            />

            {/* Caution tape */}
            <div className="absolute bottom-7 left-2 right-2 h-1.5 overflow-hidden rounded-full opacity-70">
                <div
                    className="h-full"
                    style={{
                        background:
                            "repeating-linear-gradient(90deg, #facc15 0px, #facc15 10px, #1c1917 10px, #1c1917 20px)",
                        width: "200%",
                        transform: `translateX(-${(tick * 2) % 20}px)`,
                        transition: "transform 0.4s linear",
                    }}
                />
            </div>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Maintenance({ emp_data, message, logoutUrl }) {
    const isAdmin = emp_data?.emp_id == 1705;

    const [seconds, setSeconds] = useState(10);
    const [settingOnline, setSettingOnline] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isAdmin) return;
        if (seconds <= 0) {
            window.location.href = logoutUrl;
            return;
        }
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds, logoutUrl, isAdmin]);

    const progress = isAdmin ? 100 : ((10 - seconds) / 10) * 100;

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-background">
            {/* Grid bg */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                        linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                }}
            />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,hsl(var(--primary)/0.05),transparent)]" />

            {/* Card */}
            <div
                className={`relative z-10 w-full max-w-[380px] mx-4 transition-all duration-500 ease-out ${
                    mounted
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                }`}
            >
                <Card className="border-border/60 shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                        {/* Construction scene */}
                        <div className="px-4 pt-4">
                            <ConstructionScene progress={progress} />
                        </div>

                        <div className="px-7 pb-7 pt-3">
                            {/* Status pill */}
                            <div className="flex justify-center mb-3">
                                <Badge
                                    variant="outline"
                                    className="gap-1.5 px-3 py-1 text-[11px] tracking-widest uppercase font-semibold"
                                >
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-400" />
                                    </span>
                                    Under Maintenance
                                </Badge>
                            </div>

                            {/* Heading */}
                            <div className="text-center mb-5">
                                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                                    We'll be back shortly
                                </h1>
                                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                                    {message ||
                                        "The system is undergoing scheduled maintenance. We apologize for the inconvenience."}
                                </p>
                            </div>

                            <Separator className="mb-5" />

                            {isAdmin ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
                                        <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                                            <ShieldAlert
                                                className="w-4 h-4 text-muted-foreground"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <div className="leading-none">
                                            <p className="text-[10px] text-muted-foreground mb-1">
                                                Signed in as
                                            </p>
                                            <p className="text-sm font-semibold text-foreground">
                                                Administrator
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            setSettingOnline(true);
                                            router.post(
                                                route("system-status.online"),
                                                {},
                                                {
                                                    onFinish: () =>
                                                        setSettingOnline(false),
                                                },
                                            );
                                        }}
                                        disabled={settingOnline}
                                    >
                                        <RefreshCw
                                            className={`w-4 h-4 mr-2 ${settingOnline ? "animate-spin" : ""}`}
                                        />
                                        {settingOnline
                                            ? "Setting Online…"
                                            : "Set System Online"}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                            (window.location.href = logoutUrl)
                                        }
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Go Back
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            Redirecting automatically
                                        </span>
                                        <span className="text-xs font-mono font-bold tabular-nums text-foreground">
                                            {seconds}s
                                        </span>
                                    </div>

                                    <Progress
                                        value={progress}
                                        className="h-1.5"
                                    />

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                            (window.location.href = logoutUrl)
                                        }
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Go Back
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
