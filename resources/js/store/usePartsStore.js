import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";

export const usePartsStore = create(
    devtools(
        (set, get) => ({
            // State
            options: {
                types: [],
                brands: {},
                models: {},
                specifications: {},
            },

            // Loading states
            loading: {
                types: false,
                brands: {},
                models: {},
                specifications: {},
            },

            // Cache to prevent duplicate API calls
            cache: {},

            // Actions
            loadPartTypes: async () => {
                const { cache } = get();
                const cacheKey = "types";

                // Return cached if available
                if (cache[cacheKey]) {
                    set((state) => ({
                        options: { ...state.options, types: cache[cacheKey] },
                    }));
                    return;
                }

                set((state) => ({
                    loading: { ...state.loading, types: true },
                }));

                try {
                    const { data } = await axios.get(
                        route("hardware.parts.options"),
                    );
                    console.log("loadPartTypes response:", data);

                    const types = Array.isArray(data.types) ? data.types : [];
                    const options = types.map((t) => ({ label: t, value: t }));

                    set((state) => ({
                        options: { ...state.options, types: options },
                        cache: { ...state.cache, [cacheKey]: options },
                        loading: { ...state.loading, types: false },
                    }));
                } catch (error) {
                    console.error("Error loading part types:", error);
                    set((state) => ({
                        loading: { ...state.loading, types: false },
                    }));
                }
            },

            loadBrands: async (partType, fieldName) => {
                if (!partType) return;

                const { cache } = get();
                const cacheKey = `brands_${partType}`;

                // Return cached if available
                if (cache[cacheKey]) {
                    set((state) => ({
                        options: {
                            ...state.options,
                            brands: {
                                ...state.options.brands,
                                [fieldName]: cache[cacheKey],
                            },
                            // Reset downstream
                            models: {
                                ...state.options.models,
                                [fieldName]: [],
                            },
                            specifications: {
                                ...state.options.specifications,
                                [fieldName]: [],
                            },
                        },
                    }));
                    return;
                }

                set((state) => ({
                    loading: {
                        ...state.loading,
                        brands: { ...state.loading.brands, [fieldName]: true },
                    },
                }));

                try {
                    const filters = btoa(JSON.stringify({ type: partType }));
                    console.log("filters", partType, fieldName);

                    const { data } = await axios.get(
                        route("hardware.parts.options", filters),
                    );
                    console.log(`loadBrands response for ${partType}:`, data);

                    const brands = Array.isArray(data.brands)
                        ? data.brands
                        : [];
                    const options = brands.map((b) => ({ label: b, value: b }));

                    set((state) => ({
                        options: {
                            ...state.options,
                            brands: {
                                ...state.options.brands,
                                [fieldName]: options,
                            },
                            // Reset downstream
                            models: {
                                ...state.options.models,
                                [fieldName]: [],
                            },
                            specifications: {
                                ...state.options.specifications,
                                [fieldName]: [],
                            },
                        },
                        cache: { ...state.cache, [cacheKey]: options },
                        loading: {
                            ...state.loading,
                            brands: {
                                ...state.loading.brands,
                                [fieldName]: false,
                            },
                        },
                    }));
                } catch (error) {
                    console.error("Error loading brands:", error);
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            brands: {
                                ...state.loading.brands,
                                [fieldName]: false,
                            },
                        },
                    }));
                }
            },

            loadModels: async (partType, brand, fieldName) => {
                if (!partType || !brand) return;

                const { cache } = get();
                const cacheKey = `models_${partType}_${brand}`;

                if (cache[cacheKey]) {
                    set((state) => ({
                        options: {
                            ...state.options,
                            models: {
                                ...state.options.models,
                                [fieldName]: cache[cacheKey],
                            },
                            specifications: {
                                ...state.options.specifications,
                                [fieldName]: [],
                            },
                        },
                    }));
                    return;
                }

                set((state) => ({
                    loading: {
                        ...state.loading,
                        models: { ...state.loading.models, [fieldName]: true },
                    },
                }));

                try {
                    const filters = btoa(
                        JSON.stringify({ type: partType, brand }),
                    );
                    const { data } = await axios.get(
                        route("hardware.parts.options", filters),
                    );
                    console.log(
                        `loadModels response for ${partType}, ${brand}:`,
                        data,
                    );

                    const models = Array.isArray(data.models)
                        ? data.models
                        : [];
                    const options = models.map((m) => ({ label: m, value: m }));

                    set((state) => ({
                        options: {
                            ...state.options,
                            models: {
                                ...state.options.models,
                                [fieldName]: options,
                            },
                            specifications: {
                                ...state.options.specifications,
                                [fieldName]: [],
                            },
                        },
                        cache: { ...state.cache, [cacheKey]: options },
                        loading: {
                            ...state.loading,
                            models: {
                                ...state.loading.models,
                                [fieldName]: false,
                            },
                        },
                    }));
                } catch (error) {
                    console.error("Error loading models:", error);
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            models: {
                                ...state.loading.models,
                                [fieldName]: false,
                            },
                        },
                    }));
                }
            },

            loadSpecifications: async (
                partType,
                brand,
                model,
                fieldName,
                rowIndex,
                form,
            ) => {
                if (!partType || !brand || !model) return;

                const { cache } = get();
                const cacheKey = `specs_${partType}_${brand}_${model}`;

                set((state) => ({
                    loading: {
                        ...state.loading,
                        specifications: {
                            ...state.loading.specifications,
                            [fieldName]: true,
                        },
                    },
                }));

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

                    // Group inventory by specification and condition
                    const inventoryMap = {};
                    (inventoryRes.data || []).forEach((inv) => {
                        const spec = inv.specifications;
                        const condition = inv.condition;
                        const quantity = parseInt(inv.quantity) || 0;

                        if (!inventoryMap[spec]) {
                            inventoryMap[spec] = {};
                        }

                        if (!inventoryMap[spec][condition]) {
                            inventoryMap[spec][condition] = 0;
                        }

                        inventoryMap[spec][condition] += quantity;
                    });

                    // Remove specs already used in other rows
                    const currentParts = form.getFieldValue("parts") || [];
                    const usedSpecsByCondition = {};

                    currentParts.forEach((part, idx) => {
                        if (
                            idx !== rowIndex &&
                            part?.part_type === partType &&
                            part?.brand === brand &&
                            part?.model === model &&
                            part?.specifications &&
                            part?.condition
                        ) {
                            const spec = part.specifications;
                            const condition = part.condition;

                            if (!usedSpecsByCondition[spec]) {
                                usedSpecsByCondition[spec] = {};
                            }
                            usedSpecsByCondition[spec][condition] =
                                (usedSpecsByCondition[spec][condition] || 0) +
                                1;
                        }
                    });

                    // Create specification options
                    const specificationOptions = [];

                    specs.forEach((spec) => {
                        const specInventory = inventoryMap[spec] || {};
                        const usedCounts = usedSpecsByCondition[spec] || {};

                        Object.entries(specInventory).forEach(
                            ([condition, totalQty]) => {
                                const usedQty = usedCounts[condition] || 0;
                                const availableQty = totalQty - usedQty;

                                if (
                                    availableQty > 0 &&
                                    condition !== "Defective"
                                ) {
                                    specificationOptions.push({
                                        label: `${spec} (${availableQty} ${condition})`,
                                        value: JSON.stringify({
                                            specifications: spec,
                                            condition: condition,
                                        }),
                                        condition: condition,
                                    });
                                }
                            },
                        );
                    });

                    set((state) => ({
                        options: {
                            ...state.options,
                            specifications: {
                                ...state.options.specifications,
                                [fieldName]: specificationOptions,
                            },
                        },
                        loading: {
                            ...state.loading,
                            specifications: {
                                ...state.loading.specifications,
                                [fieldName]: false,
                            },
                        },
                    }));
                } catch (error) {
                    console.error("Error loading specifications:", error);
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            specifications: {
                                ...state.loading.specifications,
                                [fieldName]: false,
                            },
                        },
                    }));
                }
            },

            // Reset functions
            resetBrands: (fieldName) =>
                set((state) => ({
                    options: {
                        ...state.options,
                        brands: { ...state.options.brands, [fieldName]: [] },
                    },
                })),

            resetModels: (fieldName) =>
                set((state) => ({
                    options: {
                        ...state.options,
                        models: { ...state.options.models, [fieldName]: [] },
                    },
                })),

            resetSpecifications: (fieldName) =>
                set((state) => ({
                    options: {
                        ...state.options,
                        specifications: {
                            ...state.options.specifications,
                            [fieldName]: [],
                        },
                    },
                })),

            // Clear all cache
            clearCache: () => set({ cache: {} }),

            // Clear all options
            clearAll: () =>
                set({
                    options: {
                        types: [],
                        brands: {},
                        models: {},
                        specifications: {},
                    },
                    cache: {},
                }),
        }),
        { name: "PartsStore" },
    ),
);
