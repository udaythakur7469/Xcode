"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/authStore";
import { PropagateLoader } from "react-spinners";
import { Eye, EyeOff } from "lucide-react";
import PasswordStrengthMeter from "@/components/auth/passwordStrength/PasswordStrengthMeter";

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { resetPassword, isLoading, error, message } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (newPassword.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    try {
      await resetPassword(token, newPassword);
      // onSuccess is called after the success message is shown
    } catch {
      // error already set in store
    }
  };

  // Success state
  if (message) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl text-green-600">
            ✓
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        <Button type="button" className="w-full" onClick={onSuccess}>
          Sign in now
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose a new password for your account.
      </p>

      {/* New password */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="new-password">
          New password
        </label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNew ? "text" : "password"}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pr-10"
            required
          />
          <Button
            type="button"
            variant="password"
            size="icon"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowNew((prev) => !prev);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {showNew ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Strength meter — always visible here since there's no swap zone */}
      {newPassword.length > 0 && (
        <PasswordStrengthMeter password={newPassword} />
      )}

      {/* Confirm password */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="confirm-password">
          Confirm password
        </label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-10"
            required
          />
          <Button
            type="button"
            variant="password"
            size="icon"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowConfirm((prev) => !prev);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Validation / API errors */}
      {(validationError || error) && (
        <p className="text-xs text-destructive text-center">
          {validationError ?? error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full flex items-center justify-center"
        disabled={isLoading || !newPassword || !confirmPassword}
      >
        {isLoading ? (
          <PropagateLoader
            style={{ display: "flex", alignItems: "center", height: "100%" }}
          />
        ) : (
          "Reset password"
        )}
      </Button>
    </form>
  );
};
