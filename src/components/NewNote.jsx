import { useState } from "react";
import { FiX, FiSmile } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

const MAX = 60;

// Instagram-style "New note" modal.
export default function NewNote({ existing, onClose, onSaved }) {
  const { user } = useAuth();
  const [text, setText] = useState(existing?.text || "");
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post("/notes", { text: text.trim() });
      toast.success("Note shared");
      onSaved?.();
      onClose();
    } catch { toast.error("Could not share note"); } finally { setBusy(false); }
  };

  const remove = async () => {
    try { await api.delete("/notes"); toast.success("Note removed"); onSaved?.(); onClose(); }
    catch { toast.error("Could not remove"); }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-neutral-800 w-full max-w-lg rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="relative flex items-center justify-center px-4 py-4 border-b border-neutral-700">
          <button onClick={onClose} className="absolute left-4"><FiX size={24} /></button>
          <h2 className="font-bold text-lg">New note</h2>
          <button onClick={share} disabled={!text.trim() || busy} className="absolute right-4 text-ig-blue font-semibold disabled:opacity-40">
            Share
          </button>
        </div>

        {/* body */}
        <div className="flex flex-col items-center py-10 gap-4">
          <div className="relative">
            <input
              autoFocus value={text} onChange={(e) => setText(e.target.value.slice(0, MAX))}
              placeholder="Share a thought..."
              className="bg-transparent text-center text-xl placeholder-gray-400 focus:outline-none w-72"
            />
          </div>
          <Avatar src={user?.avatarUrl} username={user?.username} size={110} />
          <button className="w-9 h-9 rounded-full bg-neutral-700 grid place-items-center text-gray-300"><FiSmile /></button>
          <span className="text-xs text-gray-500">{text.length}/{MAX}</span>
        </div>

        {/* footer */}
        <div className="px-4 py-4 border-t border-neutral-700 text-center text-sm text-gray-300">
          👥 Shared with <b className="text-white">followers you follow back</b>
        </div>
        {existing && (
          <button onClick={remove} className="w-full py-3 border-t border-neutral-700 text-ig-pink font-semibold">
            Delete note
          </button>
        )}
      </div>
    </div>
  );
}
