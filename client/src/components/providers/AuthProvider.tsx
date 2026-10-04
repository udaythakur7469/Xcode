"use client";

import React from "react";
import { useAuthInit } from "@/hooks/useAuthInit";

type AuthProviderProps = { children: React.ReactNode };

// Mounted once in the root layout, next to the other app-wide providers
// (SocketProvider, CommentPanelProvider, etc). Its only job is running
// useAuthInit() so exactly one checkAuth() fires per app load instead of
// every navbar/gate/guard triggering its own on mount. Everything else
// (Navbar, AccountAuthGate, InterviewAuthGate, ...) just reads the
// resulting state from useUserStore.
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  useAuthInit();

  return <>{children}</>;
};

export default AuthProvider;
