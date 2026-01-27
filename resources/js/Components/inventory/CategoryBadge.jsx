import React from "react";
import { Tag } from "antd";

const CategoryBadge = ({ value, config, uppercase = false }) => {
    return (
        <Tag
            color={config.color} // Use AntD color prop
            icon={config.icon} // AntD Tag supports icon
            style={{ fontWeight: 500, fontSize: 14, padding: "0 8px" }} // optional styling
        >
            {uppercase ? value?.toUpperCase() : value}
        </Tag>
    );
};

export default CategoryBadge;
