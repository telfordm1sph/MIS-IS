import { useState, useCallback } from "react";

export const useFormDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const openCreate = useCallback(() => {
        setEditingItem(null);
        setIsOpen(true);
    }, []);

    const openEdit = useCallback((record) => {
        setEditingItem(record);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => setEditingItem(null), 300);
    }, []);

    return {
        isOpen,
        editingItem,
        openCreate,
        openEdit,
        close,
        isEditing: !!editingItem,
    };
};
