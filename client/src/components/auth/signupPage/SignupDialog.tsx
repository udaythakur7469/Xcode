import { useState } from "react";
import { SignupForm } from "@/components/auth/signupPage/SignupForm";
import { CustomDialog } from "@/components/auth/helperComponents/CustomDialog";
import { motion, AnimatePresence } from "framer-motion";

interface SignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  openLogin: () => void;
  onSuccessfulAuth: () => void;
}

export const SignupDialog: React.FC<SignupDialogProps> = ({
  isOpen,
  onClose,
  openLogin,
  onSuccessfulAuth,
}) => {
  // Mirrors SignupForm's isLoading || isSuccess - keeps CustomDialog
  // non-dismissible through the success-message window.
  const [isBusy, setIsBusy] = useState(false);

  // Handles switching to login: close signup dialog first, then open login
  const handleOpenLogin = () => {
    onClose();
    openLogin();
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose} title="Sign Up" preventClose={isBusy}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="signup"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="p-4">
              <SignupForm
                onSuccess={onClose}
                onSuccessfulAuth={onSuccessfulAuth}
                openLogin={handleOpenLogin}
                onBusyChange={setIsBusy}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CustomDialog>
  );
};
