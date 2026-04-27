import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PortalPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { supabase, toCamelArray } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Loader2, MessagesSquare, Send } from "lucide-react";

interface ClientRow {
  id: number;
  name: string | null;
  entityId: string;
}

interface MessageRow {
  id: number;
  body: string;
  senderRole: "admin" | "client";
  readAt: string | null;
  createdAt: string;
}

export default function PortalMessagesPage() {
  const { becsUser } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientQuery = useQuery<ClientRow | null>({
    queryKey: ["portal", "client-for-messages", becsUser?.email],
    enabled: !!becsUser?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name,entity_id")
        .ilike("email", becsUser!.email)
        .eq("portal_access_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return toCamelArray<ClientRow>([data])[0];
    },
  });

  const clientId = clientQuery.data?.id;
  const entityId = clientQuery.data?.entityId ?? "becs";

  const messagesQuery = useQuery<MessageRow[]>({
    queryKey: ["portal", "messages", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_messages")
        .select("id,body,sender_role,read_at,created_at")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return toCamelArray<MessageRow>(data ?? []);
    },
  });

  const messages = messagesQuery.data ?? [];

  // Mark unread admin messages as read when the page loads them
  useEffect(() => {
    if (!clientId || !messages.length) return;
    const unreadAdminIds = messages
      .filter((m) => m.senderRole === "admin" && !m.readAt)
      .map((m) => m.id);
    if (!unreadAdminIds.length) return;
    (async () => {
      const { error } = await supabase
        .from("client_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadAdminIds);
      if (!error) {
        qc.invalidateQueries({ queryKey: ["portal", "messages-unread"] });
      }
    })();
  }, [clientId, messages, qc]);

  const sendMessage = async () => {
    if (!clientId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const { error } = await supabase.from("client_messages").insert({
        client_id: clientId,
        entity_id: entityId,
        sender_role: "client",
        body: draft.trim(),
      });
      if (error) throw error;
      setDraft("");
      await qc.invalidateQueries({ queryKey: ["portal", "messages"] });
    } catch (err: any) {
      console.error("[messages] send:", err);
      setError(err?.message || "Could not send message. Try again.");
    } finally {
      setSending(false);
    }
  };

  const groupedByDay = useMemo(() => {
    const byDay: Record<string, MessageRow[]> = {};
    for (const m of messages) {
      const key = new Date(m.createdAt).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(m);
    }
    return Object.entries(byDay);
  }, [messages]);

  return (
    <PortalPageShell>
      <section className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
            Your portal
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">Messages</h1>
          <p className="mt-2 text-slate-600">
            A direct line to Brandon and the BECS team. Expect replies within 1 business day.
          </p>
        </div>

        {clientQuery.isLoading || messagesQuery.isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            <Loader2 className="animate-spin mx-auto text-slate-400" size={22} />
            <div className="mt-3 text-sm">Loading your messages…</div>
          </div>
        ) : !clientQuery.data ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            Portal access pending. Messaging unlocks once your engagement is active.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <MessagesSquare size={16} className="text-slate-500" />
                <div className="text-sm font-bold text-slate-900">Conversation</div>
              </div>

              {messages.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">
                  No messages yet. Send the first one below.
                </div>
              ) : (
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  {groupedByDay.map(([day, msgs]) => (
                    <div key={day}>
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3">
                        {day}
                      </div>
                      <div className="space-y-3">
                        {msgs.map((m) => (
                          <MessageBubble key={m.id} message={m} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Composer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                {error && (
                  <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder="Write a message… (Cmd/Ctrl+Enter to send)"
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(83,60%,57%)] focus:border-transparent resize-none"
                    data-testid="message-composer"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !draft.trim()}
                    className="bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white self-end"
                    data-testid="send-message"
                  >
                    {sending ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      <>
                        <Send size={14} className="mr-1.5" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </PortalPageShell>
  );
}

function MessageBubble({ message }: { message: MessageRow }) {
  const isAdmin = message.senderRole === "admin";
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[80%] ${isAdmin ? "" : "text-right"}`}>
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
            isAdmin
              ? "bg-slate-100 text-slate-900 rounded-bl-sm"
              : "bg-[hsl(232,45%,18%)] text-white rounded-br-sm"
          }`}
        >
          {message.body}
        </div>
        <div className="mt-1 text-[11px] text-slate-400 px-1">
          {isAdmin ? "BECS team" : "You"} · {time}
        </div>
      </div>
    </div>
  );
}
