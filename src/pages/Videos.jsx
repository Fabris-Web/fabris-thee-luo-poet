import { useState } from "react";
import { useSupabaseQuery } from "../lib/db";
import VideoCard from "../components/VideoCard";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import { getYouTubeEmbedUrl } from "../lib/youtube";

export default function Videos(){
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('all');
  const { data: videos = [], loading } = useSupabaseQuery('videos');

  const filtered = (videos || []).filter(v => {
    if (filter === 'all') return true;
    // If video has a type field, use it; otherwise treat as 'long'
    const type = v.video_type || v.type || 'long';
    return filter === type;
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Videos</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('long')} className={filter === 'long' ? 'active' : ''}>Long</button>
          <button onClick={() => setFilter('short')} className={filter === 'short' ? 'active' : ''}>Short</button>
        </div>
      </div>

      {loading && <Loader message="Loading videos..." />}

      <section style={{marginTop:12, display:'grid', gap:12}}>
        {!loading && filtered.length === 0 && <div style={{ color: 'var(--muted)' }}>No videos found.</div>}
        {filtered.map(v => (
          <VideoCard key={v.id} video={v} onOpen={(video) => setOpen(video)} />
        ))}
      </section>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div>
            <div style={{position:'relative',paddingTop:'56.25%', marginBottom: 20}}>
              <iframe
                src={getYouTubeEmbedUrl(open.youtubeId || open.youtube_url || "")}
                title={open.title}
                style={{position:'absolute',left:0,top:0,width:'100%',height:'100%'}}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Leave a Reflection</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const reflection = {
                    content_type: 'video',
                    content_id: open.id,
                    sender_name: formData.get('name') || 'Anonymous',
                    message: formData.get('message'),
                    is_anonymous: formData.get('anonymous') === 'on',
                  };
                  console.log('Reflection:', reflection);
                  alert('Thank you for your reflection! It will appear after approval.');
                  e.target.reset();
                }}
                style={{ display: 'grid', gap: 8 }}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Your name (optional)"
                  style={{ padding: 8, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
                <textarea
                  name="message"
                  placeholder="Share your thoughts..."
                  required
                  rows={3}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                  <input type="checkbox" name="anonymous" />
                  Post anonymously
                </label>
                <button type="submit" className="btn-primary">Submit Reflection</button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
