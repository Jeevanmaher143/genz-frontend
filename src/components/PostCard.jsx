import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { FiSend, FiBookmark, FiMoreHorizontal } from "react-icons/fi";
import { BsBookmarkFill } from "react-icons/bs";
import { useSaved } from "../context/SavedContext";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";
import ShareModal from "./ShareModal";
import DeletePostModal from "./DeletePostModal";
import PostOptionsModal from "./PostOptionsModal";
import { useAuth } from "../context/AuthContext";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likedByMe || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMine = post.author.username === user?.username;

  const toggleLike = async () => {
    // optimistic update
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch {
      toast.error("Could not update like");
    }
  };

  const loadComments = async () => {
    if (!showComments && comments.length === 0) {
      try {
        const res = await api.get(`/posts/${post.id}/comments`);
        setComments(res.data.comments);
      } catch { /* ignore */ }
    }
    setShowComments((v) => !v);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { text });
      setComments((c) => [...c, res.data.comment]);
      setText("");
      setShowComments(true);
    } catch {
      toast.error("Could not post comment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card overflow-hidden mb-6">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/u/${post.author.username}`}>
          <Avatar src={post.author.avatarUrl} username={post.author.username} size={36} ring />
        </Link>
        <Link to={`/u/${post.author.username}`} className="font-semibold text-sm hover:underline">
          {post.author.username}
        </Link>
        <span className="text-gray-400 text-xs ml-auto">{timeAgo(post.createdAt)}</span>
        {isMine ? (
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="p-1"><FiMoreHorizontal /></button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-neutral-800 rounded-lg shadow-xl w-40 overflow-hidden border border-neutral-700">
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-ig-pink font-semibold hover:bg-neutral-700"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => setOptionsOpen(true)} className="p-1"><FiMoreHorizontal /></button>
        )}
      </div>

      {/* image */}
      <div className="bg-black/5">
        <img src={post.imageUrl} alt={post.caption || "post"} className="w-full max-h-[600px] object-cover" />
      </div>

      {/* actions */}
      <div className="px-4 pt-3 flex items-center gap-4 text-2xl">
        <button onClick={toggleLike} className="active:scale-90 transition">
          {liked ? <AiFillHeart className="text-ig-pink" /> : <AiOutlineHeart />}
        </button>
        <button onClick={loadComments} className="active:scale-90 transition"><FaRegComment /></button>
        <button onClick={() => setSharing(true)} className="active:scale-90 transition" title="Share"><FiSend /></button>
        <button onClick={() => toggleSave(post.id)} className="ml-auto active:scale-90 transition" title="Save">
          {isSaved(post.id) ? <BsBookmarkFill /> : <FiBookmark />}
        </button>
      </div>

      {/* likes + caption */}
      <div className="px-4 pt-2 pb-3 space-y-1">
        <p className="font-semibold text-sm">{likeCount.toLocaleString()} likes</p>
        {post.caption && (
          <p className="text-sm">
            <Link to={`/u/${post.author.username}`} className="font-semibold mr-1">{post.author.username}</Link>
            {post.caption}
          </p>
        )}
        {(post._count?.comments > 0 || comments.length > 0) && (
          <button onClick={loadComments} className="text-gray-400 text-sm">
            {showComments ? "Hide comments" : `View all ${post._count?.comments ?? comments.length} comments`}
          </button>
        )}

        {showComments && (
          <div className="space-y-1 pt-1">
            {comments.map((c) => (
              <p key={c.id} className="text-sm">
                <Link to={`/u/${c.author.username}`} className="font-semibold mr-1">{c.author.username}</Link>
                {c.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* add comment */}
      <form onSubmit={addComment} className="flex items-center border-t border-neutral-800 px-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 py-3 text-sm focus:outline-none bg-transparent"
        />
        <button disabled={!text.trim() || busy} className="text-ig-blue font-semibold text-sm disabled:opacity-40">
          Post
        </button>
      </form>
      {sharing && <ShareModal postId={post.id} onClose={() => setSharing(false)} />}
      {optionsOpen && (
        <PostOptionsModal
          post={post}
          isFollowingAuthor
          onClose={() => setOptionsOpen(false)}
          onShare={() => setSharing(true)}
        />
      )}
      {confirmDelete && (
        <DeletePostModal
          postId={post.id}
          onClose={() => setConfirmDelete(false)}
          onDeleted={() => (onDeleted ? onDeleted(post.id) : navigate(-1))}
        />
      )}
    </article>
  );
}
