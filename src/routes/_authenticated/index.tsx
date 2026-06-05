import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listCases } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Meine Anfragen – Meldeamt.helper" }] }),
  component: Dashboard,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  submitted: "Versendet",
  awaiting_reply: "Wartet auf Antwort",
  answered: "Beantwortet",
  negative: "Keine Daten",
  refused: "Abgelehnt",
};

function Dashboard() {
  const fn = useServerFn(listCases);
  const { data, isLoading } = useQuery({ queryKey: ["cases"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Meine Anfragen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Ihre Melderegister-Anfragen an einem Ort.
          </p>
        </div>
        <Link to="/_authenticated/cases/new">
          <Button>Neue Anfrage</Button>
        </Link>
      </div>

      {isLoading && <p className="text-muted-foreground">Lädt…</p>}

      {!isLoading && (!data || data.length === 0) && (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">Noch keine Anfragen.</p>
          <Link to="/_authenticated/cases/new">
            <Button className="mt-4">Erste Anfrage anlegen</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-3">
        {data?.map((c) => (
          <Link
            key={c.id}
            to="/_authenticated/cases/$caseId"
            params={{ caseId: c.id }}
            className="block"
          >
            <Card className="flex items-center justify-between p-4 transition hover:bg-accent">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.request_type === "erweitert" ? "Erweiterte Auskunft" : "Einfache Auskunft"} ·{" "}
                  {new Date(c.created_at).toLocaleDateString("de-DE")}
                </div>
              </div>
              <Badge variant={c.status === "answered" ? "default" : "secondary"}>
                {STATUS_LABEL[c.status] ?? c.status}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
