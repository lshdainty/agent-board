import { useState } from 'react';
import { Sun, Moon, Layers, List, Tag, DollarSign, TrendingUp, AlertTriangle, Shield, ShieldAlert, Activity, XCircle } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useCosts } from '@/hooks/useCosts';
import { useSecurityMetrics } from '@/hooks/useSecurityMetrics';

interface SettingsTabProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  projectId?: number;
}

export function SettingsTab({ theme, onToggleTheme, projectId = 3 }: SettingsTabProps) {
  const { settings, updateSetting } = useSettings();
  const { data: costData } = useCosts(projectId);
  const { data: securityData } = useSecurityMetrics(projectId);
  const [budgetLimit, setBudgetLimit] = useState(50);

  return (
    <div className="flex flex-col gap-5">
      {/* Theme */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          Display Settings
        </h4>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-bg)] transition-colors text-sm"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-[var(--color-card-foreground)]">
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </span>
        </button>
      </div>

      {/* 3D Quality: Shadows */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          3D Quality
        </h4>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background)]">
          <div className="flex items-center gap-3">
            <Layers size={16} className="text-[var(--color-muted-foreground)]" />
            <span className="text-sm text-[var(--color-card-foreground)]">Shadows</span>
          </div>
          <button
            onClick={() => updateSetting('shadows', !settings.shadows)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              settings.shadows ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.shadows ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Activity log count */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          Activity Log
        </h4>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background)]">
          <div className="flex items-center gap-3">
            <List size={16} className="text-[var(--color-muted-foreground)]" />
            <span className="text-sm text-[var(--color-card-foreground)]">Display count</span>
          </div>
          <select
            value={settings.activityLogCount}
            onChange={(e) => updateSetting('activityLogCount', Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Agent name labels */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          Agent Display
        </h4>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background)]">
          <div className="flex items-center gap-3">
            <Tag size={16} className="text-[var(--color-muted-foreground)]" />
            <span className="text-sm text-[var(--color-card-foreground)]">Name labels</span>
          </div>
          <button
            onClick={() => updateSetting('nameLabels', !settings.nameLabels)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              settings.nameLabels ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.nameLabels ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Cost Management */}
      {costData && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
            Cost Management
          </h4>

          {/* Total estimated cost */}
          <div className="p-3 rounded-lg bg-[var(--color-background)] mb-2">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-[var(--color-primary)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Total Estimated Cost
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-card-foreground)]">
              ${costData.estimated_cost_usd.toFixed(2)}
            </div>
            <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
              {costData.total_activities} API calls
            </div>
          </div>

          {/* Budget limit */}
          <div className="p-3 rounded-lg bg-[var(--color-background)] mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Budget Limit
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--color-muted-foreground)]">$</span>
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-1.5 py-0.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  min={1}
                />
              </div>
            </div>
            {(() => {
              const pct = Math.min(100, (costData.estimated_cost_usd / budgetLimit) * 100);
              const isOver = costData.estimated_cost_usd >= budgetLimit;
              return (
                <>
                  <div className="w-full h-3 rounded-full bg-[var(--color-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isOver ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">
                      {pct.toFixed(0)}% used
                    </span>
                    {isOver && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                        <AlertTriangle size={10} />
                        Over budget!
                      </span>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Per-agent cost breakdown */}
          {costData.by_agent.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <TrendingUp size={12} className="text-[var(--color-muted-foreground)]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  Cost by Agent
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {costData.by_agent.map((agent) => {
                  const maxCost = Math.max(1, ...costData.by_agent.map((a) => a.estimated_cost));
                  const pct = (agent.estimated_cost / maxCost) * 100;
                  return (
                    <div key={agent.agent_id} className="flex items-center gap-2 px-1">
                      <span className="text-xs text-[var(--color-card-foreground)] w-20 truncate shrink-0">
                        {agent.name}
                      </span>
                      <div className="flex-1 h-3 rounded bg-[var(--color-muted)] overflow-hidden">
                        {agent.estimated_cost > 0 && (
                          <div
                            className="h-full rounded transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: 'var(--color-primary)',
                            }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-[var(--color-muted-foreground)] w-12 text-right shrink-0">
                        ${agent.estimated_cost.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily cost trend (last 7 days) */}
          {costData.by_day.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1 block">
                Daily Cost (7 days)
              </span>
              <div className="flex items-end gap-1 h-16 px-1">
                {costData.by_day.map((day) => {
                  const maxDayCost = Math.max(0.01, ...costData.by_day.map((d) => d.cost));
                  const heightPct = (day.cost / maxDayCost) * 100;
                  const dateLabel = new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-0.5"
                      title={`${dateLabel}: $${day.cost.toFixed(2)} (${day.activities} calls)`}
                    >
                      <div className="w-full flex items-end justify-center" style={{ height: '48px' }}>
                        <div
                          className="w-full max-w-[20px] rounded-t transition-all duration-300"
                          style={{
                            height: `${Math.max(2, heightPct)}%`,
                            backgroundColor: 'var(--color-primary)',
                            opacity: 0.8,
                          }}
                        />
                      </div>
                      <span className="text-[8px] text-[var(--color-muted-foreground)] truncate w-full text-center">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Monitoring */}
      {securityData && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
            Security Monitoring
          </h4>

          {/* Overall security score */}
          <div className="p-3 rounded-lg bg-[var(--color-background)] mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-[var(--color-primary)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Overall Trust Score
              </span>
            </div>
            {(() => {
              const avgScore = securityData.agents.length > 0
                ? Math.round(securityData.agents.reduce((sum, a) => sum + a.trust_score, 0) / securityData.agents.length)
                : 100;
              const scoreColor = avgScore >= 90 ? '#22c55e' : avgScore >= 70 ? '#f59e0b' : '#ef4444';
              return (
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold" style={{ color: scoreColor }}>
                    {avgScore}
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${avgScore}%`, backgroundColor: scoreColor }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                      {securityData.agents.filter(a => a.anomaly_detected).length > 0
                        ? `${securityData.agents.filter(a => a.anomaly_detected).length} anomaly detected`
                        : 'No anomalies'}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Agent trust scores */}
          {securityData.agents.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <ShieldAlert size={12} className="text-[var(--color-muted-foreground)]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  Agent Trust Scores
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {securityData.agents.map((agent) => {
                  const barColor = agent.trust_score >= 90 ? '#22c55e' : agent.trust_score >= 70 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={agent.agent_id} className="flex items-center gap-2 px-1">
                      <span className="text-xs text-[var(--color-card-foreground)] w-20 truncate shrink-0 flex items-center gap-1">
                        {agent.name}
                        {agent.anomaly_detected && (
                          <span title="Anomaly detected" className="text-amber-500">&#9888;</span>
                        )}
                      </span>
                      <div className="flex-1 h-3 rounded bg-[var(--color-muted)] overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-300"
                          style={{ width: `${agent.trust_score}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-[10px] font-medium w-8 text-right shrink-0" style={{ color: barColor }}>
                        {agent.trust_score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* API call stats (24h) */}
          <div className="p-3 rounded-lg bg-[var(--color-background)] mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                API Calls (24h)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-lg font-bold text-[var(--color-card-foreground)]">
                  {securityData.api_calls_24h}
                </div>
                <div className="text-[10px] text-[var(--color-muted-foreground)]">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: securityData.failed_calls_24h > 0 ? '#ef4444' : '#22c55e' }}>
                  {securityData.failed_calls_24h}
                </div>
                <div className="text-[10px] text-[var(--color-muted-foreground)]">Failed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#22c55e]">
                  {securityData.api_calls_24h - securityData.failed_calls_24h}
                </div>
                <div className="text-[10px] text-[var(--color-muted-foreground)]">Success</div>
              </div>
            </div>
          </div>

          {/* Recent errors */}
          {securityData.recent_errors.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <XCircle size={12} className="text-red-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  Recent Errors
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {securityData.recent_errors.map((err, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[var(--color-background)] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--color-primary)]">{err.agent_name}</span>
                      <span className="text-[var(--color-muted-foreground)]">{err.action}</span>
                    </div>
                    <p className="text-[var(--color-muted-foreground)] mt-0.5 break-words [overflow-wrap:anywhere]">
                      {err.message}
                    </p>
                    <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                      {new Date(err.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
