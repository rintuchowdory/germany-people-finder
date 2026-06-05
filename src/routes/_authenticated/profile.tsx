import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getProfile, upsertProfile } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profil – Meldeamt.helper" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const saveFn = useServerFn(upsertProfile);
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const [form, setForm] = useState({
    full_name: "",
    street: "",
    postal_code: "",
    city: "",
    country: "Deutschland",
    phone: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        street: data.street ?? "",
        postal_code: data.postal_code ?? "",
        city: data.city ?? "",
        country: data.country ?? "Deutschland",
        phone: data.phone ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("Profil gespeichert");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Fehler"),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl font-bold">Profil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Diese Daten erscheinen als Absender auf Ihren Anträgen.
      </p>
      <Card className="mt-6 space-y-4 p-6">
        <Row label="Vollständiger Name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Row>
        <Row label="Straße & Nr."><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></Row>
        <div className="grid gap-4 md:grid-cols-2">
          <Row label="PLZ"><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></Row>
          <Row label="Ort"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Row>
        </div>
        <Row label="Land"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Row>
        <Row label="Telefon (optional)"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Row>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !form.full_name}>
          {save.isPending ? "Speichere…" : "Speichern"}
        </Button>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
