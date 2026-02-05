import { useDashboardContext } from "../Dashboard";

export default function DashboardNotifications() {
  // useDashboardContext() is available if needed in the future
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>🔔 Notifications center coming soon.</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Activity feed will include: new comments, approvals, invites, and contact actions.</div>
    </div>
  );
}
