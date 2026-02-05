import { useSoftwareStore } from "@/store/useSoftwareStore";

export const useHardwareSoftware = (form) => {
    const options = useSoftwareStore((state) => state.options);
    const loading = useSoftwareStore((state) => state.loading);
    const loadSoftwareNames = useSoftwareStore(
        (state) => state.loadSoftwareNames,
    );
    const loadSoftwareTypes = useSoftwareStore(
        (state) => state.loadSoftwareTypes,
    );
    const loadSoftwareVersions = useSoftwareStore(
        (state) => state.loadSoftwareVersions,
    );
    const loadSoftwareLicenses = useSoftwareStore(
        (state) => state.loadSoftwareLicenses,
    );
    const resetTypes = useSoftwareStore((state) => state.resetTypes);
    const resetVersions = useSoftwareStore((state) => state.resetVersions);
    const resetLicenses = useSoftwareStore((state) => state.resetLicenses);

    const getSoftwareOptions = (fieldName, dataIndex) => {
        if (dataIndex === "software_name") return options.names || [];
        if (dataIndex === "software_type")
            return options.types[fieldName] || [];
        if (dataIndex === "version") return options.versions[fieldName] || [];
        if (dataIndex === "license_key")
            return options.licenses[fieldName] || [];
        return [];
    };

    return {
        softwareOptions: options,
        loading,
        loadSoftwareNames,
        loadSoftwareTypes: (name, fieldName) =>
            loadSoftwareTypes(name, fieldName),
        loadSoftwareVersions: (name, type, fieldName) =>
            loadSoftwareVersions(name, type, fieldName),
        loadSoftwareLicenses: (name, type, version, fieldName, rowIndex) =>
            loadSoftwareLicenses(
                name,
                type,
                version,
                fieldName,
                rowIndex,
                form,
            ),
        getSoftwareOptions,
        resetTypes,
        resetVersions,
        resetLicenses,
    };
};
