import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Gem, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { AuthForm } from "@/components/ui/premium-auth";

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard immediately
  React.useEffect(() => {
    if (user) {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      await login({
        username: credentials.username,
        password: credentials.password,
      });
      navigate({ to: "/" });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const data = (err.response as { data: { error?: string } }).data;
        throw new Error(data?.error || "Invalid credentials. Please verify your details.");
      }
      throw new Error("Unable to connect to server. Ensure Spring Boot is running on port 8080.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-8 lg:p-12 relative selection:bg-amber-500/25">
      {/* Decorative ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-surface border border-border rounded-2xl shadow-elevated overflow-hidden relative z-10">
        {/* Left Side: Luxury Jewelry Visual & Brand Showcase */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 bg-zinc-950 text-white overflow-hidden">
          {/* Background image overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

          {/* Top Brand Tag */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Enterprise Jeweller Suite
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Gem className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">JEWELLERS</h1>
              </div>
            </div>
          </div>

          {/* Bottom Highlights */}
          <div className="relative z-10 space-y-4 pt-12">
            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Girvi Mortgage Vault & Counter POS Terminal</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>ERP Station v2.4</span>
            </div>
          </div>
        </div>

        {/* Right Side: Premium Auth Form */}
        <div className="col-span-1 lg:col-span-7 p-2 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <AuthForm
              onLogin={handleLogin}
              onSuccess={() => navigate({ to: "/" })}
              onClose={() => navigate({ to: "/" })}
              className="p-2 sm:p-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
