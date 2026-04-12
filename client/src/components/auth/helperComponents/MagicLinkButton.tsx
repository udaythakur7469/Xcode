"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/authStore";
import { Mail } from "lucide-react";
import { PropagateLoader } from "react-spinners";

export const MagicLinkButton: React.FC = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const { sendMagicLink, isSendingMagicLink, error } = useAuthStore();

  const handleSend = async () => {
    if (!email) return;
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch {
      // error is already set in the store
    }
  };

  if (sent) {
    return (
      <div className="text-center text-sm text-muted-foreground py-2">
        ✉ Magic link sent! Check your inbox.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        type="email"
        placeholder="Enter your email for a magic link"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={handleSend}
        disabled={isSendingMagicLink || !email}
      >
        {isSendingMagicLink ? (
          <PropagateLoader
            size={6}
            style={{ display: "flex", alignItems: "center" }}
          />
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Send Magic Link
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
};