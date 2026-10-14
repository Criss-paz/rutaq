import { useState } from 'react';
import { useApp } from '../useApp';

export default function ValidationAlert() {
  const validation = useApp((s) => s.validation);
  const select = useApp((s) => s.select);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!validation || validation.issues.length === 0) return null;

  const issues = validation.issues;
  const firstIssue = issues[0]!;
  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasMultiple = issues.length > 1;

  const handleSelect = (nodeIds?: string[], edgeIds?: string[]) => {
    if ((nodeIds && nodeIds.length > 0) || (edgeIds && edgeIds.length > 0)) {
      select(nodeIds ?? [], edgeIds ?? []);
    }
  };

  const firstHasTargets =
    (firstIssue.nodeIds && firstIssue.nodeIds.length > 0) || (firstIssue.edgeIds && firstIssue.edgeIds.length > 0);

  return (
    <aside
      data-testid="validation-alert"
      role="alert"
      aria-label="Aviso de validación del grafo"
      className={`border-b px-4 py-2 text-xs font-semibold transition-colors ${
        hasErrors
          ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/80 dark:text-rose-200'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="shrink-0">{hasErrors ? '❌' : '⚠️'}</span>
          {firstHasTargets ? (
            <button
              type="button"
              data-testid="validation-first-issue"
              onClick={() => handleSelect(firstIssue.nodeIds, firstIssue.edgeIds)}
              title="Tocar para seleccionar elementos afectados en el lienzo"
              className="cursor-pointer truncate text-left hover:underline focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-hidden rounded px-0.5"
            >
              {firstIssue.message}
            </button>
          ) : (
            <span className="truncate">{firstIssue.message}</span>
          )}
        </div>

        {hasMultiple && (
          <button
            type="button"
            data-testid="btn-toggle-issues"
            aria-expanded={isExpanded}
            aria-label={`Mostrar ${issues.length - 1} problemas más`}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-hidden"
          >
            <span>+{issues.length - 1} más</span>
            <span className={`text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
        )}
      </div>

      {hasMultiple && isExpanded && (
        <div
          data-testid="validation-issues-list"
          className="mt-2.5 flex flex-col gap-1 border-t border-current/15 pt-2"
        >
          <div className="text-[11px] font-bold uppercase opacity-75">
            Lista completa de problemas ({issues.length}):
          </div>
          {issues.map((issue, idx) => {
            const hasTargets =
              (issue.nodeIds && issue.nodeIds.length > 0) || (issue.edgeIds && issue.edgeIds.length > 0);
            return (
              <button
                key={idx}
                type="button"
                data-testid={`validation-issue-${idx}`}
                disabled={!hasTargets}
                onClick={() => handleSelect(issue.nodeIds, issue.edgeIds)}
                className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  hasTargets
                    ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-hidden'
                    : 'cursor-default opacity-80'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{issue.severity === 'error' ? '❌' : '⚠️'}</span>
                  <span>{issue.message}</span>
                </span>
                {hasTargets && (
                  <span className="shrink-0 text-[10px] font-bold uppercase opacity-80 underline">Seleccionar</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
