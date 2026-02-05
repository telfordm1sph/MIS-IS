import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";

export const useSoftwareStore = create(
    devtools(
        (set, get) => ({
            // State
            options: {
                names: [],
                types: {},
                versions: {},
                licenses: {},
            },

            // Loading states
            loading: {
                names: false,
                types: {},
                versions: {},
                licenses: {},
            },

            // Cache to prevent duplicate API calls
            cache: {},

            // Actions
            loadSoftwareNames: async () => {
                const { cache } = get();
                const cacheKey = "names";

                if (cache[cacheKey]) {
                    set((state) => ({
                        options: { ...state.options, names: cache[cacheKey] },
                    }));
                    return;
                }

                set((state) => ({
                    loading: { ...state.loading, names: true },
                }));

                try {
                    const { data } = await axios.get(
                        route("hardware.software.options"),
                    );
                    const names = data.names.map((n) => ({
                        label: n,
                        value: n,
                    }));

                    set((state) => ({
                        options: { ...state.options, names },
                        cache: { ...state.cache, [cacheKey]: names },
                        loading: { ...state.loading, names: false },
                    }));
                } catch (error) {
                    console.error("Error loading software names:", error);
                    set((state) => ({
                        loading: { ...state.loading, names: false },
                    }));
                }
            },

            loadSoftwareTypes: async (softwareName, fieldName) => {
                if (!softwareName) return;

                const { cache } = get();
                const cacheKey = `types_${softwareName}`;

                if (cache[cacheKey]) {
                    set((state) => ({
                        options: {
                            ...state.options,
                            types: {
                                ...state.options.types,
                                [fieldName]: cache[cacheKey],
                            },
                            versions: {
                                ...state.options.versions,
                                [fieldName]: [],
                            },
                            licenses: {
                                ...state.options.licenses,
                                [fieldName]: [],
                            },
                        },
                    }));
                    return;
                }

                set((state) => ({
                    loading: {
                        ...state.loading,
                        types: { ...state.loading.types, [fieldName]: true },
                    },
                }));

                try {
                    const filters = btoa(
                        JSON.stringify({ name: softwareName }),
                    );
                    const { data } = await axios.get(
                        route("hardware.software.options", filters),
                    );

                    const types = data.types.map((t) => ({
                        label: t,
                        value: t,
                    }));

                    set((state) => ({
                        options: {
                            ...state.options,
                            types: {
                                ...state.options.types,
                                [fieldName]: types,
                            },
                            versions: {
                                ...state.options.versions,
                                [fieldName]: [],
                            },
                            licenses: {
                                ...state.options.licenses,
                                [fieldName]: [],
                            },
                        },
                        cache: { ...state.cache, [cacheKey]: types },
                        loading: {
                            ...state.loading,
                            types: {
                                ...state.loading.types,
                                [fieldName]: false,
                            },
                        },
                    }));
                } catch (error) {
                    console.error("Error loading software types:", error);
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            types: {
                                ...state.loading.types,
                                [fieldName]: false,
                            },
                        },
                    }));
                }
            },

            loadSoftwareVersions: async (
                softwareName,
                softwareType,
                fieldName,
            ) => {
                if (!softwareName || !softwareType) return;

                const { cache } = get();
                const cacheKey = `versions_${softwareName}_${softwareType}`;

                if (cache[cacheKey]) {
                    set((state) => ({
                        options: {
                            ...state.options,
                            versions: {
                                ...state.options.versions,
                                [fieldName]: cache[cacheKey],
                            },
                            licenses: {
                                ...state.options.licenses,
                                [fieldName]: [],
                            },
                        },
                    }));
                    return;
                }

                set((state) => ({
                    loading: {
                        ...state.loading,
                        versions: {
                            ...state.loading.versions,
                            [fieldName]: true,
                        },
                    },
                }));

                try {
                    const filters = btoa(
                        JSON.stringify({
                            name: softwareName,
                            type: softwareType,
                        }),
                    );
                    const { data } = await axios.get(
                        route("hardware.software.options", filters),
                    );

                    const versions = data.versions.map((v) => ({
                        label: v,
                        value: v,
                    }));

                    set((state) => ({
                        options: {
                            ...state.options,
                            versions: {
                                ...state.options.versions,
                                [fieldName]: versions,
                            },
                            licenses: {
                                ...state.options.licenses,
                                [fieldName]: [],
                            },
                        },
                        cache: { ...state.cache, [cacheKey]: versions },
                        loading: {
                            ...state.loading,
                            versions: {
                                ...state.loading.versions,
                                [fieldName]: false,
                            },
                        },
                    }));
                } catch (error) {
                    console.error("Error loading software versions:", error);
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            versions: {
                                ...state.loading.versions,
                                [fieldName]: false,
                            },
                        },
                    }));
                }
            },

            loadSoftwareLicenses: async (
                softwareName,
                softwareType,
                version,
                fieldName,
                currentRowIndex,
                form,
            ) => {
                if (!softwareName || !softwareType || !version) return;

                set((state) => ({
                    loading: {
                        ...state.loading,
                        licenses: {
                            ...state.loading.licenses,
                            [fieldName]: true,
                        },
                    },
                }));

                try {
                    const filters = btoa(
                        JSON.stringify({
                            name: softwareName,
                            type: softwareType,
                            version,
                        }),
                    );
                    const { data } = await axios.get(
                        route("hardware.software.licenses", filters),
                    );

                    const licenseMap = {};
                    data.forEach((lic) => {
                        const key = lic.identifier;
                        licenseMap[key] = {
                            license_id: lic.license_id,
                            available_activations: lic.available_activations,
                            max_activations: lic.max_activations,
                            current_activations: lic.current_activations,
                            display_type: lic.display_type,
                            license_key: lic.license_key,
                            account_user: lic.account_user,
                            account_password: lic.account_password,
                        };
                    });

                    const currentSoftware =
                        form.getFieldValue("software") || [];
                    const usedLicenses = currentSoftware
                        .map((sw, idx) => {
                            if (
                                idx !== currentRowIndex &&
                                sw?.software_name === softwareName &&
                                sw?.software_type === softwareType &&
                                sw?.version === version
                            ) {
                                return (
                                    sw._license_identifier ||
                                    sw.license_key ||
                                    sw.account_user
                                );
                            }
                            return null;
                        })
                        .filter(Boolean);

                    const licenseCounts = {};
                    usedLicenses.forEach((key) => {
                        licenseCounts[key] = (licenseCounts[key] || 0) + 1;
                    });

                    const availableLicenses = Object.keys(licenseMap).filter(
                        (key) => {
                            const available =
                                licenseMap[key].available_activations;
                            const used = licenseCounts[key] || 0;
                            return available > used;
                        },
                    );

                    const licenseOptions = availableLicenses.map((key) => {
                        const lic = licenseMap[key];
                        const remaining =
                            lic.available_activations -
                            (licenseCounts[key] || 0);
                        const displayKey =
                            lic.display_type === "Account"
                                ? `Account: ${key}`
                                : key;

                        return {
                            label: `${displayKey} (${remaining} of ${lic.max_activations} available)`,
                            value: key,
                            license_data: {
                                license_id: lic.license_id,
                                license_key: lic.license_key,
                                account_user: lic.account_user,
                                account_password: lic.account_password,
                                available_activations:
                                    lic.available_activations,
                                max_activations: lic.max_activations,
                                current_activations: lic.current_activations,
                                display_type: lic.display_type,
                            },
                        };
                    });

                    set((state) => ({
                        options: {
                            ...state.options,
                            licenses: {
                                ...state.options.licenses,
                                [fieldName]: licenseOptions,
                            },
                        },
                        loading: {
                            ...state.loading,
                            licenses: {
                                ...state.loading.licenses,
                                [fieldName]: false,
                            },
                        },
                    }));
                } catch (error) {
                    console.error("Error loading software licenses:", error);
                    set((state) => ({
                        loading: {
                            ...state.loading,
                            licenses: {
                                ...state.loading.licenses,
                                [fieldName]: false,
                            },
                        },
                    }));
                }
            },

            // Reset functions
            resetTypes: (fieldName) =>
                set((state) => ({
                    options: {
                        ...state.options,
                        types: { ...state.options.types, [fieldName]: [] },
                    },
                })),

            resetVersions: (fieldName) =>
                set((state) => ({
                    options: {
                        ...state.options,
                        versions: {
                            ...state.options.versions,
                            [fieldName]: [],
                        },
                    },
                })),

            resetLicenses: (fieldName) =>
                set((state) => ({
                    options: {
                        ...state.options,
                        licenses: {
                            ...state.options.licenses,
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
                        names: [],
                        types: {},
                        versions: {},
                        licenses: {},
                    },
                    cache: {},
                }),
        }),
        { name: "SoftwareStore" },
    ),
);
