import { useDashboardContext } from "../Dashboard";
import { useState } from "react";
import { updateRecord, insertRecord } from "../../lib/db";
import { write } from "../../lib/storage";
import ImageCropper from "../../components/ImageCropper";

export default function DashboardSettings() {
  const { profiles, refetchProfiles } = useDashboardContext();
  const profile = profiles?.[0] || {};
  const [selectedFile, setSelectedFile] = useState(null);
  const [croppedFile, setCroppedFile] = useState(null);
  const [preview, setPreview] = useState(profile.profile_image || null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedFile) => {
    setCroppedFile(croppedFile);
    setShowCropper(false);
    
    // Show preview of cropped image
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleSaveProfile = async () => {
    if (!preview) return;
    
    setUploading(true);
    try {
      // Save base64 image URL to database
      const updates = { profile_image: preview, updated_at: new Date().toISOString() };

      let result;
      if (profile && profile.id) {
        // Update existing profile
        result = await updateRecord('profiles', profile.id, updates);
      } else {
        // Insert new profile row
        result = await insertRecord('profiles', { ...updates, created_at: new Date().toISOString() });
      }

      if (result.success) {
        // Update local storage so public UI (IdentityMark) can read the image immediately
        try { write('flp_profile', preview); } catch (e) { console.warn('Could not write local profile:', e); }
        alert('Profile image saved successfully!');
        setSelectedFile(null);
        setCroppedFile(null);
        setTimeout(() => refetchProfiles(), 300);
      } else {
        alert('Error saving profile image: ' + (result.error || 'unknown'));
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {showCropper && selectedFile && (
        <ImageCropper 
          file={selectedFile} 
          onSave={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
        />
      )}

      <div className="card" style={{ background: 'var(--surface)', borderLeft: '4px solid var(--accent)', padding: 12 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>👤 Profile Photos Moved</h3>
        <p style={{ margin: '4px 0', color: 'var(--muted)' }}>Profile photo uploads and management has been moved to the <strong>Library</strong> page.</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--muted)' }}>There you can upload new profile photos, view previous versions, and switch between them.</p>
      </div>
    </div>
  );
}
