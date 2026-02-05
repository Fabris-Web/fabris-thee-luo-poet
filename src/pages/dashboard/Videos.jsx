import { useState } from "react";
import { useDashboardContext, formatDate } from "../Dashboard";
import { getYouTubeWatchUrl } from "../../lib/youtube";
import { formatDate as formatDisplayDate, pickDateField } from "../../lib/format";

function VideoManager({ videos, onAdd, onDelete }) {
  const [form, setForm] = useState({ title:'', youtubeId:'', date: formatDate() });
  const save = (e)=>{ e.preventDefault(); onAdd(form); setForm({ title:'', youtubeId:'', date: formatDate() }); };
  return (
    <div style={{ display:'grid', gap:12 }}>
      <form onSubmit={save} style={{ display:'grid', gap:8 }}>
        <label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></label>
        <label>YouTube ID or URL<input value={form.youtubeId} onChange={e=>setForm({...form,youtubeId:e.target.value})} placeholder="oXqvFVFRHUY or https://youtube.com/watch?v=..." /></label>
        <label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></label>
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" className="btn-primary">Add Video</button>
        </div>
      </form>

      <div style={{ display:'grid', gap:8 }}>
        {videos.length === 0 ? <div style={{ color:'var(--muted)' }}>No videos yet.</div> : videos.map(v => (
          <div key={v.id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <strong>{v.title}</strong>
              <div style={{ color:'var(--muted)' }}>{formatDisplayDate(pickDateField(v))}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => {
                  const watchUrl = getYouTubeWatchUrl(v.youtubeId || v.youtube_url || v.url || "");
                  if (watchUrl) window.open(watchUrl, "_blank");
                }}
              >
                Watch
              </button>
              <button onClick={()=>onDelete(v.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardVideos() {
  const { videos, addVideo, deleteVideo } = useDashboardContext();
  return <VideoManager videos={videos} onAdd={addVideo} onDelete={deleteVideo} />;
}
