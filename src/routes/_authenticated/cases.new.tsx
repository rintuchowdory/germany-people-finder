import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createCase } from "@/lib/cases.functions";
import { lookupMunicipality, type MunicipalityHit } from "@/lib/meldeaemter.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cases/new")({
  head: () => ({ meta: [{ title: "Neue Anfrage – Meldeamt.helper" }] }),
  component: NewCase,
});

function NewCase() {
  const router = useRouter();
  const lookupFn = useServerFn(lookupMunicipality);
  const createFn = useServerFn(createCase);

  const [step, setStep] = useState(1);
  const [requestType, setRequestType] = useState<"einfach" | "erweitert">("einfach");

  // subject
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthName, setBirthName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [lkStreet, setLkStreet] = useState("");
  const [lkPlz, setLkPlz] = useState("");
  const [lkCity, setLkCity] = useState("");
  const [additional, setAdditional] = useState("");

  // meldeamt
  const [hits, setHits] = useState<MunicipalityHit[]>([]);
  const [selectedMuni, setSelectedMuni] = useState<MunicipalityHit | null>(null);
  const [maName, setMaName] = useState("");
  const [maStreet, setMaStreet] = useState("");
  const [maPlz, setMaPlz] = useState("");
  const [maCity, setMaCity] = useState("");
  const [maEmail, setMaEmail] = useState("");

  // legal
  const [purpose, setPurpose] = useState("");
  const [interest, setInterest] = useState("");
  const [agreed, setAgreed] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: `${firstName} ${lastName}${lkCity ? " · " + lkCity : ""}`,
          request_type: requestType,
          purpose_text: purpose,
          legitimate_interest_text: requestType === "erweitert" ? interest : null,
          declared_no_advertising: true,
          meldeamt: maName
            ? {
                name: maName,
                street: maStreet || null,
                postal_code: maPlz,
                city: maCity,
                email: maEmail || null,
                online_portal_url: null,
              }
            : null,
          subject: {
            first_name: firstName,
            last_name: lastName,
            birth_name: birthName || null,
            date_of_birth: dob || null,
            gender: gender || null,
            last_known_street: lkStreet || null,
            last_known_postal_code: lkPlz || null,
            last_known_city: lkCity || null,
            additional_info: additional || null,
          },
        },
      }),
    onSuccess: (res) => {
      toast.success("Anfrage erstellt");
      router.navigate({ to: "/_authenticated/cases/$caseId", params: { caseId: res.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Fehler"),
  });

  async function doLookup() {
    if (!lkPlz && !lkCity) return;
    const res = await lookupFn({ data: { postalCode: /^\d{5}$/.test(lkPlz) ? lkPlz : undefined, city: lkCity || undefined } });
    setHits(res);
    if (res.length === 0) toast.info("Keine Treffer – Behörde bitte manuell eintragen.");
  }

  function applyMuni(m: MunicipalityHit) {
    setSelectedMuni(m);
    setMaName(`Einwohnermeldeamt ${m.municipality}`);
    setMaPlz(m.postal_code);
    setMaCity(m.municipality);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="text-sm text-muted-foreground">← Zurück</Link>
      <h1 className="mt-2 font-serif text-3xl font-bold">Neue Anfrage</h1>
      <p className="mt-1 text-sm text-muted-foreground">Schritt {step} von 4</p>

      <div className="mt-6 space-y-6">
        {step === 1 && (
          <Card className="space-y-4 p-6">
            <h2 className="font-semibold">1. Gesuchte Person</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Vorname *">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Field>
              <Field label="Nachname *">
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Field>
              <Field label="Geburtsname (optional)">
                <Input value={birthName} onChange={(e) => setBirthName(e.target.value)} />
              </Field>
              <Field label="Geburtsdatum (optional)">
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </Field>
              <Field label="Geschlecht (optional)">
                <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="z.B. weiblich" />
              </Field>
            </div>
            <h3 className="pt-4 text-sm font-semibold">Letzte bekannte Anschrift (hilft sehr)</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Straße & Nr."><Input value={lkStreet} onChange={(e) => setLkStreet(e.target.value)} /></Field>
              <Field label="PLZ"><Input value={lkPlz} onChange={(e) => setLkPlz(e.target.value)} /></Field>
              <Field label="Ort"><Input value={lkCity} onChange={(e) => setLkCity(e.target.value)} /></Field>
            </div>
            <Field label="Weitere Hinweise">
              <Textarea value={additional} onChange={(e) => setAdditional(e.target.value)} rows={3} />
            </Field>
            <NextBack onNext={() => setStep(2)} disabled={!firstName || !lastName} />
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-4 p-6">
            <h2 className="font-semibold">2. Zuständiges Meldeamt</h2>
            <p className="text-sm text-muted-foreground">
              Anhand der PLZ ermitteln wir die Gemeinde. Behörde bitte ggf. manuell anpassen.
            </p>
            <Button type="button" variant="secondary" onClick={doLookup} disabled={!lkPlz && !lkCity}>
              Gemeinde anhand letzter Adresse suchen
            </Button>
            {hits.length > 0 && (
              <div className="space-y-1 rounded border p-3">
                {hits.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyMuni(h)}
                    className={`block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent ${
                      selectedMuni === h ? "bg-accent" : ""
                    }`}
                  >
                    {h.postal_code} {h.place} – {h.municipality}
                    {h.state && <span className="text-muted-foreground"> ({h.state})</span>}
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Behörde *"><Input value={maName} onChange={(e) => setMaName(e.target.value)} /></Field>
              <Field label="Straße"><Input value={maStreet} onChange={(e) => setMaStreet(e.target.value)} /></Field>
              <Field label="PLZ *"><Input value={maPlz} onChange={(e) => setMaPlz(e.target.value)} /></Field>
              <Field label="Ort *"><Input value={maCity} onChange={(e) => setMaCity(e.target.value)} /></Field>
              <Field label="E-Mail (optional)"><Input value={maEmail} onChange={(e) => setMaEmail(e.target.value)} /></Field>
            </div>
            <NextBack onBack={() => setStep(1)} onNext={() => setStep(3)} disabled={!maName || !maPlz || !maCity} />
          </Card>
        )}

        {step === 3 && (
          <Card className="space-y-4 p-6">
            <h2 className="font-semibold">3. Art der Auskunft</h2>
            <RadioGroup value={requestType} onValueChange={(v) => setRequestType(v as "einfach" | "erweitert")}>
              <div className="flex items-start gap-3 rounded border p-3">
                <RadioGroupItem value="einfach" id="r1" />
                <Label htmlFor="r1" className="flex-1 cursor-pointer">
                  <div className="font-medium">Einfache Melderegisterauskunft (§44 BMG)</div>
                  <div className="text-sm text-muted-foreground">
                    Aktueller Vor- und Familienname, Doktorgrad, aktuelle Anschriften. Kein
                    berechtigtes Interesse erforderlich.
                  </div>
                </Label>
              </div>
              <div className="flex items-start gap-3 rounded border p-3">
                <RadioGroupItem value="erweitert" id="r2" />
                <Label htmlFor="r2" className="flex-1 cursor-pointer">
                  <div className="font-medium">Erweiterte Melderegisterauskunft (§45 BMG)</div>
                  <div className="text-sm text-muted-foreground">
                    Zusätzlich frühere Anschriften, Geburtsdatum/-ort, Familienstand, gesetzliche
                    Vertreter, ggf. Sterbedatum. Berechtigtes Interesse muss glaubhaft gemacht
                    werden.
                  </div>
                </Label>
              </div>
            </RadioGroup>
            <Field label="Zweck der Anfrage *">
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
                placeholder="z.B. Wiederherstellung des Kontaktes zu einem verschollenen Familienmitglied"
              />
            </Field>
            {requestType === "erweitert" && (
              <Field label="Berechtigtes Interesse glaubhaft machen *">
                <Textarea
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  rows={4}
                  placeholder="z.B. Erbenermittlung, gerichtlich titulierte Forderung, etc."
                />
              </Field>
            )}
            <NextBack
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              disabled={purpose.length < 10 || (requestType === "erweitert" && interest.length < 10)}
            />
          </Card>
        )}

        {step === 4 && (
          <Card className="space-y-4 p-6">
            <h2 className="font-semibold">4. Erklärung &amp; Absenden</h2>
            <div className="rounded bg-muted p-4 text-sm">
              <p className="mb-2 font-medium">Zusammenfassung</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Person: {firstName} {lastName}</li>
                <li>Letzte Anschrift: {lkStreet} {lkPlz} {lkCity}</li>
                <li>Meldeamt: {maName}, {maPlz} {maCity}</li>
                <li>Art: {requestType === "erweitert" ? "Erweitert (§45)" : "Einfach (§44)"}</li>
              </ul>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded border p-4 text-sm">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
              <span>
                Ich versichere, dass die übermittelten Daten <strong>nicht zum Zwecke der Werbung
                oder des Adresshandels</strong> verwendet werden (§44 Abs. 4 BMG). Mir ist
                bekannt, dass missbräuchliche Nutzung strafbar sein kann.
              </span>
            </label>
            <NextBack
              onBack={() => setStep(3)}
              onNext={() => create.mutate()}
              nextLabel={create.isPending ? "Erstelle…" : "Anfrage erstellen"}
              disabled={!agreed || create.isPending}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NextBack({
  onBack,
  onNext,
  disabled,
  nextLabel = "Weiter",
}: {
  onBack?: () => void;
  onNext: () => void;
  disabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex justify-between pt-2">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          Zurück
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onNext} disabled={disabled}>
        {nextLabel}
      </Button>
    </div>
  );
}
