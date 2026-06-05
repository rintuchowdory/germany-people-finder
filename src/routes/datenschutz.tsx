import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [{ title: "Datenschutz – Meldeamt.helper" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground">← Zurück</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">Datenschutz</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Wir verarbeiten ausschließlich die Daten, die Sie selbst zur Vorbereitung Ihrer Anfragen
          eingeben. Eingaben werden in Ihrem Konto gespeichert und sind nur für Sie sichtbar.
        </p>
        <p>
          Dieses Tool fragt <strong>keine</strong> personenbezogenen Daten Dritter aus externen
          Quellen ab. Es generiert lediglich formale Schreiben an Meldebehörden.
        </p>
        <p>
          Anbieter trägt die Verantwortung gemäß DSGVO. Sie haben jederzeit das Recht auf Auskunft,
          Berichtigung und Löschung Ihrer Daten.
        </p>
      </div>
    </div>
  ),
});
