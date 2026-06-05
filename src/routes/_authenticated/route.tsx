import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="font-serif text-xl font-bold tracking-tight">
            Melde<span className="text-primary">amt</span>.helper
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              Meine Anfragen
            </Link>
            <Link to="/profile" className="text-muted-foreground hover:text-foreground">
              Profil
            </Link>
            <span className="hidden text-xs text-muted-foreground md:inline">{email}</span>
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">
              Abmelden
            </button>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-16 border-t bg-card">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          <p>
            Hinweis: Dieses Tool stellt ausschließlich formale Anträge auf Melderegisterauskunft
            gemäß §44/§45 BMG bereit. Es werden <strong>keine</strong> personenbezogenen Daten
            Dritter abgefragt, gespeichert oder verkauft. Die Auskunft erteilt allein die
            zuständige Meldebehörde.
          </p>
        </div>
      </footer>
    </div>
  );
}
