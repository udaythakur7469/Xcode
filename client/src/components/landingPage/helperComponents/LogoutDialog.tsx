import React, { useEffect, useRef, useState } from "react";
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
import { releaseBodyLock } from "@/lib/releaseBodyLock";

const SUCCESS_MESSAGE_MS = 3000;

type LogoutDialogProps = {
  onClose: () => void;
  // Fired once logout has fully finished (after the success message has
  // shown) so the parent can close whatever overlay it wrapped this dialog
  // in - a DropdownMenu (Navbar/ProblemNavbar) or the command bar's
  // FloatingDialog. Closing only THIS dialog and leaving that outer
  // overlay mounted is what was leaving <body> permanently locked and
  // freezing the page until reload.
  onLoggedOut: () => void;
};

const LogoutDialog: React.FC<LogoutDialogProps> = ({ onClose, onLoggedOut }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { logout, isLoading, error } = useAuthStore();
  const { resetStore } = useChatStore();

  const [isSuccess, setIsSuccess] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guards against calling onClose/onLoggedOut/router.replace if this
  // component happens to unmount before the success-message timeout fires.
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const finishLogout = () => {
    // Close this Dialog AND the outer overlay together, then release any
    // body lock either of them left behind, then navigate - in that exact
    // order, so nothing gets unmounted mid-transition by the navigation.
    onClose();
    onLoggedOut();
    releaseBodyLock();

    if (pathname.startsWith("/account")) {
      router.replace("/");
    }
  };

  const handleLogout = async () => {
    try {
      // 1️⃣ Logout
      await logout();

      // 2️⃣ Reset chat/global state
      resetStore();

      // 3️⃣ Show "Logout successful" in the button for a moment before
      // actually closing anything - the dialog stays open and
      // non-dismissible for this window (see onInteractOutside/
      // onEscapeKeyDown below).
      setIsSuccess(true);
      successTimeoutRef.current = setTimeout(finishLogout, SUCCESS_MESSAGE_MS);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isBusy = isLoading || isSuccess;

  return (
    <DialogContent
      className="sm:max-w-md"
      onInteractOutside={(event) => {
        if (isBusy) event.preventDefault();
      }}
      onEscapeKeyDown={(event) => {
        if (isBusy) event.preventDefault();
      }}
    >
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
          disabled={isBusy}
          className="w-full mt-6 flex justify-center items-center"
        >
          {isLoading ? (
            <PropagateLoader size={8} />
          ) : isSuccess ? (
            "Logout successful"
          ) : error ? (
            error
          ) : (
            "Logout"
          )}
        </Button>
      </motion.div>
    </DialogContent>
  );
};

export default LogoutDialog;
