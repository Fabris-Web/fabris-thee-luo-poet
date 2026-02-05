import { useDashboardContext } from "../Dashboard";
import { formatDateTime } from "../../lib/format";

export default function DashboardComments() {
  const { comments, approveComment, removeComment } = useDashboardContext();
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {comments.length === 0 ? <div style={{ color: 'var(--muted)' }}>No comments yet.</div> : (
        comments.map(c => {
          const name = c.is_anonymous ? "Anonymous" : (c.sender_name || c.name || "Anonymous");
          const body = c.message || c.body || "";
          const date = formatDateTime(c.created_at || c.date);
          const approved = c.is_approved === true || c.approved === true;
          return (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{name}</strong>
              <small style={{ color: 'var(--muted)' }}>{date}</small>
            </div>
            <div style={{ marginTop: 8 }}>{body}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {!approved && <button onClick={() => approveComment(c.id)}>Approve</button>}
              <button onClick={() => removeComment(c.id)}>Remove</button>
            </div>
          </div>
        )})
      )}
    </div>
  );
}
