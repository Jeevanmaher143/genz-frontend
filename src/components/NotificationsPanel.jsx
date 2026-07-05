import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import api from "../api/axios";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import Spinner from "./Spinner";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "follow", label: "Follows" },
  { key: "comment", label: "Comments" },
  { key: "like", label: "Likes" },
];

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

// bucket a date into Instagram's section headers
function bucket(date) {
  const d = new Date(date);
  const now = new Date();
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const today = startOfDay(now);
  const diffDays = Math.floor((today - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  if (diffDays < 30) return "This month";
  return "Earlier";
}

function message(n) {
  switch (n.type) {
    case "post_like": return "liked your post.";
    case "reel_like": return "liked your reel.";
    case "story_like": return "liked your story.";
    case "comment": return `commented: ${n.text}`;
    case "follow": return "started following you.";
    case "follow_request": return "requested to follow you.";
    default: return "";
  }
}

// Instagram-style notifications drawer (slides out next to the sidebar)
export default function NotificationsPanel({ onClose }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/notifications")
      .then((res) => setItems(res.data.notifications))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        // remember the newest seen so the sidebar dot can clear
        localStorage.setItem("notifsSeenAt", new Date().toISOString());
      });
  }, []);

  const filtered = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "follow") return n.type === "follow" || n.type === "follow_request";
    if (filter === "comment") return n.type === "comment";
    if (filter === "like") return n.type.endsWith("_like");
    return true;
  });

  const respond = async (n, accept) => {
    try {
      if (accept) await api.post(`/users/requests/${n.user.id}/accept`);
      else await api.delete(`/users/requests/${n.user.id}`);
      setItems((list) => list.filter((x) => x.id !== n.id));
    } catch { /* ignore */ }
  };

  // group into ordered sections
  const sections = [];
  for (const n of filtered) {
    const b = bucket(n.createdAt);
    let sec = sections.find((s) => s.title === b);
    if (!sec) { sec = { title: b, items: [] }; sections.push(sec); }
    sec.items.push(n);
  }

  const openTarget = (n) => {
    onClose();
    if (n.type === "comment" || n.type === "post_like") navigate(`/post/${n.post.id}`);
    else if (n.type === "reel_like") navigate("/reels");
    else if (n.type === "follow") navigate(`/u/${n.user.username}`);
  };

  return (
    <>
      {/* click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* drawer */}
      <div className="fixed left-0 md:left-[72px] top-0 z-50 h-screen w-full sm:w-[420px]
                      bg-black border-r border-neutral-800 rounded-r-2xl shadow-2xl shadow-black/70
                      flex flex-col animate-[slideIn_.25s_ease-out]">
        <style>{`@keyframes slideIn { from { transform: translateX(-30px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <button onClick={onClose}><FiX size={24} /></button>
        </div>

        {/* filter chips */}
        <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition ${
                filter === f.key
                  ? "bg-white text-black border-white"
                  : "border-neutral-700 text-white hover:bg-neutral-900"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* list */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          {loading ? <Spinner /> : sections.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">No notifications yet.</p>
          ) : sections.map((sec) => (
            <div key={sec.title}>
              <h3 className="font-bold px-5 py-3 border-t border-neutral-800 first:border-t-0">{sec.title}</h3>
              {sec.items.map((n) => (
                <div key={n.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-neutral-900 transition">
                  <Link to={`/u/${n.user.username}`} onClick={onClose} className="relative shrink-0">
                    <Avatar src={n.user.avatarUrl} username={n.user.username} size={44} />
                    {n.type.endsWith("_like") && (
                      <AiFillHeart className="absolute -bottom-0.5 -right-0.5 text-ig-pink bg-black rounded-full p-[1px]" size={16} />
                    )}
                  </Link>

                  <button onClick={() => openTarget(n)} className="min-w-0 flex-1 text-left text-sm leading-snug">
                    <span className="font-semibold">{n.user.username}</span>{" "}
                    <span className="text-gray-200">{message(n)}</span>{" "}
                    <span className="text-gray-500">{timeAgo(n.createdAt)}</span>
                  </button>

                  {/* right side: thumbnail, follow button, or confirm/delete */}
                  {n.type === "follow_request" ? (
                    <span className="flex gap-2 shrink-0">
                      <button onClick={() => respond(n, true)}
                        className="btn-primary py-1 px-4 text-xs rounded-lg">Confirm</button>
                      <button onClick={() => respond(n, false)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg py-1 px-3">Delete</button>
                    </span>
                  ) : n.type === "follow" ? (
                    <FollowButton username={n.user.username} initial={n.isFollowing} />
                  ) : n.post ? (
                    <button onClick={() => openTarget(n)} className="w-11 h-11 shrink-0 rounded overflow-hidden bg-neutral-800">
                      {n.post.type === "reel"
                        ? <video src={n.post.imageUrl} className="w-full h-full object-cover" muted preload="metadata" />
                        : <img src={n.post.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </button>
                  ) : n.story ? (
                    <div className="w-11 h-11 shrink-0 rounded overflow-hidden bg-neutral-800">
                      <img src={n.story.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
