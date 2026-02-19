import { useState, useCallback } from "react";
import axios from "axios";

export const useFormDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [locationOptions, setLocationOptions] = useState([]);
    const [prodLineOptions, setProdLineOptions] = useState([]);
    const [stationOptions, setStationOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const fetchOptions = useCallback(async () => {
        setLoadingOptions(true);
        try {
            const [empRes, deptRes, locRes, prodLineRes, stationRes] =
                await Promise.all([
                    axios.get(route("employees.list")),
                    axios.get(route("departments.list")),
                    axios.get(route("locations.list")),
                    axios.get(route("prod-lines.list")),
                    axios.get(route("stations.list")),
                ]);

            setEmployeeOptions(
                (empRes.data.employees ?? []).map((emp) => ({
                    label: `${emp.empname} - ${emp.emp_id}`,
                    value: String(emp.emp_id), // ← coerce to string
                })),
            );

            setDepartmentOptions(
                (deptRes.data.departments ?? []).map((dept) => ({
                    label: dept.dept_name,
                    value: String(dept.dept_id), // ← coerce to string
                })),
            );

            setLocationOptions(
                (locRes.data.locations ?? []).map((loc) => ({
                    label: loc.location_name,
                    value: String(loc.id), // ← coerce to string
                })),
            );

            setProdLineOptions(
                (prodLineRes.data.prodlines ?? []).map((prod) => ({
                    label: prod.pl_name,
                    value: String(prod.pl_id), // ← coerce to string
                })),
            );

            setStationOptions(
                (stationRes.data.stations ?? []).map((station) => ({
                    label: station.station_name,
                    value: String(station.station_id), // ← coerce to string
                })),
            );
        } catch (error) {
            console.error("Failed to fetch form options:", error);
        } finally {
            setLoadingOptions(false);
        }
    }, []);

    const openCreate = useCallback(() => {
        setEditingItem(null);
        setIsOpen(true);
        fetchOptions();
    }, [fetchOptions]);

    const openEdit = useCallback(
        (record) => {
            setEditingItem(record);
            setIsOpen(true);
            fetchOptions();
        },
        [fetchOptions],
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
        departmentOptions,
        locationOptions,
        prodLineOptions,
        stationOptions,
        loadingOptions,
    };
};
