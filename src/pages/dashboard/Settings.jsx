import { useState, useEffect } from "react";
import { useDashboardContext } from "../Dashboard";
import ImageCropper from "../../components/ImageCropper";
import { uploadFile, deleteFile } from "../../lib/supabaseStorage";
import { updateRecord, insertRecord } from "../../lib/db";
import { useToast } from "../../context/ToastProvider";

export default function DashboardSettings() {
  const { profiles = [], refetchProfiles } = useDashboardContext();
  const profile = profiles?.[0] || {};
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoHistory, setPhotoHistory] = useState(profile?.photo_history || []);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [autoSwitch, setAutoSwitch] = useState(!!profile?.auto_switch);

  useEffect(() => {
    // sync profile data
    let history = profile?.photo_history || [];
    if (history.length === 0 && profile?.profile_image) {
      history = [{ url: profile.profile_image, uploaded_at: profile.updated_at || profile.created_at, is_active: true }];
    }
    setPhotoHistory(history);
    setAutoSwitch(!!profile?.auto_switch);
  }, [profile?.photo_history, profile?.profile_image, profile?.auto_switch]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    if (!croppedFile) return;
    setUploading(true);
    try {
      const uploadRes = await uploadFile(croppedFile, 'media', 'profile-photos');
      if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed');

      const newUrl = uploadRes.url;
      const timestamp = new Date().toISOString();

      // Build updated history: new active first
      const updated = [{ url: newUrl, uploaded_at: timestamp, is_active: true }, ...photoHistory.map(p => ({ ...p, is_active: false }))];

      if (profile?.id) {
        const res = await updateRecord('profiles', profile.id, { photo_history: updated, updated_at: timestamp });
        if (!res.success) throw new Error(res.error || 'DB save failed');
        setPhotoHistory(updated);
        addToast('Profile photo uploaded', 'success');
        setTimeout(() => refetchProfiles?.(), 300);
      } else {
        const res = await insertRecord('profiles', { photo_history: updated, created_at: timestamp, updated_at: timestamp });
        if (!res.success) throw new Error(res.error || 'DB insert failed');
        setPhotoHistory(updated);
        addToast('Profile created with photo', 'success');
        setTimeout(() => refetchProfiles?.(), 300);
      }
    } catch (err) {
      addToast('Error uploading profile photo: ' + (err?.message || err), 'error');
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const openModal = (photo) => setModalPhoto(photo);
  const closeModal = () => setModalPhoto(null);

  const handleMakeLive = async (url) => {
    if (!profile?.id) return;
    const updated = photoHistory.map(p => ({ ...p, is_active: p.url === url }));
    try {
      const res = await updateRecord('profiles', profile.id, { photo_history: updated, updated_at: new Date().toISOString() });
      if (!res.success) throw new Error(res.error || 'DB update failed');
      setPhotoHistory(updated);
      addToast('Photo set as active', 'success');
      setTimeout(() => refetchProfiles?.(), 300);
      closeModal();
    } catch (err) {
      addToast('Error setting active photo: ' + (err?.message || err), 'error');
    }
  };

  const handleDelete = async (url) => {
    if (!profile?.id) return;
    if (!confirm('Delete this photo?')) return;
    try {
      // Remove from history
      const updated = photoHistory.filter(p => p.url !== url);
      // If active removed, set first as active
      if (!updated.find(p => p.is_active) && updated.length > 0) updated[0].is_active = true;

      const res = await updateRecord('profiles', profile.id, { photo_history: updated, updated_at: new Date().toISOString() });
      if (!res.success) throw new Error(res.error || 'DB update failed');
      setPhotoHistory(updated);
      addToast('Photo removed', 'success');
      // attempt deleting from storage (best-effort)
      try { await deleteFile(url); } catch (e) { console.warn('Could not delete storage file:', e); }
      setTimeout(() => refetchProfiles?.(), 300);
      closeModal();
    } catch (err) {
      addToast('Error deleting photo: ' + (err?.message || err), 'error');
    }
  };

  const toggleAutoSwitch = async () => {
    if (!profile?.id) return;
    const next = !autoSwitch;
    try {
      const res = await updateRecord('profiles', profile.id, { auto_switch: next, auto_switch_interval_hours: 6, updated_at: new Date().toISOString() });
      if (!res.success) throw new Error(res.error || 'DB update failed');
      setAutoSwitch(next);
      addToast('Auto-switch ' + (next ? 'enabled' : 'disabled'), 'success');
      setTimeout(() => refetchProfiles?.(), 300);
    } catch (err) {
      addToast('Error updating auto-switch: ' + (err?.message || err), 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {showCropper && selectedFile && (
        <ImageCropper file={selectedFile} onSave={handleCropComplete} onCancel={() => { setShowCropper(false); setSelectedFile(null); }} />
      )}

      <div className="card">
        <h3>👤 Profile</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent)' }}>
            <img src={(photoHistory.find(p=>p.is_active)||{}).url || '/profile.svg'} alt="active profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>e.target.src='/profile.svg'} />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ display: 'block' }}>
              Upload new profile photo
              <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} style={{ marginTop: 6 }} />
            </label>
            <div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={autoSwitch} onChange={toggleAutoSwitch} />
                <span style={{ color: 'var(--muted)' }}>Auto-switch photos every 6 hours</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>Photo History</h4>
        {photoHistory.length === 0 ? (
          <div style={{ color: 'var(--muted)', padding: 12 }}>No profile photos yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {photoHistory.map((p, idx) => (
              <div key={idx} style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden', borderRadius: 8, border: p.is_active ? '3px solid var(--accent)' : '1px solid var(--border)', background: 'var(--surface)' }}>
                <img src={p.url} alt={'photo-'+idx} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => openModal(p)} onError={(e)=>e.target.src='/MyLogo.png'} />
                <small style={{ position: 'absolute', left: 6, top: 6, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>{new Date(p.uploaded_at).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={closeModal}>
          <div style={{ width: 'min(90vw,800px)', background: 'var(--bg)', padding: 16, borderRadius: 8 }} onClick={(e)=>e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 240, height: 240, overflow: 'hidden', borderRadius: 8 }}>
                <img src={modalPhoto.url} alt="modal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>e.target.src='/MyLogo.png'} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginTop: 0 }}>{modalPhoto.is_active ? 'Active Photo' : 'Photo'}</h4>
                <p style={{ color: 'var(--muted)' }}>Uploaded: {new Date(modalPhoto.uploaded_at).toLocaleString()}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn-primary" onClick={() => handleMakeLive(modalPhoto.url)}>Display</button>
                  <button onClick={() => handleDelete(modalPhoto.url)} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '8px 12px' }}>Delete</button>
                  <button onClick={closeModal} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', padding: '8px 12px' }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
