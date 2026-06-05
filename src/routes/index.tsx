import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meldeamt.helper – Melderegisterauskunft in Deutschland einfach beantragen" },
      {
        name: "description",
        content:
          "Bereiten Sie formgerechte Anträge auf Melderegisterauskunft (§44/§45 BMG) vor, finden Sie die zuständige Meldebehörde und verfolgen Sie Ihre Anfragen an einem Ort.",
      },
      { property: "og:title", content: "Meldeamt.helper – Melderegisterauskunft beantragen" },
      {
        property: "og:description",
        content: "Formgerechte Anträge an die richtige Meldebehörde – verwaltet an einem Ort.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-xl font-bold">
            Melde<span className="text-primary">amt</span>.helper
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              Anmelden
            </Link>
            <Link to="/auth">
              <Button size="sm">Kostenlos starten</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="mb-4 inline-block rounded-full border bg-muted px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          §44 / §45 BMG
        </p>
        <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          Melderegisterauskunft – formgerecht in Minuten.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Jemanden in Deutschland verloren? Bereiten Sie einen offiziellen Antrag an die zuständige
          Meldebehörde vor, drucken Sie ihn als PDF und verfolgen Sie die Antwort. Wir suchen
          niemanden für Sie – wir helfen Ihnen, korrekt zu fragen.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth">
            <Button size="lg">Jetzt Anfrage vorbereiten</Button>
          </Link>
        </div>
      </section>

      <section className="border-t bg-muted">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-3">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-serif text-primary-foreground">
              1
            </div>
            <h3 className="mb-1 font-semibold">Person erfassen</h3>
            <p className="text-sm text-muted-foreground">
              Name, ggf. Geburtsdatum und letzte bekannte Adresse eingeben.
            </p>
          </div>
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-serif text-primary-foreground">
              2
            </div>
            <h3 className="mb-1 font-semibold">Zuständiges Meldeamt finden</h3>
            <p className="text-sm text-muted-foreground">
              Per Postleitzahl ermitteln wir die richtige Behörde inkl. Anschrift und Portal.
            </p>
          </div>
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-serif text-primary-foreground">
              3
            </div>
            <h3 className="mb-1 font-semibold">PDF erzeugen &amp; senden</h3>
            <p className="text-sm text-muted-foreground">
              Antrag als PDF herunterladen, einreichen und den Status verfolgen.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-4 font-serif text-3xl font-bold">Was dieses Tool nicht ist</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li>– Keine Datenbank mit Adressen von Privatpersonen.</li>
          <li>– Keine automatische Suche in sozialen Netzwerken.</li>
          <li>– Keine kommerzielle Adressauskunft, kein Adresshandel.</li>
          <li>
            – Anträge zu unlauteren Zwecken (Stalking, Werbung, Adresshandel) sind ausdrücklich
            untersagt.
          </li>
        </ul>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Meldeamt.helper</span>
          <div className="flex gap-4">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

