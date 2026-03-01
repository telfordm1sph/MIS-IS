import { useEffect } from "react";
import { Head } from "@inertiajs/react";
import { Typography, Select } from "antd";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useDashboardData } from "@/Hooks/useDashboardData";
import { HardwareView } from "./HardwareView";
import { PartsView } from "./PartsView";

const { Title } = Typography;
const { Option } = Select;
import { AnimatePresence, motion } from "framer-motion";
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
                <div className="mb-6 flex justify-between items-center">
                    <Title
                        level={2}
                        className="mb-0"
                        style={{ textTransform: "capitalize" }}
                    >
                        Dashboard - {activeTab}
                    </Title>
                    <Select
                        value={activeTab}
                        onChange={setActiveTab}
                        style={{ width: 200 }}
                        size="large"
                        showSearch
                        placeholder="Select inventory type"
                        optionFilterProp="children"
                    >
                        <Option value="hardware">Hardware Inventory</Option>
                        <Option value="parts">Parts Inventory</Option>
                    </Select>
                </div>

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
