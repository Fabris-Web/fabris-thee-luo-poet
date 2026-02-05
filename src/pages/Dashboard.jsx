import { useEffect, useMemo, useState, createContext, useContext } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { useSupabaseQuery, insertRecord, updateRecord, deleteRecord, deleteAll } from "../lib/db";
import { getYouTubeWatchUrl, parseYouTubeId } from "../lib/youtube";

// Create context to pass dashboard state to child pages
const DashboardContext = createContext();

export function useDashboardContext() {
  return useContext(DashboardContext);
}

// Dashboard no longer handles local mock auth; use global Supabase auth

export function formatDate(d = new Date()) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // Initialize data from Supabase—useSupabaseQuery handles real-time sync
  const { data: poems = [], loading: loadingPoems, refetch: refetchPoems } = useSupabaseQuery('poems');
  const { data: videos = [], loading: loadingVideos, refetch: refetchVideos } = useSupabaseQuery('videos');
  const { data: mediaAssets = [], loading: loadingMediaAssets, refetch: refetchMediaAssets } = useSupabaseQuery('media_assets');
  const { data: comments = [], loading: loadingComments, refetch: refetchComments } = useSupabaseQuery('comments');
  const { data: invites = [], loading: loadingInvites, refetch: refetchInvites } = useSupabaseQuery('invites');
  const { data: profiles = [], loading: loadingProfiles, refetch: refetchProfiles } = useSupabaseQuery('profiles');
  const { data: liveSettings = [], loading: loadingLive, refetch: refetchLive } = useSupabaseQuery('live_settings');
  const { data: notifications = [], loading: loadingNotifications, refetch: refetchNotifications } = useSupabaseQuery('notifications');

  // Debug: Log data state for troubleshooting in dev only
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('Dashboard Supabase data loaded:', { 
      poemsCount: poems?.length || 0,
      videosCount: videos?.length || 0,
      commentsCount: comments?.length || 0,
      invitesCount: invites?.length || 0,
      poems: poems,
      videos: videos
    });
  }, [poems, videos, comments, invites]);

  const counts = useMemo(() => ({
    poems: (poems || []).length || 0,
    videos: (videos || []).length || 0,
    comments: (comments || []).length || 0,
     invites: (invites || []).filter(i => !i.is_read).length || 0,
  }), [poems, videos, comments, invites]);

  // Update title based on the current route
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const section = pathSegments[pathSegments.length - 1] || 'dashboard';
    const titles = {
      dashboard: 'Overview',
      poems: 'Poems',
      videos: 'Videos',
      live: 'Live',
      comments: 'Comments',
      invites: 'Invites',
      notifications: 'Notifications',
      media: 'Media',
      settings: 'Settings',
    };
    setPageTitle(titles[section] || 'Dashboard');
  }, [location.pathname]);

  // Redirect unauthenticated users once auth has finished loading
  useEffect(() => {
    console.log('Dashboard: Auth check - loading:', authLoading, 'user:', user?.email || 'none');
    if (!authLoading && !user) {
      console.log('Dashboard: No user after auth loading, redirecting to home');
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  // If auth is still initializing, show a placeholder
  if (authLoading) return <div className="page">Loading auth...</div>;

  // If user is not signed in, redirect to home (or show a short message)
  if (!user) {
    return null;
  }

  // --- Admin actions (Supabase) ---
  const addPoem = async (p) => {
    try {
      const result = await insertRecord('poems', { 
        title: p.title, 
        body: p.body, 
        created_at: p.date || new Date().toISOString()
      });
      if (result.success) {
        console.log('✓ Poem added:', result.data);
        // Wait a moment before refetching to ensure DB is updated
        setTimeout(() => refetchPoems(), 300);
      } else {
        console.error('✗ Failed to add poem:', result.error);
        alert('Error adding poem: ' + (result.error || 'unknown'));
      }
    } catch (e) {
      console.error('✗ Exception adding poem:', e);
      alert('Error: ' + e.message);
    }
  };

  const updatePoem = async (id, patch) => {
    try {
      const result = await updateRecord('poems', id, patch);
      if (result.success) {
        console.log('✓ Poem updated:', result.data);
        setTimeout(() => refetchPoems(), 300);
      } else {
        console.error('✗ Failed to update poem:', result.error);
        alert('Error updating poem: ' + (result.error || 'unknown'));
      }
    } catch (e) {
      console.error('✗ Exception updating poem:', e);
      alert('Error: ' + e.message);
    }
  };

  const deletePoem = async (id) => {
    try {
      const result = await deleteRecord('poems', id);
      if (result.success) {
        console.log('✓ Poem deleted');
        setTimeout(() => refetchPoems(), 300);
      } else {
        console.error('✗ Failed to delete poem:', result.error);
        alert('Error deleting poem: ' + (result.error || 'unknown'));
      }
    } catch (e) {
      console.error('✗ Exception deleting poem:', e);
      alert('Error: ' + e.message);
    }
  };

  const addVideo = async (v) => {
    try {
      // Normalize input: accept a raw YouTube ID or a full URL but require an ID
      const raw = (v.youtubeId || v.youtube_url || v.url || '').trim();
      const extractedId = parseYouTubeId(raw);

      if (!extractedId) {
        throw new Error('Please provide a valid YouTube ID or URL (e.g. oXqvFVFRHUY or https://youtu.be/oXqvFVFRHUY)');
      }

      const youtubeUrl = getYouTubeWatchUrl(extractedId);

      // Insert using `youtube_url` (most schemas use snake_case column names)
      const primaryPayload = {
        title: v.title || `Video ${extractedId}`,
        description: v.description || null,
        youtube_url: youtubeUrl,
        video_type: v.video_type || "long",
        is_published: typeof v.is_published === "boolean" ? v.is_published : true,
        created_at: v.date || new Date().toISOString(),
      };

      let result = await insertRecord("videos", primaryPayload);

      // Fallback for older schemas (youtubeId/date/type)
      if (!result.success && /column|does not exist/i.test(String(result.error || ""))) {
        const fallbackPayload = {
          title: v.title || `Video ${extractedId}`,
          youtubeId: extractedId,
          type: v.video_type || "long",
          date: v.date || new Date().toISOString().slice(0, 10),
        };
        result = await insertRecord("videos", fallbackPayload);
      }

      if (result.success) {
        console.log('✓ Video added:', result.data);
        // Ensure callers can await until the data is refetched
        await refetchVideos();
        return { success: true, data: result.data };
      } else {
        console.error('✗ Failed to add video:', result.error);
        throw new Error(result.error || 'Failed to add video');
      }
    } catch (e) {
      console.error('✗ Exception adding video:', e);
      throw e;
    }
  };

  const deleteVideo = async (id) => {
    try {
      const result = await deleteRecord('videos', id);
      if (result.success) {
        console.log('✓ Video deleted');
        setTimeout(() => refetchVideos(), 300);
      } else {
        console.error('✗ Failed to delete video:', result.error);
        alert('Error deleting video: ' + (result.error || 'unknown'));
      }
    } catch (e) {
      console.error('✗ Exception deleting video:', e);
      alert('Error: ' + e.message);
    }
  };

  const approveComment = async (id) => {
    try {
      const result = await updateRecord('comments', id, { is_approved: true });
      if (result.success) {
        console.log('✓ Comment approved');
        setTimeout(() => refetchComments(), 300);
      } else {
        console.error('✗ Failed to approve comment:', result.error);
      }
    } catch (e) {
      console.error('✗ Exception approving comment:', e);
    }
  };

  const removeComment = async (id) => {
    try {
      const result = await deleteRecord('comments', id);
      if (result.success) {
        console.log('✓ Comment removed');
        setTimeout(() => refetchComments(), 300);
      } else {
        console.error('✗ Failed to remove comment:', result.error);
      }
    } catch (e) {
      console.error('✗ Exception removing comment:', e);
    }
  };

  const clearAllInvites = async () => {
    try {
      await deleteAll('invites');
      console.log('✓ All invites cleared');
      setTimeout(() => refetchInvites(), 300);
    } catch (e) {
      console.error('✗ Exception clearing invites:', e);
      alert('Error: ' + e.message);
    }
  };

  const addMediaAsset = async ({ asset_type, file_url }) => {
    try {
      const result = await insertRecord('media_assets', {
        asset_type: asset_type || 'profile',
        file_url,
        updated_at: new Date().toISOString(),
      });
      if (result.success) {
        console.log('✓ Media asset added:', result.data);
        // Wait for refetch to complete before resolving
        await refetchMediaAssets();
        return { success: true, data: result.data };
      } else {
        console.error('✗ Failed to add media asset:', result.error);
        throw new Error(result.error || 'Failed to add media');
      }
    } catch (e) {
      console.error('✗ Exception adding media asset:', e);
      throw e;
    }
  };

  const deleteMediaAsset = async (id) => {
    try {
      const result = await deleteRecord('media_assets', id);
      if (result.success) {
        console.log('✓ Media asset deleted');
        setTimeout(() => refetchMediaAssets(), 300);
      } else {
        console.error('✗ Failed to delete media asset:', result.error);
      }
    } catch (e) {
      console.error('✗ Exception deleting media asset:', e);
    }
  };

  // Provide context to all child pages
  const contextValue = {
    poems,
    videos,
    mediaAssets,
    comments,
    invites,
    profiles,
    liveSettings,
    notifications,
    counts,
    addPoem, updatePoem, deletePoem,
    addVideo, deleteVideo,
    approveComment, removeComment, clearAllInvites,
    addMediaAsset, deleteMediaAsset,
    formatDate,
    signOut,
    refetchPoems, refetchVideos, refetchMediaAssets, refetchComments, refetchInvites, refetchProfiles, refetchLive, refetchNotifications
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>🔔 {counts.invites + counts.comments}</div>
          </div>
        </div>
        <Outlet />
      </div>
    </DashboardContext.Provider>
  );
}
