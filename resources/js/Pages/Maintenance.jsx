import { Link } from "@inertiajs/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export default function Maintenance() {
    return (
        <div className="flex items-center justify-center min-h-screen px-6 bg-gray-100 dark:bg-gray-900">
            <div className="text-center max-w-md w-full space-y-4">
                <div className="flex justify-center">
                    <Construction className="w-16 h-16 text-yellow-500" />
                </div>

                <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-400 dark:text-yellow-400"
                >
                    System Maintenance
                </Badge>

                <h1 className="text-[60pt] font-bold text-gray-800 dark:text-gray-100 leading-none">
                    🔧
                </h1>

                <Alert className="text-left border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                    <Construction className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                        We'll be back soon!
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        The system is currently undergoing scheduled
                        maintenance. We apologize for the inconvenience and
                        appreciate your patience.
                    </AlertDescription>
                </Alert>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    If you need urgent assistance, please contact support.
                </p>

                <Button variant="outline" asChild>
                    <Link href={route("dashboard")}>Go Back</Link>
                </Button>
            </div>
        </div>
    );
}
