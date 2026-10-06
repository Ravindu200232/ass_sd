import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Wrench, Lock, User } from "lucide-react";

import { beginGoogleSignIn } from "@/lib/googleAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, user } = useAuth();

  // Already logged in → redirect
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      toast.error("Login Failed", {
        description: result.error,
      });
    } else {
      toast.success("Login Successful", {
        description: `Welcome back, ${result.data.full_name}!`,
      });

      /**
       * ✅ STEP 06 — Median + OneSignal SAFE TAGGING
       * MUST use OneSignalDeferred (NOT window.OneSignal)
       */
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push((OneSignal) => {
          OneSignal.sendTags({
            role: result.data.role,           // admin | employee
            user_code: result.data.user_code, // ADM001 | EMP001
          });
        });
      }
    }

    setLoading(false);
  };

  /**
   * Start the Google OIDC flow.
   *
   * googleLoading stays true on success: the page is navigating away to
   * Google, and resetting it would flash the button back to its idle state
   * during the redirect.
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      await beginGoogleSignIn();
    } catch (e) {
      setGoogleLoading(false);

      toast.error("Google sign-in unavailable", {
        description:
          e?.response?.data?.message ||
          e?.message ||
          "Please sign in with your username and password.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse delay-2000 transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Pubudu Auto Machineries
            </CardTitle>
            <CardDescription className="text-base mt-2 text-slate-600">
              Sign in to access your account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  // V-05: without autoComplete the browser cannot offer the
                  // saved credential, which pushes staff towards short,
                  // memorable - and therefore guessable - passwords. Now that
                  // the policy requires 12 characters with complexity, letting
                  // the password manager fill them in is what makes the policy
                  // workable rather than something people write on a note.
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold"
              disabled={loading || googleLoading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* ---------------------------------------------------------------
              Google OpenID Connect sign-in.

              The button only starts the flow: it asks the backend for an
              authorize URL and navigates to it. No client secret, no PKCE
              verifier and no nonce ever reach this page - see
              src/lib/googleAuth.js for why that matters in an application that
              had a stored XSS (V-13).
          --------------------------------------------------------------- */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full h-12 font-medium"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z"
              />
            </svg>
            {googleLoading ? "Redirecting to Google..." : "Sign in with Google"}
          </Button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Your administrator must link your work email to your staff account
            before Google sign-in will work.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
