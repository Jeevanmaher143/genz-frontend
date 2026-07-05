import { useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";

// Instagram-style "Share" sheet: pick recipients (follows/followers or search) and
// send a post into their DMs. The message carries a [post:ID] marker rendered as a preview.
export default function ShareModal({ postId, onClose }) {
  const [people, setPeople] = useState([]);   // default connections
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null); // search results (null = not searching)
  const [selected, setSelected] = useState({}); // id -> user
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("/users/me/connections").then((res) => setPeople(res.data.users)).catch(() => {});
  }, []);

  // debounced search
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults(null); return; }
    const t = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(term)}`)
        .then((res) => setResults(res.data.users)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const toggle = (u) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[u.id]) delete next[u.id];
      else next[u.id] = u;
      return next;
    });
  };

  const send = async () => {
    const ids = Object.keys(selected);
    if (!ids.length) return;
    setSending(true);
    const text = note.trim() ? `[post:${postId}] ${note.trim()}` : `[post:${postId}]`;
    try {
      await Promise.all(ids.map((id) => api.post(`/messages/${id}`, { text })));
      toast.success(ids.length > 1 ? `Sent to ${ids.length} people` : "Sent");
      onClose();
    } catch {
      toast.error("Could not send");
    } finally {
      setSending(false);
    }
  };

  const list = results ?? people;
  const count = Object.keys(selected).length;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-neutral-900 w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <span className="w-6" />
          <h2 className="font-semibold">Share</h2>
          <button onClick={onClose}><FiX size={22} /></button>
        </div>

        {/* search */}
        <div className="p-3 border-b border-neutral-800">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        {/* recipients */}
        <div className="overflow-y-auto flex-1">
          {list.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {results ? "No users found." : "Follow people to share with them."}
            </p>
          ) : list.map((u) => (
            <button key={u.id} onClick={() => toggle(u)}
              className="flex items-center gap-3 w-full px-4 py-2 hover:bg-neutral-800 transition text-left">
              <Avatar src={u.avatarUrl} username={u.username} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{u.username}</p>
                <p className="text-gray-500 text-xs truncate">{u.fullName}</p>
              </div>
              <span className={`w-5 h-5 rounded-full border-2 grid place-items-center ${
                selected[u.id] ? "bg-ig-blue border-ig-blue" : "border-gray-500"
              }`}>
                {selected[u.id] && <span className="w-2 h-2 bg-white rounded-full" />}
              </span>
            </button>
          ))}
        </div>

        {/* note + send */}
        {count > 0 && (
          <div className="p-3 border-t border-neutral-800 space-y-2">
            <input value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Write a message…"
              className="w-full bg-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            <button onClick={send} disabled={sending} className="btn-primary w-full">
              {sending ? "Sending…" : `Send${count > 1 ? ` to ${count}` : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
