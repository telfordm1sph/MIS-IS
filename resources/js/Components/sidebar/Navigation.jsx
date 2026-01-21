import { usePage } from "@inertiajs/react";

import SidebarLink from "@/Components/sidebar/SidebarLink";

import { ClipboardList, FileText, SheetIcon, Table2Icon } from "lucide-react";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            {/* <SidebarLink
                href={route("request.form")}
                icon={<FileText className="w-5 h-5" />}
                label="Requests Slip"
                isSidebarOpen={isSidebarOpen}
            /> */}
        </nav>
    );
}
