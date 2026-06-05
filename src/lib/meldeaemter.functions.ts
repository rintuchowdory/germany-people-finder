import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LookupSchema = z.object({
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  city: z.string().trim().min(1).max(120).optional(),
});

export type MunicipalityHit = {
  postal_code: string;
  place: string;
  municipality: string;
  district?: string;
  state?: string;
};

export const lookupMunicipality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => LookupSchema.parse(data))
  .handler(async ({ data }): Promise<MunicipalityHit[]> => {
    if (!data.postalCode && !data.city) return [];
    const url = data.postalCode
      ? `https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(data.postalCode)}`
      : `https://openplzapi.org/de/Localities?name=${encodeURIComponent(data.city!)}`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return [];
      const json = (await res.json()) as Array<{
        postalCode: string;
        name: string;
        municipality?: { name: string };
        district?: { name: string };
        federalState?: { name: string };
      }>;
      return json.slice(0, 50).map((r) => ({
        postal_code: r.postalCode,
        place: r.name,
        municipality: r.municipality?.name ?? r.name,
        district: r.district?.name,
        state: r.federalState?.name,
      }));
    } catch (e) {
      console.error("OpenPLZ lookup failed", e);
      return [];
    }
  });

const MeldeamtSearchSchema = z.object({
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  city: z.string().trim().min(1).max(120).optional(),
});

export const searchMeldeaemter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => MeldeamtSearchSchema.parse(data))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("meldeaemter").select("*").limit(20);
    if (data.postalCode) q = q.eq("postal_code", data.postalCode);
    else if (data.city) q = q.ilike("city", `%${data.city}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
