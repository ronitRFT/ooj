import './StatsCard.css';

export default function StatsCard({ label, value, accent }) {
  return (
    <div className={`stats-card ${accent || ''}`}>
      <span className="stats-value">{value}</span>
      <span className="stats-label">{label}</span>
    </div>
  );
}
