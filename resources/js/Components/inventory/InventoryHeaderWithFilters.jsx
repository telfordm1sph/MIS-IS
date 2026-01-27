import React from "react";
import { Input, Select, Tag, Button } from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    FilterOutlined,
} from "@ant-design/icons";

const { Option } = Select;

// Unified icon wrapper for AntD and Lucide
const IconWrapper = ({ children, size = 16, style = {} }) => (
    <span
        style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            fontSize: size, // for font-based icons
            ...style,
        }}
    >
        {React.isValidElement(children)
            ? React.cloneElement(children, { width: size, height: size })
            : children}
    </span>
);

const InventoryHeaderWithFilters = ({
    title,
    categoryCounts = {},
    categoryConfig = {},
    searchText,
    category,
    subCategory,
    onSearchChange,
    onCategoryChange,
    onSubCategoryChange,
    hasActiveFilters,
    onResetFilters,
    searchPlaceholder = "Search hardware...",
    categoryPlaceholder = "Filter by category",
    subCategoryPlaceholder = "Filter by hardware type",
    showTags = true,
}) => {
    const totalCount = Object.values(categoryCounts).reduce(
        (sum, count) => sum + count,
        0
    );

    const statusCategories = ["New", "Inactive", "Defective"];
    const showSubCategory = statusCategories.includes(category);

    const hardwareCategories = Object.keys(categoryCounts).filter(
        (cat) => !statusCategories.includes(cat)
    );

    return (
        <div style={{ display: "grid", gap: 16, margin: "16px 0" }}>
            {/* Top row: Tags */}
            {showTags && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Tag color="default">Total: {totalCount}</Tag>
                    {Object.entries(categoryCounts).map(([cat, count]) => {
                      const config =
    categoryConfig[cat?.toLowerCase()] || categoryConfig.default || {};
                        return (
                            <Tag key={cat} color={config.color || "blue"}>
                                {config.icon && (
                                    <IconWrapper
                                        size={16}
                                        style={{ marginRight: 4 }}
                                    >
                                        {config.icon}
                                    </IconWrapper>
                                )}
                                {cat}: {count}
                            </Tag>
                        );
                    })}
                </div>
            )}

            {/* Bottom row: Controls */}
            <div
                style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: showSubCategory
                        ? "1fr auto auto auto"
                        : "1fr auto auto",
                }}
            >
                <Input
                    placeholder={searchPlaceholder}
                    prefix={
                        <IconWrapper size={16}>
                            <SearchOutlined />
                        </IconWrapper>
                    }
                    onChange={onSearchChange}
                    value={searchText}
                    allowClear
                    style={{ width: "100%" }}
                />

                <Select
                    placeholder={categoryPlaceholder}
                    value={category || undefined}
                    onChange={onCategoryChange}
                    allowClear
                    size="middle"
                    style={{ minWidth: 150 }}
                    suffixIcon={
                        <IconWrapper size={16}>
                            <FilterOutlined />
                        </IconWrapper>
                    }
                >
                    {Object.entries(categoryCounts).map(([cat, count]) => (
                        <Option key={cat} value={cat}>
                            {cat} ({count})
                        </Option>
                    ))}
                </Select>

                {showSubCategory && (
                    <Select
                        placeholder={subCategoryPlaceholder}
                        value={subCategory || undefined}
                        onChange={onSubCategoryChange}
                        allowClear
                        size="middle"
                        style={{ minWidth: 150 }}
                        suffixIcon={
                            <IconWrapper size={16}>
                                <FilterOutlined />
                            </IconWrapper>
                        }
                    >
                        {hardwareCategories.map((cat) => (
                            <Option key={cat} value={cat}>
                                {cat}
                            </Option>
                        ))}
                    </Select>
                )}

                {hasActiveFilters && (
                    <Button
                        type="primary"
                        icon={
                            <IconWrapper size={16}>
                                <ReloadOutlined />
                            </IconWrapper>
                        }
                        onClick={onResetFilters}
                    >
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
};

export default InventoryHeaderWithFilters;
