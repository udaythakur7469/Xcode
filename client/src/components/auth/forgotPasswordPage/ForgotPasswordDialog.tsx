import { CustomDialog } from "@/components/auth/helperComponents/CustomDialog";
import { ForgotPasswordForm } from "@/components/auth/forgotPasswordPage/ForgotPasswordForm";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/features/authStore";
import { useEffect } from "react";

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  openLogin: () => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  isOpen,
  onClose,
  openLogin,
}) => {
  const { clearError, clearMessage } = useAuthStore();

  // Reset store state every time the dialog opens so stale messages
  // from a previous session don't flash on re-open
  useEffect(() => {
    if (isOpen) {
      clearError();
      clearMessage();
    }
  }, [isOpen, clearError, clearMessage]);

  const handleSuccess = () => {
    onClose();
    openLogin();
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose} title="Forgot password">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="forgot-password"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="p-4">
              <ForgotPasswordForm onSuccess={handleSuccess} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CustomDialog>
  );
};
