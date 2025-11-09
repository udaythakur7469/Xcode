import React from "react";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropagateLoader } from "react-spinners";
import { useAuthStore } from "@/features/authStore";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

type LogoutDialogProps = {
  isOpen?: boolean;
};

const LogoutDialog: React.FC<LogoutDialogProps> = ({ isOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, isLoading, error } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after successful logout
      if (pathname.startsWith("/account/")) {
        router.push("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <DialogHeader className="flex items-center justify-center">
          <DialogTitle className="text-2xl">
            Are you sure you want to Logout!
          </DialogTitle>
        </DialogHeader>
        <DialogClose asChild>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full flex mt-4"
          >
            {isLoading ? <PropagateLoader /> : error ? error : "Logout"}
          </Button>
        </DialogClose>
      </motion.div>
    </DialogContent>
  );
};
export default LogoutDialog;
