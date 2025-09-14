"use client";

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
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <PasswordStrengthMeter password={passwordValue} />

        {/* Submit Button */}
        <Button type="submit" className="w-full">
          {isLoading ? <PropagateLoader /> : error ? error : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
};
