import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const DeleteConfirm = ({ open, onOpenChange, onConfirm }) => (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete this part?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onConfirm}
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);
