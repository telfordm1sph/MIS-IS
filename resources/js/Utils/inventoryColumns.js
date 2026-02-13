import React from "react";
import { Button, Tag } from "antd";
import { CirclePlusIcon } from "lucide-react";

export const getPartColumns = (onSelect) => [
    {
        title: "Add",
        key: "add",
        fixed: "left",
        width: 60,
        render: (_, record) =>
            React.createElement(Button, {
                type: "text",
                size: "small",
                icon: React.createElement(CirclePlusIcon, { size: 16 }),
                onClick: () => onSelect(record),
                disabled: record.quantity <= 0,
            }),
    },
    { title: "Part Type", dataIndex: "part_type", width: 120 },
    { title: "Brand", dataIndex: "brand", width: 120 },
    { title: "Model", dataIndex: "model", width: 120 },
    { title: "Specifications", dataIndex: "specifications", width: 150 },
    {
        title: "Condition",
        dataIndex: "condition",
        width: 100,
        render: (condition) =>
            React.createElement(Tag, { color: "green" }, condition),
    },
    { title: "Qty Available", dataIndex: "quantity", width: 100 },
    { title: "Location", dataIndex: "location", width: 120 },
];

export const getSoftwareColumns = (onSelect) => [
    {
        title: "Add",
        key: "add",
        fixed: "left",
        width: 60,
        render: (_, record) =>
            React.createElement(Button, {
                type: "text",
                size: "small",
                icon: React.createElement(CirclePlusIcon, { size: 16 }),
                onClick: () => onSelect(record),
                disabled: record.available_activations <= 0,
            }),
    },
    { title: "Software Name", dataIndex: "software_name", width: 150 },
    { title: "Type", dataIndex: "software_type", width: 120 },
    { title: "Version", dataIndex: "version", width: 100 },
    {
        title: "Identifier",
        dataIndex: "identifier",
        width: 150,
        render: (text, record) =>
            React.createElement(
                "div",
                null,
                React.createElement("div", null, text),
                React.createElement(
                    "small",
                    { style: { color: "#888" } },
                    record.identifier_type,
                ),
            ),
    },
    {
        title: "Available Activations",
        dataIndex: "available_activations",
        width: 130,
    },
];
