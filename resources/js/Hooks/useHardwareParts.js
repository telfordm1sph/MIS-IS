import { usePartsStore } from "@/store/usePartsStore";

// form param removed — store actions no longer call form.setFieldsValue
export const useHardwareParts = () => {
    const options = usePartsStore((state) => state.options);
    const loading = usePartsStore((state) => state.loading);
    const loadPartTypes = usePartsStore((state) => state.loadPartTypes);
    const loadBrands = usePartsStore((state) => state.loadBrands);
    const loadModels = usePartsStore((state) => state.loadModels);
    const loadSpecifications = usePartsStore(
        (state) => state.loadSpecifications,
    );
    const preloadPartData = usePartsStore((state) => state.preloadPartData);
    const resetBrands = usePartsStore((state) => state.resetBrands);
    const resetModels = usePartsStore((state) => state.resetModels);
    const resetSpecifications = usePartsStore(
        (state) => state.resetSpecifications,
    );

    const getPartsOptions = (fieldName, dataIndex) => {
        if (dataIndex === "part_type") return options.types || [];
        if (dataIndex === "brand") return options.brands[fieldName] || [];
        if (dataIndex === "model") return options.models[fieldName] || [];
        if (dataIndex === "specifications")
            return options.specifications[fieldName] || [];
        return [];
    };

    return {
        partsOptions: options,
        loading,
        loadPartTypes,
        loadBrands,
        loadModels,
        // Store handles its own state — no form injection needed
        loadSpecifications: (partType, brand, model, fieldName, rowIndex) =>
            loadSpecifications(partType, brand, model, fieldName, rowIndex),
        preloadPartData,
        getPartsOptions,
        resetBrands,
        resetModels,
        resetSpecifications,
    };
};
