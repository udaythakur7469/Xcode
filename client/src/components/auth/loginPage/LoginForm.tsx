"use client";

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

interface LoginFormProps {
  onSuccess?: () => void; // Add this line
  onSuccessfulAuth: () => void;
}

export const LoginForm = ({ onSuccess, onSuccessfulAuth }: LoginFormProps) => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { login, isLoading, error } = useAuthStore();

  const onSubmit = async (loginData: LoginFormData) => {
    try {
      await login(loginData.email, loginData.password);
      onSuccessfulAuth?.();
      onSuccess?.();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
};
