import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { OpsPage } from "@/ops/OpsDashboardPage";
import { relativeTime } from "@/ops/PowerBadge";

export default function OpsAuditPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ops", "audit"],
    queryFn: api.opsAudit,
  });

  return (
    <OpsPage
      title="Audit"
      subtitle="Every operator action, who did it, and when"
    >
      {isLoading && <div className="skeleton" style={{ height: 200 }} />}
      {error && <p className="error">{(error as Error).message}</p>}

      {data && data.length === 0 && (
        <p className="muted">Nothing recorded yet.</p>
      )}

      <ol className="trail">
        {(data ?? []).map((e) => (
          <li key={e.id} className="trail-item">
            <span className="trail-dot" aria-hidden="true" />
            <span className="trail-body">
              <span className="trail-summary">{e.summary}</span>
              <span className="muted small block">
                {e.actor_email} · {relativeTime(e.at)}
                {e.target_label && ` · ${e.target_label}`}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </OpsPage>
  );
}
