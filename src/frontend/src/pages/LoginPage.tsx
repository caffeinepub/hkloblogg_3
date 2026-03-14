import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!alias.trim() || !password.trim()) {
      setError("Fyll i alias och lösenord.");
      return;
    }
    setLoading(true);
    try {
      await login(alias.trim(), password);
      toast.success(`Välkommen, ${alias}!`);
      navigate({ to: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Inloggning misslyckades.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-foreground mb-2">
            Välkommen tillbaka
          </h1>
          <p className="text-sm text-muted-foreground">Logga in på HKLOblogg</p>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card-md p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-ocid="login.panel"
          >
            <div className="space-y-1.5">
              <Label htmlFor="alias">Alias</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="alias"
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Ditt alias"
                  className="pl-9"
                  autoComplete="username"
                  data-ocid="login.input"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Lösenord</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ditt lösenord"
                  className="pl-9"
                  autoComplete="current-password"
                  data-ocid="login.password.input"
                  required
                />
              </div>
            </div>
            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="login.error_state"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-ocid="login.submit_button"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {loading ? "Loggar in..." : "Logga in"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Inget konto?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
              data-ocid="login.register.link"
            >
              Registrera dig
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
