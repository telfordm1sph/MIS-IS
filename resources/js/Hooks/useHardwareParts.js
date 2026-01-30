import { useState } from "react";
import axios from "axios";

export const useHardwareParts = (form) => {
    const [partsOptions, setPartsOptions] = useState({
        types: [],
        brands: {},
        models: {},
        specifications: {},
    });

    /** Load all part types */
    const loadPartTypes = async () => {
        try {
            const { data } = await axios.get(route("hardware.parts.options"));
            console.log("loadPartTypes response:", data);

            const types = Array.isArray(data.types) ? data.types : [];
            setPartsOptions((prev) => ({
                ...prev,
                types: types.map((t) => ({ label: t, value: t })),
            }));
        } catch (error) {
            console.error("Error loading part types:", error);
        }
    };

    /** Load brands for a selected part type */
    const loadBrands = async (partType, fieldName) => {
        if (!partType) return;

        try {
            const filters = btoa(JSON.stringify({ type: partType }));
            console.log("filters", partType, fieldName);
            const { data } = await axios.get(
                route("hardware.parts.options", filters),
            );
            console.log(`loadBrands response for ${partType}:`, data);

            const brands = Array.isArray(data.brands) ? data.brands : [];
            setPartsOptions((prev) => ({
                ...prev,
                brands: {
                    ...prev.brands,
                    [fieldName]: brands.map((b) => ({ label: b, value: b })),
                },
            }));

            // Reset downstream options (model & specifications) for this row
            setPartsOptions((prev) => ({
                ...prev,
                models: { ...prev.models, [fieldName]: [] },
                specifications: { ...prev.specifications, [fieldName]: [] },
            }));
        } catch (error) {
            console.error("Error loading brands:", error);
        }
    };

    /** Load models for a selected type and brand */
    const loadModels = async (partType, brand, fieldName) => {
        if (!partType || !brand) return;

        try {
            const filters = btoa(JSON.stringify({ type: partType, brand }));
            const { data } = await axios.get(
                route("hardware.parts.options", filters),
            );
            console.log(`loadModels response for ${partType}, ${brand}:`, data);

            const models = Array.isArray(data.models) ? data.models : [];
            setPartsOptions((prev) => ({
                ...prev,
                models: {
                    ...prev.models,
                    [fieldName]: models.map((m) => ({ label: m, value: m })),
                },
            }));

            // Reset downstream options (specifications) for this row
            setPartsOptions((prev) => ({
                ...prev,
                specifications: { ...prev.specifications, [fieldName]: [] },
            }));
        } catch (error) {
            console.error("Error loading models:", error);
        }
    };

    /** Load specifications for selected type, brand, model */
    const loadSpecifications = async (
        partType,
        brand,
        model,
        fieldName,
        rowIndex,
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

            const specs = Array.isArray(optionsRes.data.specifications)
                ? optionsRes.data.specifications
                : [];
            const inventoryMap = {};
            (inventoryRes.data || []).forEach((inv) => {
                inventoryMap[inv.specifications] = inv.available_quantity;
            });

            // Remove specs already used in other rows
            const currentParts = form.getFieldValue("parts") || [];
            const usedSpecs = currentParts
                .map((part, idx) => {
                    if (
                        idx !== rowIndex &&
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
            usedSpecs.forEach(
                (spec) => (specCounts[spec] = (specCounts[spec] || 0) + 1),
            );

            const availableSpecs = specs.filter((spec) => {
                const available = inventoryMap[spec] || 0;
                const used = specCounts[spec] || 0;
                return available > used;
            });

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

    /** Get options for select fields safely */
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
