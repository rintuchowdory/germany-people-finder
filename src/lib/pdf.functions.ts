import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";

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

    const meldeamt = (c.meldeamt_snapshot as null | {
      name: string;
      street?: string | null;
      postal_code: string;
      city: string;
    }) ?? null;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const W = 595.28;
    const M = 56;
    let y = 800;

    const draw = (
      text: string,
      opts: { x?: number; size?: number; bold?: boolean; color?: [number, number, number] } = {},
    ) => {
      const { x = M, size = 11, color = [0, 0, 0] as [number, number, number] } = opts;
      const f = opts.bold ? bold : font;
      // crude line wrap at ~85 chars
      const max = 85;
      const lines: string[] = [];
      text.split("\n").forEach((para) => {
        if (para.length <= max) { lines.push(para); return; }
        const words = para.split(" ");
        let cur = "";
        for (const w of words) {
          if ((cur + " " + w).trim().length > max) { lines.push(cur); cur = w; }
          else cur = cur ? cur + " " + w : w;
        }
        if (cur) lines.push(cur);
      });
      for (const line of lines) {
        page.drawText(line, { x, y, size, font: f, color: rgb(color[0], color[1], color[2]) });
        y -= size + 4;
      }
    };

    // Sender (top right)
    const senderLines = [
      profile?.full_name ?? "",
      profile?.street ?? "",
      `${profile?.postal_code ?? ""} ${profile?.city ?? ""}`.trim(),
      profile?.country ?? "",
      profile?.phone ? `Tel: ${profile.phone}` : "",
    ].filter(Boolean);
    let sy = 800;
    for (const line of senderLines) {
      page.drawText(line, { x: W - M - 200, y: sy, size: 10, font });
      sy -= 13;
    }

    // Recipient (top left)
    draw("An die zuständige Meldebehörde:", { bold: true });
    y -= 4;
    if (meldeamt) {
      draw(meldeamt.name, { bold: true });
      if (meldeamt.street) draw(meldeamt.street);
      draw(`${meldeamt.postal_code} ${meldeamt.city}`);
    } else {
      draw("(Anschrift bitte ergänzen)");
    }

    y -= 30;
    const today = new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
    page.drawText(today, { x: W - M - 200, y, size: 10, font });
    y -= 30;

    draw(
      c.request_type === "erweitert"
        ? "Antrag auf erweiterte Melderegisterauskunft nach §45 BMG"
        : "Antrag auf einfache Melderegisterauskunft nach §44 BMG",
      { bold: true, size: 13 },
    );
    y -= 10;

    draw("Sehr geehrte Damen und Herren,");
    y -= 4;
    draw(
      `hiermit beantrage ich gemäß §${c.request_type === "erweitert" ? "45" : "44"} Bundesmeldegesetz eine ${
        c.request_type === "erweitert" ? "erweiterte" : "einfache"
      } Melderegisterauskunft zu folgender Person:`,
    );
    y -= 6;

    draw("Angaben zur gesuchten Person", { bold: true });
    draw(`Name: ${subject.first_name} ${subject.last_name}`);
    if (subject.birth_name) draw(`Geburtsname: ${subject.birth_name}`);
    if (subject.date_of_birth) draw(`Geburtsdatum: ${subject.date_of_birth}`);
    if (subject.gender) draw(`Geschlecht: ${subject.gender}`);
    if (subject.last_known_street || subject.last_known_city) {
      draw(
        `Letzte bekannte Anschrift: ${subject.last_known_street ?? ""}, ${subject.last_known_postal_code ?? ""} ${
          subject.last_known_city ?? ""
        }`,
      );
    }
    if (subject.additional_info) draw(`Weitere Angaben: ${subject.additional_info}`);
    y -= 6;

    draw("Zweck der Anfrage", { bold: true });
    draw(c.purpose_text ?? "");
    y -= 4;

    if (c.request_type === "erweitert" && c.legitimate_interest_text) {
      draw("Berechtigtes Interesse", { bold: true });
      draw(c.legitimate_interest_text);
      y -= 4;
    }

    draw("Erklärung", { bold: true });
    draw(
      "Ich versichere, dass die übermittelten Daten nicht zum Zwecke der Werbung oder des Adresshandels verwendet werden (§44 Abs. 4 BMG).",
    );
    y -= 12;

    draw("Mit freundlichen Grüßen");
    y -= 30;
    draw("_____________________________");
    draw(profile?.full_name ?? "");

    const bytes = await pdf.save();
    const base64 = Buffer.from(bytes).toString("base64");
    const safeName = `${subject.last_name}_${subject.first_name}`.replace(/[^a-zA-Z0-9_-]/g, "");
    return { pdfBase64: base64, filename: `Melderegisterauskunft_${safeName}.pdf` };
  });
