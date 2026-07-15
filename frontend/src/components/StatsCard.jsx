import './StatsCard.css';

export default function StatsCard({ label, value, variant }) {
  return (
    <div className={`stats-card ${variant || ''}`}>
      <span className="stats-value">{value}</span>
      <span className="stats-label">{label}</span>
    </div>
  );
}
