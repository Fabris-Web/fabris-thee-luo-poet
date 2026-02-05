import { useDashboardContext } from "../Dashboard";
import { useState } from "react";

export default function DashboardMediaLibrary() {
  const { mediaAssets = [], deleteMediaAsset } = useDashboardContext();
  const [filter, setFilter] = useState('all'); // 'all', 'images', 'videos'

  const filtered = (mediaAssets || []).filter(m => {
    if (filter === 'images') return !m.file_url.match(/\.(mp4|webm|mov|avi)$/i);
    if (filter === 'videos') return m.file_url.match(/\.(mp4|webm|mov|avi)$/i);
    return true;
  });

  const handleDelete = async (id) => {
    if (confirm('Delete this media?')) {
      try {
        await deleteMediaAsset(id);
        alert('Media deleted successfully!');
      } catch (err) {
        alert('Error deleting media: ' + (err?.message || err));
      }
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={() => setFilter('all')}
          style={{ padding: '6px 12px', borderRadius: 6, border: filter === 'all' ? '2px solid var(--accent)' : '1px solid var(--border)', background: filter === 'all' ? 'var(--surface)' : 'transparent' }}
        >
          All ({mediaAssets.length})
        </button>
        <button 
          onClick={() => setFilter('images')}
          style={{ padding: '6px 12px', borderRadius: 6, border: filter === 'images' ? '2px solid var(--accent)' : '1px solid var(--border)', background: filter === 'images' ? 'var(--surface)' : 'transparent' }}
        >
          Images ({(mediaAssets || []).filter(m => !m.file_url.match(/\.(mp4|webm|mov|avi)$/i)).length})
        </button>
        <button 
          onClick={() => setFilter('videos')}
          style={{ padding: '6px 12px', borderRadius: 6, border: filter === 'videos' ? '2px solid var(--accent)' : '1px solid var(--border)', background: filter === 'videos' ? 'var(--surface)' : 'transparent' }}
        >
          Videos ({(mediaAssets || []).filter(m => m.file_url.match(/\.(mp4|webm|mov|avi)$/i)).length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
          No {filter !== 'all' ? filter : 'media'} yet. Upload some in the Media Upload page.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {filtered.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
              <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: 'var(--surface)', overflow: 'hidden' }}>
                {m.file_url.match(/\.(mp4|webm|mov|avi)$/i) ? (
                  <video 
                    src={m.file_url} 
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <img 
                    src={m.file_url} 
                    alt="asset" 
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                )}
              </div>
              <div style={{ padding: 8 }}>
                <small style={{ color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                  {new Date(m.created_at || m.updated_at).toLocaleDateString()}
                </small>
                <button 
                  onClick={() => handleDelete(m.id)}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '0.85rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
