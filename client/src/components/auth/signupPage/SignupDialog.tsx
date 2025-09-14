import { SignupForm } from "@/components/auth/signupPage/SignupForm";
import { CustomDialog } from "@/components/auth/helperComponents/CustomDialog";
import { motion, AnimatePresence } from "framer-motion";

interface SignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  openLogin: () => void;
  onSuccessfulAuth : () => void;
}

export const SignupDialog: React.FC<SignupDialogProps> = ({
  isOpen,
  onClose,
  openLogin,
  onSuccessfulAuth
}) => {
  return (
    <CustomDialog isOpen={isOpen} onClose={onClose} title="Sign Up">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="signup"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="p-4">
              <SignupForm
                onSuccess={onClose}
                onSuccessfulAuth={onSuccessfulAuth}
              />

              {/* Button to Open Login Dialog */}
              <p className="mt-4 text-sm text-center">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    onClose();
                    openLogin();
                  }}
                  className="text-blue-500 hover:underline"
                >
                  Log In
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CustomDialog>
  );
};
