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

            // In-flight promises to prevent duplicate concurrent requests
            inFlight: {},

            // Actions
            loadSoftwareNames: async () => {
                const { cache, inFlight } = get();
                const cacheKey = "names";

                if (cache[cacheKey]) {
                    set((state) => ({
                        options: { ...state.options, names: cache[cacheKey] },
                    }));
                    return;
                }

                if (inFlight[cacheKey]) {
                    const result = await inFlight[cacheKey];
                    set((state) => ({
                        options: { ...state.options, names: result },
                    }));
                    return;
                }

                set((state) => ({
                    loading: { ...state.loading, names: true },
                }));

                const promise = (async () => {
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
                            inFlight: { ...state.inFlight, [cacheKey]: null },
                        }));

                        return names;
                    } catch (error) {
                        console.error("Error loading software names:", error);
                        set((state) => ({
                            loading: { ...state.loading, names: false },
                            inFlight: { ...state.inFlight, [cacheKey]: null },
                        }));
                        return [];
                    }
                })();

                set((state) => ({
                    inFlight: { ...state.inFlight, [cacheKey]: promise },
                }));

                return promise;
            },

            loadSoftwareTypes: async (softwareName, fieldName) => {
                if (!softwareName) return;

                const { cache, inFlight } = get();
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
                    return cache[cacheKey];
                }

                if (inFlight[cacheKey]) {
                    const result = await inFlight[cacheKey];
                    set((state) => ({
                        options: {
                            ...state.options,
                            types: {
                                ...state.options.types,
                                [fieldName]: result,
                            },
                        },
                    }));
                    return result;
                }

                set((state) => ({
                    loading: {
                        ...state.loading,
                        types: { ...state.loading.types, [fieldName]: true },
                    },
                }));

                const promise = (async () => {
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
                            cache: { ...state.cache, [cacheKey]: types },
                            loading: {
                                ...state.loading,
                                types: {
                                    ...state.loading.types,
                                    [fieldName]: false,
                                },
                            },
                            inFlight: {
                                ...state.inFlight,
                                [cacheKey]: null,
                            },
                        }));

                        return types;
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
                            inFlight: {
                                ...state.inFlight,
                                [cacheKey]: null,
                            },
                        }));
                        return [];
                    }
                })();

                set((state) => ({
                    inFlight: { ...state.inFlight, [cacheKey]: promise },
                }));

                const result = await promise;
                set((state) => ({
                    options: {
                        ...state.options,
                        types: {
                            ...state.options.types,
                            [fieldName]: result,
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
                return result;
            },

            loadSoftwareVersions: async (
                softwareName,
                softwareType,
                fieldName,
            ) => {
                if (!softwareName || !softwareType) return;

                const { cache, inFlight } = get();
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
                    return cache[cacheKey];
                }

                if (inFlight[cacheKey]) {
                    const result = await inFlight[cacheKey];
                    set((state) => ({
                        options: {
                            ...state.options,
                            versions: {
                                ...state.options.versions,
                                [fieldName]: result,
                            },
                        },
                    }));
                    return result;
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

                const promise = (async () => {
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
                            cache: { ...state.cache, [cacheKey]: versions },
                            loading: {
                                ...state.loading,
                                versions: {
                                    ...state.loading.versions,
                                    [fieldName]: false,
                                },
                            },
                            inFlight: {
                                ...state.inFlight,
                                [cacheKey]: null,
                            },
                        }));

                        return versions;
                    } catch (error) {
                        console.error(
                            "Error loading software versions:",
                            error,
                        );
                        set((state) => ({
                            loading: {
                                ...state.loading,
                                versions: {
                                    ...state.loading.versions,
                                    [fieldName]: false,
                                },
                            },
                            inFlight: {
                                ...state.inFlight,
                                [cacheKey]: null,
                            },
                        }));
                        return [];
                    }
                })();

                set((state) => ({
                    inFlight: { ...state.inFlight, [cacheKey]: promise },
                }));

                const result = await promise;
                set((state) => ({
                    options: {
                        ...state.options,
                        versions: {
                            ...state.options.versions,
                            [fieldName]: result,
                        },
                        licenses: {
                            ...state.options.licenses,
                            [fieldName]: [],
                        },
                    },
                }));
                return result;
            },

            loadSoftwareLicenses: async (
                softwareName,
                softwareType,
                version,
                fieldName,
                currentRowIndex,
                form, // optional — pass null when preloading
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

                    // Only filter used licenses if form is available
                    const usedLicenses = form
                        ? (form.getFieldValue("software") || [])
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
                              .filter(Boolean)
                        : [];

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

            // Preload all cascading options for a software row (mirrors preloadPartData)
            preloadSoftwareData: async (sw, rowIndex) => {
                if (!sw || sw.bypass_inventory) return;

                const { software_name, software_type, version } = sw;
                const prefix = `software_${rowIndex}`;

                if (!software_name) return;

                await get().loadSoftwareTypes(software_name, prefix);

                if (software_type) {
                    await get().loadSoftwareVersions(
                        software_name,
                        software_type,
                        prefix,
                    );

                    if (version) {
                        await get().loadSoftwareLicenses(
                            software_name,
                            software_type,
                            version,
                            prefix,
                            rowIndex,
                            null, // safe — guard handles null form
                        );
                    }
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
                    inFlight: {},
                }),
        }),
        { name: "SoftwareStore" },
    ),
);
