import { usePage } from "@inertiajs/react";

import SidebarLink from "@/Components/sidebar/SidebarLink";

import { Table2Icon } from "lucide-react";

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
        </nav>
    );
}
