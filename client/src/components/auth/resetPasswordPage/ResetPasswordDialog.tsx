import { CustomDialog } from "@/components/auth/helperComponents/CustomDialog";
import { ResetPasswordForm } from "@/components/auth/resetPasswordPage/ResetPasswordForm";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/features/authStore";
import { useEffect } from "react";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
  openLogin: () => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  isOpen,
  token,
  onClose,
  openLogin,
}) => {
  const { clearError, clearMessage } = useAuthStore();

  // Clear stale store state each time this dialog opens
  useEffect(() => {
    if (isOpen) {
      clearError();
      clearMessage();
    }
  }, [isOpen, clearError, clearMessage]);

  // After success the user clicks "Sign in now" — close dialog,
  // clear the resetToken from the URL, then open login dialog
  const handleSuccess = () => {
    onClose();
    openLogin();
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose} title="Reset password">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="reset-password"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="p-4">
              <ResetPasswordForm token={token} onSuccess={handleSuccess} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CustomDialog>
  );
};
