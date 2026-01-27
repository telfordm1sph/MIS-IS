import { useState, useCallback } from "react";

/**
 * Custom hook for managing inventory drawer state
 * @returns {Object} Drawer state and handlers
 */
export const useDrawer = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const openDrawer = useCallback((item) => {
        setSelectedItem(item);
        setDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        // Delay clearing the item to allow drawer close animation
        setTimeout(() => setSelectedItem(null), 300);
    }, []);

    return {
        drawerOpen,
        selectedItem,
        openDrawer,
        closeDrawer,
    };
};
