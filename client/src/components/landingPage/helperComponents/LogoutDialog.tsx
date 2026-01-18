import React from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropagateLoader } from "react-spinners";
import { useAuthStore } from "@/features/authStore";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useChatStore } from "@/features/chatStore";

type LogoutDialogProps = {
  onClose: () => void;
};

const LogoutDialog: React.FC<LogoutDialogProps> = ({ onClose }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { logout, isLoading, error } = useAuthStore();
  const { resetStore } = useChatStore();

  const handleLogout = async () => {
    try {
      // 1️⃣ Logout
      await logout();

      // 2️⃣ Reset chat/global state
      resetStore();

      // 3️⃣ Close dialog AFTER everything is done
      onClose();

      // 4️⃣ Redirect safely
      if (pathname.startsWith("/account")) {
        router.replace("/");
      }
    } catch (err) {
      console.error("Logout failed:", err);
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
          <DialogTitle className="text-2xl text-center">
            Are you sure you want to logout?
          </DialogTitle>
        </DialogHeader>

        <Button
          variant="destructive"
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full mt-6 flex justify-center items-center"
        >
          {isLoading ? <PropagateLoader size={8} /> : error ? error : "Logout"}
        </Button>
      </motion.div>
    </DialogContent>
  );
};

export default LogoutDialog;
