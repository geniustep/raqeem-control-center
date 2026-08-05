import Link from "next/link";

import { Card, CardBody, CardHeader } from "@/components/Card";
import {
  KnowledgeDomainBadge,
  KnowledgeIntentBadge,
  KnowledgeLanguageBadge,
  KnowledgeStatusBadge,
  KnowledgeTypeBadge,
  NeedsReviewBadge,
} from "@/components/knowledge/KnowledgeBadges";
import {
  KnowledgeErrorState,
  KnowledgePageHeader,
} from "@/components/knowledge/KnowledgePageChrome";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { Pill } from "@/components/Pill";
import { KnowledgeItemNotFoundError } from "@/lib/knowledge-read/client";
import { KnowledgeUpstreamError } from "@/lib/knowledge-auth/client";
import { KNOWLEDGE_UI_PATHS } from "@/lib/knowledge-read/constants";
import { knowledgeUiCopy as t } from "@/lib/knowledge-read/i18n";
import { loadItemData } from "@/lib/knowledge-read/loaders";

export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800 sm:text-end">{children}</dd>
    </div>
  );
}

export default async function KnowledgeItemDetailPage({
  params,
}: {
  params: Promise<{ public_uuid: string }>;
}) {
  const { public_uuid: publicUuid } = await params;

  try {
    const { item } = await loadItemData(publicUuid);

    const enabledActions = Object.entries(item.allowed_actions).filter(
      ([, enabled]) => enabled,
    );

    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader
          title={item.question || item.title}
          subtitle={t.detail.title}
          actions={
            <Link
              href={KNOWLEDGE_UI_PATHS.items}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              {t.detail.back}
            </Link>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader title={t.detail.question} />
              <CardBody>
                <p className="text-base font-medium text-slate-900 whitespace-pre-wrap">
                  {item.question || item.title}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t.detail.shortAnswer} />
              <CardBody>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">
                  {item.short_answer || "—"}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t.detail.body} />
              <CardBody>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-800">
                  {item.body || "—"}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardBody>
                <dl>
                  <Row label={t.items.state}>
                    <KnowledgeStatusBadge state={item.state} />
                  </Row>
                  <Row label={t.items.intent}>
                    <KnowledgeIntentBadge intent={item.intent} />
                  </Row>
                  <Row label={t.items.type}>
                    <KnowledgeTypeBadge type={item.item_type} />
                  </Row>
                  <Row label={t.items.language}>
                    <KnowledgeLanguageBadge language={item.language} />
                  </Row>
                  <Row label={t.detail.domains}>
                    <div className="flex flex-wrap justify-end gap-2">
                      {item.domains.length > 0
                        ? item.domains.map((domain) => (
                            <KnowledgeDomainBadge
                              key={`${domain.id}-${domain.code}`}
                              name={domain.name}
                              code={domain.code}
                            />
                          ))
                        : "—"}
                    </div>
                  </Row>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={t.detail.validity} />
              <CardBody>
                <dl>
                  <Row label={t.detail.reviewStatus}>
                    {item.review_status ?? "—"}
                  </Row>
                  <Row label={t.detail.needsReview}>
                    <NeedsReviewBadge needsReview={item.needs_review} />
                  </Row>
                  <Row label={t.detail.nextReview}>
                    <span dir="ltr">{item.validity.next_review_date ?? "—"}</span>
                  </Row>
                  <Row label={t.detail.validUntil}>
                    <span dir="ltr">{item.validity.valid_until ?? "—"}</span>
                  </Row>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={t.detail.people} />
              <CardBody>
                <dl>
                  <Row label={t.detail.owner}>
                    <span dir="auto">{item.owner?.display_name ?? "—"}</span>
                  </Row>
                  <Row label={t.detail.reviewer}>
                    <span dir="auto">{item.reviewer?.display_name ?? "—"}</span>
                  </Row>
                  <Row label={t.detail.approver}>
                    <span dir="auto">{item.approver?.display_name ?? "—"}</span>
                  </Row>
                  <Row label={t.detail.publisher}>
                    <span dir="auto">{item.publisher?.display_name ?? "—"}</span>
                  </Row>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={t.detail.latestPackage} />
              <CardBody>
                {item.latest_package ? (
                  <dl>
                    <Row label="version">
                      <span dir="ltr">{item.latest_package.version ?? "—"}</span>
                    </Row>
                    <Row label="state">
                      {item.latest_package.state ?? "—"}
                    </Row>
                    <Row label="hash">
                      <span className="break-all font-mono text-xs" dir="ltr">
                        {item.latest_package.hash ?? "—"}
                      </span>
                    </Row>
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={t.detail.counts} />
              <CardBody>
                <dl>
                  <Row label={t.detail.packages}>{item.package_count}</Row>
                  <Row label={t.detail.relations}>{item.relation_count}</Row>
                  <Row label={t.detail.assets}>{item.asset_count}</Row>
                </dl>
              </CardBody>
            </Card>

            {enabledActions.length > 0 ? (
              <Card>
                <CardHeader title={t.detail.allowedActions} />
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {enabledActions.map(([action]) => (
                      <Pill key={action} tone="amber" dot={false}>
                        {action}: {t.detail.actionLater}
                      </Pill>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ) : null}

            <details className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                {t.detail.technical}
              </summary>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="public_uuid">
                  <span className="font-mono text-xs" dir="ltr">
                    {item.public_uuid}
                  </span>
                </Row>
                <Row label="slug">
                  <span dir="ltr">{item.slug || "—"}</span>
                </Row>
                <Row label="version_token">
                  <span className="break-all font-mono text-xs" dir="ltr">
                    {item.version_token ?? "—"}
                  </span>
                </Row>
                <Row label="created_at">
                  <span dir="ltr">{item.created_at ?? "—"}</span>
                </Row>
                <Row label="updated_at">
                  <span dir="ltr">{item.updated_at ?? "—"}</span>
                </Row>
                <Row label="published_at">
                  <span dir="ltr">{item.published_at ?? "—"}</span>
                </Row>
              </dl>
            </details>
          </div>
        </div>
      </KnowledgeWorkspace>
    );
  } catch (error) {
    const notFound =
      error instanceof KnowledgeItemNotFoundError ||
      (error instanceof KnowledgeUpstreamError &&
        (error.message === "item_not_found" || error.status === 404));
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.detail.title} />
        <KnowledgeErrorState
          message={notFound ? t.detail.notFound : t.states.error}
          retryHref={KNOWLEDGE_UI_PATHS.items}
        />
      </KnowledgeWorkspace>
    );
  }
}
