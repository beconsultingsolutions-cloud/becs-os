/**
 * portal-learn-module.tsx
 * Single-module view for the BECS P.E.S. program.
 * Route: /portal/learn/:moduleId  (moduleId: 'plan' | 'evolve' | 'succeed')
 *
 * Persistence: public.module_progress
 *   id, client_id, module_id (text), step_id (text), completed (bool),
 *   form_data (jsonb), updated_at
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { PortalPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase, toCamelArray } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Target,
  Users,
  DollarSign,
  BookOpen,
  Rocket,
  Palette,
  Settings2,
  Zap,
  TrendingUp,
  Mail,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Map,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProgressRow {
  id?: number;
  clientId: number;
  moduleId: string;
  stepId: string;
  completed: boolean;
  formData: Record<string, unknown> | null;
  updatedAt?: string;
}

type ModuleId = "plan" | "evolve" | "succeed";

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------
async function fetchClientId(email: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .ilike("email", email)
    .eq("portal_access_active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (data as { id: number }).id;
}

async function fetchModuleProgress(
  clientId: number,
  moduleId: string
): Promise<ProgressRow[]> {
  const { data, error } = await supabase
    .from("module_progress")
    .select("*")
    .eq("client_id", clientId)
    .eq("module_id", moduleId);
  if (error) throw error;
  return toCamelArray<ProgressRow>(data ?? []);
}

async function upsertStepRow(
  clientId: number,
  moduleId: string,
  stepId: string,
  completed: boolean,
  formData: Record<string, unknown> | null = null
) {
  const { error } = await supabase.from("module_progress").upsert(
    {
      client_id: clientId,
      module_id: moduleId,
      step_id: stepId,
      completed,
      form_data: formData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id,module_id,step_id" }
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
const NAVY = "hsl(232,45%,18%)";
const LIME = "hsl(83,60%,57%)";

function SectionTab({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
        active
          ? "bg-[hsl(232,45%,18%)] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon size={16} className={active ? "text-[hsl(83,60%,57%)]" : ""} />
      {label}
    </button>
  );
}

function StepToggle({
  stepId,
  label,
  completed,
  onToggle,
}: {
  stepId: string;
  label: string;
  completed: boolean;
  onToggle: (stepId: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(stepId)}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      aria-label={completed ? `Mark ${label} incomplete` : `Mark ${label} complete`}
    >
      {completed ? (
        <CheckCircle2 size={18} className="text-[hsl(83,60%,57%)] flex-shrink-0" />
      ) : (
        <Circle size={18} className="text-slate-300 flex-shrink-0" />
      )}
      <span className={completed ? "line-through text-slate-400" : ""}>{label}</span>
    </button>
  );
}

function FieldCard({
  title,
  children,
  stepId,
  completed,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  stepId?: string;
  completed?: boolean;
  onToggle?: (stepId: string) => void;
}) {
  return (
    <Card className="border-slate-200 mb-5">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">
            {title}
          </CardTitle>
          {stepId && onToggle && (
            <button
              onClick={() => onToggle(stepId)}
              className="ml-3 flex-shrink-0"
              aria-label={completed ? "Mark incomplete" : "Mark complete"}
            >
              {completed ? (
                <CheckCircle2 size={20} className="text-[hsl(83,60%,57%)]" />
              ) : (
                <Circle size={20} className="text-slate-300 hover:text-slate-400 transition-colors" />
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

function FLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
    </Label>
  );
}

function FInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border-slate-200 focus:ring-[hsl(232,45%,18%)] bg-white"
    />
  );
}

function FTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="border-slate-200 focus:ring-[hsl(232,45%,18%)] bg-white resize-y"
    />
  );
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[hsl(232,45%,18%)]/5 px-5 py-4 mb-6 text-sm text-slate-700 leading-relaxed">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MODULE 1: PLAN
// ---------------------------------------------------------------------------
const PLAN_STEPS_TOTAL = 20;

type PlanFormData = {
  // Message Map
  characterProblem: string;
  externalProblem: string;
  internalProblem: string;
  philosophicalProblem: string;
  guideName: string;
  empathy: string;
  authority: string;
  planStep1: string;
  planStep2: string;
  planStep3: string;
  callToAction: string;
  stakesSuccess: string;
  stakesFailure: string;
  oneLiner: string;
  // Market Validation
  targetMarket: string;
  idealClientAvatar1: string;
  idealClientAvatar2: string;
  idealClientAvatar3: string;
  competitor1: string;
  competitor2: string;
  competitor3: string;
  uniqueValue: string;
  // Profit Allocation
  currentRevenue: string;
  profitPercentage: string;
  ownerPayPercentage: string;
  taxPercentage: string;
  opexPercentage: string;
  targetMonthlyProfit: string;
  targetOwnerPay: string;
};

const defaultPlanForm: PlanFormData = {
  characterProblem: "",
  externalProblem: "",
  internalProblem: "",
  philosophicalProblem: "",
  guideName: "",
  empathy: "",
  authority: "",
  planStep1: "",
  planStep2: "",
  planStep3: "",
  callToAction: "",
  stakesSuccess: "",
  stakesFailure: "",
  oneLiner: "",
  targetMarket: "",
  idealClientAvatar1: "",
  idealClientAvatar2: "",
  idealClientAvatar3: "",
  competitor1: "",
  competitor2: "",
  competitor3: "",
  uniqueValue: "",
  currentRevenue: "",
  profitPercentage: "15",
  ownerPayPercentage: "30",
  taxPercentage: "15",
  opexPercentage: "40",
  targetMonthlyProfit: "",
  targetOwnerPay: "",
};

const PLAN_SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "messagemap", label: "BECS Message Map", icon: Target },
  { id: "market", label: "Market Validation", icon: Users },
  { id: "profit", label: "BECS Profit Allocation", icon: DollarSign },
];

function Module1Plan({
  clientId,
  completedSteps,
  formData,
  onToggleStep,
  onFormChange,
}: {
  clientId: number;
  completedSteps: Record<string, boolean>;
  formData: PlanFormData;
  onToggleStep: (stepId: string) => void;
  onFormChange: (field: keyof PlanFormData, value: string) => void;
}) {
  const [section, setSection] = useState("overview");

  const alloc =
    (parseInt(formData.profitPercentage) || 0) +
    (parseInt(formData.ownerPayPercentage) || 0) +
    (parseInt(formData.taxPercentage) || 0) +
    (parseInt(formData.opexPercentage) || 0);

  const revenue = parseFloat(formData.currentRevenue) || 0;
  const calcProfit = ((revenue * (parseInt(formData.profitPercentage) || 0)) / 100).toFixed(2);
  const calcOwnerPay = ((revenue * (parseInt(formData.ownerPayPercentage) || 0)) / 100).toFixed(2);

  return (
    <div>
      {/* Section nav */}
      <div className="flex gap-2 flex-wrap mb-6">
        {PLAN_SECTIONS.map((s) => (
          <SectionTab
            key={s.id}
            id={s.id}
            label={s.label}
            icon={s.icon}
            active={section === s.id}
            onClick={() => setSection(s.id)}
          />
        ))}
      </div>

      {/* Overview */}
      {section === "overview" && (
        <div>
          <InfoBanner>
            <strong>Welcome to Module 1: PLAN — Foundation &amp; Clarity.</strong> This module
            establishes the three pillars of your business foundation:{" "}
            <strong>Crystal-Clear Messaging</strong>,{" "}
            <strong>Validated Market Position</strong>, and{" "}
            <strong>Profitable Financial Structure</strong>. Work through each
            section using the tabs above and check off steps as you complete them.
          </InfoBanner>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              {
                icon: Target,
                title: "BECS Message Map",
                desc: "Craft a compelling narrative that positions your customer as the hero and your business as their trusted guide. Build your complete message map.",
              },
              {
                icon: Users,
                title: "Market Validation",
                desc: "Identify your ideal clients, analyze competitors, and validate your unique value proposition. Know your market better than they know themselves.",
              },
              {
                icon: DollarSign,
                title: "BECS Profit Allocation",
                desc: "Build profitability into your business from day one. Structure your revenue allocation so you pay yourself first and grow sustainably.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-slate-200">
                <CardContent className="p-5">
                  <item.icon
                    size={28}
                    className="text-[hsl(232,45%,18%)] mb-3"
                  />
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-[hsl(83,60%,57%)]/40 bg-[hsl(83,60%,57%)]/5">
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 mb-2">
                What you'll build in this module
              </h3>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {[
                  "Complete BECS Message Map with hero/guide narrative",
                  "Ideal client avatar profiles (×3)",
                  "Competitor landscape and unique value proposition",
                  "BECS Profit Allocation plan with revenue percentages",
                  "Your business one-liner for every marketing touchpoint",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-[hsl(83,60%,45%)] mt-0.5 flex-shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BECS Message Map */}
      {section === "messagemap" && (
        <div>
          <InfoBanner>
            <strong>BECS Message Map.</strong> Your customer is the hero. You
            are the guide. Build your complete brand narrative: identify who you
            serve, what problems they face, how you show up as their trusted
            partner, the clear path forward, and the transformation at stake.
          </InfoBanner>

          {/* 1. Character / Hero */}
          <FieldCard
            title="1. A Character — Your Client (the Hero)"
            stepId="mm-character"
            completed={!!completedSteps["mm-character"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Who is your customer? What do they want more than anything?
            </p>
            <div className="space-y-4">
              <div>
                <FLabel>What core problem do they have?</FLabel>
                <FTextarea
                  value={formData.characterProblem}
                  onChange={(v) => onFormChange("characterProblem", v)}
                  placeholder="Example: Solo entrepreneurs struggle to clarify their brand message and attract ideal clients…"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <FLabel>External Problem</FLabel>
                  <FInput
                    value={formData.externalProblem}
                    onChange={(v) => onFormChange("externalProblem", v)}
                    placeholder="Physical/tangible issue"
                  />
                </div>
                <div>
                  <FLabel>Internal Problem</FLabel>
                  <FInput
                    value={formData.internalProblem}
                    onChange={(v) => onFormChange("internalProblem", v)}
                    placeholder="How they feel"
                  />
                </div>
                <div>
                  <FLabel>Philosophical Problem</FLabel>
                  <FInput
                    value={formData.philosophicalProblem}
                    onChange={(v) => onFormChange("philosophicalProblem", v)}
                    placeholder="Why it's unjust"
                  />
                </div>
              </div>
            </div>
          </FieldCard>

          {/* 2. Guide */}
          <FieldCard
            title="2. Meets a Guide — You"
            stepId="mm-guide"
            completed={!!completedSteps["mm-guide"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Show empathy and authority. Why should they trust you?
            </p>
            <div className="space-y-4">
              <div>
                <FLabel>Your Business / Brand Name</FLabel>
                <FInput
                  value={formData.guideName}
                  onChange={(v) => onFormChange("guideName", v)}
                  placeholder="e.g. Your Business Name"
                />
              </div>
              <div>
                <FLabel>Empathy Statement — "We understand…"</FLabel>
                <FTextarea
                  value={formData.empathy}
                  onChange={(v) => onFormChange("empathy", v)}
                  placeholder="Example: We understand how overwhelming it feels to build a business without clear direction…"
                />
              </div>
              <div>
                <FLabel>Authority / Credibility Proof</FLabel>
                <FTextarea
                  value={formData.authority}
                  onChange={(v) => onFormChange("authority", v)}
                  placeholder="Example: We've helped 50+ entrepreneurs build profitable brands using proven frameworks…"
                />
              </div>
            </div>
          </FieldCard>

          {/* 3. Plan */}
          <FieldCard
            title="3. A Clear 3-Step Plan"
            stepId="mm-plan"
            completed={!!completedSteps["mm-plan"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Three simple steps to work with you. Remove friction by showing
              exactly what happens next.
            </p>
            <div className="space-y-3">
              {[
                { field: "planStep1", label: "Step 1", placeholder: "Schedule a strategy call" },
                { field: "planStep2", label: "Step 2", placeholder: "Get your custom roadmap" },
                { field: "planStep3", label: "Step 3", placeholder: "Launch and grow your business" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label}</FLabel>
                  <FInput
                    value={formData[item.field as keyof PlanFormData]}
                    onChange={(v) => onFormChange(item.field as keyof PlanFormData, v)}
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
            </div>
          </FieldCard>

          {/* 4. Call to Action */}
          <FieldCard
            title="4. Call to Action"
            stepId="mm-cta"
            completed={!!completedSteps["mm-cta"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              What is the direct, clear next step you want them to take?
            </p>
            <FLabel>Your Primary Call to Action</FLabel>
            <FInput
              value={formData.callToAction}
              onChange={(v) => onFormChange("callToAction", v)}
              placeholder="Book Your Free Strategy Session"
            />
          </FieldCard>

          {/* 5–7. Stakes */}
          <FieldCard
            title="5–7. Success & Failure Stakes"
            stepId="mm-stakes"
            completed={!!completedSteps["mm-stakes"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Paint the contrast: what does transformation look like, and what
              happens if they do nothing?
            </p>
            <div className="space-y-4">
              <div>
                <FLabel>Success — Their transformed life</FLabel>
                <FTextarea
                  value={formData.stakesSuccess}
                  onChange={(v) => onFormChange("stakesSuccess", v)}
                  placeholder="Example: A thriving business with consistent revenue, clear brand positioning, and the freedom to work with ideal clients…"
                />
              </div>
              <div>
                <FLabel>Failure — What happens if they do nothing?</FLabel>
                <FTextarea
                  value={formData.stakesFailure}
                  onChange={(v) => onFormChange("stakesFailure", v)}
                  placeholder="Example: Continued confusion, wasted marketing dollars, inconsistent income…"
                />
              </div>
            </div>
          </FieldCard>

          {/* One-Liner */}
          <FieldCard
            title="Your One-Liner"
            stepId="mm-oneliner"
            completed={!!completedSteps["mm-oneliner"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Combine everything into one compelling sentence. Use it on your
              website, bio, and every marketing touchpoint.
            </p>
            <FLabel>Format: [Customer] + [Problem] + [Solution] + [Success]</FLabel>
            <FTextarea
              rows={4}
              value={formData.oneLiner}
              onChange={(v) => onFormChange("oneLiner", v)}
              placeholder="Example: We help overwhelmed entrepreneurs clarify their brand message and build profitable businesses through strategic guidance and proven frameworks."
            />
          </FieldCard>
        </div>
      )}

      {/* Market Validation */}
      {section === "market" && (
        <div>
          <InfoBanner>
            <strong>Market Validation.</strong> Know your market better than
            they know themselves. Define your ideal clients, understand the
            competitive landscape, and lock in your unique value proposition.
          </InfoBanner>

          <FieldCard
            title="Target Market"
            stepId="market-target"
            completed={!!completedSteps["market-target"]}
            onToggle={onToggleStep}
          >
            <FLabel>Describe your ideal market segment</FLabel>
            <FTextarea
              value={formData.targetMarket}
              onChange={(v) => onFormChange("targetMarket", v)}
              placeholder="Example: Solo service-based entrepreneurs (coaches, consultants, creatives) with 0–3 years in business generating $2k–$10k/month who want to build a scalable, profitable brand…"
            />
          </FieldCard>

          <FieldCard
            title="Ideal Client Avatars"
            stepId="market-avatars"
            completed={!!completedSteps["market-avatars"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Define three distinct client personas you serve best.
            </p>
            <div className="space-y-4">
              {[
                { field: "idealClientAvatar1", label: "Avatar 1", placeholder: "Name, age, role, goals, pain points, where they hang out…" },
                { field: "idealClientAvatar2", label: "Avatar 2", placeholder: "Name, age, role, goals, pain points, where they hang out…" },
                { field: "idealClientAvatar3", label: "Avatar 3", placeholder: "Name, age, role, goals, pain points, where they hang out…" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label}</FLabel>
                  <FTextarea
                    value={formData[item.field as keyof PlanFormData]}
                    onChange={(v) => onFormChange(item.field as keyof PlanFormData, v)}
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
            </div>
          </FieldCard>

          <FieldCard
            title="Competitor Analysis"
            stepId="market-competitors"
            completed={!!completedSteps["market-competitors"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Who else competes for your ideal client's attention?
            </p>
            <div className="space-y-3">
              {[
                { field: "competitor1", label: "Competitor 1" },
                { field: "competitor2", label: "Competitor 2" },
                { field: "competitor3", label: "Competitor 3" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label}</FLabel>
                  <FInput
                    value={formData[item.field as keyof PlanFormData]}
                    onChange={(v) => onFormChange(item.field as keyof PlanFormData, v)}
                    placeholder="Name + what they offer + their weakness"
                  />
                </div>
              ))}
            </div>
          </FieldCard>

          <FieldCard
            title="Unique Value Proposition"
            stepId="market-uvp"
            completed={!!completedSteps["market-uvp"]}
            onToggle={onToggleStep}
          >
            <FLabel>What makes you the obvious choice?</FLabel>
            <FTextarea
              value={formData.uniqueValue}
              onChange={(v) => onFormChange("uniqueValue", v)}
              placeholder="Describe what you do differently, better, or exclusively — the thing your competitors simply can't match…"
            />
          </FieldCard>
        </div>
      )}

      {/* BECS Profit Allocation */}
      {section === "profit" && (
        <div>
          <InfoBanner>
            <strong>BECS Profit Allocation.</strong> Profitability is built
            into your foundation — not an afterthought. Structure your revenue
            allocation so profit, owner pay, taxes, and operating expenses are
            separated from day one.
          </InfoBanner>

          <FieldCard
            title="Current Monthly Revenue"
            stepId="profit-revenue"
            completed={!!completedSteps["profit-revenue"]}
            onToggle={onToggleStep}
          >
            <FLabel>Current Average Monthly Revenue ($)</FLabel>
            <FInput
              type="number"
              value={formData.currentRevenue}
              onChange={(v) => {
                onFormChange("currentRevenue", v);
                const rev = parseFloat(v) || 0;
                onFormChange(
                  "targetMonthlyProfit",
                  ((rev * (parseInt(formData.profitPercentage) || 0)) / 100).toFixed(2)
                );
                onFormChange(
                  "targetOwnerPay",
                  ((rev * (parseInt(formData.ownerPayPercentage) || 0)) / 100).toFixed(2)
                );
              }}
              placeholder="e.g. 5000"
            />
          </FieldCard>

          <FieldCard
            title="BECS Profit Allocation Percentages"
            stepId="profit-allocations"
            completed={!!completedSteps["profit-allocations"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Adjust the sliders to set your target allocations. They must sum
              to 100%.
            </p>
            <div className="space-y-5">
              {[
                { field: "profitPercentage", label: "Profit", color: "bg-[hsl(83,60%,57%)]" },
                { field: "ownerPayPercentage", label: "Owner Pay", color: "bg-[hsl(232,45%,18%)]" },
                { field: "taxPercentage", label: "Tax Reserve", color: "bg-amber-400" },
                { field: "opexPercentage", label: "Operating Expenses", color: "bg-slate-400" },
              ].map((item) => (
                <div key={item.field}>
                  <div className="flex items-center justify-between mb-1.5">
                    <FLabel>{item.label}</FLabel>
                    <span className="text-sm font-semibold text-slate-800">
                      {formData[item.field as keyof PlanFormData]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={parseInt(formData[item.field as keyof PlanFormData]) || 0}
                    onChange={(e) =>
                      onFormChange(item.field as keyof PlanFormData, e.target.value)
                    }
                    className="w-full accent-[hsl(232,45%,18%)]"
                  />
                </div>
              ))}
            </div>

            {/* Allocation total indicator */}
            <div
              className={`mt-4 rounded-lg p-3 text-sm font-medium ${
                alloc === 100
                  ? "bg-[hsl(83,60%,57%)]/10 text-[hsl(83,60%,35%)]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              Total allocation: {alloc}%{" "}
              {alloc !== 100 && `(${alloc < 100 ? `${100 - alloc}% unallocated` : `${alloc - 100}% over`})`}
            </div>
          </FieldCard>

          <FieldCard
            title="Projected Monthly Outcomes"
            stepId="profit-projections"
            completed={!!completedSteps["profit-projections"]}
            onToggle={onToggleStep}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-[hsl(83,60%,57%)]/10 p-4">
                <div className="text-xs text-slate-500 mb-1">Monthly Profit</div>
                <div className="text-2xl font-bold text-[hsl(232,45%,18%)]">
                  ${calcProfit}
                </div>
              </div>
              <div className="rounded-lg bg-[hsl(232,45%,18%)]/5 p-4">
                <div className="text-xs text-slate-500 mb-1">Owner Pay</div>
                <div className="text-2xl font-bold text-[hsl(232,45%,18%)]">
                  ${calcOwnerPay}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Based on ${formData.currentRevenue || "0"}/month revenue with your
              current allocation percentages.
            </p>
            <div className="mt-4 space-y-2">
              <div>
                <FLabel>Target Monthly Profit Goal ($)</FLabel>
                <FInput
                  type="number"
                  value={formData.targetMonthlyProfit}
                  onChange={(v) => onFormChange("targetMonthlyProfit", v)}
                  placeholder="e.g. 1500"
                />
              </div>
              <div>
                <FLabel>Target Monthly Owner Pay ($)</FLabel>
                <FInput
                  type="number"
                  value={formData.targetOwnerPay}
                  onChange={(v) => onFormChange("targetOwnerPay", v)}
                  placeholder="e.g. 3000"
                />
              </div>
            </div>
          </FieldCard>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MODULE 2: EVOLVE
// ---------------------------------------------------------------------------
const EVOLVE_STEPS_TOTAL = 25;

type EvolveFormData = {
  // Brand Identity
  brandName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoDescription: string;
  brandVoice: string;
  brandPersonality: string;
  visualStyle: string;
  // Operations
  currentTools: string;
  workflowPainPoints: string;
  clientOnboardingSteps: string;
  projectManagementTool: string;
  communicationChannels: string;
  documentationNeeds: string;
  sop1: string;
  sop2: string;
  sop3: string;
  // Marketing Automation
  emailProvider: string;
  crmTool: string;
  automationGoals: string;
  leadCaptureMethod: string;
  followUpSequence: string;
  // Offer Suite
  coreOffer: string;
  offerPrice: string;
  upsellOffer: string;
  downsellOffer: string;
  deliveryMethod: string;
  // Launch Planning
  launchDate: string;
  preLaunchGoals: string;
  launchMonth1: string;
  launchMonth2: string;
  launchMonth3: string;
};

const defaultEvolveForm: EvolveFormData = {
  brandName: "",
  tagline: "",
  primaryColor: "#1d2d6e",
  secondaryColor: "#8dc63f",
  accentColor: "#ffffff",
  logoDescription: "",
  brandVoice: "",
  brandPersonality: "",
  visualStyle: "",
  currentTools: "",
  workflowPainPoints: "",
  clientOnboardingSteps: "",
  projectManagementTool: "",
  communicationChannels: "",
  documentationNeeds: "",
  sop1: "",
  sop2: "",
  sop3: "",
  emailProvider: "",
  crmTool: "",
  automationGoals: "",
  leadCaptureMethod: "",
  followUpSequence: "",
  coreOffer: "",
  offerPrice: "",
  upsellOffer: "",
  downsellOffer: "",
  deliveryMethod: "",
  launchDate: "",
  preLaunchGoals: "",
  launchMonth1: "",
  launchMonth2: "",
  launchMonth3: "",
};

const EVOLVE_SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "brand", label: "Brand Identity", icon: Palette },
  { id: "operations", label: "Operations", icon: Settings2 },
  { id: "automation", label: "Marketing Automation", icon: Zap },
  { id: "offer", label: "Offer Suite", icon: ShieldCheck },
  { id: "launch", label: "Launch Playbook", icon: Rocket },
];

function Module2Evolve({
  clientId,
  completedSteps,
  formData,
  onToggleStep,
  onFormChange,
}: {
  clientId: number;
  completedSteps: Record<string, boolean>;
  formData: EvolveFormData;
  onToggleStep: (stepId: string) => void;
  onFormChange: (field: keyof EvolveFormData, value: string) => void;
}) {
  const [section, setSection] = useState("overview");

  return (
    <div>
      {/* Section nav */}
      <div className="flex gap-2 flex-wrap mb-6">
        {EVOLVE_SECTIONS.map((s) => (
          <SectionTab
            key={s.id}
            id={s.id}
            label={s.label}
            icon={s.icon}
            active={section === s.id}
            onClick={() => setSection(s.id)}
          />
        ))}
      </div>

      {/* Overview */}
      {section === "overview" && (
        <div>
          <InfoBanner>
            <strong>Module 2: EVOLVE — Build &amp; Launch Readiness.</strong>{" "}
            Transform your vision into reality. This module takes you from
            concept to launch-ready business with professional brand assets,
            automated systems, a refined offer suite, and a comprehensive 90-day
            execution plan.
          </InfoBanner>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              {
                icon: Palette,
                title: "Brand Identity System",
                bullets: ["Logo brief & visual assets", "Color palette & typography", "Brand voice & tone", "Style guide foundations"],
              },
              {
                icon: Settings2,
                title: "Operations Workflow",
                bullets: ["Current process inventory", "Bottleneck identification", "Proposed SOPs", "Team coordination"],
              },
              {
                icon: Zap,
                title: "Marketing Automation",
                bullets: ["Email sequence drafts", "CRM selection", "Lead capture setup", "Follow-up automation"],
              },
              {
                icon: Rocket,
                title: "90-Day Launch Playbook",
                bullets: ["Month-by-month execution plan", "Milestone tracking", "Pre-launch checklist", "Go-live strategy"],
              },
            ].map((item) => (
              <Card key={item.title} className="border-slate-200">
                <CardContent className="p-5">
                  <item.icon
                    size={26}
                    className="text-[hsl(232,45%,18%)] mb-3"
                  />
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {item.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2
                          size={13}
                          className="text-[hsl(83,60%,45%)] mt-0.5 flex-shrink-0"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-[hsl(83,60%,57%)]/40 bg-[hsl(83,60%,57%)]/5">
            <CardContent className="p-5 text-sm text-slate-700 leading-relaxed">
              <strong>BECS Clarity Method:</strong> If you confuse, you lose.
              Your brand, systems, and processes must be crystal clear to both
              you and your customers. This module eliminates confusion and builds
              clarity at every level of your business.
            </CardContent>
          </Card>
        </div>
      )}

      {/* Brand Identity */}
      {section === "brand" && (
        <div>
          <InfoBanner>
            Build a cohesive, professional brand identity that communicates your
            value at every touchpoint — from your logo to your language.
          </InfoBanner>

          <FieldCard
            title="Brand Basics"
            stepId="brand-basics"
            completed={!!completedSteps["brand-basics"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Brand / Business Name</FLabel>
                <FInput
                  value={formData.brandName}
                  onChange={(v) => onFormChange("brandName", v)}
                  placeholder="Your business name"
                />
              </div>
              <div>
                <FLabel>Tagline</FLabel>
                <FInput
                  value={formData.tagline}
                  onChange={(v) => onFormChange("tagline", v)}
                  placeholder="A short, memorable phrase that captures your promise"
                />
              </div>
            </div>
          </FieldCard>

          <FieldCard
            title="Logo Brief"
            stepId="brand-logo"
            completed={!!completedSteps["brand-logo"]}
            onToggle={onToggleStep}
          >
            <FLabel>Describe your logo concept, style, and feel</FLabel>
            <FTextarea
              value={formData.logoDescription}
              onChange={(v) => onFormChange("logoDescription", v)}
              placeholder="Example: Minimal wordmark, geometric icon representing growth, clean sans-serif, conveys trust and expertise…"
            />
          </FieldCard>

          <FieldCard
            title="Color Palette"
            stepId="brand-colors"
            completed={!!completedSteps["brand-colors"]}
            onToggle={onToggleStep}
          >
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { field: "primaryColor", label: "Primary" },
                { field: "secondaryColor", label: "Secondary" },
                { field: "accentColor", label: "Accent" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label} Color</FLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData[item.field as keyof EvolveFormData]}
                      onChange={(e) =>
                        onFormChange(
                          item.field as keyof EvolveFormData,
                          e.target.value
                        )
                      }
                      className="h-9 w-14 cursor-pointer rounded border border-slate-200"
                    />
                    <span className="text-sm text-slate-600 font-mono">
                      {formData[item.field as keyof EvolveFormData]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </FieldCard>

          <FieldCard
            title="Brand Voice & Personality"
            stepId="brand-voice"
            completed={!!completedSteps["brand-voice"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Brand Voice (how you sound)</FLabel>
                <FTextarea
                  value={formData.brandVoice}
                  onChange={(v) => onFormChange("brandVoice", v)}
                  placeholder="Example: Authoritative yet approachable, direct, encouraging, no jargon…"
                />
              </div>
              <div>
                <FLabel>Brand Personality (3–5 adjectives)</FLabel>
                <FInput
                  value={formData.brandPersonality}
                  onChange={(v) => onFormChange("brandPersonality", v)}
                  placeholder="e.g. Bold, Trusted, Clear, Energetic, Professional"
                />
              </div>
              <div>
                <FLabel>Visual Style</FLabel>
                <FInput
                  value={formData.visualStyle}
                  onChange={(v) => onFormChange("visualStyle", v)}
                  placeholder="e.g. Modern minimal, editorial, warm & organic…"
                />
              </div>
            </div>
          </FieldCard>
        </div>
      )}

      {/* Operations */}
      {section === "operations" && (
        <div>
          <InfoBanner>
            Streamline your operations with documented processes, efficient
            project management, and client onboarding systems. Identify where
            time leaks and eliminate friction.
          </InfoBanner>

          <FieldCard
            title="Current Process Inventory"
            stepId="ops-inventory"
            completed={!!completedSteps["ops-inventory"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Tools you currently use</FLabel>
                <FTextarea
                  value={formData.currentTools}
                  onChange={(v) => onFormChange("currentTools", v)}
                  placeholder="List every tool: email, project management, invoicing, scheduling, communication…"
                />
              </div>
              <div>
                <FLabel>Workflow pain points / bottlenecks</FLabel>
                <FTextarea
                  value={formData.workflowPainPoints}
                  onChange={(v) => onFormChange("workflowPainPoints", v)}
                  placeholder="Where do things break down or slow down most?"
                />
              </div>
            </div>
          </FieldCard>

          <FieldCard
            title="Client Onboarding System"
            stepId="ops-onboarding"
            completed={!!completedSteps["ops-onboarding"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Client onboarding steps (in order)</FLabel>
                <FTextarea
                  value={formData.clientOnboardingSteps}
                  onChange={(v) => onFormChange("clientOnboardingSteps", v)}
                  placeholder="Step 1: Contract signed → Step 2: Welcome email + portal access → Step 3: Kick-off call…"
                  rows={4}
                />
              </div>
              <div>
                <FLabel>Project management tool of choice</FLabel>
                <FInput
                  value={formData.projectManagementTool}
                  onChange={(v) => onFormChange("projectManagementTool", v)}
                  placeholder="e.g. Notion, ClickUp, Asana, Trello…"
                />
              </div>
              <div>
                <FLabel>Communication channels</FLabel>
                <FInput
                  value={formData.communicationChannels}
                  onChange={(v) => onFormChange("communicationChannels", v)}
                  placeholder="e.g. Email + Slack + portal messages"
                />
              </div>
            </div>
          </FieldCard>

          <FieldCard
            title="Standard Operating Procedures (SOPs)"
            stepId="ops-sops"
            completed={!!completedSteps["ops-sops"]}
            onToggle={onToggleStep}
          >
            <p className="text-sm text-slate-500 mb-4">
              Draft your top three SOPs — the processes you repeat most often.
            </p>
            <div className="space-y-4">
              {[
                { field: "sop1", label: "SOP 1" },
                { field: "sop2", label: "SOP 2" },
                { field: "sop3", label: "SOP 3" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label} — Name + Key Steps</FLabel>
                  <FTextarea
                    value={formData[item.field as keyof EvolveFormData]}
                    onChange={(v) =>
                      onFormChange(item.field as keyof EvolveFormData, v)
                    }
                    placeholder="Name: New Client Intake\nStep 1: …\nStep 2: …"
                  />
                </div>
              ))}
            </div>
          </FieldCard>

          <FieldCard
            title="Documentation Needs"
            stepId="ops-docs"
            completed={!!completedSteps["ops-docs"]}
            onToggle={onToggleStep}
          >
            <FLabel>What needs to be documented to make your business run without you?</FLabel>
            <FTextarea
              value={formData.documentationNeeds}
              onChange={(v) => onFormChange("documentationNeeds", v)}
              placeholder="e.g. Proposal template, contract, onboarding checklist, delivery checklist, offboarding process…"
            />
          </FieldCard>
        </div>
      )}

      {/* Marketing Automation */}
      {section === "automation" && (
        <div>
          <InfoBanner>
            Set up automated marketing systems that nurture leads and convert
            prospects. Your email sequences and CRM should work while you focus
            on delivery.
          </InfoBanner>

          <FieldCard
            title="Email & CRM Setup"
            stepId="auto-crm"
            completed={!!completedSteps["auto-crm"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Email marketing provider</FLabel>
                <FInput
                  value={formData.emailProvider}
                  onChange={(v) => onFormChange("emailProvider", v)}
                  placeholder="e.g. ConvertKit, Mailchimp, ActiveCampaign, Klaviyo…"
                />
              </div>
              <div>
                <FLabel>CRM tool</FLabel>
                <FInput
                  value={formData.crmTool}
                  onChange={(v) => onFormChange("crmTool", v)}
                  placeholder="e.g. HubSpot, Dubsado, Pipedrive, Notion CRM…"
                />
              </div>
              <div>
                <FLabel>Automation goals</FLabel>
                <FTextarea
                  value={formData.automationGoals}
                  onChange={(v) => onFormChange("automationGoals", v)}
                  placeholder="e.g. Welcome sequence for new leads, post-call follow-up, re-engagement for cold contacts…"
                />
              </div>
            </div>
          </FieldCard>

          <FieldCard
            title="Lead Capture & Follow-Up"
            stepId="auto-lead"
            completed={!!completedSteps["auto-lead"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Lead capture method</FLabel>
                <FTextarea
                  value={formData.leadCaptureMethod}
                  onChange={(v) => onFormChange("leadCaptureMethod", v)}
                  placeholder="e.g. Free guide opt-in form, webinar registration, contact page → tagging in CRM…"
                />
              </div>
              <div>
                <FLabel>Follow-up email sequence draft (subject lines + key points)</FLabel>
                <FTextarea
                  rows={6}
                  value={formData.followUpSequence}
                  onChange={(v) => onFormChange("followUpSequence", v)}
                  placeholder={`Email 1 (Day 0): Subject: Welcome! Here's what's next…\nEmail 2 (Day 2): Subject: The #1 mistake I see…\nEmail 3 (Day 5): Subject: How [Client Name] went from X to Y…\nEmail 4 (Day 7): Subject: Ready to talk strategy?`}
                />
              </div>
            </div>
          </FieldCard>
        </div>
      )}

      {/* Offer Suite */}
      {section === "offer" && (
        <div>
          <InfoBanner>
            Define your complete offer suite — from your core offer through
            upsells and downsells. A clear offer ladder maximizes client value
            and revenue at every stage.
          </InfoBanner>

          <FieldCard
            title="Core Offer"
            stepId="offer-core"
            completed={!!completedSteps["offer-core"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Core offer description</FLabel>
                <FTextarea
                  value={formData.coreOffer}
                  onChange={(v) => onFormChange("coreOffer", v)}
                  placeholder="Describe what you deliver, who it's for, outcomes, duration, and what's included…"
                />
              </div>
              <div>
                <FLabel>Price point</FLabel>
                <FInput
                  value={formData.offerPrice}
                  onChange={(v) => onFormChange("offerPrice", v)}
                  placeholder="e.g. $3,000/month or $12,000 one-time"
                />
              </div>
              <div>
                <FLabel>Delivery method</FLabel>
                <FInput
                  value={formData.deliveryMethod}
                  onChange={(v) => onFormChange("deliveryMethod", v)}
                  placeholder="e.g. 1:1 coaching calls + async portal + weekly check-ins"
                />
              </div>
            </div>
          </FieldCard>

          <FieldCard
            title="Upsell"
            stepId="offer-upsell"
            completed={!!completedSteps["offer-upsell"]}
            onToggle={onToggleStep}
          >
            <FLabel>Upsell offer (premium or continuation)</FLabel>
            <FTextarea
              value={formData.upsellOffer}
              onChange={(v) => onFormChange("upsellOffer", v)}
              placeholder="Describe the next-level offer for clients ready to go deeper or longer…"
            />
          </FieldCard>

          <FieldCard
            title="Downsell"
            stepId="offer-downsell"
            completed={!!completedSteps["offer-downsell"]}
            onToggle={onToggleStep}
          >
            <FLabel>Downsell offer (entry-level or self-serve)</FLabel>
            <FTextarea
              value={formData.downsellOffer}
              onChange={(v) => onFormChange("downsellOffer", v)}
              placeholder="Describe a lower-commitment option for leads not yet ready for the core offer…"
            />
          </FieldCard>
        </div>
      )}

      {/* Launch Playbook */}
      {section === "launch" && (
        <div>
          <InfoBanner>
            Execute a structured 90-day launch strategy with clear milestones
            and accountability checkpoints. Month by month, work toward a
            successful go-live and early client wins.
          </InfoBanner>

          <FieldCard
            title="Launch Basics"
            stepId="launch-basics"
            completed={!!completedSteps["launch-basics"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Target launch date</FLabel>
                <FInput
                  type="date"
                  value={formData.launchDate}
                  onChange={(v) => onFormChange("launchDate", v)}
                />
              </div>
              <div>
                <FLabel>Pre-launch goals (what must be true before you launch?)</FLabel>
                <FTextarea
                  value={formData.preLaunchGoals}
                  onChange={(v) => onFormChange("preLaunchGoals", v)}
                  placeholder="e.g. Website live, offer page complete, 2 beta clients confirmed, email list at 200+…"
                />
              </div>
            </div>
          </FieldCard>

          <FieldCard
            title="90-Day Timeline"
            stepId="launch-timeline"
            completed={!!completedSteps["launch-timeline"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-4">
              {[
                { field: "launchMonth1", label: "Month 1 — Foundation & Prep" },
                { field: "launchMonth2", label: "Month 2 — Build Momentum & Beta" },
                { field: "launchMonth3", label: "Month 3 — Full Launch & Scale" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label}</FLabel>
                  <FTextarea
                    value={formData[item.field as keyof EvolveFormData]}
                    onChange={(v) =>
                      onFormChange(item.field as keyof EvolveFormData, v)
                    }
                    placeholder="List key milestones, actions, and checkpoints for this month…"
                  />
                </div>
              ))}
            </div>
          </FieldCard>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MODULE 3: SUCCEED
// ---------------------------------------------------------------------------
const SUCCEED_STEPS_TOTAL = 30;

type SucceedFormData = {
  // Marketing Roadmap
  marketingGoal: string;
  targetAudience: string;
  primaryChannel: string;
  contentPillars: string;
  weeklyContentGoal: string;
  roadmapWeek1_2: string;
  roadmapWeek3_4: string;
  roadmapWeek5_6: string;
  roadmapWeek7_8: string;
  // Content System (30 posts)
  contentPost1: string; contentPost2: string; contentPost3: string; contentPost4: string; contentPost5: string;
  contentPost6: string; contentPost7: string; contentPost8: string; contentPost9: string; contentPost10: string;
  contentPost11: string; contentPost12: string; contentPost13: string; contentPost14: string; contentPost15: string;
  contentPost16: string; contentPost17: string; contentPost18: string; contentPost19: string; contentPost20: string;
  contentPost21: string; contentPost22: string; contentPost23: string; contentPost24: string; contentPost25: string;
  contentPost26: string; contentPost27: string; contentPost28: string; contentPost29: string; contentPost30: string;
  // Email Funnel
  email1Subject: string; email1Body: string;
  email2Subject: string; email2Body: string;
  email3Subject: string; email3Body: string;
  email4Subject: string; email4Body: string;
  email5Subject: string; email5Body: string;
  email6Subject: string; email6Body: string;
  email7Subject: string; email7Body: string;
  email8Subject: string; email8Body: string;
  email9Subject: string; email9Body: string;
  email10Subject: string; email10Body: string;
  email11Subject: string; email11Body: string;
  email12Subject: string; email12Body: string;
  // Paid Ads
  adBudget: string;
  adPlatform: string;
  targetROAS: string;
  adCreative: string;
  audienceTargeting: string;
  // KPIs
  revenueGoal: string;
  clientGoal: string;
  conversionRate: string;
  customerAcquisitionCost: string;
  lifetimeValue: string;
  // Profit Allocation Review
  monthlyRevenue: string;
  actualProfit: string;
  actualOwnerPay: string;
  profitMargin: string;
  // Client Success
  onboardingExperience: string;
  deliveryExcellence: string;
  feedbackSystem: string;
  retentionStrategy: string;
};

function makeDefaultSucceedForm(): SucceedFormData {
  const base: Record<string, string> = {
    marketingGoal: "", targetAudience: "", primaryChannel: "", contentPillars: "", weeklyContentGoal: "",
    roadmapWeek1_2: "", roadmapWeek3_4: "", roadmapWeek5_6: "", roadmapWeek7_8: "",
    adBudget: "", adPlatform: "", targetROAS: "", adCreative: "", audienceTargeting: "",
    revenueGoal: "", clientGoal: "", conversionRate: "", customerAcquisitionCost: "", lifetimeValue: "",
    monthlyRevenue: "", actualProfit: "", actualOwnerPay: "", profitMargin: "",
    onboardingExperience: "", deliveryExcellence: "", feedbackSystem: "", retentionStrategy: "",
  };
  for (let i = 1; i <= 30; i++) base[`contentPost${i}`] = "";
  for (let i = 1; i <= 12; i++) { base[`email${i}Subject`] = ""; base[`email${i}Body`] = ""; }
  return base as unknown as SucceedFormData;
}

const defaultSucceedForm: SucceedFormData = makeDefaultSucceedForm();

const SUCCEED_SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "roadmap", label: "60-Day Roadmap", icon: Map },
  { id: "content", label: "Content System", icon: Users },
  { id: "email", label: "Email Funnel", icon: Mail },
  { id: "ads", label: "Paid Ads", icon: TrendingUp },
  { id: "kpis", label: "KPI Dashboard", icon: BarChart3 },
  { id: "profitreview", label: "Profit Allocation Review", icon: DollarSign },
  { id: "retention", label: "Client Retention", icon: UserCheck },
];

function Module3Succeed({
  clientId,
  completedSteps,
  formData,
  onToggleStep,
  onFormChange,
}: {
  clientId: number;
  completedSteps: Record<string, boolean>;
  formData: SucceedFormData;
  onToggleStep: (stepId: string) => void;
  onFormChange: (field: keyof SucceedFormData, value: string) => void;
}) {
  const [section, setSection] = useState("overview");

  return (
    <div>
      {/* Section nav */}
      <div className="flex gap-2 flex-wrap mb-6">
        {SUCCEED_SECTIONS.map((s) => (
          <SectionTab
            key={s.id}
            id={s.id}
            label={s.label}
            icon={s.icon}
            active={section === s.id}
            onClick={() => setSection(s.id)}
          />
        ))}
      </div>

      {/* Overview */}
      {section === "overview" && (
        <div>
          <InfoBanner>
            <strong>Module 3: SUCCEED — Growth Engine &amp; Market Expansion.</strong>{" "}
            Execute a comprehensive marketing strategy, track key metrics, and
            build client success systems that drive sustainable growth and
            consistent profitability.
          </InfoBanner>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              {
                icon: Map,
                title: "60-Day Marketing Roadmap",
                bullets: ["Content strategy", "Channel selection", "Campaign planning", "Performance tracking"],
              },
              {
                icon: Users,
                title: "Content System (30 Posts)",
                bullets: ["Platform strategy", "Content calendar", "Engagement system", "Community building"],
              },
              {
                icon: Mail,
                title: "Email Funnel (6–12 Emails)",
                bullets: ["Welcome sequence", "Sales funnel", "Retention emails", "Broadcast strategy"],
              },
              {
                icon: BarChart3,
                title: "Performance Dashboard",
                bullets: ["Revenue metrics", "Conversion tracking", "CAC & LTV", "Monthly profit review"],
              },
            ].map((item) => (
              <Card key={item.title} className="border-slate-200">
                <CardContent className="p-5">
                  <item.icon
                    size={26}
                    className="text-[hsl(232,45%,18%)] mb-3"
                  />
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {item.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2
                          size={13}
                          className="text-[hsl(83,60%,45%)] mt-0.5 flex-shrink-0"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-[hsl(83,60%,57%)]/40 bg-[hsl(83,60%,57%)]/5">
            <CardContent className="p-5 text-sm text-slate-700 leading-relaxed">
              <strong>You can't manage what you don't measure.</strong> This
              module focuses on ruthless prioritization and data-driven
              optimization. Track what matters, eliminate what doesn't, and scale
              what works. Build a business that runs on systems, not hustle.
            </CardContent>
          </Card>
        </div>
      )}

      {/* 60-Day Roadmap */}
      {section === "roadmap" && (
        <div>
          <InfoBanner>
            Map out your next 60 days of marketing activity — goals, channels,
            and weekly actions — so you execute with clarity instead of guessing.
          </InfoBanner>

          <FieldCard
            title="Marketing Goals"
            stepId="roadmap-goals"
            completed={!!completedSteps["roadmap-goals"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              <div>
                <FLabel>Primary 60-day marketing goal</FLabel>
                <FInput
                  value={formData.marketingGoal}
                  onChange={(v) => onFormChange("marketingGoal", v)}
                  placeholder="e.g. Reach 5 new discovery calls per week"
                />
              </div>
              <div>
                <FLabel>Target audience for this campaign</FLabel>
                <FTextarea
                  value={formData.targetAudience}
                  onChange={(v) => onFormChange("targetAudience", v)}
                  placeholder="Be specific: demographics, psychographics, platform, stage of business…"
                />
              </div>
              <div>
                <FLabel>Primary channel</FLabel>
                <FInput
                  value={formData.primaryChannel}
                  onChange={(v) => onFormChange("primaryChannel", v)}
                  placeholder="e.g. Instagram, LinkedIn, YouTube, Podcast…"
                />
              </div>
              <div>
                <FLabel>Content pillars (3–5 themes)</FLabel>
                <FInput
                  value={formData.contentPillars}
                  onChange={(v) => onFormChange("contentPillars", v)}
                  placeholder="e.g. Client wins, Behind the process, Education, Mindset, Offers"
                />
              </div>
              <div>
                <FLabel>Weekly content goal (posts per week)</FLabel>
                <FInput
                  type="number"
                  value={formData.weeklyContentGoal}
                  onChange={(v) => onFormChange("weeklyContentGoal", v)}
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </FieldCard>

          {[
            { field: "roadmapWeek1_2", label: "Weeks 1–2", stepId: "roadmap-w1-2", placeholder: "Focus: Awareness & audience building. Actions: …" },
            { field: "roadmapWeek3_4", label: "Weeks 3–4", stepId: "roadmap-w3-4", placeholder: "Focus: Engagement & lead gen. Actions: …" },
            { field: "roadmapWeek5_6", label: "Weeks 5–6", stepId: "roadmap-w5-6", placeholder: "Focus: Conversion & offers. Actions: …" },
            { field: "roadmapWeek7_8", label: "Weeks 7–8", stepId: "roadmap-w7-8", placeholder: "Focus: Optimization & scale. Actions: …" },
          ].map((item) => (
            <FieldCard
              key={item.field}
              title={item.label}
              stepId={item.stepId}
              completed={!!completedSteps[item.stepId]}
              onToggle={onToggleStep}
            >
              <FTextarea
                value={formData[item.field as keyof SucceedFormData]}
                onChange={(v) =>
                  onFormChange(item.field as keyof SucceedFormData, v)
                }
                placeholder={item.placeholder}
              />
            </FieldCard>
          ))}
        </div>
      )}

      {/* Content System */}
      {section === "content" && (
        <div>
          <InfoBanner>
            Plan 30 posts across your content pillars. Having them mapped in
            advance removes decision fatigue and keeps you consistent.
          </InfoBanner>

          <FieldCard
            title="30-Post Content Grid"
            stepId="content-30posts"
            completed={!!completedSteps["content-30posts"]}
            onToggle={onToggleStep}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                <div key={num}>
                  <FLabel>Post {num}</FLabel>
                  <FInput
                    value={formData[`contentPost${num}` as keyof SucceedFormData]}
                    onChange={(v) =>
                      onFormChange(`contentPost${num}` as keyof SucceedFormData, v)
                    }
                    placeholder={`Topic / hook / format for post ${num}`}
                  />
                </div>
              ))}
            </div>
          </FieldCard>
        </div>
      )}

      {/* Email Funnel */}
      {section === "email" && (
        <div>
          <InfoBanner>
            Write 6–12 emails for your nurture sequence. Each email should
            deliver value, build trust, and guide the reader toward a clear next
            step.
          </InfoBanner>

          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <FieldCard
              key={num}
              title={`Email ${num}`}
              stepId={`email-${num}`}
              completed={!!completedSteps[`email-${num}`]}
              onToggle={onToggleStep}
            >
              <div className="space-y-2">
                <div>
                  <FLabel>Subject line</FLabel>
                  <FInput
                    value={formData[`email${num}Subject` as keyof SucceedFormData]}
                    onChange={(v) =>
                      onFormChange(
                        `email${num}Subject` as keyof SucceedFormData,
                        v
                      )
                    }
                    placeholder={`Email ${num} subject line…`}
                  />
                </div>
                <div>
                  <FLabel>Body / key points</FLabel>
                  <FTextarea
                    value={formData[`email${num}Body` as keyof SucceedFormData]}
                    onChange={(v) =>
                      onFormChange(
                        `email${num}Body` as keyof SucceedFormData,
                        v
                      )
                    }
                    placeholder="Hook → Value → Story → CTA…"
                  />
                </div>
              </div>
            </FieldCard>
          ))}
        </div>
      )}

      {/* Paid Ads */}
      {section === "ads" && (
        <div>
          <InfoBanner>
            Plan your paid advertising strategy: budget, platform, audience,
            creative direction, and expected return.
          </InfoBanner>

          <FieldCard
            title="Paid Ad Strategy"
            stepId="ads-strategy"
            completed={!!completedSteps["ads-strategy"]}
            onToggle={onToggleStep}
          >
            <div className="space-y-3">
              {[
                { field: "adBudget", label: "Monthly Ad Budget ($)", placeholder: "e.g. 500" },
                { field: "adPlatform", label: "Ad Platform", placeholder: "e.g. Meta, Google, LinkedIn, TikTok…" },
                { field: "targetROAS", label: "Target ROAS (Return on Ad Spend)", placeholder: "e.g. 3x" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label}</FLabel>
                  <FInput
                    value={formData[item.field as keyof SucceedFormData]}
                    onChange={(v) =>
                      onFormChange(item.field as keyof SucceedFormData, v)
                    }
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
              <div>
                <FLabel>Audience targeting details</FLabel>
                <FTextarea
                  value={formData.audienceTargeting}
                  onChange={(v) => onFormChange("audienceTargeting", v)}
                  placeholder="Demographics, interests, behaviors, lookalike audiences…"
                />
              </div>
              <div>
                <FLabel>Creative notes (hooks, formats, visuals)</FLabel>
                <FTextarea
                  value={formData.adCreative}
                  onChange={(v) => onFormChange("adCreative", v)}
                  placeholder="e.g. Video testimonial carousel, hook: 'Why most consultants stay broke…', CTA: Book a call…"
                />
              </div>
            </div>
          </FieldCard>
        </div>
      )}

      {/* KPI Dashboard */}
      {section === "kpis" && (
        <div>
          <InfoBanner>
            Set and track your key performance indicators. Review these monthly
            to confirm you're on track and make data-driven adjustments.
          </InfoBanner>

          <FieldCard
            title="Revenue & Client KPIs"
            stepId="kpi-revenue"
            completed={!!completedSteps["kpi-revenue"]}
            onToggle={onToggleStep}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { field: "revenueGoal", label: "Monthly Revenue Goal ($)", placeholder: "e.g. 15000" },
                { field: "clientGoal", label: "New Clients / Month Goal", placeholder: "e.g. 3" },
                { field: "conversionRate", label: "Sales Conversion Rate (%)", placeholder: "e.g. 25" },
                { field: "customerAcquisitionCost", label: "Customer Acquisition Cost ($)", placeholder: "e.g. 200" },
                { field: "lifetimeValue", label: "Client Lifetime Value ($)", placeholder: "e.g. 5000" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label}</FLabel>
                  <FInput
                    type="number"
                    value={formData[item.field as keyof SucceedFormData]}
                    onChange={(v) =>
                      onFormChange(item.field as keyof SucceedFormData, v)
                    }
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
            </div>
          </FieldCard>
        </div>
      )}

      {/* BECS Profit Allocation Review */}
      {section === "profitreview" && (
        <div>
          <InfoBanner>
            <strong>Monthly BECS Profit Allocation Review.</strong> Conduct this
            review each month to confirm your allocations are working, your
            profitability is growing, and your owner pay is on target.
          </InfoBanner>

          <FieldCard
            title="Monthly Actuals"
            stepId="profit-actuals"
            completed={!!completedSteps["profit-actuals"]}
            onToggle={onToggleStep}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { field: "monthlyRevenue", label: "Actual Monthly Revenue ($)", placeholder: "e.g. 12000" },
                { field: "actualProfit", label: "Actual Profit ($)", placeholder: "e.g. 1800" },
                { field: "actualOwnerPay", label: "Actual Owner Pay ($)", placeholder: "e.g. 3600" },
                { field: "profitMargin", label: "Profit Margin (%)", placeholder: "e.g. 15" },
              ].map((item) => (
                <div key={item.field}>
                  <FLabel>{item.label}</FLabel>
                  <FInput
                    type="number"
                    value={formData[item.field as keyof SucceedFormData]}
                    onChange={(v) =>
                      onFormChange(item.field as keyof SucceedFormData, v)
                    }
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Compare these actuals against your targets set in Module 1 BECS
              Profit Allocation. Adjust your percentages and revenue model
              accordingly.
            </p>
          </FieldCard>
        </div>
      )}

      {/* Client Retention */}
      {section === "retention" && (
        <div>
          <InfoBanner>
            Client success and retention is your most cost-effective growth
            lever. Deliver an outstanding experience and build systems to keep
            great clients coming back.
          </InfoBanner>

          <FieldCard
            title="Onboarding Experience"
            stepId="retention-onboarding"
            completed={!!completedSteps["retention-onboarding"]}
            onToggle={onToggleStep}
          >
            <FLabel>What does an exceptional onboarding experience look like?</FLabel>
            <FTextarea
              value={formData.onboardingExperience}
              onChange={(v) => onFormChange("onboardingExperience", v)}
              placeholder="Welcome gift, kick-off call agenda, first 72 hours touchpoints, portal setup, expectations set…"
            />
          </FieldCard>

          <FieldCard
            title="Delivery Excellence"
            stepId="retention-delivery"
            completed={!!completedSteps["retention-delivery"]}
            onToggle={onToggleStep}
          >
            <FLabel>How do you consistently over-deliver on your promise?</FLabel>
            <FTextarea
              value={formData.deliveryExcellence}
              onChange={(v) => onFormChange("deliveryExcellence", v)}
              placeholder="Response time standards, progress updates, milestone celebrations, surprise value-adds…"
            />
          </FieldCard>

          <FieldCard
            title="Feedback System"
            stepId="retention-feedback"
            completed={!!completedSteps["retention-feedback"]}
            onToggle={onToggleStep}
          >
            <FLabel>How do you collect, act on, and share client feedback?</FLabel>
            <FTextarea
              value={formData.feedbackSystem}
              onChange={(v) => onFormChange("feedbackSystem", v)}
              placeholder="Mid-engagement check-in, end-of-engagement survey, testimonial request process, NPS tracking…"
            />
          </FieldCard>

          <FieldCard
            title="Retention Playbook"
            stepId="retention-playbook"
            completed={!!completedSteps["retention-playbook"]}
            onToggle={onToggleStep}
          >
            <FLabel>How do you retain clients and create repeat business?</FLabel>
            <FTextarea
              value={formData.retentionStrategy}
              onChange={(v) => onFormChange("retentionStrategy", v)}
              placeholder="Renewal strategy, continuation offers, referral program, alumni community, check-in cadence…"
            />
          </FieldCard>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
const MODULE_META: Record<
  ModuleId,
  {
    title: string;
    subtitle: string;
    description: string;
    totalSteps: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  plan: {
    title: "PLAN",
    subtitle: "Foundation & Clarity",
    description: "Build your strategic messaging, market position, and financial foundation.",
    totalSteps: PLAN_STEPS_TOTAL,
    icon: Target,
  },
  evolve: {
    title: "EVOLVE",
    subtitle: "Build & Launch",
    description: "Develop brand identity, operations systems, and launch strategy.",
    totalSteps: EVOLVE_STEPS_TOTAL,
    icon: Rocket,
  },
  succeed: {
    title: "SUCCEED",
    subtitle: "Growth Engine",
    description: "Execute marketing, track KPIs, and build a sustainable growth engine.",
    totalSteps: SUCCEED_STEPS_TOTAL,
    icon: TrendingUp,
  },
};

export default function PortalLearnModulePage() {
  const params = useParams<{ moduleId: string }>();
  const rawModuleId = params?.moduleId ?? "";
  const moduleId: ModuleId = (["plan", "evolve", "succeed"].includes(rawModuleId)
    ? rawModuleId
    : "plan") as ModuleId;

  const meta = MODULE_META[moduleId];
  const { becsUser } = useAuth();
  const queryClient = useQueryClient();

  // ------ Client ID ------
  const clientIdQuery = useQuery<number | null>({
    queryKey: ["portal", "client-id", becsUser?.email],
    enabled: !!becsUser?.email,
    queryFn: () => fetchClientId(becsUser!.email),
  });
  const clientId = clientIdQuery.data ?? null;

  // ------ Module Progress ------
  const progressQuery = useQuery<ProgressRow[]>({
    queryKey: ["portal", "module-progress", clientId, moduleId],
    enabled: !!clientId,
    queryFn: () => fetchModuleProgress(clientId!, moduleId),
  });

  const rows = progressQuery.data ?? [];

  // Build completedSteps map from DB rows
  const completedSteps = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    rows.forEach((r) => {
      if (r.stepId !== "form") map[r.stepId] = r.completed;
    });
    return map;
  }, [rows]);

  // Build formData from DB row with stepId='form'
  const dbFormRow = rows.find((r) => r.stepId === "form");

  // ------ Form state ------
  const [planForm, setPlanForm] = useState<PlanFormData>(defaultPlanForm);
  const [evolveForm, setEvolveForm] = useState<EvolveFormData>(defaultEvolveForm);
  const [succeedForm, setSucceedForm] = useState<SucceedFormData>(defaultSucceedForm);

  // Hydrate form from DB on load
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!dbFormRow?.formData || hydratedRef.current) return;
    hydratedRef.current = true;
    const fd = dbFormRow.formData as Record<string, string>;
    if (moduleId === "plan") {
      setPlanForm((prev) => ({ ...prev, ...fd }));
    } else if (moduleId === "evolve") {
      setEvolveForm((prev) => ({ ...prev, ...fd }));
    } else {
      setSucceedForm((prev) => ({ ...prev, ...fd }));
    }
  }, [dbFormRow, moduleId]);

  // ------ Mutations ------
  const stepMutation = useMutation({
    mutationFn: async ({
      stepId,
      completed,
    }: {
      stepId: string;
      completed: boolean;
    }) => {
      if (!clientId) throw new Error("No client ID");
      await upsertStepRow(clientId, moduleId, stepId, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["portal", "module-progress", clientId, moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["portal", "module-progress-all", clientId],
      });
    },
  });

  const formMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      if (!clientId) throw new Error("No client ID");
      await upsertStepRow(clientId, moduleId, "form", false, formData);
    },
  });

  // Debounced form persistence
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleFormSave = useCallback(
    (data: Record<string, unknown>) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        formMutation.mutate(data);
      }, 500);
    },
    [formMutation]
  );

  // ------ Handlers ------
  const handleToggleStep = useCallback(
    (stepId: string) => {
      const current = !!completedSteps[stepId];
      stepMutation.mutate({ stepId, completed: !current });
    },
    [completedSteps, stepMutation]
  );

  const handlePlanChange = useCallback(
    (field: keyof PlanFormData, value: string) => {
      setPlanForm((prev) => {
        const next = { ...prev, [field]: value };
        scheduleFormSave(next as unknown as Record<string, unknown>);
        return next;
      });
    },
    [scheduleFormSave]
  );

  const handleEvolveChange = useCallback(
    (field: keyof EvolveFormData, value: string) => {
      setEvolveForm((prev) => {
        const next = { ...prev, [field]: value };
        scheduleFormSave(next as unknown as Record<string, unknown>);
        return next;
      });
    },
    [scheduleFormSave]
  );

  const handleSucceedChange = useCallback(
    (field: keyof SucceedFormData, value: string) => {
      setSucceedForm((prev) => {
        const next = { ...prev, [field]: value };
        scheduleFormSave(next as unknown as Record<string, unknown>);
        return next;
      });
    },
    [scheduleFormSave]
  );

  // ------ Progress calculation ------
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const pct = Math.min(
    100,
    Math.round((completedCount / meta.totalSteps) * 100)
  );

  const Icon = meta.icon;

  if (clientIdQuery.isLoading || progressQuery.isLoading) {
    return (
      <PortalPageShell>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          Loading module…
        </div>
      </PortalPageShell>
    );
  }

  if (!clientId) {
    return (
      <PortalPageShell>
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center max-w-md mx-auto">
          <h3 className="font-bold text-slate-900 mb-2">Portal access pending</h3>
          <p className="text-sm text-slate-600">
            Your account isn't linked to an active client record. Please reach
            out if you believe this is a mistake.
          </p>
        </div>
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell>
      {/* Back link */}
      <Link href="/portal/learn">
        <a className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft size={14} />
          Back to program
        </a>
      </Link>

      {/* Module header */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(232,45%,18%)] flex items-center justify-center flex-shrink-0">
              <Icon size={22} className="text-[hsl(83,60%,57%)]" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
                BECS P.E.S. — Module{" "}
                {moduleId === "plan" ? "1" : moduleId === "evolve" ? "2" : "3"}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                {meta.title}
                <span className="ml-2 text-slate-400 font-normal text-lg">
                  — {meta.subtitle}
                </span>
              </h1>
            </div>
          </div>

          {/* Progress pill */}
          <div className="flex items-center gap-3 sm:text-right">
            <div>
              <div className="text-xs text-slate-500 mb-1">
                {completedCount} / {meta.totalSteps} steps
              </div>
              <div className="w-32">
                <Progress
                  value={pct}
                  className="h-2 bg-slate-100 [&>div]:bg-[hsl(83,60%,57%)]"
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-[hsl(232,45%,18%)]">
              {pct}%
            </div>
          </div>
        </div>
      </section>

      {/* Module content */}
      <div className="min-h-[60vh]">
        {moduleId === "plan" && clientId && (
          <Module1Plan
            clientId={clientId}
            completedSteps={completedSteps}
            formData={planForm}
            onToggleStep={handleToggleStep}
            onFormChange={handlePlanChange}
          />
        )}
        {moduleId === "evolve" && clientId && (
          <Module2Evolve
            clientId={clientId}
            completedSteps={completedSteps}
            formData={evolveForm}
            onToggleStep={handleToggleStep}
            onFormChange={handleEvolveChange}
          />
        )}
        {moduleId === "succeed" && clientId && (
          <Module3Succeed
            clientId={clientId}
            completedSteps={completedSteps}
            formData={succeedForm}
            onToggleStep={handleToggleStep}
            onFormChange={handleSucceedChange}
          />
        )}
      </div>

      {/* Save status */}
      {formMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-[hsl(232,45%,18%)] text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg">
          Saving…
        </div>
      )}
      {formMutation.isSuccess && !formMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-[hsl(83,60%,35%)] text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg">
          Saved
        </div>
      )}
    </PortalPageShell>
  );
}
