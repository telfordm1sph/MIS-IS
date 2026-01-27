
import { useState, useCallback } from "react";

export const useLogsModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [entityId, setEntityId] = useState(null);

    const open = useCallback((id) => {
        setEntityId(id);
        setIsVisible(true);
    }, []);

    const close = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => setEntityId(null), 300);
    }, []);

    return {
        isVisible,
        entityId,
        open,
        close,
    };
};
