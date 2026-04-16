import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(232,45%,12%)]">
        <Loader2 className="animate-spin text-[hsl(83,60%,57%)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(232,45%,12%)] p-4">
      <Card className="w-full max-w-sm border-white/10 bg-[hsl(232,45%,18%)] shadow-2xl" data-testid="login-card">
        <CardContent className="p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-label="BECS OS">
              <rect width="48" height="48" rx="12" fill="hsl(83,60%,57%)" />
              <text
                x="6"
                y="33"
                fontFamily="'Cabinet Grotesk', sans-serif"
                fontWeight="800"
                fontSize="24"
                fill="hsl(232,45%,18%)"
              >
                BE
              </text>
            </svg>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white tracking-wide">BECS OS</h1>
              <p className="text-white/50 text-sm mt-0.5">Plan. Evolve. Succeed.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Sign in */}
          <div className="space-y-3">
            <p className="text-white/60 text-xs text-center uppercase tracking-widest font-semibold">
              Sign in to continue
            </p>
            <Button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full bg-white text-[hsl(232,45%,18%)] hover:bg-white/90 font-semibold h-11"
              data-testid="button-google-signin"
            >
              {signingIn ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {signingIn ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>

          <p className="text-white/30 text-xs text-center">
            Access restricted to authorized team members
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
