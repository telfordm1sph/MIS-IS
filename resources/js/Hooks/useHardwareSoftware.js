import { useSoftwareStore } from "@/store/useSoftwareStore";

export const useHardwareSoftware = () => {
    const {
        options,
        loading,
        loadSoftwareNames,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,
        resetTypes,
        resetVersions,
        resetLicenses,
        preloadSoftwareData,
    } = useSoftwareStore((state) => state);

    const getSoftwareOptions = (fieldName, dataIndex) => {
        const map = {
            software_name: options?.names || [],
            software_type: options?.types?.[fieldName] || [],
            version: options?.versions?.[fieldName] || [],
            license_key: options?.licenses?.[fieldName] || [],
        };

        return map[dataIndex] || [];
    };

    return {
        softwareOptions: options,
        loading,

        // Directly expose store functions (no wrapping needed)
        loadSoftwareNames,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,

        getSoftwareOptions,

        resetTypes,
        resetVersions,
        resetLicenses,

        preloadSoftwareData,
    };
};
