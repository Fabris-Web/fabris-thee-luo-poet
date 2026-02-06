import { useState, useEffect } from "react";
import { useDashboardContext, formatDate } from "../Dashboard";
import { getYouTubeWatchUrl, fetchYouTubeMetadata, fetchTikTokMetadata } from "../../lib/youtube";
import { formatDate as formatDisplayDate, pickDateField, trimToWords } from "../../lib/format";
import { updateRecord } from "../../lib/db";

function VideoManager({ videos, onAdd, onDelete }) {
  const [form, setForm] = useState({ youtubeId:'', date: formatDate() });
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [fetchedTitle, setFetchedTitle] = useState("");
  const [videoTitles, setVideoTitles] = useState({});
  const [refreshingId, setRefreshingId] = useState(null);
  const [platform, setPlatform] = useState('youtube');

  // Auto-fetch title when URL changes (YouTube and TikTok support auto-fetch)
  useEffect(() => {
    setFetchedTitle("");
    if (!form.youtubeId.trim()) return;
    
    if (platform === 'youtube') {
      setFetchingMetadata(true);
      fetchYouTubeMetadata(form.youtubeId).then((metadata) => {
        if (metadata && metadata.title) {
          setFetchedTitle(metadata.title);
        }
        setFetchingMetadata(false);
      });
    } else if (platform === 'tiktok') {
      setFetchingMetadata(true);
      fetchTikTokMetadata(form.youtubeId).then((metadata) => {
        if (metadata && metadata.title) {
          setFetchedTitle(metadata.title);
        }
        setFetchingMetadata(false);
      });
    }
    // Facebook doesn't support auto-fetch, title must be manual
  }, [form.youtubeId, platform]);

  // Fetch and cache titles for existing videos (prefetch from YouTube)
  useEffect(() => {
    videos.forEach(v => {
      const youtubeId = v.youtubeId || v.youtube_url || v.url;
      // Prefer database title, fallback to cached fetched title
      if (youtubeId && !videoTitles[v.id]) {
        if (v.title) {
          setVideoTitles(prev => ({ ...prev, [v.id]: v.title }));
        } else {
          // Fetch from YouTube if not in database
          fetchYouTubeMetadata(youtubeId).then((metadata) => {
            if (metadata && metadata.title) {
              setVideoTitles(prev => ({ ...prev, [v.id]: metadata.title }));
            }
          });
        }
      }
    });
  }, [videos, videoTitles]);

  const save = async (e) => {
    e.preventDefault();
    try {
      setFetchingMetadata(true);

      let title = fetchedTitle;

      // YouTube: auto-fetch if not already available
      if (platform === 'youtube') {
        if (!title) {
          const meta = await fetchYouTubeMetadata(form.youtubeId);
          title = meta?.title || `Video ${form.youtubeId}`;
        }
      }
      // TikTok: auto-fetch if not already available
      else if (platform === 'tiktok') {
        if (!title) {
          const meta = await fetchTikTokMetadata(form.youtubeId);
          title = meta?.title || null;
        }
        if (!title) {
          alert('Could not fetch TikTok title. Please try again or enter title manually.');
          return;
        }
      }
      // Facebook: requires manual title (no API support)
      else if (platform === 'facebook') {
        if (!title) {
          alert('Please enter a title for Facebook videos');
          return;
        }
      }

      // Set video_type based on platform (long for YouTube, short for TikTok/Facebook)
      const videoType = platform === 'youtube' ? 'long' : 'short';

      await onAdd({ youtubeId: form.youtubeId, title, date: form.date, video_type: videoType });
      setForm({ youtubeId: '', date: formatDate() });
      setFetchedTitle('');
    } finally {
      setFetchingMetadata(false);
    }
  };

  // Refresh title from YouTube and update database
  const refreshVideoTitle = async (video) => {
    setRefreshingId(video.id);
    const youtubeId = video.youtubeId || video.youtube_url || video.url || "";
    const metadata = await fetchYouTubeMetadata(youtubeId);
    if (metadata && metadata.title) {
      // Update the video record with fresh title from YouTube
      await updateRecord("videos", video.id, { title: metadata.title });
      setVideoTitles(prev => ({ ...prev, [video.id]: metadata.title }));
    }
    setRefreshingId(null);
  };
  
  return (
    <div style={{ display:'grid', gap:12 }}>
      <form onSubmit={save} style={{ display:'grid', gap:8 }}>
        {/* Platform Toggle */}
        <div style={{ display:'flex', gap:8, marginBottom: 8 }}>
          <button type="button" className={platform === 'youtube' ? 'btn-primary' : ''} onClick={() => { setPlatform('youtube'); setForm({...form, youtubeId: ''}); setFetchedTitle(''); }} style={{ flex: 1 }}>▶️ YouTube</button>
          <button type="button" className={platform === 'tiktok' ? 'btn-primary' : ''} onClick={() => { setPlatform('tiktok'); setForm({...form, youtubeId: ''}); setFetchedTitle(''); }} style={{ flex: 1 }}>🎵 TikTok</button>
          <button type="button" className={platform === 'facebook' ? 'btn-primary' : ''} onClick={() => { setPlatform('facebook'); setForm({...form, youtubeId: ''}); setFetchedTitle(''); }} style={{ flex: 1 }}>👍 Facebook</button>
        </div>

        {/* YouTube Mode - auto-fetch title */}
        {platform === 'youtube' && (
          <>
            <input value={form.youtubeId} onChange={e=>setForm({...form,youtubeId:e.target.value})} placeholder="YouTube ID or URL" />
          </>
        )}

        {/* TikTok Mode - auto-fetch title */}
        {platform === 'tiktok' && (
          <>
            <input value={form.youtubeId} onChange={e=>setForm({...form,youtubeId:e.target.value})} placeholder="TikTok URL or video ID" />
            {fetchedTitle && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>📌 Title: {fetchedTitle}</div>}
          </>
        )}

        {/* Facebook Mode - manual title */}
        {platform === 'facebook' && (
          <>
            <label>Title<input value={fetchedTitle} onChange={e=>setFetchedTitle(e.target.value)} placeholder="Enter video title" /></label>
            <input value={form.youtubeId} onChange={e=>setForm({...form,youtubeId:e.target.value})} placeholder="Facebook video URL" />
          </>
        )}

        <label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></label>
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" className="btn-primary" disabled={fetchingMetadata || !form.youtubeId.trim() || (platform !== 'youtube' && !fetchedTitle.trim())}>Add</button>
        </div>
      </form>

      <div style={{ display:'grid', gap:8 }}>
        {videos.length === 0 ? <div style={{ color:'var(--muted)' }}>No videos yet.</div> : videos.map(v => (
          <div key={v.id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <strong>{trimToWords(videoTitles[v.id] || v.title || 'Loading title...')}</strong>
              <div style={{ color:'var(--muted)' }}>{formatDisplayDate(pickDateField(v))}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => refreshVideoTitle(v)}
                disabled={refreshingId === v.id}
                style={{ fontSize: '0.85rem', padding: '6px 10px' }}
              >
                {refreshingId === v.id ? 'Updating...' : 'Refresh Title'}
              </button>
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
