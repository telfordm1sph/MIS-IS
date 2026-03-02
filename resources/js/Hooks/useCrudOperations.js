import axios from "axios";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

export const useCrudOperations = ({
    updateRoute,
    storeRoute,
    deleteRoute,
    updateSuccessMessage = "Updated successfully!",
    createSuccessMessage = "Created successfully!",
    deleteSuccessMessage = "Deleted successfully!",
    errorMessage = "Something went wrong.",
    reloadProps = null,
}) => {
    const handleSave = async (values, id) => {
        try {
            let response;

            if (id) {
                response = await axios.put(route(updateRoute, id), values);

                if (response.data.success) {
                    toast.success(updateSuccessMessage);
                }
            } else {
                response = await axios.post(route(storeRoute), values);

                if (response.data.success) {
                    toast.success(createSuccessMessage);
                }
            }

            if (response.data.success && reloadProps) {
                router.reload({ only: reloadProps });
            }

            return { success: response.data.success, data: response.data };
        } catch (e) {
            toast.error(errorMessage);
            console.error(e);
            return { success: false, error: e };
        }
    };

    const handleDelete = async (id, extraData = {}) => {
        try {
            const response = await axios.delete(route(deleteRoute, id), {
                data: extraData,
            });

            if (response.data.success) {
                toast.success(deleteSuccessMessage);

                if (reloadProps) {
                    router.reload({ only: reloadProps });
                }
            }

            return { success: response.data.success, data: response.data };
        } catch (e) {
            toast.error(errorMessage);
            console.error(e);
            return { success: false, error: e };
        }
    };

    return { handleSave, handleDelete };
};
