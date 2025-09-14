import { LoginForm } from "@/components/auth/loginPage/LoginForm";
import { CustomDialog } from "@/components/auth/helperComponents/CustomDialog";
import { motion, AnimatePresence } from "framer-motion";


interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  openSignup: () => void;
  onSuccessfulAuth : () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
  openSignup,
  onSuccessfulAuth
}) => {
  return (
    <CustomDialog isOpen={isOpen} onClose={onClose} title="Login">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="login"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="p-4">
              <LoginForm
                onSuccess={onClose}
                onSuccessfulAuth={onSuccessfulAuth}
              />

              {/* Button to Open Signup Dialog */}
              <p className="mt-4 text-sm text-center">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    onClose();
                    openSignup();
                  }}
                  className="text-blue-500 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CustomDialog>
  );
};