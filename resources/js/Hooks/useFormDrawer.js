import { useState, useCallback } from "react";
import axios from "axios";

export const useFormDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    const fetchEmployees = useCallback(async () => {
        setEmployeesLoading(true);
        try {
            const res = await axios.get(route("employees.list"));
            setEmployeeOptions(
                res.data.employees.map((emp) => ({
                    label: `${emp.empname} - ${emp.emp_id}`,
                    value: emp.emp_id,
                })),
            );
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setEmployeesLoading(false);
        }
    }, []);

    const openCreate = useCallback(() => {
        setEditingItem(null);
        setIsOpen(true);
        fetchEmployees();
    }, [fetchEmployees]);

    const openEdit = useCallback(
        (record) => {
            setEditingItem(record);
            setIsOpen(true);
            fetchEmployees();
        },
        [fetchEmployees],
    );

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
        employeeOptions,
        employeesLoading,
    };
};
