import { useState } from "react";
import axios from "axios";

export const useHardwareParts = (form) => {
    const [partsOptions, setPartsOptions] = useState({
        types: [],
        brands: {},
        models: {},
        specifications: {},
    });

    const loadPartTypes = async () => {
        try {
            const { data } = await axios.get(route("hardware.parts.options"));
            setPartsOptions((prev) => ({
                ...prev,
                types: data.types.map((t) => ({ label: t, value: t })),
            }));
        } catch (error) {
            console.error("Error loading part types:", error);
        }
    };

    const loadBrands = async (partType, fieldName) => {
        if (!partType) return;

        try {
            const filters = btoa(JSON.stringify({ type: partType }));
            const { data } = await axios.get(
                route("hardware.parts.options", filters),
            );

            setPartsOptions((prev) => ({
                ...prev,
                brands: {
                    ...prev.brands,
                    [fieldName]: data.brands.map((b) => ({
                        label: b,
                        value: b,
                    })),
                },
            }));
        } catch (error) {
            console.error("Error loading brands:", error);
        }
    };

    const loadModels = async (partType, brand, fieldName) => {
        if (!partType || !brand) return;

        try {
            const filters = btoa(JSON.stringify({ type: partType, brand }));
            const { data } = await axios.get(
                route("hardware.parts.options", filters),
            );

            setPartsOptions((prev) => ({
                ...prev,
                models: {
                    ...prev.models,
                    [fieldName]: data.models.map((m) => ({
                        label: m,
                        value: m,
                    })),
                },
            }));
        } catch (error) {
            console.error("Error loading models:", error);
        }
    };

    const loadSpecifications = async (
        partType,
        brand,
        model,
        fieldName,
        currentRowIndex,
    ) => {
        if (!partType || !brand || !model) return;

        try {
            const filters = btoa(
                JSON.stringify({ type: partType, brand, model }),
            );
            const [optionsRes, inventoryRes] = await Promise.all([
                axios.get(route("hardware.parts.options", filters)),
                axios.get(route("hardware.parts.inventory", filters)),
            ]);

            const inventoryMap = {};
            inventoryRes.data.forEach((inv) => {
                inventoryMap[inv.specifications] = inv.available_quantity;
            });

            const currentParts = form.getFieldValue("parts") || [];
            const usedSpecs = currentParts
                .map((part, idx) => {
                    if (
                        idx !== currentRowIndex &&
                        part?.part_type === partType &&
                        part?.brand === brand &&
                        part?.model === model
                    ) {
                        return part.specifications;
                    }
                    return null;
                })
                .filter(Boolean);

            const specCounts = {};
            usedSpecs.forEach((spec) => {
                specCounts[spec] = (specCounts[spec] || 0) + 1;
            });

            const availableSpecs = optionsRes.data.specifications.filter(
                (spec) => {
                    const available = inventoryMap[spec] || 0;
                    const used = specCounts[spec] || 0;
                    return available > used;
                },
            );

            setPartsOptions((prev) => ({
                ...prev,
                specifications: {
                    ...prev.specifications,
                    [fieldName]: availableSpecs.map((s) => ({
                        label: `${s} (${inventoryMap[s] - (specCounts[s] || 0)} available)`,
                        value: s,
                    })),
                },
            }));
        } catch (error) {
            console.error("Error loading specifications:", error);
        }
    };

    const getPartsOptions = (fieldName, dataIndex) => {
        if (dataIndex === "part_type") return partsOptions.types || [];
        if (dataIndex === "brand") return partsOptions.brands[fieldName] || [];
        if (dataIndex === "model") return partsOptions.models[fieldName] || [];
        if (dataIndex === "specifications")
            return partsOptions.specifications[fieldName] || [];
        return [];
    };

    return {
        partsOptions,
        loadPartTypes,
        loadBrands,
        loadModels,
        loadSpecifications,
        getPartsOptions,
    };
};
