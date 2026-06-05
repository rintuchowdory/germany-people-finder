import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Anmelden – Meldeamt.helper" },
      { name: "description", content: "Anmeldung für den Melderegister-Antragshelfer." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Konto erstellt. Sie sind jetzt angemeldet.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/_authenticated",
    });
    if (result.error) {
      toast.error("Google-Anmeldung fehlgeschlagen");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    router.navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center font-serif text-2xl font-bold">
          Melde<span className="text-primary">amt</span>.helper
        </Link>
        <Card className="p-8">
          <h1 className="mb-1 text-2xl font-semibold">
            {mode === "signin" ? "Anmelden" : "Konto erstellen"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Verwalten Sie Ihre Melderegister-Anfragen."
              : "Erstellen Sie ein Konto, um Anfragen vorzubereiten."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mb-4 w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            Mit Google fortfahren
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> oder <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {mode === "signin" ? "Anmelden" : "Konto erstellen"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "Noch kein Konto? Jetzt registrieren"
              : "Bereits registriert? Anmelden"}
          </button>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Mit der Anmeldung akzeptieren Sie unsere{" "}
          <Link to="/datenschutz" className="underline">
            Datenschutzhinweise
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
