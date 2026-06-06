import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { buildRequestPdf } from "./pdf.server";

export const generateRequestPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ caseId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ pdfBase64: string; filename: string }> => {
    const [{ data: c }, { data: subject }, { data: profile }] = await Promise.all([
      context.supabase.from("cases").select("*").eq("id", data.caseId).maybeSingle(),
      context.supabase.from("case_subjects").select("*").eq("case_id", data.caseId).maybeSingle(),
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
    ]);
    if (!c || !subject) throw new Error("Fall nicht vollständig");

    return buildRequestPdf({ caseRow: c, subject, profile });
  });
