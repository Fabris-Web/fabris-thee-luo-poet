import { useState } from "react";
import { useDashboardContext } from "../Dashboard";
import { uploadFile } from "../../lib/supabaseStorage";

function CreatePost({ onCreate }) {
  const [type, setType] = useState('post');
  const [mode, setMode] = useState('url');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fileData, setFileData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => { setTitle(''); setText(''); setImageUrl(''); setFileData(null); setType('post'); setMode('url'); };

  const handleFile = (file) => {
    if (!file) return setFileData(null);
    // Store file object, not data URL
    setFileData(file);
  };

  const submit = async (e) => {
    e && e.preventDefault();
    
    // Validate required fields
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (type === 'post' && !text.trim() && !imageUrl && !fileData) {
      alert('Please add text, image URL, or upload an image');
      return;
    }
    
    if ((type === 'long' || type === 'short') && mode === 'url' && !imageUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }
    
    if ((type === 'long' || type === 'short') && mode === 'file') {
      alert('Video file uploads are not supported; please provide a YouTube URL instead.');
      return;
    }
    
    setUploading(true);

    try {
      const date = new Date().toISOString();
      const content = {};

      if (type === 'post') {
        content.text = text;

        // Upload image if file is selected
        if (fileData) {
          const uploadRes = await uploadFile(fileData, 'media', 'posts');
          if (!uploadRes.success) {
            alert('Failed to upload image: ' + uploadRes.error);
            setUploading(false);
            return;
          }
          content.image = uploadRes.url;
        } else if (imageUrl) {
          content.image = imageUrl;
        } else {
          content.image = null;
        }
      } else {
        // For videos
        if (mode === 'url') {
          content.url = imageUrl || null;
        } else if (fileData) {
          // Upload video file
          const uploadRes = await uploadFile(fileData, 'media', 'videos');
          if (!uploadRes.success) {
            alert('Failed to upload video: ' + uploadRes.error);
            setUploading(false);
            return;
          }
          content.file = uploadRes.url;
        } else {
          content.file = null;
        }
      }

      onCreate({ type: type === 'post' ? 'post' : (type === 'long' ? 'long' : 'short'), title, content, date });
      reset();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h3>Create post</h3>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" className={type === 'post' ? 'btn-primary' : ''} onClick={() => setType('post')} style={{ flex: 1 }}>📝 Text</button>
          <button type="button" className={type === 'long' ? 'btn-primary' : ''} onClick={() => setType('long')} style={{ flex: 1 }}>🎬 Long Video</button>
          <button type="button" className={type === 'short' ? 'btn-primary' : ''} onClick={() => setType('short')} style={{ flex: 1 }}>📱 Short Video</button>
        </div>

        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Optional title" /></label>

        {type === 'post' && (
          <>
            <label>Text<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write something..." /></label>
            <label>Image URL<input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="/profile.svg or external" /></label>
            <label>Or upload image<input type="file" accept="image/*" onChange={(e)=>e.target.files[0] && handleFile(e.target.files[0])} disabled={uploading} /></label>
            {fileData && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>📁 {fileData.name} ({(fileData.size / 1024).toFixed(1)} KB)</div>}
          </>
        )}

        {(type === 'long' || type === 'short') && (
          <>
            <div style={{ display:'flex', gap:8, marginBottom: 8 }}>
              <button type="button" className={mode === 'url' ? 'btn-primary' : ''} onClick={() => setMode('url')} style={{ flex: 1 }}>🔗 Embed URL</button>
              <button type="button" className={mode === 'file' ? 'btn-primary' : ''} onClick={() => setMode('file')} style={{ flex: 1 }}>📁 Upload File</button>
            </div>
            {mode === 'url' && <label>Video URL<input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://youtube.com/..." /></label>}
            {mode === 'file' && <label>Upload video file<input type="file" accept="video/*" onChange={(e)=>e.target.files[0] && handleFile(e.target.files[0])} disabled={uploading} /></label>}
            {fileData && typeof fileData === 'object' && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>📁 {fileData.name} ({(fileData.size / 1024 / 1024).toFixed(1)} MB)</div>}
          </>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Create'}
          </button>
          <button type="button" onClick={reset} disabled={uploading}>Reset</button>
        </div>
      </form>
    </div>
  );
}

export default function DashboardMedia() {
  const ctx = useDashboardContext();
  const { mediaAssets = [], addMediaAsset, addVideo } = ctx;

  // Map CreatePost output to either media_assets (images) or videos (YouTube URLs)
  const handleCreate = async (post) => {
    // prefer image/url/file in content
    const fileUrl = post.content?.image || post.content?.file || post.content?.url || null;
    if (!fileUrl) {
      alert('No file/URL provided. Please enter a video URL or upload an image.');
      return;
    }

    try {
      if (post.type === 'long' || post.type === 'short') {
        // Video posts should use the videos table and accept YouTube URLs only
        try {
          await addVideo({ title: post.title, youtube_url: fileUrl, video_type: post.type === 'long' ? 'long' : 'short', date: post.date });
          alert('Video added successfully!');
        } catch (err) {
          alert('Error adding video: ' + (err?.message || err));
        }
        return;
      }

      // Otherwise treat as an image upload -> media_assets
      await addMediaAsset({ asset_type: 'image', file_url: fileUrl });
      alert('Media uploaded successfully!');
    } catch (err) {
      alert('Error uploading media: ' + (err?.message || err));
    }
  };

  // Show only the 5 most recent uploads
  const recentUploads = (mediaAssets || []).slice(0, 5);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <CreatePost onCreate={handleCreate} />

      {recentUploads.length > 0 && (
        <div>
          <h3>Recently Uploaded</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {recentUploads.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
                  {m.file_url.match(/\.(mp4|webm|mov|avi)$/i) ? (
                    <video src={m.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={m.file_url} alt="asset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{m.asset_type}</strong>
                  <small style={{ display: 'block', color: 'var(--muted)', marginTop: 4 }}>
                    {new Date(m.created_at || m.updated_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
