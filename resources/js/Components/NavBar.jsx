import { usePage } from "@inertiajs/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, User, LogOut, Loader2 } from "lucide-react";

export default function NavBar() {
    const { emp_data } = usePage().props;
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

    const firstName = emp_data?.emp_firstname || "Guest";

    return (
        <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur-md border-b border-border/40 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-end h-[54px]">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2.5 px-2.5 py-1.5 h-auto rounded-full hover:bg-muted/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                            >
                                {/* Avatar with online dot */}
                                <div className="relative">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                            {getInitials(firstName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                                </div>

                                <span className="text-sm font-medium hidden sm:block">
                                    Hello,{" "}
                                    <span className="font-semibold">
                                        {firstName}
                                    </span>
                                </span>

                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-56 rounded-2xl p-1.5 shadow-xl"
                        >
                            {/* Profile header */}
                            <div className="flex items-center gap-3 px-3 py-2.5">
                                <Avatar className="w-9 h-9">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                                        {getInitials(firstName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold leading-tight truncate">
                                        {firstName}
                                    </span>
                                    <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                        Active now
                                    </span>
                                </div>
                            </div>

                            <DropdownMenuSeparator className="my-1" />

                            {/* Profile link */}
                            <DropdownMenuItem
                                asChild
                                className="rounded-xl cursor-pointer gap-3 px-3 py-2"
                            >
                                <a href={route("profile.index")}>
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">Profile</span>
                                </a>
                            </DropdownMenuItem>

                            {/* Logout */}
                            <DropdownMenuItem
                                onClick={logout}
                                disabled={isLoggingOut}
                                className="rounded-xl cursor-pointer gap-3 px-3 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                <span className="text-sm">
                                    {isLoggingOut ? "Signing out…" : "Log out"}
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
