import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useEntity } from "@/lib/entity-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import {
  format, parseISO, startOfMonth, subDays, subMonths,
  startOfYear, isAfter, differenceInDays, eachMonthOfInterval,
  startOfWeek, eachWeekOfInterval, subYears,
} from "date-fns";
import {
  DollarSign, TrendingUp, Users, Activity, BarChart2,
  RefreshCw, BarChart3, Calendar, FileText, Zap, CheckSquare,
} from "lucide-react";

// ─── Brand Colors ──────────────────────────────────────────────────────────────
const BRAND = {
  blue: "#26296A",
  green: "#A2D652",
  lightGreen: "#D8F4C1",
  grayBlue: "#A1B4C4",
  blueLight: "#4A4E8A",
};

const CHART_COLORS = [
  "#26296A", "#A2D652", "#A1B4C4", "#D8F4C1", "#4A4E8A",
  "#7BC142", "#8B5CF6", "#F59E0B",
];

// ─── Date Range Options ─────────────────────────────────────────────────────────
type DateRange = "month" | "30" | "90" | "year" | "all";

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "This Month", value: "month" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

function getStartDate(range: DateRange): Date | null {
  const now = new Date();
  if (range === "month") return startOfMonth(now);
  if (range === "30") return subDays(now, 30);
  if (range === "90") return subDays(now, 90);
  if (range === "year") return startOfYear(now);
  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function label(s: string | null | undefined): string {
  if (!s) return "Unknown";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item) || "Unknown";
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function groupByMonth<T>(arr: T[], dateKey: (item: T) => string | null | undefined): { month: string; count: number }[] {
  const now = new Date();
  const start = subMonths(now, 11);
  const months = eachMonthOfInterval({ start, end: now });
  const groups = groupBy(arr, (item) => {
    const d = dateKey(item);
    if (!d) return "Unknown";
    try { return format(parseISO(d), "MMM yy"); } catch { return "Unknown"; }
  });
  return months.map((m) => ({
    month: format(m, "MMM yy"),
    count: (groups[format(m, "MMM yy")] || []).length,
  }));
}

function sumByMonth(arr: any[], dateKey: string, valueKey: string): { month: string; total: number }[] {
  const now = new Date();
  const start = subMonths(now, 11);
  const months = eachMonthOfInterval({ start, end: now });
  const groups: Record<string, number> = {};
  arr.forEach((item) => {
    const d = item[dateKey];
    if (!d) return;
    try {
      const key = format(parseISO(d), "MMM yy");
      groups[key] = (groups[key] || 0) + (Number(item[valueKey]) || 0);
    } catch { /* skip */ }
  });
  return months.map((m) => ({
    month: format(m, "MMM yy"),
    total: groups[format(m, "MMM yy")] || 0,
  }));
}

function pieData(arr: any[], key: string): { name: string; value: number }[] {
  const groups = groupBy(arr, (item) => label(item[key]));
  return Object.entries(groups)
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="animate-pulse bg-muted rounded-lg" style={{ height }} />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 text-center py-12 px-6"
      style={{ minHeight: 200 }}
    >
      <BarChart3 size={32} className="text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: string;
}

function SummaryCard({ title, value, icon: Icon, sub, accent = "#A2D652" }: SummaryCardProps) {
  return (
    <Card data-testid={`summary-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 truncate">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
          </div>
          <div className="ml-3 p-2.5 rounded-lg shrink-0" style={{ backgroundColor: `${accent}20` }}>
            <Icon size={18} style={{ color: accent }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label: tooltipLabel }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{tooltipLabel}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{typeof entry.value === "number" && entry.name?.toLowerCase().includes("revenue") || entry.name?.toLowerCase().includes("total") || entry.name?.toLowerCase().includes("amount") ? fmt(entry.value) : entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground">{value} ({p.percent ? pct(p.percent * 100) : ""})</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {pct(percent * 100)}
    </text>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Tab 1: Revenue & Payments ──────────────────────────────────────────────────
function RevenueTab({ entity, dateRange }: { entity: string; dateRange: DateRange }) {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const [pRes, iRes, prRes] = await Promise.all([
        (() => {
          let q = supabase.from("payments").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
        (() => {
          let q = supabase.from("invoices").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
        (() => {
          let q = supabase.from("proposals").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
      ]);
      setPayments(pRes.data || []);
      setInvoices(iRes.data || []);
      setProposals(prRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [entity, dateRange]);

  const completedPayments = payments.filter((p) => p.status === "completed");
  const totalRevenue = completedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const outstandingInvoices = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + (Number(i.total) || 0), 0);
  const acceptedProposals = proposals.filter((p) => p.status === "accepted");
  const avgDealSize = acceptedProposals.length
    ? acceptedProposals.reduce((s, p) => s + (Number(p.price) || 0), 0) / acceptedProposals.length
    : 0;
  const proposalsValue = proposals
    .filter((p) => p.status !== "declined")
    .reduce((s, p) => s + (Number(p.price) || 0), 0);

  const revenueOverTime = sumByMonth(completedPayments, "paid_at", "amount");
  const serviceTypePie = pieData(acceptedProposals, "service_type");
  const invoiceStatusData = Object.entries(
    groupBy(invoices, (i) => label(i.status))
  ).map(([name, items]) => ({ name, count: items.length }));
  const paymentMethodPie = pieData(payments, "method");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonChart key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="Total Revenue" value={fmt(totalRevenue)} icon={DollarSign} sub="Completed payments" accent={BRAND.green} />
        <SummaryCard title="Outstanding" value={fmt(outstandingInvoices)} icon={FileText} sub="Sent & overdue invoices" accent={BRAND.blue} />
        <SummaryCard title="Avg Deal Size" value={fmt(avgDealSize)} icon={TrendingUp} sub="Accepted proposals" accent={BRAND.grayBlue} />
        <SummaryCard title="Pipeline Value" value={fmt(proposalsValue)} icon={BarChart2} sub="Non-declined proposals" accent={BRAND.blueLight} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Over Time" className="lg:col-span-2">
          {revenueOverTime.every((d) => d.total === 0) ? (
            <EmptyState message="No revenue data yet. Revenue will appear as payments are recorded." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueOverTime} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRAND.green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Revenue" stroke={BRAND.green} strokeWidth={2} fill="url(#revenueGrad)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Revenue by Service Type">
          {serviceTypePie.length === 0 ? (
            <EmptyState message="No accepted proposals yet. Chart will populate as deals are closed." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviceTypePie} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={renderPieLabel} isAnimationActive={true}>
                  {serviceTypePie.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Invoice Status Breakdown">
          {invoiceStatusData.length === 0 ? (
            <EmptyState message="No invoices recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={invoiceStatusData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} width={72} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Invoices" fill={BRAND.blue} radius={[0, 4, 4, 0]} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Payment Methods">
          {paymentMethodPie.length === 0 ? (
            <EmptyState message="No payments recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={paymentMethodPie} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={renderPieLabel} isAnimationActive={true}>
                  {paymentMethodPie.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab 2: Pipeline & Leads ────────────────────────────────────────────────────
function PipelineTab({ entity, dateRange }: { entity: string; dateRange: DateRange }) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const [lRes, cRes] = await Promise.all([
        (() => {
          let q = supabase.from("leads").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
        supabase.from("clients").select("*").eq("entity_id", entity),
      ]);
      setLeads(lRes.data || []);
      setClients(cRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [entity, dateRange]);

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new").length;

  // Conversion: leads that have a matching client
  const clientLeadIds = new Set(clients.map((c) => c.lead_id).filter(Boolean));
  const convertedLeads = leads.filter((l) => clientLeadIds.has(l.id));
  const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;

  // Avg days to convert
  const daysToConvert = convertedLeads.map((lead) => {
    const client = clients.find((c) => c.lead_id === lead.id);
    if (!client) return null;
    try {
      return differenceInDays(parseISO(client.created_at), parseISO(lead.created_at));
    } catch { return null; }
  }).filter((d): d is number => d !== null && d >= 0);
  const avgDaysToConvert = daysToConvert.length
    ? Math.round(daysToConvert.reduce((s, d) => s + d, 0) / daysToConvert.length)
    : 0;

  const leadFlowOverTime = groupByMonth(leads, (l) => l.created_at);

  const PIPELINE_STAGES = ["new", "reviewing", "discovery", "assessment", "proposal", "nurture", "not_fit"];
  const funnelData = PIPELINE_STAGES.map((stage, i) => ({
    stage: label(stage),
    count: leads.filter((l) => l.status === stage).length,
    opacity: 1 - i * 0.1,
  }));

  const sourceData = pieData(leads, "referral_source");
  const serviceData = Object.entries(groupBy(leads, (l) => label(l.service_interest || "Unknown")))
    .map(([name, items]) => ({ name, count: items.length }))
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
        <div className="grid lg:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <SkeletonChart key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="Total Leads" value={totalLeads} icon={Users} sub="In date range" accent={BRAND.blue} />
        <SummaryCard title="New Leads" value={newLeads} icon={TrendingUp} sub="Awaiting review" accent={BRAND.green} />
        <SummaryCard title="Conversion Rate" value={pct(conversionRate)} icon={CheckSquare} sub="Leads → clients" accent={BRAND.grayBlue} />
        <SummaryCard title="Avg Days to Convert" value={avgDaysToConvert || "—"} icon={Calendar} sub="Lead to client" accent={BRAND.blueLight} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Lead Flow Over Time" className="lg:col-span-2">
          {leadFlowOverTime.every((d) => d.count === 0) ? (
            <EmptyState message="No leads in the selected period." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={leadFlowOverTime} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRAND.blue} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="New Leads" stroke={BRAND.blue} strokeWidth={2} fill="url(#leadGrad)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Pipeline Funnel">
          {funnelData.every((d) => d.count === 0) ? (
            <EmptyState message="No leads in pipeline yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: "#6B7280" }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]} isAnimationActive={true}>
                  {funnelData.map((_entry, i) => (
                    <Cell key={i} fill={BRAND.blue} fillOpacity={1 - i * 0.11} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Leads by Source">
          {sourceData.length === 0 ? (
            <EmptyState message="No source data available yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={renderPieLabel} isAnimationActive={true}>
                  {sourceData.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Leads by Service Interest" className="lg:col-span-2">
          {serviceData.length === 0 ? (
            <EmptyState message="No service interest data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={serviceData} margin={{ top: 4, right: 16, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Leads" fill={BRAND.green} radius={[4, 4, 0, 0]} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab 3: Client & Project Health ─────────────────────────────────────────────
function ClientHealthTab({ entity, dateRange }: { entity: string; dateRange: DateRange }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const [cRes, pRes] = await Promise.all([
        (() => {
          let q = supabase.from("clients").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
        (() => {
          let q = supabase.from("projects").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
      ]);
      setClients(cRes.data || []);
      setProjects(pRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [entity, dateRange]);

  const activeClients = clients.filter((c) => c.status === "active").length;
  const activeProjects = projects.filter((p) => p.status === "active");
  const avgProgress = activeProjects.length
    ? activeProjects.reduce((s, p) => s + (Number(p.progress_percent) || 0), 0) / activeProjects.length
    : 0;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const completionRate = projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;

  // Client growth over time (cumulative)
  const sortedClients = [...clients].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const now = new Date();
  const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
  const clientGrowth = months.map((m) => {
    const monthStr = format(m, "MMM yy");
    const count = sortedClients.filter((c) => {
      try { return !isAfter(parseISO(c.created_at), m); } catch { return false; }
    }).length;
    return { month: monthStr, clients: count };
  });

  const projectStatusPie = pieData(projects, "status");

  // Progress buckets
  const buckets = [
    { name: "0-25%", count: projects.filter((p) => (p.progress_percent || 0) <= 25).length },
    { name: "26-50%", count: projects.filter((p) => (p.progress_percent || 0) > 25 && (p.progress_percent || 0) <= 50).length },
    { name: "51-75%", count: projects.filter((p) => (p.progress_percent || 0) > 50 && (p.progress_percent || 0) <= 75).length },
    { name: "76-100%", count: projects.filter((p) => (p.progress_percent || 0) > 75).length },
  ];

  const phaseData = ["plan", "evolve", "succeed"].map((phase) => ({
    phase: label(phase),
    count: projects.filter((p) => p.current_phase === phase).length,
  }));

  const clientStatusPie = pieData(clients, "status");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
        <div className="grid lg:grid-cols-2 gap-4">{[1, 2, 3, 4, 5].map((i) => <SkeletonChart key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="Active Clients" value={activeClients} icon={Users} sub="Currently active" accent={BRAND.green} />
        <SummaryCard title="Active Projects" value={activeProjects.length} icon={BarChart2} sub="In progress" accent={BRAND.blue} />
        <SummaryCard title="Avg Progress" value={`${Math.round(avgProgress)}%`} icon={TrendingUp} sub="Active projects" accent={BRAND.grayBlue} />
        <SummaryCard title="Completion Rate" value={pct(completionRate)} icon={CheckSquare} sub="Projects finished" accent={BRAND.blueLight} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Client Growth Over Time" className="lg:col-span-2">
          {clientGrowth.every((d) => d.clients === 0) ? (
            <EmptyState message="No client data yet. Growth curve will appear as clients are added." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={clientGrowth} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND.grayBlue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRAND.grayBlue} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="clients" name="Clients" stroke={BRAND.grayBlue} strokeWidth={2} fill="url(#clientGrad)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Project Status Distribution">
          {projectStatusPie.length === 0 ? (
            <EmptyState message="No project data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={projectStatusPie} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={renderPieLabel} isAnimationActive={true}>
                  {projectStatusPie.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Project Progress Distribution">
          {buckets.every((b) => b.count === 0) ? (
            <EmptyState message="No project progress data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buckets} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Projects" fill={BRAND.blueLight} radius={[4, 4, 0, 0]} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Projects by P.E.S. Phase">
          {phaseData.every((d) => d.count === 0) ? (
            <EmptyState message="No phase data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={phaseData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="phase" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Projects" radius={[4, 4, 0, 0]} isAnimationActive={true}>
                  <Cell fill={BRAND.blue} />
                  <Cell fill={BRAND.green} />
                  <Cell fill={BRAND.grayBlue} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Client Status">
          {clientStatusPie.length === 0 ? (
            <EmptyState message="No client status data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={clientStatusPie} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={renderPieLabel} isAnimationActive={true}>
                  {clientStatusPie.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab 4: Activity Summary ─────────────────────────────────────────────────────
function ActivityTab({ entity, dateRange }: { entity: string; dateRange: DateRange }) {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [legalDocs, setLegalDocs] = useState<any[]>([]);
  const [automationEvents, setAutomationEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const applyDate = (q: any, field: string) => startDate ? q.gte(field, startDate.toISOString()) : q;

      const [mRes, prRes, ldRes, aeRes] = await Promise.all([
        applyDate(supabase.from("meetings").select("*").eq("entity_id", entity), "created_at"),
        applyDate(supabase.from("proposals").select("*").eq("entity_id", entity), "created_at"),
        applyDate(supabase.from("legal_docs").select("*").eq("entity_id", entity), "created_at"),
        applyDate(supabase.from("automation_events").select("*").eq("entity_id", entity), "triggered_at"),
      ]);
      setMeetings(mRes.data || []);
      setProposals(prRes.data || []);
      setLegalDocs(ldRes.data || []);
      setAutomationEvents(aeRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [entity, dateRange]);

  const meetingCount = meetings.length;
  const proposalsSent = proposals.filter((p) => p.status !== "draft").length;
  const docsSigned = legalDocs.filter((d) => ["signed", "paid", "complete"].includes(d.status)).length;
  const automationCount = automationEvents.length;

  // Activity timeline by month
  const now = new Date();
  const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
  const activityTimeline = months.map((m) => {
    const key = format(m, "MMM yy");
    const mCount = meetings.filter((item) => {
      try { return format(parseISO(item.created_at), "MMM yy") === key; } catch { return false; }
    }).length;
    const pCount = proposals.filter((item) => {
      try { return format(parseISO(item.created_at), "MMM yy") === key; } catch { return false; }
    }).length;
    const aCount = automationEvents.filter((item) => {
      try { return format(parseISO(item.triggered_at), "MMM yy") === key; } catch { return false; }
    }).length;
    return { month: key, meetings: mCount, proposals: pCount, automation: aCount };
  });

  const meetingTypePie = pieData(meetings, "type");

  const proposalOutcomes = ["draft", "sent", "viewed", "accepted", "declined", "expired"].map((s) => ({
    name: label(s),
    count: proposals.filter((p) => p.status === s).length,
  }));

  const automationTypeData = Object.entries(
    groupBy(automationEvents, (e) => label(e.type || "Unknown"))
  ).map(([name, items]) => ({ name, count: items.length })).sort((a, b) => b.count - a.count).slice(0, 8);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
        <div className="grid lg:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <SkeletonChart key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="Meetings" value={meetingCount} icon={Calendar} sub="In date range" accent={BRAND.blue} />
        <SummaryCard title="Proposals Sent" value={proposalsSent} icon={FileText} sub="Non-draft proposals" accent={BRAND.green} />
        <SummaryCard title="Docs Signed" value={docsSigned} icon={CheckSquare} sub="Signed / paid / complete" accent={BRAND.grayBlue} />
        <SummaryCard title="Automations" value={automationCount} icon={Zap} sub="Events triggered" accent={BRAND.blueLight} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Activity Timeline" className="lg:col-span-2">
          {activityTimeline.every((d) => d.meetings === 0 && d.proposals === 0 && d.automation === 0) ? (
            <EmptyState message="No activity recorded yet in the selected period." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityTimeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="meetings" name="Meetings" stroke={BRAND.blue} strokeWidth={2} dot={false} isAnimationActive={true} />
                <Line type="monotone" dataKey="proposals" name="Proposals" stroke={BRAND.green} strokeWidth={2} dot={false} isAnimationActive={true} />
                <Line type="monotone" dataKey="automation" name="Automation" stroke={BRAND.grayBlue} strokeWidth={2} dot={false} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Meeting Types">
          {meetingTypePie.length === 0 ? (
            <EmptyState message="No meetings recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={meetingTypePie} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={renderPieLabel} isAnimationActive={true}>
                  {meetingTypePie.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Proposal Outcomes">
          {proposalOutcomes.every((d) => d.count === 0) ? (
            <EmptyState message="No proposals recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={proposalOutcomes} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} width={72} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Proposals" radius={[0, 4, 4, 0]} isAnimationActive={true}>
                  {proposalOutcomes.map((entry, i) => (
                    <Cell key={i} fill={entry.name === "Accepted" ? BRAND.green : entry.name === "Declined" ? "#EF4444" : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Automation Event Types" className="lg:col-span-2">
          {automationTypeData.length === 0 ? (
            <EmptyState message="No automation events yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={automationTypeData} margin={{ top: 4, right: 16, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Events" fill={BRAND.blueLight} radius={[4, 4, 0, 0]} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab 5: Progress Reports ─────────────────────────────────────────────────────
function ProgressTab({ entity, dateRange }: { entity: string; dateRange: DateRange }) {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [coachingSessions, setCoachingSessions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const [prRes, tRes, csRes] = await Promise.all([
        (() => {
          let q = supabase.from("projects").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
        (() => {
          let q = supabase.from("tasks").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
        (() => {
          let q = supabase.from("coaching_sessions").select("*").eq("entity_id", entity);
          if (startDate) q = q.gte("created_at", startDate.toISOString());
          return q;
        })(),
      ]);
      setProjects(prRes.data || []);
      setTasks(tRes.data || []);
      setCoachingSessions(csRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [entity, dateRange]);

  const planCount = projects.filter((p) => p.current_phase === "plan").length;
  const evolveCount = projects.filter((p) => p.current_phase === "evolve").length;
  const succeedCount = projects.filter((p) => p.current_phase === "succeed").length;
  const tasksCompleted = tasks.filter((t) => t.status === "done").length;

  const pesData = [
    { name: "Plan", value: planCount },
    { name: "Evolve", value: evolveCount },
    { name: "Succeed", value: succeedCount },
  ].filter((d) => d.value > 0);
  const pesColors = [BRAND.blue, BRAND.green, BRAND.grayBlue];

  // Task completion over time
  const completedTasks = tasks.filter((t) => t.status === "done" && t.completed_at);
  const taskCompletionOverTime = groupByMonth(completedTasks, (t) => t.completed_at);

  const taskPriorityData = ["low", "medium", "high", "urgent"].map((p) => ({
    priority: label(p),
    total: tasks.filter((t) => t.priority === p).length,
    done: tasks.filter((t) => t.priority === p && t.status === "done").length,
  }));

  // Coaching sessions by phase and status
  const coachingPhaseData = Object.entries(
    groupBy(coachingSessions, (s) => label(s.phase || "Unknown"))
  ).map(([phase, items]) => ({
    phase,
    completed: items.filter((i) => i.status === "completed").length,
    scheduled: items.filter((i) => i.status === "scheduled").length,
    cancelled: items.filter((i) => i.status === "cancelled").length,
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
        <div className="grid lg:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <SkeletonChart key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="In Plan Phase" value={planCount} icon={BarChart2} sub="Foundation building" accent={BRAND.blue} />
        <SummaryCard title="In Evolve Phase" value={evolveCount} icon={TrendingUp} sub="Growing & scaling" accent={BRAND.green} />
        <SummaryCard title="In Succeed Phase" value={succeedCount} icon={CheckSquare} sub="Thriving & expanding" accent={BRAND.grayBlue} />
        <SummaryCard title="Tasks Completed" value={tasksCompleted} icon={Activity} sub="In date range" accent={BRAND.blueLight} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="P.E.S. Phase Distribution">
          {pesData.length === 0 ? (
            <EmptyState message="No projects with phase data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={50}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                  isAnimationActive={true}
                >
                  {pesData.map((_entry, i) => (
                    <Cell key={i} fill={pesColors[i % pesColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color, fontWeight: 600 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Task Completion Over Time">
          {taskCompletionOverTime.every((d) => d.count === 0) ? (
            <EmptyState message="No completed tasks yet. Chart will populate as tasks are finished." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={taskCompletionOverTime} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRAND.green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Tasks Completed" stroke={BRAND.green} strokeWidth={2} fill="url(#taskGrad)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Task Priority Distribution">
          {taskPriorityData.every((d) => d.total === 0) ? (
            <EmptyState message="No tasks recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskPriorityData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" name="Total" fill={BRAND.grayBlue} radius={[4, 4, 0, 0]} isAnimationActive={true} />
                <Bar dataKey="done" name="Done" fill={BRAND.green} radius={[4, 4, 0, 0]} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Coaching Sessions by Phase">
          {coachingPhaseData.length === 0 ? (
            <EmptyState message="No coaching sessions recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coachingPhaseData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="phase" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill={BRAND.green} isAnimationActive={true} />
                <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill={BRAND.blue} isAnimationActive={true} />
                <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill={BRAND.grayBlue} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Tab definitions ─────────────────────────────────────────────────────────────
type TabId = "revenue" | "pipeline" | "health" | "activity" | "progress";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "pipeline", label: "Pipeline", icon: TrendingUp },
  { id: "health", label: "Client Health", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "progress", label: "Progress", icon: BarChart2 },
];

// ─── Main Page ───────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { currentEntity } = useEntity();
  const [activeTab, setActiveTab] = useState<TabId>("revenue");
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-5" data-testid="reports-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time business intelligence across your operations
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                data-testid={`date-range-${opt.value}`}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  dateRange === opt.value
                    ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            data-testid="refresh-reports"
            className="gap-1.5"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                isActive
                  ? "text-white border-transparent shadow-sm"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
              style={isActive ? { backgroundColor: BRAND.blue, borderColor: BRAND.blue } : {}}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div key={`${activeTab}-${currentEntity}-${dateRange}-${refreshKey}`}>
        {activeTab === "revenue" && (
          <RevenueTab entity={currentEntity} dateRange={dateRange} />
        )}
        {activeTab === "pipeline" && (
          <PipelineTab entity={currentEntity} dateRange={dateRange} />
        )}
        {activeTab === "health" && (
          <ClientHealthTab entity={currentEntity} dateRange={dateRange} />
        )}
        {activeTab === "activity" && (
          <ActivityTab entity={currentEntity} dateRange={dateRange} />
        )}
        {activeTab === "progress" && (
          <ProgressTab entity={currentEntity} dateRange={dateRange} />
        )}
      </div>
    </div>
  );
}
