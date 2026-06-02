import { useCallback, useEffect, useState } from "react";
import { buildDefaultSettings } from "../../lib/defaults";
import { GamificationRing } from "./GamificationRing";
import { MissingWorkTray } from "./MissingWorkTray";
import { WhatIfCalculator } from "./WhatIfCalculator";

export function CanvasSidebar({ open, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const appUrl = buildDefaultSettings().appUrl;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    chrome.runtime.sendMessage({ type: "GET_CANVAS_DASHBOARD" }, (response) => {
      setLoading(false);
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message ?? "Extension error");
        return;
      }
      if (!response?.ok) {
        setError(response?.error ?? "Could not load planner data.");
        return;
      }
      setData(response.data);
    });
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <aside
      className={`k12-panel ${open ? "k12-open" : ""}`}
      aria-hidden={!open}
      aria-label="K-12 Academic Command Center"
    >
      <div className="k12-panel-inner">
        <header className="k12-header">
          <div>
            <h1>K-12 Command Center</h1>
            <p>Academic planner · synced with K12 Planner</p>
          </div>
          <button type="button" className="k12-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {loading ? <p className="k12-loading">Loading your planner…</p> : null}

        {error ? (
          <div className="k12-section">
            <p className="k12-error">{error}</p>
            <p className="k12-muted">
              Open the extension Options and sign in with your K12 Planner account.
            </p>
            <button type="button" className="k12-close" style={{ width: "auto", marginTop: 8 }} onClick={load}>
              Retry
            </button>
          </div>
        ) : null}

        {!loading && !error && data ? (
          <>
            <MissingWorkTray items={data.missingWork} />
            <GamificationRing
              percent={data.weekPercent}
              done={data.weekDone}
              total={data.weekTotal}
            />
            <WhatIfCalculator courses={data.courses} />
          </>
        ) : null}

        <a
          className="k12-footer-link"
          href={`${appUrl}/app`}
          target="_blank"
          rel="noreferrer"
        >
          Open full planner →
        </a>
      </div>
    </aside>
  );
}
