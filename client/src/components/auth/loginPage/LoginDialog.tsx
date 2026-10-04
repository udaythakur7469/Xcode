import { useState } from "react";
import { LoginForm } from "@/components/auth/loginPage/LoginForm";
import { CustomDialog } from "@/components/auth/helperComponents/CustomDialog";
import { motion, AnimatePresence } from "framer-motion";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  openSignup: () => void;
  openForgotPassword: () => void;
  onSuccessfulAuth: () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
  openSignup,
  openForgotPassword,
  onSuccessfulAuth,
}) => {
  // Mirrors LoginForm's isLoading || isSuccess - keeps CustomDialog
  // non-dismissible through the success-message window.
  const [isBusy, setIsBusy] = useState(false);

  const handleOpenSignup = () => {
    onClose();
    openSignup();
  };

  const handleOpenForgotPassword = () => {
    onClose();
    openForgotPassword();
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose} title="Login" preventClose={isBusy}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="login"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="p-4">
              <LoginForm
                onSuccess={onClose}
                onSuccessfulAuth={onSuccessfulAuth}
                openSignup={handleOpenSignup}
                openForgotPassword={handleOpenForgotPassword}
                onBusyChange={setIsBusy}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CustomDialog>
  );
};
