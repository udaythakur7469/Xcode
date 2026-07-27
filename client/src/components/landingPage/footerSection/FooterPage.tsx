"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { ForgotPasswordDialog } from "@/components/auth/forgotPasswordPage/ForgotPasswordDialog";
import { useUserStore } from "@/features/userStore";

type FooterPageProps = {};

const FooterPage: React.FC<FooterPageProps> = () => {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { checkAuth, userData } = useUserStore();

  const navigateTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  const goToAccountPage = (e: React.MouseEvent) => {
    e.preventDefault();
    const name = encodeURIComponent(userData?.name || "");
    router.push(`/account/${name}`);
  };

  return (
    <>
      <footer id="footer" className="border-t border-border pt-[60px] pb-8">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-[50px]">
            <div>
              <div className="flex items-center gap-2.5 font-bold text-xl">
                <span
                  className="w-2.5 h-2.5 rounded-full bg-brand"
                  style={{ boxShadow: "0 0 12px var(--brand-glow)" }}
                />
                xCode
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3.5 max-w-[280px]">
                A modern, judged coding platform to practice, get AI interview
                feedback, and actually retain what you learn.
              </p>
            </div>

            <div>
              <h5 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-4">
                Platform
              </h5>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li>
                  <a
                    href="/problems"
                    onClick={navigateTo("/problems")}
                    className="opacity-80 hover:opacity-100 hover:text-brand transition-colors"
                  >
                    Problems
                  </a>
                </li>
                <li>
                  <a
                    href="/explore"
                    onClick={navigateTo("/explore")}
                    className="opacity-80 hover:opacity-100 hover:text-brand transition-colors"
                  >
                    Explore
                  </a>
                </li>
                <li>
                  <a
                    href="/interview"
                    onClick={navigateTo("/interview")}
                    className="opacity-80 hover:opacity-100 hover:text-brand transition-colors"
                  >
                    Practice Interviews
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-4">
                Interview Prep
              </h5>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li>
                  <a
                    href="/interview"
                    onClick={navigateTo("/interview")}
                    className="opacity-80 hover:opacity-100 hover:text-brand transition-colors"
                  >
                    Practice Interviews
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-4">
                Account
              </h5>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={goToAccountPage}
                    className="opacity-80 hover:opacity-100 hover:text-brand transition-colors"
                  >
                    My Account
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsSignupOpen(true)}
                    className="opacity-80 hover:opacity-100 hover:text-brand transition-colors"
                  >
                    Sign up
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsLoginOpen(true)}
                    className="opacity-80 hover:opacity-100 hover:text-brand transition-colors"
                  >
                    Log in
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3.5 pt-[26px] border-t border-border text-sm text-muted-foreground">
            <span>
              © {new Date().getFullYear()} xCode. Built by Uday Thakur.
            </span>
          </div>
        </div>
      </footer>

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
        openForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        openLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
};
export default FooterPage;
