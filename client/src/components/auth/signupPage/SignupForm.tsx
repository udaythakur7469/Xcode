"use client";

import { useState } from "react";
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

interface SignupFormProps {
  onSuccess?: () => void; // Add this line
  onSuccessfulAuth: () => void;
}

export const SignupForm = ({
  onSuccess,
  onSuccessfulAuth,
}: SignupFormProps) => {
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = form.watch("password");

  const { signUp, isLoading, error } = useAuthStore();
  const router = useRouter();

  const onSubmit = async (signUpData: SignupFormData) => {
    try {
      await signUp(signUpData.name, signUpData.email, signUpData.password);
      onSuccessfulAuth?.();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="name" placeholder="Enter your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Email Field */}
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

        {/* Password Field */}
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
                    onClick={handleShowPassword}
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

        <PasswordStrengthMeter password={passwordValue} />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full flex items-center justify-center"
        >
          {isLoading ? (
            <PropagateLoader
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
              }}
            />
          ) : error ? (
            error
          ) : (
            "Sign Up"
          )}
        </Button>
      </form>
    </Form>
  );
};
