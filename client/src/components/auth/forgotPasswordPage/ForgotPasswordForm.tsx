"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/authStore";
import { PropagateLoader } from "react-spinners";

interface ForgotPasswordFormProps {
  onSuccess: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const { forgotPassword, isLoading, error, message } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await forgotPassword(email);
      // Don't call onSuccess — stay on the dialog to show the confirmation message
    } catch {
      // error already set in store
    }
  };

  // Sent state — show confirmation, nothing else
  if (message) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
            ✉
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
          <p className="text-xs text-muted-foreground">
            Check your spam folder if you don&apos;t see it within a minute.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onSuccess}
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your email address and we&apos;ll send you the password reset link
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="forgot-email">
          Email
        </label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-xs text-destructive text-center">{error}</p>}

      <Button
        type="submit"
        className="w-full flex items-center justify-center"
        disabled={isLoading || !email}
      >
        {isLoading ? (
          <PropagateLoader
            style={{ display: "flex", alignItems: "center", height: "100%" }}
          />
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
};
