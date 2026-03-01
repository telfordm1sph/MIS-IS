import { usePage } from "@inertiajs/react";
import { useState } from "react";

export default function NavBar() {
    const { emp_data } = usePage().props;
    const [open, setOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const logout = () => {
        setIsLoggingOut(true);
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => {
            window.location.href = route("logout");
        }, 500);
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <nav className="sticky top-0 z-50 bg-base-100/70 backdrop-blur-md shadow-sm">
            <div className="px-4 mx-auto sm:px-6 lg:px-8">
                <div className="flex items-center justify-end h-[54px]">
                    <div className="relative">
                        {/* Trigger */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-base-200 transition"
                        >
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                                    {getInitials(emp_data?.emp_firstname)}
                                </div>

                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-base-100 rounded-full"></span>
                            </div>

                            <span className="font-semibold text-sm">
                                Hello, {emp_data?.emp_firstname || "Guest"}
                            </span>

                            {/* Chevron */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="none"
                                className={`w-4 h-4 transition-transform duration-200 ${
                                    open ? "rotate-180" : ""
                                }`}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                />
                            </svg>
                        </button>

                        {/* Dropdown */}
                        {open && (
                            <div className="absolute right-0 mt-2 w-56 bg-base-100 rounded-2xl shadow-xl border border-base-content/10 p-2">
                                {/* Header */}
                                <div className="flex items-center gap-3 p-3 border-b border-base-200">
                                    <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                                        {getInitials(emp_data?.emp_firstname)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">
                                            {emp_data?.emp_firstname || "Guest"}
                                        </div>
                                        <div className="text-xs text-success">
                                            ● Active now
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 space-y-1">
                                    <a
                                        href={route("profile.index")}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-base-200 transition"
                                        onClick={() => setOpen(false)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.8"
                                            stroke="currentColor"
                                            className="w-4 h-4 text-primary"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                            />
                                        </svg>
                                        Profile
                                    </a>

                                    <button
                                        onClick={logout}
                                        disabled={isLoggingOut}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-error/10 text-error transition w-full text-left"
                                    >
                                        {isLoggingOut ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.8"
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                                                />
                                            </svg>
                                        )}
                                        {isLoggingOut
                                            ? "Signing out…"
                                            : "Log out"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
