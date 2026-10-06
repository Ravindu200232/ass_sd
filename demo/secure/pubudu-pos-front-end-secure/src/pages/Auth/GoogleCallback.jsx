import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { completeGoogleSignIn } from "@/lib/googleAuth";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Landing page for Google's redirect: /auth/callback?code=...&state=...
 *
 * The page reads the two query parameters, posts them to the backend, and lets
 * the backend do the exchange and every verification check. Nothing sensitive
 * is handled here - the client secret, the PKCE verifier and the nonce all live
 * server-side.
 *
 * Note the deliberate absence of any "redirect to wherever ?next= says" logic.
 * A post-login redirect target taken from the URL is the classic open-redirect,
 * and on a login page it is worth real money to a phisher. Successful sign-in
 * always lands on /dashboard.
 */
export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { adoptSession } = useAuth();

  const [error, setError] = useState(null);

  // React 18/19 StrictMode runs effects twice in development. The authorization
  // code is single-use, so a second exchange would always fail and show the
  // user an error after a successful sign-in.
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const googleError = searchParams.get("error");

    // The user pressed "Cancel" on Google's consent screen, or Google refused.
    if (googleError) {
      setError(
        googleError === "access_denied"
          ? "Sign-in was cancelled."
          : "Google could not complete the sign-in."
      );
      return;
    }

    if (!code || !state) {
      setError("This sign-in link is incomplete. Please start again.");
      return;
    }

    completeGoogleSignIn(code, state)
      .then((data) => {
        adoptSession(data.user, data.token);

        toast.success("Signed in with Google", {
          description: `Welcome, ${data.user.full_name}.`,
        });

        // replace: true so the browser Back button does not return to a URL
        // still carrying a spent authorization code.
        navigate("/dashboard", { replace: true });
      })
      .catch((e) => {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Google sign-in could not be completed."
        );
      });
  }, [searchParams, adoptSession, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {error ? (
            <>
              <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
              <div>
                <h1 className="text-lg font-semibold">Sign-in failed</h1>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => navigate("/login", { replace: true })}>
                Back to sign in
              </Button>
            </>
          ) : (
            <>
              <div className="relative">
                <ShieldCheck className="h-10 w-10 text-primary" aria-hidden="true" />
                <Loader2
                  className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Verifying your Google account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Checking the signed identity token with Google. This takes a moment.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
