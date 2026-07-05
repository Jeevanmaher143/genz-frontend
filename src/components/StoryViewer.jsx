import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiX, FiTrash2, FiSend, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsEye, BsPlayFill, BsPauseFill, BsVolumeMute, BsVolumeUp } from "react-icons/bs";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

const IMAGE_DURATION = 5000;
const isVideo = (url = "") => /\.(mp4|webm|mov|m4v|ogg)$/i.test(url);

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function StoryViewer({ groups, startGroup = 0, onClose }) {
  const { user: me } = useAuth();
  const [gi, setGi] = useState(startGroup);
  const [ii, setIi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reply, setReply] = useState("");
  const [stats, setStats] = useState({ viewCount: 0, likeCount: 0 });
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const videoRef = useRef(null);

  const group = groups[gi];
  const item = group?.items[ii];
  const video = item ? isVideo(item.imageUrl) : false;

  const goClose = useCallback(() => { cancelAnimationFrame(rafRef.current); onClose(); }, [onClose]);

  const next = useCallback(() => {
    if (!group) return goClose();
    if (ii < group.items.length - 1) setIi(ii + 1);
    else if (gi < groups.length - 1) { setGi(gi + 1); setIi(0); }
    else goClose();
  }, [group, ii, gi, groups.length, goClose]);

  const prev = useCallback(() => {
    if (ii > 0) setIi(ii - 1);
    else if (gi > 0) { setGi(gi - 1); setIi(0); }
  }, [ii, gi]);

  const jumpTo = (idx) => { setGi(idx); setIi(0); };

  // progress for images
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    if (video) return;
    startRef.current = performance.now();
    const tick = (now) => {
      if (paused) { startRef.current = now - elapsedRef.current; rafRef.current = requestAnimationFrame(tick); return; }
      elapsedRef.current = now - startRef.current;
      const p = Math.min(1, elapsedRef.current / IMAGE_DURATION);
      setProgress(p);
      if (p >= 1) { next(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, ii, paused, video]);

  // pause/resume video on paused state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") goClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goClose]);

  // mark seen + load like state
  useEffect(() => {
    if (!item) return;
    setShowViewers(false);
    api.post(`/stories/${item.id}/view`)
      .then((res) => { setLiked(res.data.likedByMe); setStats({ viewCount: res.data.viewCount, likeCount: res.data.likeCount }); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, ii]);

  const toggleLike = async () => {
    setLiked((v) => !v);
    try {
      const res = await api.post(`/stories/${item.id}/like`);
      setLiked(res.data.liked);
      setStats((s) => ({ ...s, likeCount: res.data.likeCount }));
    } catch { toast.error("Could not like"); }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text) return;
    setReply("");
    try {
      await api.post(`/messages/${group.author.id}`, { text: `↩️ Replied to your story: ${text}` });
      toast.success("Reply sent");
    } catch { toast.error("Could not send reply"); }
  };

  const openViewers = async () => {
    setPaused(true);
    setShowViewers(true);
    try {
      const res = await api.get(`/stories/${item.id}/viewers`);
      setViewers(res.data.viewers);
      setStats({ viewCount: res.data.viewCount, likeCount: res.data.likeCount });
    } catch { /* ignore */ }
  };

  const onVideoTime = () => {
    const v = videoRef.current;
    if (v && v.duration) setProgress(v.currentTime / v.duration);
  };

  const del = async () => {
    try {
      await api.delete(`/stories/${item.id}`);
      toast.success("Story deleted");
      group.items.splice(ii, 1);
      if (group.items.length === 0 && groups.length <= 1) return goClose();
      next();
    } catch { toast.error("Could not delete"); }
  };

  if (!group || !item) return null;
  const mine = group.author.username === me?.username;

  // adjacent groups for side preview cards
  const SideCard = ({ idx, side }) => {
    const g = groups[idx];
    if (!g) return <div className="w-[150px] hidden lg:block" />;
    const cover = g.items[0];
    return (
      <button onClick={() => jumpTo(idx)}
        className="relative w-[150px] h-[260px] rounded-xl overflow-hidden hidden lg:block opacity-90 hover:opacity-100 transition shrink-0">
        {isVideo(cover.imageUrl)
          ? <video src={cover.imageUrl} className="w-full h-full object-cover" muted />
          : <img src={cover.imageUrl} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
            <div className="p-[2px] bg-black rounded-full">
              <Avatar src={g.author.avatarUrl} username={g.author.username} size={44} />
            </div>
          </div>
          <span className="text-white text-xs font-semibold mt-1">{g.author.username}</span>
          <span className="text-white/70 text-[11px]">{timeAgo(cover.createdAt)}</span>
        </div>
        <span className="sr-only">{side}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center gap-3 px-2">
      <button onClick={goClose} className="absolute top-4 right-4 text-white z-30 p-2"><FiX size={30} /></button>

      {/* left preview */}
      <SideCard idx={gi - 1} side="prev" />

      {/* prev chevron */}
      {gi > 0 && (
        <button onClick={prev} className="hidden lg:grid place-items-center w-8 h-8 rounded-full bg-white/90 text-black shrink-0">
          <FiChevronLeft size={20} />
        </button>
      )}

      {/* center story */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[92vh] sm:rounded-xl overflow-hidden bg-neutral-900 shrink-0"
        onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>

        {/* progress segments */}
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {group.items.map((_, idx) => (
            <div key={idx} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: idx < ii ? "100%" : idx === ii ? `${progress * 100}%` : "0%" }} />
            </div>
          ))}
        </div>

        {/* header */}
        <div className="absolute top-5 left-3 right-3 z-20 flex items-center gap-2 text-white">
          <Avatar src={group.author.avatarUrl} username={group.author.username} size={32} />
          <Link to={`/u/${group.author.username}`} onClick={goClose} className="font-semibold text-sm">{group.author.username}</Link>
          <span className="text-xs text-white/70">{timeAgo(item.createdAt)}</span>
          <div className="ml-auto flex items-center gap-3">
            {video && (
              <button onClick={() => setMuted((m) => !m)}>{muted ? <BsVolumeMute size={20} /> : <BsVolumeUp size={20} />}</button>
            )}
            <button onClick={() => setPaused((p) => !p)}>{paused ? <BsPlayFill size={22} /> : <BsPauseFill size={22} />}</button>
            {mine && <button onClick={del}><FiTrash2 size={18} /></button>}
          </div>
        </div>

        {/* media */}
        {video ? (
          <video ref={videoRef} src={item.imageUrl} className="w-full h-full object-contain bg-black"
            autoPlay playsInline muted={muted} onTimeUpdate={onVideoTime} onEnded={next} />
        ) : (
          <img src={item.imageUrl} alt="" className="w-full h-full object-contain bg-black" />
        )}

        {item.caption && (
          <p className="absolute bottom-20 left-0 right-0 text-center text-white text-sm px-6 drop-shadow">{item.caption}</p>
        )}

        {/* tap zones */}
        <button className="absolute left-0 top-12 bottom-16 w-1/3 z-10" onClick={prev} aria-label="Previous" />
        <button className="absolute right-0 top-12 bottom-16 w-2/3 z-10" onClick={next} aria-label="Next" />

        {/* footer: reply + like + share (others) / viewers (owner) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          {mine ? (
            <button onClick={openViewers} className="flex items-center gap-2 text-white/90 text-sm font-medium px-2 py-1">
              <BsEye size={18} /> {stats.viewCount} viewers · <AiFillHeart className="text-ig-pink" /> {stats.likeCount}
            </button>
          ) : (
            <form onSubmit={sendReply} className="flex items-center gap-3"
              onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
              <input
                value={reply} onChange={(e) => setReply(e.target.value)}
                onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
                placeholder={`Reply to ${group.author.username}…`}
                className="flex-1 bg-transparent border border-white/50 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/70 focus:outline-none"
              />
              <button type="button" onClick={toggleLike} className="text-white active:scale-90 transition">
                {liked ? <AiFillHeart size={26} className="text-ig-pink" /> : <AiOutlineHeart size={26} />}
              </button>
              <button type="submit" className="text-white active:scale-90 transition" title="Send">
                <FiSend size={24} />
              </button>
            </form>
          )}
        </div>

        {/* viewers list (owner) */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 z-30 bg-neutral-900 rounded-t-2xl max-h-[60%] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 sticky top-0 bg-neutral-900">
              <span className="font-semibold text-sm">{stats.viewCount} viewers</span>
              <button onClick={() => { setShowViewers(false); setPaused(false); }}><FiX size={22} /></button>
            </div>
            {viewers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No viewers yet.</p>
            ) : viewers.map((v) => (
              <Link key={v.user.id} to={`/u/${v.user.username}`} onClick={goClose}
                className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-800">
                <Avatar src={v.user.avatarUrl} username={v.user.username} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{v.user.username}</p>
                  <p className="text-gray-500 text-xs truncate">{v.user.fullName}</p>
                </div>
                {v.liked && <AiFillHeart className="text-ig-pink" size={18} />}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* next chevron */}
      {gi < groups.length - 1 && (
        <button onClick={next} className="hidden lg:grid place-items-center w-8 h-8 rounded-full bg-white/90 text-black shrink-0">
          <FiChevronRight size={20} />
        </button>
      )}

      {/* right previews */}
      <SideCard idx={gi + 1} side="next" />
      <SideCard idx={gi + 2} side="next2" />
    </div>
  );
}
