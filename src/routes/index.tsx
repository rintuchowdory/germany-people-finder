import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, MapPin, Search, ShieldCheck, Sparkles, Mail } from "lucide-react";

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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-xl font-bold">
            Melde
            <span className="bg-[image:var(--gradient-sunset)] bg-clip-text text-transparent">
              amt
            </span>
            .helper
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              Anmelden
            </Link>
            <Link to="/auth">
              <Button
                size="sm"
                className="bg-[image:var(--gradient-warm)] text-white shadow-[var(--shadow-glow)] hover:opacity-90"
              >
                Kostenlos starten
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl" />
          <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-brand-pink/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-brand-violet/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-6 py-28 text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-pink/30 bg-brand-pink/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-pink">
            <Sparkles className="size-3.5" /> §44 / §45 BMG
          </p>
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Melderegisterauskunft –{" "}
            <span className="bg-[image:var(--gradient-sunset)] bg-clip-text text-transparent">
              formgerecht in Minuten.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Jemanden in Deutschland verloren? Bereiten Sie einen offiziellen Antrag an die zuständige
            Meldebehörde vor, drucken Sie ihn als PDF und verfolgen Sie die Antwort.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[image:var(--gradient-sunset)] text-white shadow-[var(--shadow-glow)] hover:opacity-90"
              >
                Jetzt Anfrage vorbereiten <ArrowRight className="ml-1" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline">
                So funktioniert's
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4">
            {[
              { k: "11.000+", v: "Meldeämter" },
              { k: "<5 Min", v: "bis PDF" },
              { k: "DSGVO", v: "konform" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-2xl border bg-card/60 p-4 backdrop-blur"
              >
                <div className="bg-[image:var(--gradient-sunset)] bg-clip-text font-serif text-2xl font-bold text-transparent md:text-3xl">
                  {s.k}
                </div>
                <div className="text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-center font-serif text-4xl font-bold">
            In drei Schritten zur Auskunft
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: 1,
                icon: Search,
                color: "from-brand-orange to-brand-amber",
                title: "Person erfassen",
                desc: "Name, ggf. Geburtsdatum und letzte bekannte Adresse eingeben.",
              },
              {
                n: 2,
                icon: MapPin,
                color: "from-brand-pink to-brand-orange",
                title: "Zuständiges Meldeamt finden",
                desc: "Per Postleitzahl ermitteln wir die richtige Behörde inkl. Anschrift und Portal.",
              },
              {
                n: 3,
                icon: FileText,
                color: "from-brand-violet to-brand-pink",
                title: "PDF erzeugen & senden",
                desc: "Antrag als PDF herunterladen, einreichen und den Status verfolgen.",
              },
            ].map(({ n, icon: Icon, color, title, desc }) => (
              <div
                key={n}
                className="group relative rounded-3xl border bg-card p-7 transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
              >
                <div
                  className={`mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}
                >
                  <Icon className="size-6" />
                </div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-pink">
                  Schritt {n}
                </div>
                <h3 className="mb-2 font-serif text-xl font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Rechtssicher", d: "Formulierungen gemäß BMG." },
            { icon: Mail, t: "E-Mail-Vorlage", d: "Fertiger Text zum Kopieren." },
            { icon: FileText, t: "PDF-Export", d: "Ein Klick, druckfertig." },
            { icon: Search, t: "Such & Filter", d: "Alle Anfragen sortierbar." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border bg-card p-5">
              <Icon className="mb-3 size-5 text-brand-orange" />
              <div className="font-semibold">{t}</div>
              <div className="text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What it isn't */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="mb-6 font-serif text-3xl font-bold">Was dieses Tool nicht ist</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li>– Keine Datenbank mit Adressen von Privatpersonen.</li>
            <li>– Keine automatische Suche in sozialen Netzwerken.</li>
            <li>– Keine kommerzielle Adressauskunft, kein Adresshandel.</li>
            <li>
              – Anträge zu unlauteren Zwecken (Stalking, Werbung, Adresshandel) sind ausdrücklich
              untersagt.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-5xl px-6 py-20">
        <div className="overflow-hidden rounded-3xl bg-[image:var(--gradient-sunset)] p-10 text-center text-white shadow-[var(--shadow-glow)] md:p-16">
          <h2 className="font-serif text-3xl font-bold md:text-5xl">Bereit anzufangen?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Erstellen Sie Ihren ersten Antrag in unter 5 Minuten.
          </p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button size="lg" className="bg-white text-foreground hover:bg-white/90">
              Kostenlos starten <ArrowRight className="ml-1" />
            </Button>
          </Link>
        </div>
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
