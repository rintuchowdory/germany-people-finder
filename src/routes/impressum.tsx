import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [{ title: "Impressum – Meldeamt.helper" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground">← Zurück</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">Impressum</h1>
      <p className="mt-6 text-muted-foreground">
        Bitte tragen Sie hier Ihre Angaben gemäß §5 TMG ein (Name, Anschrift, Kontakt,
        Verantwortlicher).
      </p>
    </div>
  ),
});
