import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listCases } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
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

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-foreground",
  submitted: "bg-brand-amber/15 text-brand-amber border-brand-amber/30",
  awaiting_reply: "bg-brand-orange/15 text-brand-orange border-brand-orange/30",
  answered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  negative: "bg-muted text-muted-foreground",
  refused: "bg-destructive/15 text-destructive border-destructive/30",
};

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function Dashboard() {
  const fn = useServerFn(listCases);
  const { data, isLoading } = useQuery({ queryKey: ["cases"], queryFn: () => fn() });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    return (data ?? []).filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (type !== "all" && c.request_type !== type) return false;
      if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, status, type]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { total: data?.length ?? 0 };
    for (const c of data ?? []) acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, [data]);

  function exportCsv() {
    const rows = [
      ["Titel", "Art", "Status", "Erstellt", "Versendet"],
      ...filtered.map((c) => [
        c.title,
        c.request_type,
        STATUS_LABEL[c.status] ?? c.status,
        new Date(c.created_at).toLocaleDateString("de-DE"),
        c.submitted_at ? new Date(c.submitted_at).toLocaleDateString("de-DE") : "",
      ]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anfragen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold">
            Meine{" "}
            <span className="bg-[image:var(--gradient-sunset)] bg-clip-text text-transparent">
              Anfragen
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Ihre Melderegister-Anfragen an einem Ort.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download /> CSV
          </Button>
          <Link to="/cases/new">
            <Button className="bg-[image:var(--gradient-warm)] text-white hover:opacity-90">
              <Plus /> Neue Anfrage
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Gesamt", value: counts.total, tone: "from-brand-orange to-brand-amber" },
          {
            label: "Wartend",
            value: (counts.awaiting_reply ?? 0) + (counts.submitted ?? 0),
            tone: "from-brand-pink to-brand-orange",
          },
          { label: "Beantwortet", value: counts.answered ?? 0, tone: "from-emerald-500 to-teal-500" },
          { label: "Entwürfe", value: counts.draft ?? 0, tone: "from-brand-violet to-brand-pink" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div
              className={`mt-1 bg-gradient-to-br ${s.tone} bg-clip-text font-serif text-3xl font-bold text-transparent`}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nach Titel suchen…"
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Art" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Arten</SelectItem>
            <SelectItem value="einfach">Einfache Auskunft</SelectItem>
            <SelectItem value="erweitert">Erweiterte Auskunft</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {isLoading && <p className="text-muted-foreground">Lädt…</p>}

      {!isLoading && filtered.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">
            {data?.length ? "Keine Treffer für diese Filter." : "Noch keine Anfragen."}
          </p>
          {!data?.length && (
            <Link to="/cases/new">
              <Button className="mt-4 bg-[image:var(--gradient-warm)] text-white hover:opacity-90">
                Erste Anfrage anlegen
              </Button>
            </Link>
          )}
        </Card>
      )}

      <div className="grid gap-3">
        {filtered.map((c) => (
          <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }} className="block">
            <Card className="flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.request_type === "erweitert" ? "Erweiterte Auskunft" : "Einfache Auskunft"} ·{" "}
                  {new Date(c.created_at).toLocaleDateString("de-DE")}
                </div>
              </div>
              <Badge variant="outline" className={STATUS_TONE[c.status]}>
                {STATUS_LABEL[c.status] ?? c.status}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
