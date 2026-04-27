// BE University inbound webhook receiver
// =========================================================================
// INERT until BE U platform is chosen. Logs every payload to
// be_u_webhook_events, then dispatches per source adapter. Existing
// adapters: kajabi, skool, teachable, custom. New platforms only need
// a parseX() function added to ADAPTERS.
//
// Auth: shared secret via x-be-u-signature header, compared to env var
// BE_U_WEBHOOK_SECRET. If header is missing the request is rejected with
// 401. Set the secret in Supabase project settings before going live.
//
// Verify_jwt is false because external platforms don't have a JWT —
// they sign with the shared secret instead.
// =========================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────
interface NormalizedEvent {
  source: string;
  eventType: "purchase" | "enrollment" | "progress" | "completion" | "refund" | "unknown";
  externalId: string | null;
  email: string | null;
  courseExternalId: string | null;
  progressPct: number | null;
  status: string | null;
  raw: Record<string, unknown>;
}

type Adapter = (payload: any) => NormalizedEvent;

// ─── Adapters (one per platform) ──────────────────────────────────────────
// Each adapter takes the raw platform payload and produces a NormalizedEvent.
// All adapters are skeletons until the platform is chosen.

const parseKajabi: Adapter = (p) => ({
  source: "kajabi",
  eventType: (p?.event ?? "unknown") as NormalizedEvent["eventType"],
  externalId: p?.id ?? null,
  email: p?.member?.email ?? p?.email ?? null,
  courseExternalId: p?.offer?.id ?? p?.product?.id ?? null,
  progressPct: typeof p?.progress === "number" ? p.progress : null,
  status: p?.status ?? null,
  raw: p,
});

const parseSkool: Adapter = (p) => ({
  source: "skool",
  eventType: (p?.type ?? "unknown") as NormalizedEvent["eventType"],
  externalId: p?.event_id ?? null,
  email: p?.user?.email ?? null,
  courseExternalId: p?.course?.id ?? null,
  progressPct: typeof p?.progress_percent === "number" ? p.progress_percent : null,
  status: p?.status ?? null,
  raw: p,
});

const parseTeachable: Adapter = (p) => ({
  source: "teachable",
  eventType: (p?.event ?? "unknown") as NormalizedEvent["eventType"],
  externalId: p?.id ? String(p.id) : null,
  email: p?.email ?? null,
  courseExternalId: p?.course_id ? String(p.course_id) : null,
  progressPct: typeof p?.percent_complete === "number" ? p.percent_complete : null,
  status: p?.completed_at ? "completed" : null,
  raw: p,
});

const parseCustom: Adapter = (p) => ({
  source: "custom",
  eventType: (p?.event_type ?? "unknown") as NormalizedEvent["eventType"],
  externalId: p?.event_id ?? null,
  email: p?.email ?? null,
  courseExternalId: p?.course_external_id ?? null,
  progressPct: typeof p?.progress_pct === "number" ? p.progress_pct : null,
  status: p?.status ?? null,
  raw: p,
});

const ADAPTERS: Record<string, Adapter> = {
  kajabi: parseKajabi,
  skool: parseSkool,
  teachable: parseTeachable,
  custom: parseCustom,
};

// ─── Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, x-be-u-signature, x-be-u-source",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth: shared-secret header
  const expected = Deno.env.get("BE_U_WEBHOOK_SECRET");
  const provided = req.headers.get("x-be-u-signature");
  if (!expected) {
    // Don't fail closed if the secret hasn't been set yet — log and accept,
    // but mark as "skipped" so it's clearly inert. This lets you stand up
    // the endpoint and wire it to a platform later without a redeploy.
    console.warn("BE_U_WEBHOOK_SECRET not set — accepting payload as inert");
  } else if (provided !== expected) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const source = req.headers.get("x-be-u-source") ?? "custom";
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const adapter = ADAPTERS[source] ?? parseCustom;
  const evt = adapter(payload);

  // Supabase admin client (service role)
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const eventId = `BEU-WH-${crypto.randomUUID()}`;

  // 1. Log raw event
  const initialStatus = expected ? "received" : "skipped"; // skipped if no secret configured
  const { data: logged, error: logErr } = await sb
    .from("be_u_webhook_events")
    .insert({
      event_id: eventId,
      direction: "inbound",
      source: evt.source,
      event_type: evt.eventType,
      payload: evt.raw,
      status: initialStatus,
    })
    .select()
    .single();

  if (logErr) {
    console.error("failed to log webhook event:", logErr);
    return new Response(JSON.stringify({ error: "log_failed", details: logErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // 2. Try to resolve client by email
  let clientId: number | null = null;
  if (evt.email) {
    const { data: client } = await sb
      .from("clients")
      .select("id")
      .ilike("email", evt.email)
      .maybeSingle();
    clientId = client?.id ?? null;
  }

  // 3. Try to resolve course by external_id
  let courseId: number | null = null;
  if (evt.courseExternalId) {
    const { data: course } = await sb
      .from("be_u_courses")
      .select("id")
      .eq("external_id", evt.courseExternalId)
      .maybeSingle();
    courseId = course?.id ?? null;
  }

  let processedStatus = "skipped";
  let errorMessage: string | null = null;
  let enrollmentId: number | null = null;

  try {
    // 4. If purchase + no client → create a lead
    if (evt.eventType === "purchase" && !clientId && evt.email) {
      const { count } = await sb.from("leads").select("id", { count: "exact", head: true });
      const leadId = `BECS-L-${String((count ?? 0) + 1).padStart(3, "0")}`;
      // Best-effort mode tag from course (if known)
      let mode: string | null = null;
      if (courseId) {
        const { data: c } = await sb.from("be_u_courses").select("mode").eq("id", courseId).maybeSingle();
        mode = c?.mode ?? null;
      }
      await sb.from("leads").insert({
        lead_id: leadId,
        name: evt.email.split("@")[0],
        email: evt.email,
        source: "returning", // best-effort mapping
        status: "new",
        mode,
        qualification_notes: `Auto-created from BE U ${evt.source} purchase event ${evt.externalId ?? eventId}`,
      });
      processedStatus = "processed";
    }

    // 5. If enrollment / progress / completion + matched client + matched course → upsert enrollment
    else if (
      ["enrollment", "progress", "completion"].includes(evt.eventType) &&
      clientId &&
      courseId
    ) {
      const { data: existing } = await sb
        .from("be_u_enrollments")
        .select("id")
        .eq("client_id", clientId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (existing) {
        const patch: Record<string, unknown> = { source: "be_u_webhook" };
        if (evt.progressPct !== null) patch.progress_pct = Math.max(0, Math.min(100, Math.round(evt.progressPct)));
        if (evt.eventType === "completion") {
          patch.status = "completed";
          patch.completed_at = new Date().toISOString();
          patch.progress_pct = 100;
        } else if (evt.eventType === "progress" && (evt.progressPct ?? 0) > 0) {
          patch.status = "in_progress";
          patch.last_active = new Date().toISOString();
        }
        const { error: upErr } = await sb.from("be_u_enrollments").update(patch).eq("id", existing.id);
        if (upErr) throw upErr;
        enrollmentId = existing.id;
      } else {
        const { count } = await sb.from("be_u_enrollments").select("id", { count: "exact", head: true });
        const newEnrollmentId = `BECS-EN-${String((count ?? 0) + 1).padStart(4, "0")}`;
        const { data: ins, error: insErr } = await sb.from("be_u_enrollments").insert({
          enrollment_id: newEnrollmentId,
          client_id: clientId,
          course_id: courseId,
          status: evt.eventType === "completion" ? "completed" : "enrolled",
          progress_pct: evt.progressPct ? Math.round(evt.progressPct) : 0,
          source: "be_u_webhook",
          external_id: evt.externalId,
          started_at: new Date().toISOString(),
          completed_at: evt.eventType === "completion" ? new Date().toISOString() : null,
        }).select().single();
        if (insErr) throw insErr;
        enrollmentId = ins?.id ?? null;
      }
      processedStatus = "processed";
    }
  } catch (err: any) {
    processedStatus = "failed";
    errorMessage = err?.message ?? String(err);
  }

  // 6. Update the log row with final status
  await sb
    .from("be_u_webhook_events")
    .update({
      status: processedStatus,
      error_message: errorMessage,
      client_id: clientId,
      enrollment_id: enrollmentId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", logged.id);

  return new Response(
    JSON.stringify({ ok: true, event_id: eventId, status: processedStatus, error: errorMessage }),
    { status: 202, headers: { "content-type": "application/json" } },
  );
});
