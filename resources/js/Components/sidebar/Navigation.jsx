import { usePage } from "@inertiajs/react";

import SidebarLink from "@/Components/sidebar/SidebarLink";

import { Table2Icon, ToolCase } from "lucide-react";
import { WindowsOutlined } from "@ant-design/icons";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("hardware.table")}
                icon={<Table2Icon className="w-5 h-5" />}
                label="Inventory"
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                href={route("parts.table")}
                icon={<ToolCase className="w-5 h-5" />}
                label="Parts"
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                href={route("software.table")}
                icon={<WindowsOutlined className="w-5 h-5" />}
                label="Softwares"
                isSidebarOpen={isSidebarOpen}
            />
        </nav>
    );
}
