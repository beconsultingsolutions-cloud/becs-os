import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSigningIn(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
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

          {/* Sign in form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-white/60 text-xs text-center uppercase tracking-widest font-semibold">
              Sign in to continue
            </p>

            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(83,60%,57%)] h-10"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(83,60%,57%)] h-10"
                data-testid="input-password"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs text-center bg-red-400/10 rounded-lg py-2 px-3" data-testid="text-login-error">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={signingIn || !email || !password}
              className="w-full bg-[hsl(83,60%,57%)] text-[hsl(232,45%,18%)] hover:bg-[hsl(83,60%,50%)] font-semibold h-11"
              data-testid="button-signin"
            >
              {signingIn ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Lock size={14} className="mr-2" />
              )}
              {signingIn ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-white/30 text-xs text-center">
            Access restricted to authorized team members
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
