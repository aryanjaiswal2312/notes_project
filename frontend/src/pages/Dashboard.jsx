import { BookOpen, CheckCircle2, FileText, GalleryHorizontalEnd, Target, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import MetricCard from "../components/MetricCard";

export default function Dashboard({ profile, setActivePage }) {
  const [summary, setSummary] = useState({ notes: 0, tasks: 0, pending: 0, gallery: 0 });

  useEffect(() => {
    let alive = true;
    Promise.all([api.notes.list(), api.tasks.list(), api.gallery.list()])
      .then(([notes, taskPayload, files]) => {
        if (!alive) return;
        setSummary({
          notes: notes.length,
          tasks: taskPayload.summary.total,
          pending: taskPayload.summary.pending,
          gallery: files.length
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const profileValue = useMemo(() => `${profile?.completion || 0}%`, [profile]);

  return (
    <div className="page-stack">
      <section className="dashboard-grid">
        <MetricCard icon={BookOpen} label="Notes" value={summary.notes} tone="teal" onClick={() => setActivePage("notes")} />
        <MetricCard icon={FileText} label="CG Notes" value="Open" tone="amber" onClick={() => setActivePage("notes")} />
        <MetricCard icon={Target} label="Daily Target" value={`${summary.pending} pending`} tone="coral" onClick={() => setActivePage("tasks")} />
        <MetricCard icon={GalleryHorizontalEnd} label="Gallery" value={summary.gallery} tone="indigo" onClick={() => setActivePage("gallery")} />
        <MetricCard icon={UserRound} label="Profile Progress" value={profileValue} tone="green" onClick={() => setActivePage("profile")} />
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-head">
            <h2>Daily Summary</h2>
            <CheckCircle2 size={19} />
          </div>
          <div className="summary-row">
            <span>Created notes</span>
            <strong>{summary.notes}</strong>
          </div>
          <div className="summary-row">
            <span>Total tasks</span>
            <strong>{summary.tasks}</strong>
          </div>
          <div className="summary-row">
            <span>Pending tasks</span>
            <strong>{summary.pending}</strong>
          </div>
        </div>

        <div className="panel progress-panel">
          <div className="panel-head">
            <h2>Profile Completion</h2>
            <span>{profileValue}</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${profile?.completion || 0}%` }} />
          </div>
          <button className="secondary-button" type="button" onClick={() => setActivePage("customization")}>
            Update Profile
          </button>
        </div>
      </section>
    </div>
  );
}
