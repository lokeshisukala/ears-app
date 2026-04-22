import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Radio, Lock, User, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth-context";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    // already logged in
    queueMicrotask(() => navigate(from, { replace: true }));
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // small artificial delay for tactical feel
    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.ok) setError(res.error ?? "Login failed");
      else navigate(from, { replace: true });
    }, 350);
  };

  const fillDemo = (id: string, pwd: string) => {
    setUsername(id); setPassword(pwd); setError(null);
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-background relative overflow-hidden p-4">
      {/* Backdrop grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--primary)/0.15) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--primary)/0.15) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emergency via-primary to-emergency animate-pulse" />

      <div className="relative w-full max-w-md tactical-card p-6 sm:p-8 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-emergency/15 grid place-items-center glow-primary">
              <Radio className="h-8 w-8 text-emergency" />
            </div>
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emergency animate-blink" />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-widest text-glow">EARS</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
            Emergency Ambulance Routing System
          </p>
          <div className="mt-1 px-2 py-0.5 rounded-sm bg-success/15 border border-success/30 font-mono text-[9px] tracking-wider text-success">
            ● SECURE TAC-OS LOGIN
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="font-display text-xs tracking-widest uppercase">
              Driver ID
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ears-07"
                required
                disabled={loading}
                className="pl-9 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-display text-xs tracking-widest uppercase">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="pl-9 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center text-muted-foreground hover:text-foreground"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emergency/15 border border-emergency/40 text-emergency text-xs font-mono">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-display tracking-widest bg-gradient-to-r from-emergency to-primary hover:opacity-90 text-primary-foreground glow-primary"
          >
            {loading ? "AUTHENTICATING…" : "ENTER DASHBOARD"}
          </Button>
        </form>

        {/* Demo credentials helper */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="font-display text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Demo Credentials — tap to fill
          </div>
          <div className="grid gap-1.5">
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => fillDemo(c.id, c.pwd)}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/40 hover:bg-muted transition text-left"
              >
                <span className="font-mono text-xs text-foreground">{c.id}</span>
                <span className="font-mono text-xs text-muted-foreground">{c.pwd}</span>
                <span className="font-display text-[9px] tracking-wider text-primary">{c.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground font-mono">
          v2.4.1 · TAC-OS · Restricted Access
        </p>
      </div>
    </div>
  );
}
