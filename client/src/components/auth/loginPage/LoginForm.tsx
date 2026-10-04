"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  LoginFormData,
} from "@/components/auth/schemas/loginSchema";
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
import { EyeOff, Eye } from "lucide-react";
import { OAuthButtons } from "@/components/auth/helperComponents/OAuthButtons";
import { MagicLinkButton } from "@/components/auth/helperComponents/MagicLinkButton";

const SUCCESS_MESSAGE_MS = 3000;

interface LoginFormProps {
  onSuccess?: () => void;
  onSuccessfulAuth: () => void;
  openSignup: () => void;
  openForgotPassword: () => void;
  // Reports isLoading || isSuccess up to LoginDialog, which forwards it to
  // CustomDialog as preventClose - keeps the dialog open and non-dismissible
  // through the whole loader -> success-message window.
  onBusyChange?: (isBusy: boolean) => void;
}

export const LoginForm = ({
  onSuccess,
  onSuccessfulAuth,
  openSignup,
  openForgotPassword,
  onBusyChange,
}: LoginFormProps) => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { login, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onBusyChange?.(isLoading || isSuccess);
  }, [isLoading, isSuccess, onBusyChange]);

  // Guards against calling onSuccessfulAuth/onSuccess if this component
  // happens to unmount before the success-message timeout fires.
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const onSubmit = async (loginData: LoginFormData) => {
    try {
      await login(loginData.email, loginData.password);

      // Show "Login successful" in the button for a moment before actually
      // closing anything - onBusyChange(true) above keeps the dialog
      // non-dismissible for this window.
      setIsSuccess(true);
      successTimeoutRef.current = setTimeout(() => {
        onSuccessfulAuth?.();
        onSuccess?.();
      }, SUCCESS_MESSAGE_MS);
    } catch (err) {
      console.log(err);
    }
  };

  const isBusy = isLoading || isSuccess;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  />
                  <Button
                    title={showPassword ? "Hide password" : "Show password"}
                    type="button"
                    variant="password"
                    size="icon"
                    onMouseDown={(e) => {
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

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* OAuth buttons */}
        <OAuthButtons mode="login" />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Magic Link */}
        <MagicLinkButton />

        {/* Login button */}
        <Button
          type="submit"
          disabled={isBusy}
          className="w-full flex items-center justify-center"
        >
          {isLoading ? (
            <PropagateLoader
              style={{ display: "flex", alignItems: "center", height: "100%" }}
            />
          ) : isSuccess ? (
            "Login successful"
          ) : error ? (
            error
          ) : (
            "Login"
          )}
        </Button>

        {/* Switch to signup */}
        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={openSignup}
            className="text-blue-500 hover:underline"
          >
            Sign Up
          </button>
        </p>

        {/* Forgot password */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={openForgotPassword}
            className="text-sm text-muted-foreground hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </form>
    </Form>
  );
};
