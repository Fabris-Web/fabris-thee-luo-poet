import { useSupabaseQuery } from "../lib/db";

export default function IdentityMark() {
  const fallback = "/profile.svg";
  const { data: profiles = [] } = useSupabaseQuery('profiles');
  const profile = profiles?.[0];
  const imageUrl = profile?.profile_image || fallback;

  const isFallback = imageUrl === fallback;

  return (
    <div className="identity-mark">
      <div className={`crop ${isFallback ? 'crop--avatar' : 'crop--uploaded'}`} aria-hidden>
        <img src={imageUrl} alt={isFallback ? 'avatar' : 'profile image'} className={`identity-img ${isFallback ? 'is-avatar' : 'is-uploaded'}`} />
      </div>
    </div>
  );
}
