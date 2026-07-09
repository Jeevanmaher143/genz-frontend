import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { FiSend, FiBookmark, FiX, FiMoreHorizontal } from "react-icons/fi";
import { BsBookmarkFill } from "react-icons/bs";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";
import ShareModal from "./ShareModal";
import { useAuth } from "../context/AuthContext";
import { useSaved } from "../context/SavedContext";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

// Instagram-style post popup: media on the left, comments on the right,
// with a working add-comment box. Reuses the existing post/comment APIs.
export default function PostModal({ post, onClose, onCommentAdded }) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [sharing, setSharing] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    api.get(`/posts/${post.id}/comments`)
      .then((res) => setComments(res.data.comments))
      .finally(() => setLoading(false));
  }, [post.id]);

  const toggleLike = async () => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setLiked(res.data.liked); setLikeCount(res.data.likeCount);
    } catch { toast.error("Could not update like"); }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { text });
      setComments((c) => [...c, res.data.comment]);
      setText("");
      onCommentAdded?.();
      // scroll to newest
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    } catch { toast.error("Could not post comment"); }
    finally { setBusy(false); }
  };

  const isReel = post.type === "reel";

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white z-20"><FiX size={28} /></button>

      <div
        className="bg-black w-full h-full md:h-[88vh] md:max-w-4xl md:rounded-xl overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* media */}
        <div className="bg-black flex items-center justify-center md:flex-1 shrink-0">
          {isReel
            ? <video src={post.imageUrl} className="w-full max-h-[45vh] md:max-h-full object-contain" controls autoPlay loop muted />
            : <img src={post.imageUrl} alt="" className="w-full max-h-[45vh] md:max-h-full object-contain" />}
        </div>

        {/* right panel */}
        <div className="flex flex-col md:w-[405px] md:shrink-0 flex-1 min-h-0 border-l border-neutral-800">
          {/* header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
            <Link to={`/u/${post.author.username}`} onClick={onClose}>
              <Avatar src={post.author.avatarUrl} username={post.author.username} size={34} ring />
            </Link>
            <Link to={`/u/${post.author.username}`} onClick={onClose} className="font-semibold text-sm">{post.author.username}</Link>
            <FiMoreHorizontal className="ml-auto" />
          </div>

          {/* comments (+ caption pinned first) */}
          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
            {post.caption && (
              <div className="flex gap-3">
                <Avatar src={post.author.avatarUrl} username={post.author.username} size={34} />
                <p className="text-sm">
                  <Link to={`/u/${post.author.username}`} onClick={onClose} className="font-semibold mr-2">{post.author.username}</Link>
                  {post.caption}
                </p>
              </div>
            )}
            {loading ? (
              <p className="text-gray-500 text-sm text-center py-6">Loading comments…</p>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-10">No comments yet. Start the conversation.</p>
            ) : comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link to={`/u/${c.author.username}`} onClick={onClose}>
                  <Avatar src={c.author.avatarUrl} username={c.author.username} size={34} />
                </Link>
                <div className="min-w-0">
                  <p className="text-sm">
                    <Link to={`/u/${c.author.username}`} onClick={onClose} className="font-semibold mr-2">{c.author.username}</Link>
                    {c.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{timeAgo(c.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* actions + likes */}
          <div className="border-t border-neutral-800 px-4 pt-3">
            <div className="flex items-center gap-4 text-2xl">
              <button onClick={toggleLike} className="active:scale-90 transition">
                {liked ? <AiFillHeart className="text-ig-pink" /> : <AiOutlineHeart />}
              </button>
              <FaRegComment />
              <button onClick={() => setSharing(true)} className="active:scale-90 transition"><FiSend /></button>
              <button onClick={() => toggleSave(post.id)} className="ml-auto active:scale-90 transition">
                {isSaved(post.id) ? <BsBookmarkFill /> : <FiBookmark />}
              </button>
            </div>
            <p className="font-semibold text-sm mt-2">{likeCount.toLocaleString()} likes</p>
            <p className="text-[11px] text-gray-500 uppercase mb-2">{timeAgo(post.createdAt)} ago</p>
          </div>

          {/* add comment */}
          <form onSubmit={addComment} className="flex items-center gap-2 border-t border-neutral-800 px-4 py-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…"
              className="flex-1 bg-transparent text-sm py-2 focus:outline-none" />
            <button disabled={!text.trim() || busy} className="text-ig-blue font-semibold text-sm disabled:opacity-40">Post</button>
          </form>
        </div>
      </div>

      {sharing && <ShareModal postId={post.id} onClose={() => setSharing(false)} />}
    </div>
  );
}
