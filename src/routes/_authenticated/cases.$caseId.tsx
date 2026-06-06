import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getCase, updateCaseStatus, recordResponse, deleteCase } from "@/lib/cases.functions";
import { generateRequestPdf } from "@/lib/pdf.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cases/$caseId")({
  head: () => ({ meta: [{ title: "Anfrage – Meldeamt.helper" }] }),
  component: CaseDetail,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  submitted: "Versendet",
  awaiting_reply: "Wartet auf Antwort",
  answered: "Beantwortet",
  negative: "Keine Daten",
  refused: "Abgelehnt",
};

function CaseDetail() {
  const { caseId } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getCase);
  const updFn = useServerFn(updateCaseStatus);
  const pdfFn = useServerFn(generateRequestPdf);
  const respFn = useServerFn(recordResponse);
  const delFn = useServerFn(deleteCase);

  const { data, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getFn({ data: { id: caseId } }),
  });

  const [outcome, setOutcome] = useState<"address_received" | "negative" | "refused" | "no_reply">("address_received");
  const [respDate, setRespDate] = useState("");
  const [rName, setRName] = useState("");
  const [rStreet, setRStreet] = useState("");
  const [rPlz, setRPlz] = useState("");
  const [rCity, setRCity] = useState("");
  const [rNotes, setRNotes] = useState("");

  const markSubmitted = useMutation({
    mutationFn: (channel: "post" | "email" | "portal" | "in_person") =>
      updFn({ data: { id: caseId, status: "awaiting_reply", submission_channel: channel } }),
    onSuccess: () => {
      toast.success("Als versendet markiert");
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });

  const recordResp = useMutation({
    mutationFn: () =>
      respFn({
        data: {
          case_id: caseId,
          outcome,
          response_date: respDate || null,
          current_full_name: rName || null,
          current_street: rStreet || null,
          current_postal_code: rPlz || null,
          current_city: rCity || null,
          current_country: null,
          notes: rNotes || null,
        },
      }),
    onSuccess: () => {
      toast.success("Antwort erfasst");
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      setRName(""); setRStreet(""); setRPlz(""); setRCity(""); setRNotes("");
    },
  });

  const downloadPdf = useMutation({
    mutationFn: () => pdfFn({ data: { caseId } }),
    onSuccess: (res) => {
      const bytes = Uint8Array.from(atob(res.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Fehler"),
  });

  const del = useMutation({
    mutationFn: () => delFn({ data: { id: caseId } }),
    onSuccess: () => {
      toast.success("Gelöscht");
      window.location.href = "/dashboard";
    },
  });

  if (isLoading || !data) return <div className="mx-auto max-w-3xl px-6 py-10">Lädt…</div>;
  const { case: c, subject, responses } = data;
  const ma = c.meldeamt_snapshot as null | { name: string; street?: string | null; postal_code: string; city: string; email?: string | null };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="text-sm text-muted-foreground">← Zurück</Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">{c.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.request_type === "erweitert" ? "Erweiterte Auskunft (§45 BMG)" : "Einfache Auskunft (§44 BMG)"}
          </p>
        </div>
        <Badge>{STATUS_LABEL[c.status] ?? c.status}</Badge>
      </div>

      <div className="mt-6 grid gap-6">
        <Card className="space-y-2 p-6">
          <h2 className="font-semibold">Gesuchte Person</h2>
          {subject && (
            <div className="text-sm text-muted-foreground">
              <div>{subject.first_name} {subject.last_name}{subject.birth_name ? ` (geb. ${subject.birth_name})` : ""}</div>
              {subject.date_of_birth && <div>geb. {subject.date_of_birth}</div>}
              {(subject.last_known_street || subject.last_known_city) && (
                <div>Letzte Anschrift: {subject.last_known_street} {subject.last_known_postal_code} {subject.last_known_city}</div>
              )}
            </div>
          )}
        </Card>

        <Card className="space-y-2 p-6">
          <h2 className="font-semibold">Empfänger</h2>
          {ma ? (
            <div className="text-sm text-muted-foreground">
              <div>{ma.name}</div>
              {ma.street && <div>{ma.street}</div>}
              <div>{ma.postal_code} {ma.city}</div>
              {ma.email && <div>{ma.email}</div>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Kein Meldeamt hinterlegt.</p>
          )}
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="font-semibold">Aktionen</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => downloadPdf.mutate()} disabled={downloadPdf.isPending}>
              {downloadPdf.isPending ? "Erstelle PDF…" : "Antrag als PDF herunterladen"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const subjectLine = `Antrag auf ${c.request_type === "erweitert" ? "erweiterte" : "einfache"} Melderegisterauskunft (§${c.request_type === "erweitert" ? "45" : "44"} BMG)`;
                const personLine = subject
                  ? `${subject.first_name} ${subject.last_name}${subject.birth_name ? ` (geb. ${subject.birth_name})` : ""}${subject.date_of_birth ? `, geb. am ${subject.date_of_birth}` : ""}`
                  : "[Person]";
                const lastAddr =
                  subject && (subject.last_known_street || subject.last_known_city)
                    ? `Letzte bekannte Anschrift: ${subject.last_known_street ?? ""} ${subject.last_known_postal_code ?? ""} ${subject.last_known_city ?? ""}`.trim()
                    : "";
                const body = [
                  `Sehr geehrte Damen und Herren,`,
                  ``,
                  `hiermit beantrage ich gemäß §${c.request_type === "erweitert" ? "45" : "44"} BMG eine ${c.request_type === "erweitert" ? "erweiterte" : "einfache"} Melderegisterauskunft zu folgender Person:`,
                  ``,
                  personLine,
                  lastAddr,
                  ``,
                  `Zweck der Anfrage: ${c.purpose_text ?? ""}`,
                  c.request_type === "erweitert" && c.legitimate_interest_text
                    ? `Berechtigtes Interesse: ${c.legitimate_interest_text}`
                    : "",
                  ``,
                  `Ich versichere, dass die Daten nicht zu Zwecken der Werbung oder des Adresshandels verwendet werden.`,
                  ``,
                  `Der vollständige, unterschriebene Antrag ist diesem Schreiben als PDF beigefügt.`,
                  ``,
                  `Mit freundlichen Grüßen`,
                ]
                  .filter(Boolean)
                  .join("\n");
                const mailto = ma?.email
                  ? `mailto:${ma.email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`
                  : null;
                navigator.clipboard.writeText(`${subjectLine}\n\n${body}`).then(() => {
                  toast.success("E-Mail-Text in Zwischenablage kopiert");
                });
                if (mailto) window.location.href = mailto;
              }}
            >
              E-Mail-Vorlage
            </Button>
            {(c.status === "draft" || c.status === "submitted") && (
              <Select onValueChange={(v) => markSubmitted.mutate(v as "post" | "email" | "portal" | "in_person")}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Als versendet markieren…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Per Post</SelectItem>
                  <SelectItem value="email">Per E-Mail</SelectItem>
                  <SelectItem value="portal">Online-Portal</SelectItem>
                  <SelectItem value="in_person">Persönlich</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="destructive" onClick={() => { if (confirm("Wirklich löschen?")) del.mutate(); }}>
              Löschen
            </Button>
          </div>
          {c.submitted_at && (
            <p className="text-xs text-muted-foreground">
              Versendet am {new Date(c.submitted_at).toLocaleDateString("de-DE")}
              {c.follow_up_at && ` · Nachfassen ab ${new Date(c.follow_up_at).toLocaleDateString("de-DE")}`}
            </p>
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Antwort erfassen</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Ergebnis</Label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="address_received">Adresse erhalten</SelectItem>
                  <SelectItem value="negative">Person nicht im Register</SelectItem>
                  <SelectItem value="refused">Auskunft verweigert</SelectItem>
                  <SelectItem value="no_reply">Keine Antwort</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Datum der Antwort</Label>
              <Input type="date" value={respDate} onChange={(e) => setRespDate(e.target.value)} />
            </div>
          </div>
          {outcome === "address_received" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1"><Label>Name</Label><Input value={rName} onChange={(e) => setRName(e.target.value)} /></div>
              <div className="space-y-1"><Label>Straße</Label><Input value={rStreet} onChange={(e) => setRStreet(e.target.value)} /></div>
              <div className="space-y-1"><Label>PLZ</Label><Input value={rPlz} onChange={(e) => setRPlz(e.target.value)} /></div>
              <div className="space-y-1"><Label>Ort</Label><Input value={rCity} onChange={(e) => setRCity(e.target.value)} /></div>
            </div>
          )}
          <div className="space-y-1">
            <Label>Notizen</Label>
            <Textarea rows={3} value={rNotes} onChange={(e) => setRNotes(e.target.value)} />
          </div>
          <Button onClick={() => recordResp.mutate()} disabled={recordResp.isPending}>Antwort speichern</Button>
        </Card>

        {responses.length > 0 && (
          <Card className="space-y-3 p-6">
            <h2 className="font-semibold">Bisherige Antworten</h2>
            {responses.map((r) => (
              <div key={r.id} className="rounded border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{r.outcome}</span>
                  <span className="text-muted-foreground">{r.response_date ?? new Date(r.created_at).toLocaleDateString("de-DE")}</span>
                </div>
                {r.current_street && (
                  <div className="mt-1 text-muted-foreground">
                    {r.current_full_name} – {r.current_street}, {r.current_postal_code} {r.current_city}
                  </div>
                )}
                {r.notes && <div className="mt-1 text-muted-foreground">{r.notes}</div>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
