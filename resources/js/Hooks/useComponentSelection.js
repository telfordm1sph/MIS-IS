import { useState, useCallback } from "react";

/**
 * Hook for managing component selection state
 * Used in ComponentMaintenanceDrawer
 */
export const useComponentSelection = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedComponentType, setSelectedComponentType] = useState(null);
    const [selectedComponentData, setSelectedComponentData] = useState(null);

    const handleComponentSelect = useCallback((value, option) => {
        setSelectedComponent(value);
        setSelectedComponentType(option?.componentType || null);
        setSelectedComponentData(option?.data || null);
    }, []);

    const resetSelection = useCallback(() => {
        setSelectedComponent(null);
        setSelectedComponentType(null);
        setSelectedComponentData(null);
    }, []);

    return {
        selectedComponent,
        selectedComponentType,
        selectedComponentData,
        handleComponentSelect,
        resetSelection,
    };
};