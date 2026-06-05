import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cases")
      .select("id, title, status, request_type, created_at, submitted_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  request_type: z.enum(["einfach", "erweitert"]),
  purpose_text: z.string().trim().min(10).max(2000),
  legitimate_interest_text: z.string().trim().max(2000).optional().nullable(),
  declared_no_advertising: z.literal(true),
  meldeamt: z
    .object({
      name: z.string().min(1).max(200),
      street: z.string().max(200).optional().nullable(),
      postal_code: z.string().max(20),
      city: z.string().max(120),
      email: z.string().max(200).optional().nullable(),
      online_portal_url: z.string().max(500).optional().nullable(),
    })
    .nullable(),
  subject: z.object({
    first_name: z.string().trim().min(1).max(120),
    last_name: z.string().trim().min(1).max(120),
    birth_name: z.string().trim().max(120).optional().nullable(),
    date_of_birth: z.string().optional().nullable(),
    gender: z.string().max(40).optional().nullable(),
    last_known_street: z.string().max(200).optional().nullable(),
    last_known_postal_code: z.string().max(20).optional().nullable(),
    last_known_city: z.string().max(120).optional().nullable(),
    additional_info: z.string().max(2000).optional().nullable(),
  }),
});

export const createCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: created, error } = await context.supabase
      .from("cases")
      .insert({
        owner_id: context.userId,
        title: data.title,
        request_type: data.request_type,
        purpose_text: data.purpose_text,
        legitimate_interest_text: data.legitimate_interest_text,
        declared_no_advertising: data.declared_no_advertising,
        meldeamt_snapshot: data.meldeamt as never,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: subErr } = await context.supabase.from("case_subjects").insert({
      case_id: created.id,
      owner_id: context.userId,
      first_name: data.subject.first_name,
      last_name: data.subject.last_name,
      birth_name: data.subject.birth_name,
      date_of_birth: data.subject.date_of_birth || null,
      gender: data.subject.gender,
      last_known_street: data.subject.last_known_street,
      last_known_postal_code: data.subject.last_known_postal_code,
      last_known_city: data.subject.last_known_city,
      additional_info: data.subject.additional_info,
    });
    if (subErr) throw new Error(subErr.message);

    return { id: created.id };
  });

export const getCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const [{ data: c, error }, { data: subj }, { data: resp }] = await Promise.all([
      context.supabase.from("cases").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("case_subjects").select("*").eq("case_id", data.id).maybeSingle(),
      context.supabase.from("case_responses").select("*").eq("case_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (!c) throw new Error("Fall nicht gefunden");
    return { case: c, subject: subj, responses: resp ?? [] };
  });

const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "submitted", "awaiting_reply", "answered", "negative", "refused"]),
  submission_channel: z.enum(["post", "email", "portal", "in_person"]).optional(),
  fee_paid_eur: z.number().min(0).max(1000).optional().nullable(),
});

export const updateCaseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => StatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "submitted" || data.status === "awaiting_reply") {
      patch.submitted_at = new Date().toISOString();
      patch.follow_up_at = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();
      if (data.submission_channel) patch.submission_channel = data.submission_channel;
      if (data.fee_paid_eur != null) patch.fee_paid_eur = data.fee_paid_eur;
    }
    const { error } = await context.supabase.from("cases").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ResponseSchema = z.object({
  case_id: z.string().uuid(),
  outcome: z.enum(["address_received", "negative", "refused", "no_reply"]),
  response_date: z.string().optional().nullable(),
  current_full_name: z.string().max(200).optional().nullable(),
  current_street: z.string().max(200).optional().nullable(),
  current_postal_code: z.string().max(20).optional().nullable(),
  current_city: z.string().max(120).optional().nullable(),
  current_country: z.string().max(80).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const recordResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ResponseSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("case_responses").insert({
      owner_id: context.userId,
      ...data,
    });
    if (error) throw new Error(error.message);
    const newStatus =
      data.outcome === "address_received"
        ? "answered"
        : data.outcome === "negative"
          ? "negative"
          : data.outcome === "refused"
            ? "refused"
            : "awaiting_reply";
    await context.supabase.from("cases").update({ status: newStatus }).eq("id", data.case_id);
    return { ok: true };
  });

export const deleteCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cases").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
