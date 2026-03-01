// hooks/useDashboardData.js
import { useState, useCallback } from "react";
import axios from "axios";

export function useDashboardData() {
    const [activeTab, setActiveTab] = useState("hardware");
    const [loading, setLoading] = useState({
        hardware: false,
        parts: false,
    });

    const [hardwareData, setHardwareData] = useState({
        chartData: [],
        counts: {},
    });

    const [partsData, setPartsData] = useState({
        chartData: [],
        counts: {},
    });

    const fetchHardwareData = useCallback(async () => {
        if (
            hardwareData.chartData.length > 0 &&
            Object.keys(hardwareData.counts).length > 0
        ) {
            return;
        }

        setLoading((prev) => ({ ...prev, hardware: true }));
        try {
            const [counts, chart] = await Promise.all([
                axios.get(route("dashboard.hardware.counts")),
                axios.get(route("dashboard.hardware.chart-data")),
            ]);
            console.log(chart.data);

            setHardwareData({
                counts: counts.data,
                chartData: chart.data,
            });
        } catch (error) {
            console.error("Error fetching hardware data:", error);
        } finally {
            setLoading((prev) => ({ ...prev, hardware: false }));
        }
    }, [hardwareData]);

    const fetchPartsData = useCallback(async () => {
        if (
            partsData.chartData.length > 0 &&
            Object.keys(partsData.counts).length > 0
        ) {
            return;
        }

        setLoading((prev) => ({ ...prev, parts: true }));
        try {
            const [counts, chart] = await Promise.all([
                axios.get(route("dashboard.parts.counts")),
                axios.get(route("dashboard.parts.chart-data")),
            ]);

            setPartsData({
                counts: counts.data,
                chartData: chart.data,
            });
        } catch (error) {
            console.error("Error fetching parts data:", error);
        } finally {
            setLoading((prev) => ({ ...prev, parts: false }));
        }
    }, [partsData]);

    return {
        activeTab,
        setActiveTab,
        loading,
        hardwareData,
        partsData,
        fetchHardwareData,
        fetchPartsData,
    };
}
