import React, { useEffect } from "react";
import { Form } from "antd";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/Components/ui/Combobox";

// ─── Design tokens (must match HardwareFormDrawer) ────────────────────────────
const LABEL_H = 18;
const GAP = 5;
const INPUT_H = 34;
const BOTTOM = 14;

// ─── Cell primitive ───────────────────────────────────────────────────────────

const Cell = ({ label, showLabel, flex, children }) => (
    <div className="flex flex-col min-w-0" style={{ flex }}>
        <div
            style={{
                height: LABEL_H,
                marginBottom: GAP,
                display: "flex",
                alignItems: "center",
            }}
        >
            {showLabel && label && (
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 truncate leading-none">
                    {label}
                </Label>
            )}
        </div>
        <div style={{ height: INPUT_H }}>{children}</div>
        <div style={{ height: BOTTOM }} />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const CascadingSoftwareFields = ({
    fieldPrefix,
    form,
    initialValues = {},
    disabled = {},
    layout = "vertical",
    showLabels = true,
    onFieldChange,
    softwareHooks,
    isFormList = false,
    rowIndex = null,
    rowData = null,
}) => {
    const {
        softwareOptions,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,
    } = softwareHooks;

    const getFieldValue = (fieldKey) => {
        if (isFormList) {
            const all = form.getFieldValue("software") || [];
            return all[rowIndex]?.[fieldKey];
        }
        return form.getFieldValue(`${fieldPrefix}_${fieldKey}`);
    };

    const setFieldValues = (updates) => {
        if (isFormList) {
            const all = form.getFieldValue("software") || [];
            all[rowIndex] = { ...all[rowIndex], ...updates };
            form.setFieldsValue({ software: all });
        } else {
            const flat = {};
            Object.entries(updates).forEach(([k, v]) => {
                flat[`${fieldPrefix}_${k}`] = v;
            });
            form.setFieldsValue(flat);
        }
    };

    useEffect(() => {
        const name = rowData?.software_name;
        const type = rowData?.software_type;
        const version = rowData?.version;
        if (name) loadSoftwareTypes(name, fieldPrefix);
        if (name && type) loadSoftwareVersions(name, type, fieldPrefix);
        if (name && type && version)
            loadSoftwareLicenses(
                name,
                type,
                version,
                fieldPrefix,
                rowIndex || 0,
            );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowData?.software_name, rowData?.software_type, rowData?.version]);

    const handleNameChange = (val) => {
        setFieldValues({
            software_name: val,
            software_type: undefined,
            version: undefined,
            _license_identifier: undefined,
        });
        if (val) loadSoftwareTypes(val, fieldPrefix);
        onFieldChange?.("software_name", val);
    };

    const handleTypeChange = (val) => {
        setFieldValues({
            software_type: val,
            version: undefined,
            _license_identifier: undefined,
        });
        if (val)
            loadSoftwareVersions(
                getFieldValue("software_name"),
                val,
                fieldPrefix,
            );
        onFieldChange?.("software_type", val);
    };

    const handleVersionChange = (val) => {
        setFieldValues({ version: val, _license_identifier: undefined });
        if (val)
            loadSoftwareLicenses(
                getFieldValue("software_name"),
                getFieldValue("software_type"),
                val,
                fieldPrefix,
                rowIndex || 0,
            );
        onFieldChange?.("version", val);
    };

    // ── inline + isFormList mode ── used inside HardwareFormDrawer Form.List
    if (layout === "inline" && isFormList) {
        return (
            <div className="flex gap-2 flex-1 min-w-0">
                {/* Software Name */}
                <Cell label="Software Name" showLabel={showLabels} flex={1.6}>
                    <Form.Item
                        name={[rowIndex, "software_name"]}
                        noStyle
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Combobox
                            options={softwareOptions.names || []}
                            placeholder="Software"
                            value={rowData?.software_name} // Add this
                            disabled={disabled.software_name}
                            onChange={handleNameChange}
                            style={{ height: INPUT_H }}
                        />
                    </Form.Item>
                </Cell>

                {/* Software Type */}
                <Cell label="Type" showLabel={showLabels} flex={1.1}>
                    <Form.Item
                        name={[rowIndex, "software_type"]}
                        noStyle
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Combobox
                            options={softwareOptions.types[fieldPrefix] || []}
                            placeholder="Type"
                            value={rowData?.software_type} // Add this
                            disabled={disabled.software_type}
                            onChange={handleTypeChange}
                            onFocus={async () => {
                                const n = getFieldValue("software_name");
                                if (n) await loadSoftwareTypes(n, fieldPrefix);
                            }}
                            style={{ height: INPUT_H }}
                        />
                    </Form.Item>
                </Cell>

                {/* Version */}
                <Cell label="Version" showLabel={showLabels} flex={0.9}>
                    <Form.Item
                        name={[rowIndex, "version"]}
                        noStyle
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Combobox
                            options={
                                softwareOptions.versions[fieldPrefix] || []
                            }
                            placeholder="Version"
                            value={rowData?.version} // Add this
                            disabled={disabled.version}
                            onChange={handleVersionChange}
                            onFocus={async () => {
                                const n = getFieldValue("software_name");
                                const t = getFieldValue("software_type");
                                if (n && t)
                                    await loadSoftwareVersions(
                                        n,
                                        t,
                                        fieldPrefix,
                                    );
                            }}
                            style={{ height: INPUT_H }}
                        />
                    </Form.Item>
                </Cell>
                {/* License / Account */}
                <Cell
                    label="License / Account"
                    showLabel={showLabels}
                    flex={1.8}
                >
                    <Form.Item name={[rowIndex, "_license_identifier"]} noStyle>
                        <Combobox
                            options={
                                softwareOptions.licenses[fieldPrefix] || []
                            }
                            placeholder="License"
                            value={rowData?._license_identifier}
                            disabled={disabled.license}
                            onFocus={async () => {
                                const n = getFieldValue("software_name");
                                const t = getFieldValue("software_type");
                                const v = getFieldValue("version");
                                if (n && t && v)
                                    await loadSoftwareLicenses(
                                        n,
                                        t,
                                        v,
                                        fieldPrefix,
                                        rowIndex || 0,
                                    );
                            }}
                            style={{ height: INPUT_H }}
                            allowCustomValue={true} // Add this
                        />
                    </Form.Item>
                </Cell>
            </div>
        );
    }

    // ── inline (non-list) mode ────────────────────────────────────────────────
    if (layout === "inline") {
        const fieldDefs = [
            {
                name: "software_name",
                label: "Software Name",
                opts: softwareOptions.names || [],
                required: true,
                onChange: handleNameChange,
            },
            {
                name: "software_type",
                label: "Type",
                opts: softwareOptions.types[fieldPrefix] || [],
                required: true,
                onChange: handleTypeChange,
                onFocus: async () => {
                    const n = getFieldValue("software_name");
                    if (n) await loadSoftwareTypes(n, fieldPrefix);
                },
            },
            {
                name: "version",
                label: "Version",
                opts: softwareOptions.versions[fieldPrefix] || [],
                required: true,
                onChange: handleVersionChange,
                onFocus: async () => {
                    const n = getFieldValue("software_name");
                    const t = getFieldValue("software_type");
                    if (n && t) await loadSoftwareVersions(n, t, fieldPrefix);
                },
            },
            {
                name: "_license_identifier",
                label: "License / Account",
                opts: softwareOptions.licenses[fieldPrefix] || [],
                required: false,
                onFocus: async () => {
                    const n = getFieldValue("software_name");
                    const t = getFieldValue("software_type");
                    const v = getFieldValue("version");
                    if (n && t && v)
                        await loadSoftwareLicenses(
                            n,
                            t,
                            v,
                            fieldPrefix,
                            rowIndex || 0,
                        );
                },
            },
        ];

        return (
            <div className="flex gap-2 flex-1 min-w-0">
                {fieldDefs.map((f) => (
                    <div key={f.name} className="flex-1 min-w-0">
                        <Form.Item
                            name={`${fieldPrefix}_${f.name}`}
                            noStyle
                            rules={
                                f.required
                                    ? [{ required: true, message: "Required" }]
                                    : []
                            }
                        >
                            <Combobox
                                options={f.opts}
                                placeholder={f.label}
                                disabled={disabled[f.name]}
                                onChange={f.onChange}
                                onFocus={f.onFocus}
                                style={{ height: INPUT_H }}
                            />
                        </Form.Item>
                    </div>
                ))}
            </div>
        );
    }

    // ── vertical (default) mode ───────────────────────────────────────────────
    const vertFields = [
        {
            name: "software_name",
            label: "Software Name",
            opts: softwareOptions.names || [],
            required: true,
            onChange: handleNameChange,
        },
        {
            name: "software_type",
            label: "Software Type",
            opts: softwareOptions.types[fieldPrefix] || [],
            required: true,
            onChange: handleTypeChange,
            onFocus: async () => {
                const n = getFieldValue("software_name");
                if (n) await loadSoftwareTypes(n, fieldPrefix);
            },
        },
        {
            name: "version",
            label: "Version",
            opts: softwareOptions.versions[fieldPrefix] || [],
            required: true,
            onChange: handleVersionChange,
            onFocus: async () => {
                const n = getFieldValue("software_name");
                const t = getFieldValue("software_type");
                if (n && t) await loadSoftwareVersions(n, t, fieldPrefix);
            },
        },
        {
            name: "_license_identifier",
            label: "License / Account",
            opts: softwareOptions.licenses[fieldPrefix] || [],
            required: false,
            onFocus: async () => {
                const n = getFieldValue("software_name");
                const t = getFieldValue("software_type");
                const v = getFieldValue("version");
                if (n && t && v)
                    await loadSoftwareLicenses(
                        n,
                        t,
                        v,
                        fieldPrefix,
                        rowIndex || 0,
                    );
            },
        },
    ];

    return (
        <div
            className={cn(
                "grid gap-4",
                layout === "horizontal" ? "grid-cols-2" : "grid-cols-1",
            )}
        >
            {vertFields.map((f) => (
                <div key={f.name} className="flex flex-col gap-1.5">
                    {showLabels && (
                        <Label className="text-xs font-semibold text-muted-foreground">
                            {f.label}
                        </Label>
                    )}
                    <Form.Item
                        name={`${fieldPrefix}_${f.name}`}
                        noStyle
                        rules={
                            f.required
                                ? [
                                      {
                                          required: true,
                                          message: `Please select ${f.label.toLowerCase()}`,
                                      },
                                  ]
                                : []
                        }
                        initialValue={initialValues[f.name]}
                    >
                        <Combobox
                            options={f.opts}
                            placeholder={`Select ${f.label}`}
                            disabled={disabled[f.name]}
                            onChange={f.onChange}
                            onFocus={f.onFocus}
                        />
                    </Form.Item>
                </div>
            ))}
        </div>
    );
};

export default CascadingSoftwareFields;
