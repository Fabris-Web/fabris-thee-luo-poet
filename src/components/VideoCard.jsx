import React from "react";
import { getYouTubeThumb } from "../lib/youtube";
import { formatDate, pickDateField } from "../lib/format";

export default function VideoCard({ video, onOpen }) {
  const thumb =
    getYouTubeThumb(video.youtubeId || video.youtube_url || video.url || "") ||
    "/FLP.jpeg";
  const displayDate = formatDate(pickDateField(video));

  return (
    <article className="list-card">
      <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", gap: 8 }}>
        <h4 style={{ margin: 0 }}>{video.title}</h4>
        <img
          src={thumb}
          alt="thumbnail"
          className="thumbnail"
          onClick={() => onOpen(video)}
          style={{ cursor: "pointer", borderRadius: 8, width: "100%", height: "auto" }}
        />
      </div>
      <div
        className="meta"
        style={{ flex: "1 1 45%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      >
        <small style={{ color: "var(--muted)" }}>{displayDate}</small>
      </div>
    </article>
  );
}
