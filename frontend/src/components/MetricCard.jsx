import { ArrowRight } from "lucide-react";

export default function MetricCard({ icon: Icon, label, value, tone = "teal", onClick }) {
  return (
    <button className={`metric-card tone-${tone}`} type="button" onClick={onClick}>
      <span className="metric-icon">{Icon ? <Icon size={22} /> : null}</span>
      <span>
        <span className="metric-label">{label}</span>
        <strong>{value}</strong>
      </span>
      <ArrowRight className="metric-arrow" size={18} />
    </button>
  );
}
