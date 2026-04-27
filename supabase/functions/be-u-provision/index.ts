// BE University outbound provisioning
// =========================================================================
// INERT until BE U platform is chosen. Called from app code (proposal
// accept, manual enroll, course purchase) to push enrollments / user
// provisioning to the external BE U platform.
//
// Logs every call to be_u_webhook_events with direction='outbound'. When
// the BE U platform is wired up, this function will dispatch to the
// chosen platform's API (Kajabi / Skool / Teachable / custom) and update
// be_u_enrollments.external_id with the platform-side enrollment ID.
//
// Auth: verify_jwt = true. Called from authenticated app code, never
// from public clients. Service role key is auto-injected.
// =========================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface ProvisionRequest {
  client_id: number;
  course_id: number;
  action: "enroll" | "revoke" | "issue_certificate" | "sync_progress";
  metadata?: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let body: ProvisionRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate required fields
  if (!body.client_id || !body.course_id || !body.action) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: client_id, course_id, action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const validActions = ["enroll", "revoke", "issue_certificate", "sync_progress"];
  if (!validActions.includes(body.action)) {
    return new Response(
      JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Resolve client + course for context
  const { data: client } = await supabase
    .from("clients")
    .select("id, email, name, code")
    .eq("id", body.client_id)
    .maybeSingle();

  const { data: course } = await supabase
    .from("be_u_courses")
    .select("id, code, title, mode, tier, external_id")
    .eq("id", body.course_id)
    .maybeSingle();

  if (!client) {
    return new Response(JSON.stringify({ error: "Client not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!course) {
    return new Response(JSON.stringify({ error: "Course not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log the outbound event
  const eventPayload = {
    direction: "outbound",
    source: "becs-os",
    event_type: body.action,
    status: "pending",
    payload: {
      action: body.action,
      client: { id: client.id, email: client.email, name: client.name, code: client.code },
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        mode: course.mode,
        tier: course.tier,
        external_id: course.external_id,
      },
      metadata: body.metadata ?? {},
    },
    notes: "Inert: BE U platform not yet wired. Event logged for replay once platform is chosen.",
  };

  const { data: logged, error: logError } = await supabase
    .from("be_u_webhook_events")
    .insert(eventPayload)
    .select()
    .single();

  if (logError) {
    return new Response(
      JSON.stringify({ error: "Failed to log event", details: logError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ─── Dispatch (currently inert) ─────────────────────────────────────────
  // When BE U platform is chosen, switch on a provider env var and call:
  //   - enroll → POST /api/enrollments  (Kajabi / Skool / Teachable / custom)
  //   - revoke → DELETE /api/enrollments/:id
  //   - issue_certificate → POST /api/certificates
  //   - sync_progress → GET /api/progress, then upsert be_u_enrollments
  //
  // On success: update be_u_webhook_events.status = 'completed' + set
  // be_u_enrollments.external_id from platform response.
  // On failure: status = 'failed' + retry_count++.

  return new Response(
    JSON.stringify({
      ok: true,
      event_id: logged.id,
      action: body.action,
      client_id: client.id,
      course_id: course.id,
      status: "pending",
      message: "Logged. Dispatch is inert until BE U platform is wired.",
    }),
    {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
