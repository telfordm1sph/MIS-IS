import { usePage } from "@inertiajs/react";

import SidebarLink from "@/Components/sidebar/SidebarLink";

import {
    CctvIcon,
    Copyright,
    PackageSearch,
    Printer,
    ToolCase,
} from "lucide-react";
import { WindowsOutlined } from "@ant-design/icons";

export default function NavLinks({ isSidebarOpen }) {
    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("hardware.table")}
                icon={<PackageSearch className="w-5 h-5" />}
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
            <SidebarLink
                href={route("licenses.table")}
                icon={<Copyright className="w-5 h-5" />}
                label="Licenses"
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                href={route("printers.table")}
                icon={<Printer className="w-5 h-5" />}
                label="Printers"
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                href={route("cctv.table")}
                icon={<CctvIcon className="w-5 h-5" />}
                label="CCTVs"
                isSidebarOpen={isSidebarOpen}
            />
        </nav>
    );
}
