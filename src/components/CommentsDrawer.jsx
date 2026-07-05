import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiX } from "react-icons/fi";
import api from "../api/axios";
import Avatar from "./Avatar";

// Slide-up comments panel for a post/reel (reuses /posts/:id/comments).
export default function CommentsDrawer({ postId, onClose, onCount }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/posts/${postId}/comments`).then((res) => setComments(res.data.comments)).catch(() => {});
  }, [postId]);

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { text });
      setComments((c) => [...c, res.data.comment]);
      setText("");
      onCount?.(comments.length + 1);
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-neutral-900 w-full sm:max-w-md h-[70vh] sm:h-[80vh] sm:rounded-2xl rounded-t-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <span className="font-semibold">Comments</span>
          <button onClick={onClose}><FiX size={22} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">No comments yet. Be the first!</p>
          ) : comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar src={c.author.avatarUrl} username={c.author.username} size={36} />
              <p className="text-sm">
                <Link to={`/u/${c.author.username}`} className="font-semibold mr-1">{c.author.username}</Link>
                {c.text}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={add} className="flex items-center gap-2 border-t border-neutral-800 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…"
            className="flex-1 bg-transparent text-sm focus:outline-none" />
          <button disabled={!text.trim() || busy} className="text-ig-blue font-semibold text-sm disabled:opacity-40">Post</button>
        </form>
      </div>
    </div>
  );
}
