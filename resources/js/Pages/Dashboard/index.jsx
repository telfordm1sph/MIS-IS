import { useEffect } from "react";
import { Head } from "@inertiajs/react";
import { AnimatePresence, motion } from "framer-motion";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useDashboardData } from "@/Hooks/useDashboardData";
import { HardwareView } from "./HardwareView";
import { PartsView } from "./PartsView";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default function Dashboard() {
    const {
        activeTab,
        setActiveTab,
        loading,
        hardwareData,
        partsData,
        fetchHardwareData,
        fetchPartsData,
    } = useDashboardData();

    useEffect(() => {
        if (activeTab === "hardware") {
            fetchHardwareData();
        } else {
            fetchPartsData();
        }
    }, [activeTab]);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ── Header ── */}
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold capitalize text-foreground">
                        Dashboard —{" "}
                        <span className="text-muted-foreground font-medium">
                            {activeTab}
                        </span>
                    </h2>

                    <Select value={activeTab} onValueChange={setActiveTab}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select inventory type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hardware">
                                Hardware Inventory
                            </SelectItem>
                            <SelectItem value="parts">
                                Parts Inventory
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* ── Animated Tab Content ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "hardware" ? (
                            <HardwareView
                                data={hardwareData}
                                loading={loading.hardware}
                            />
                        ) : (
                            <PartsView
                                data={partsData}
                                loading={loading.parts}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </AuthenticatedLayout>
    );
}
