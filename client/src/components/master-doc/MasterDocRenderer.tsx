/**
 * MasterDocRenderer
 *
 * Takes a MasterDoc (from the registry) + token map and renders the full
 * master-doc layout: hero, sticky progress, sections (with rich HTML body),
 * and footer.
 *
 * Use from any page:
 *   <MasterDocRenderer doc={getMasterDoc("msa")} tokens={{ CLIENT_NAME: "..." }} />
 */

import { useMemo } from "react";
import {
  MasterDocLayout,
  MasterDocHero,
  MasterDocProgress,
  MasterDocWrap,
  MasterDocSection,
  MasterDocFooter,
  useScrollSpy,
  scrollToId,
  type ProgressItem,
} from "./MasterDocLayout";
import {
  type MasterDoc,
  type TokenMap,
  replaceTokens,
} from "@/lib/master-doc-registry";

export function MasterDocRenderer({
  doc,
  tokens,
  /** Show top-nav tabs derived from sections. */
  showTabs = true,
  /** Optional appended content rendered after sections (e.g. signature pad). */
  appendix,
  /** Optional override of the hero block (full ReactNode). */
  heroOverride,
}: {
  doc: MasterDoc;
  tokens?: TokenMap;
  showTabs?: boolean;
  appendix?: React.ReactNode;
  heroOverride?: React.ReactNode;
}) {
  // Pre-substitute tokens once per render.
  const resolved = useMemo(() => {
    return {
      heroHeadline: replaceTokens(doc.heroHeadline, tokens),
      heroSubline: replaceTokens(doc.heroSubline, tokens),
      heroMeta:
        doc.defaultMeta?.map((m) => ({
          label: m.label,
          value: replaceTokens(m.value, tokens),
        })) ?? [],
      sections: doc.sections.map((s) => ({
        ...s,
        body: replaceTokens(s.body, tokens),
      })),
    };
  }, [doc, tokens]);

  const ids = resolved.sections.map((s) => s.id);
  const activeId = useScrollSpy(ids);

  const progressItems: ProgressItem[] = resolved.sections.map((s) => ({
    id: s.id,
    label: s.navLabel || stripBadgeNumber(s.title),
    onSelect: () => scrollToId(s.id),
  }));

  const tabs = showTabs
    ? resolved.sections.slice(0, 6).map((s) => ({
        id: s.id,
        label: s.navLabel || stripBadgeNumber(s.title),
        active: activeId === s.id,
        onClick: () => scrollToId(s.id),
      }))
    : undefined;

  return (
    <MasterDocLayout brandLabel="BECS" tabs={tabs}>
      {heroOverride ?? (
        <MasterDocHero
          eyebrow={doc.heroEyebrow}
          headline={
            <span dangerouslySetInnerHTML={{ __html: resolved.heroHeadline }} />
          }
          subline={resolved.heroSubline}
          meta={resolved.heroMeta.map((m) => ({
            label: m.label,
            value: m.value,
          }))}
          watermark="B"
        />
      )}

      <MasterDocProgress items={progressItems} activeId={activeId} />

      <MasterDocWrap>
        {resolved.sections.map((s, i) => (
          <MasterDocSection
            key={s.id}
            id={s.id}
            num={i + 1}
            eyebrow={s.eyebrow}
            title={s.title}
            badgeTone={i % 3 === 1 ? "teal" : "purple"}
          >
            <div
              className="md-rich"
              dangerouslySetInnerHTML={{ __html: s.body }}
            />
          </MasterDocSection>
        ))}
        {appendix}
      </MasterDocWrap>

      <MasterDocFooter />
    </MasterDocLayout>
  );
}

function stripBadgeNumber(title: string): string {
  return title.replace(/^\d+(\.\d+)?\s*[—-]\s*/, "").replace(/^Step \d+\s*[—-]\s*/, "");
}

export default MasterDocRenderer;
