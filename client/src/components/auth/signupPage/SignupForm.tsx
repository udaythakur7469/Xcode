"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signupSchema,
  SignupFormData,
} from "@/components/auth/schemas/signupSchema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuthStore } from "@/features/authStore";
import { PropagateLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import PasswordStrengthMeter from "../passwordStrength/PasswordStrengthMeter";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { OAuthButtons } from "@/components/auth/helperComponents/OAuthButtons";
import { MagicLinkButton } from "@/components/auth/helperComponents/MagicLinkButton";

// Spring config — same as the prototype
const SWAP_SPRING = { type: "spring", stiffness: 300, damping: 28 } as const;

interface SignupFormProps {
  onSuccess?: () => void;
  onSuccessfulAuth: () => void;
  openLogin: () => void;
}

export const SignupForm = ({
  onSuccess,
  onSuccessfulAuth,
  openLogin,
}: SignupFormProps) => {
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const passwordValue = form.watch("password");
  const { signUp, isLoading, error } = useAuthStore();
  const router = useRouter();

  // ── Swap zone ────────────────────────────────────────────────────────────────
  const [pwFocused, setPwFocused] = useState(false);
  const [zoneHeight, setZoneHeight] = useState<number>(120);
  const oauthPanelRef = useRef<HTMLDivElement>(null);
  const strengthPanelRef = useRef<HTMLDivElement>(null);

  // Measure both panels on mount and lock to the taller one so the
  // dialog never jumps in height during the slide animation
  useEffect(() => {
    const oh = oauthPanelRef.current?.offsetHeight ?? 0;
    const sh = strengthPanelRef.current?.offsetHeight ?? 0;
    setZoneHeight(Math.max(oh, sh, 120));
  }, []);

  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (signUpData: SignupFormData) => {
    try {
      await signUp(signUpData.name, signUpData.email, signUpData.password);
      onSuccessfulAuth?.();
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Enter your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                    className="pr-10"
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
                  />
                  <Button
                    title={showPassword ? "Hide password" : "Show password"}
                    type="button"
                    variant="password"
                    size="icon"
                    onMouseDown={(e) => {
                      // Prevents blur firing before click — keeps animation stable
                      e.preventDefault();
                      setShowPassword((prev) => !prev);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div
          className="overflow-hidden"
          style={{ height: zoneHeight }}
          aria-live="polite"
        >
          <motion.div
            className="flex w-[200%]"
            animate={{ x: pwFocused ? "-50%" : "0%" }}
            transition={SWAP_SPRING}
          >
            {/* Panel A — OAuth + Magic Link (default visible) */}
            <div ref={oauthPanelRef} className="w-1/2 pr-2 space-y-2">
              <OAuthButtons mode="signup" />
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              <MagicLinkButton />
            </div>

            {/* Panel B — Password strength meter (visible on password focus) */}
            <div ref={strengthPanelRef} className="w-1/2 pl-2">
              <PasswordStrengthMeter password={passwordValue} />
            </div>
          </motion.div>
        </div>

        {/* Sign Up button */}
        <Button
          type="submit"
          className="w-full flex items-center justify-center"
        >
          {isLoading ? (
            <PropagateLoader
              style={{ display: "flex", alignItems: "center", height: "100%" }}
            />
          ) : error ? (
            error
          ) : (
            "Sign Up"
          )}
        </Button>

        {/* Switch to login */}
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={openLogin}
            className="text-blue-500 hover:underline"
          >
            Log In
          </button>
        </p>
      </form>
    </Form>
  );
};
