import { message } from "antd";
import axios from "axios";
import { router } from "@inertiajs/react"; // Make sure router is imported

export const useCrudOperations = ({
    updateRoute,
    storeRoute,
    deleteRoute,
    updateSuccessMessage = "Updated successfully!",
    createSuccessMessage = "Created successfully!",
    deleteSuccessMessage = "Deleted successfully!",
    errorMessage = "Something went wrong.",
    reloadProps = null, // optional array of props to reload after success
}) => {
    const handleSave = async (values, id) => {
        try {
            let response;
            if (id) {
                response = await axios.put(route(updateRoute, id), values);
                if (response.data.success) {
                    message.success(updateSuccessMessage);
                }
            } else {
                response = await axios.post(route(storeRoute), values);
                if (response.data.success) {
                    message.success(createSuccessMessage);
                }
            }

            if (response.data.success && reloadProps) {
                router.reload({ only: reloadProps });
            }

            return { success: response.data.success, data: response.data };
        } catch (e) {
            message.error(errorMessage);
            console.error(e);
            return { success: false, error: e };
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(route(deleteRoute, id));

            if (response.data.success) {
                message.success(deleteSuccessMessage);

                // 🔹 reload Inertia props if provided
                if (reloadProps) {
                    router.reload({ only: reloadProps });
                }
            }

            return { success: response.data.success, data: response.data };
        } catch (e) {
            message.error(errorMessage);
            console.error(e);
            return { success: false, error: e };
        }
    };

    return { handleSave, handleDelete };
};
