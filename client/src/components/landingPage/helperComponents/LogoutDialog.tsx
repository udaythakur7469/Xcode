import React from "react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropagateLoader } from "react-spinners";
import { useAuthStore } from "@/features/authStore";
import { useRouter } from "next/navigation";

type LogoutDialogProps = {};

const LogoutDialog: React.FC<LogoutDialogProps> = () => {
  const router = useRouter();
  const { logout, isLoading, error } = useAuthStore();
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after successful logout
      router.push("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="flex items-center justify-center">
        <DialogTitle>Logout</DialogTitle>
        <DialogDescription>Are you sure you want to Logout!</DialogDescription>
      </DialogHeader>
      <DialogClose asChild>
        <Button variant="destructive" onClick={handleLogout}>
          {isLoading ? <PropagateLoader /> : error ? error : "Logout"}
        </Button>
      </DialogClose>
    </DialogContent>
  );
};
export default LogoutDialog;
