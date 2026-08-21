export default function DashboardLoading() {
  return (
    <div className="loading-grid" aria-label="Cargando">
      <div className="skeleton heading" />
      <div className="skeleton panel" />
      <div className="skeleton panel" />
    </div>
  );
}
