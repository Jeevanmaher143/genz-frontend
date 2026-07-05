import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaCommentDots } from "react-icons/fa";
import { FiSend, FiBookmark, FiMoreHorizontal, FiVolume2, FiVolumeX, FiPlus, FiChevronUp, FiChevronDown, FiMapPin } from "react-icons/fi";
import { RiMessengerLine } from "react-icons/ri";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import CommentsDrawer from "../components/CommentsDrawer";
import ShareModal from "../components/ShareModal";
import CreateReel from "../components/CreateReel";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessagesContext";
import { useSaved } from "../context/SavedContext";
import { BsBookmarkFill } from "react-icons/bs";

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true); // start muted so autoplay works; tap to unmute
  const [commentFor, setCommentFor] = useState(null);
  const [shareFor, setShareFor] = useState(null);
  const { unread, recent } = useMessages();
  const scrollRef = useRef();
  const [creating, setCreating] = useState(false);

  const load = () => {
    api.get("/reels").then((res) => setReels(res.data.reels)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // scroll one reel up/down (arrow buttons)
  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ top: dir * el.clientHeight, behavior: "smooth" });
  };

  if (loading) return <Spinner />;

  return (
    <div className="relative h-[calc(100dvh-3rem)] md:h-screen">
      {/* upload button → opens the New reel modal */}
      <button onClick={() => setCreating(true)}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-sm font-semibold">
        <FiPlus /> Reel
      </button>

      {reels.length === 0 ? (
        <div className="h-full grid place-items-center text-gray-400">No reels yet. Upload one!</div>
      ) : (
        <div ref={scrollRef} className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
          {reels.map((r) => (
            <ReelItem key={r.id} reel={r} muted={muted} setMuted={setMuted}
              onComment={() => setCommentFor(r)} onShare={() => setShareFor(r.id)} />
          ))}
        </div>
      )}

      {/* up/down navigation arrows (desktop) */}
      {reels.length > 1 && (
        <div className="hidden md:flex flex-col gap-3 absolute right-5 top-1/2 -translate-y-1/2 z-20">
          <button onClick={() => scrollBy(-1)} className="w-10 h-10 grid place-items-center rounded-full bg-neutral-800/90 hover:bg-neutral-700">
            <FiChevronUp size={20} />
          </button>
          <button onClick={() => scrollBy(1)} className="w-10 h-10 grid place-items-center rounded-full bg-neutral-800/90 hover:bg-neutral-700">
            <FiChevronDown size={20} />
          </button>
        </div>
      )}

      {/* floating Messages quick button (bottom-right) — shows recent avatars + unread count */}
      <Link to="/messages"
        className="hidden md:flex items-center gap-2 absolute bottom-5 right-5 z-20 bg-neutral-800/90 hover:bg-neutral-700 rounded-full pl-4 pr-2 py-2 font-semibold text-sm shadow-lg">
        <RiMessengerLine size={20} />
        <span>Messages</span>
        {unread > 0 && (
          <span className="bg-ig-pink text-white text-[11px] font-bold min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        {recent.length > 0 && (
          <span className="flex -space-x-2 ml-1">
            {recent.map((u) => (
              <span key={u.id} className="ring-2 ring-neutral-800 rounded-full">
                <Avatar src={u.avatarUrl} username={u.username} size={24} />
              </span>
            ))}
          </span>
        )}
      </Link>

      {commentFor && (
        <CommentsDrawer postId={commentFor.id} onClose={() => setCommentFor(null)} />
      )}
      {shareFor && <ShareModal postId={shareFor} onClose={() => setShareFor(null)} />}
      {creating && <CreateReel onClose={() => setCreating(false)} onCreated={load} />}
    </div>
  );
}

// pull a "📍 location" line out of the caption (CreateReel appends it there)
function splitCaption(caption) {
  const lines = (caption || "").split("\n");
  const locLine = lines.find((l) => l.trim().startsWith("📍"));
  const location = locLine ? locLine.replace("📍", "").trim() : null;
  const text = lines.filter((l) => !l.trim().startsWith("📍")).join("\n").trim();
  return { location, text };
}

function ReelItem({ reel, muted, setMuted, onComment, onShare }) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const vidRef = useRef();
  const wrapRef = useRef();
  const [liked, setLiked] = useState(reel.likedByMe);
  const [likeCount, setLikeCount] = useState(reel._count?.likes ?? 0);
  const [playing, setPlaying] = useState(true);
  const [following, setFollowing] = useState(reel.authorFollowed || false);
  const [expanded, setExpanded] = useState(false);
  const isMe = reel.author.username === user?.username;
  const { location, text } = splitCaption(reel.caption);

  const toggleFollow = async () => {
    setFollowing((v) => !v); // optimistic
    try {
      const res = await api.post(`/users/${reel.author.username}/follow`);
      setFollowing(res.data.following);
    } catch { setFollowing((v) => !v); }
  };

  // autoplay only when this reel is in view
  useEffect(() => {
    const v = vidRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!v) return;
        if (entry.isIntersecting) { v.play().catch(() => {}); setPlaying(true); }
        else { v.pause(); v.currentTime = 0; }
      },
      { threshold: 0.6 }
    );
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => io.disconnect();
  }, []);

  const togglePlay = () => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const like = async () => {
    setLiked((x) => !x);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      const res = await api.post(`/posts/${reel.id}/like`);
      setLiked(res.data.liked); setLikeCount(res.data.likeCount);
    } catch { /* ignore */ }
  };

  const Action = ({ icon, label, onClick, active }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <span className={`text-3xl ${active ? "text-ig-pink" : "text-white"}`}>{icon}</span>
      {label != null && <span className="text-xs text-white">{label}</span>}
    </button>
  );

  // author + caption block (shared by desktop side column & mobile overlay)
  const Info = (
    <>
      <div className="flex items-center gap-2">
        <Avatar src={reel.author.avatarUrl} username={reel.author.username} size={36} ring />
        <Link to={`/u/${reel.author.username}`} className="font-semibold text-sm drop-shadow">{reel.author.username}</Link>
        {!isMe && (
          <button onClick={toggleFollow} className="text-sm font-semibold drop-shadow">
            <span className="text-white/70">•</span>{" "}
            <span className={following ? "text-white/80" : "text-ig-blue"}>{following ? "Following" : "Follow"}</span>
          </button>
        )}
      </div>
      {location && (
        <div className="flex items-center gap-1 text-xs mt-1 drop-shadow">
          <FiMapPin size={12} /> {location}
        </div>
      )}
      {text && (
        <p className={`text-sm mt-2 drop-shadow whitespace-pre-line ${expanded ? "" : "line-clamp-2"}`}>
          {text}
          {!expanded && text.length > 80 && (
            <button onClick={() => setExpanded(true)} className="text-white/70 ml-1 font-semibold">… more</button>
          )}
        </p>
      )}
    </>
  );

  return (
    <div ref={wrapRef} className="h-full snap-start flex items-center justify-center py-4">
      {/* video — always dead-center; info/rail hang off its sides */}
      <div className="relative h-full w-full max-w-[420px] flex items-center shrink-0">
        {/* info column — anchored to the LEFT of the video, bottom-aligned (desktop) */}
        <div className="hidden md:block absolute right-full mr-6 bottom-6 w-[300px] text-white">
          {Info}
        </div>

        {/* action rail — anchored to the RIGHT of the video, bottom-aligned (desktop) */}
        <div className="hidden md:flex absolute left-full ml-5 bottom-6 flex-col items-center gap-5">
          <Action icon={liked ? <AiFillHeart /> : <AiOutlineHeart />} active={liked} label={likeCount} onClick={like} />
          <Action icon={<FaCommentDots />} label={reel._count?.comments ?? 0} onClick={onComment} />
          <Action icon={<FiSend />} onClick={onShare} />
          <Action icon={isSaved(reel.id) ? <BsBookmarkFill /> : <FiBookmark />} onClick={() => toggleSave(reel.id)} />
          <Action icon={<FiMoreHorizontal />} onClick={() => {}} />
          <Link to={`/u/${reel.author.username}`} className="mt-1 w-8 h-8 rounded-lg overflow-hidden border-2 border-white/70">
            <Avatar src={reel.author.avatarUrl} username={reel.author.username} size={28} />
          </Link>
        </div>
        <video
          ref={vidRef}
          src={reel.imageUrl}
          className="w-full max-h-full object-contain bg-black mx-auto rounded-lg"
          loop playsInline muted={muted}
          onClick={togglePlay}
        />

        {/* mute toggle */}
        <button onClick={() => setMuted((m) => !m)} className="absolute top-4 left-4 bg-black/50 rounded-full p-2">
          {muted ? <FiVolumeX className="text-white" /> : <FiVolume2 className="text-white" />}
        </button>

        {!playing && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/40 grid place-items-center text-white text-3xl">▶</div>
          </div>
        )}

        {/* mobile: info overlaid on the video (no side columns) */}
        <div className="md:hidden absolute bottom-4 left-3 right-16 text-white">
          {Info}
        </div>

        {/* mobile: action rail overlaid on the right edge of the video */}
        <div className="md:hidden absolute right-2 bottom-6 flex flex-col items-center gap-5">
          <Action icon={liked ? <AiFillHeart /> : <AiOutlineHeart />} active={liked} label={likeCount} onClick={like} />
          <Action icon={<FaCommentDots />} label={reel._count?.comments ?? 0} onClick={onComment} />
          <Action icon={<FiSend />} onClick={onShare} />
          <Action icon={isSaved(reel.id) ? <BsBookmarkFill /> : <FiBookmark />} onClick={() => toggleSave(reel.id)} />
        </div>
      </div>
    </div>
  );
}
