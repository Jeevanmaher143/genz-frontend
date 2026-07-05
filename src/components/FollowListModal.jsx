import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiX, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import { useAuth } from "../context/AuthContext";

// Instagram-style followers/following modal.
// type: "followers" | "following"; isMe enables Remove on the followers list.
export default function FollowListModal({ username, type, isMe, onClose, onChanged }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}/${type}`)
      .then((res) => setUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, type]);

  const remove = async (u) => {
    try {
      await api.delete(`/users/followers/${u.id}`);
      setUsers((list) => list.filter((x) => x.id !== u.id));
      onChanged?.();
      toast.success(`Removed ${u.username}`);
    } catch { toast.error("Could not remove"); }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(q.toLowerCase()) ||
    (u.fullName || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-neutral-900 w-full max-w-md rounded-xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="relative flex items-center justify-center px-4 py-3 border-b border-neutral-800">
          <h2 className="font-semibold capitalize">{type}</h2>
          <button onClick={onClose} className="absolute right-3"><FiX size={22} /></button>
        </div>

        {/* search */}
        <div className="p-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
              className="w-full bg-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        {/* list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {q ? "No results." : type === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          ) : filtered.map((u) => {
            const mine = u.username === me?.username;
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2">
                <Link to={`/u/${u.username}`} onClick={onClose}>
                  <Avatar src={u.avatarUrl} username={u.username} size={44} />
                </Link>
                <Link to={`/u/${u.username}`} onClick={onClose} className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{u.username}</p>
                  <p className="text-gray-400 text-sm truncate">{u.fullName}</p>
                </Link>
                {!mine && <FollowButton username={u.username} initial={u.isFollowing} />}
                {isMe && type === "followers" && (
                  <button onClick={() => remove(u)}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-semibold rounded-lg py-1.5 px-3">
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
