import { useState } from "react";
import axios from "axios";

export const useHardwareSoftware = (form) => {
    const [softwareOptions, setSoftwareOptions] = useState({
        names: [],
        types: {},
        versions: {},
        licenses: {},
    });

    const loadSoftwareNames = async () => {
        try {
            const { data } = await axios.get(
                route("hardware.software.options"),
            );
            setSoftwareOptions((prev) => ({
                ...prev,
                names: data.names.map((n) => ({ label: n, value: n })),
            }));
        } catch (error) {
            console.error("Error loading software names:", error);
        }
    };

    const loadSoftwareTypes = async (softwareName, fieldName) => {
        if (!softwareName) return;

        try {
            const filters = btoa(JSON.stringify({ name: softwareName }));
            const { data } = await axios.get(
                route("hardware.software.options", filters),
            );

            setSoftwareOptions((prev) => ({
                ...prev,
                types: {
                    ...prev.types,
                    [fieldName]: data.types.map((t) => ({
                        label: t,
                        value: t,
                    })),
                },
            }));
        } catch (error) {
            console.error("Error loading software types:", error);
        }
    };

    const loadSoftwareVersions = async (
        softwareName,
        softwareType,
        fieldName,
    ) => {
        if (!softwareName || !softwareType) return;

        try {
            const filters = btoa(
                JSON.stringify({ name: softwareName, type: softwareType }),
            );
            const { data } = await axios.get(
                route("hardware.software.options", filters),
            );

            setSoftwareOptions((prev) => ({
                ...prev,
                versions: {
                    ...prev.versions,
                    [fieldName]: data.versions.map((v) => ({
                        label: v,
                        value: v,
                    })),
                },
            }));
        } catch (error) {
            console.error("Error loading software versions:", error);
        }
    };

    const loadSoftwareLicenses = async (
        softwareName,
        softwareType,
        version,
        fieldName,
        currentRowIndex,
    ) => {
        if (!softwareName || !softwareType || !version) return;

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

            const currentSoftware = form.getFieldValue("software") || [];
            const usedLicenses = currentSoftware
                .map((sw, idx) => {
                    if (
                        idx !== currentRowIndex &&
                        sw?.software_name === softwareName &&
                        sw?.software_type === softwareType &&
                        sw?.version === version
                    ) {
                        // Use _license_identifier if available, otherwise fall back
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

            const availableLicenses = Object.keys(licenseMap).filter((key) => {
                const available = licenseMap[key].available_activations;
                const used = licenseCounts[key] || 0;
                return available > used;
            });

            setSoftwareOptions((prev) => ({
                ...prev,
                licenses: {
                    ...prev.licenses,
                    [fieldName]: availableLicenses.map((key) => {
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
                    }),
                },
            }));
        } catch (error) {
            console.error("Error loading software licenses:", error);
        }
    };

    const getSoftwareOptions = (fieldName, dataIndex) => {
        if (dataIndex === "software_name") return softwareOptions.names || [];
        if (dataIndex === "software_type")
            return softwareOptions.types[fieldName] || [];
        if (dataIndex === "version")
            return softwareOptions.versions[fieldName] || [];
        if (dataIndex === "license_key")
            return softwareOptions.licenses[fieldName] || [];
        return [];
    };

    return {
        softwareOptions,
        loadSoftwareNames,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,
        getSoftwareOptions,
    };
};
