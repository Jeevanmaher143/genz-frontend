import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { FaRegHeart, FaRegComment } from "react-icons/fa";
import { BsCameraReelsFill } from "react-icons/bs";
import api from "../api/axios";
import Avatar from "../components/Avatar";
import FollowButton from "../components/FollowButton";
import Spinner from "../components/Spinner";

// Combined Search + Explore: a search bar up top, and a mixed posts/reels
// grid below — switches to people-search results while a query is typed.
export default function Explore() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [items, setItems] = useState([]); // posts + reels, merged
  const [loading, setLoading] = useState(true);

  // load the explore grid (posts + reels) once
  useEffect(() => {
    Promise.all([
      api.get("/feed/explore"),
      api.get("/reels"),
    ])
      .then(([postsRes, reelsRes]) => {
        const posts = postsRes.data.posts.map((p) => ({ ...p, kind: "post" }));
        const reels = reelsRes.data.reels.map((r) => ({ ...r, kind: "reel" }));
        const merged = [...posts, ...reels].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setItems(merged);
      })
      .finally(() => setLoading(false));
  }, []);

  // debounced people search
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setUsers([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(term)}`)
        .then((res) => setUsers(res.data.users))
        .catch(() => setUsers([]))
        .finally(() => { setSearching(false); setSearched(true); });
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* search bar */}
      <div className="relative mb-5 max-w-xl mx-auto">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people by name or username"
          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-9 pr-9 py-2.5 text-sm
                     text-white placeholder-gray-500 focus:outline-none focus:border-neutral-500"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <FiX />
          </button>
        )}
      </div>

      {q ? (
        /* ---- search results ---- */
        <div className="max-w-xl mx-auto">
          {searching && <p className="text-gray-500 text-sm text-center py-6">Searching…</p>}
          {!searching && searched && users.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No results for “{q}”.</p>
          )}
          <div className="space-y-1">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900 transition">
                <Link to={`/u/${u.username}`}><Avatar src={u.avatarUrl} username={u.username} size={48} /></Link>
                <Link to={`/u/${u.username}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{u.username}</p>
                  <p className="text-gray-400 text-sm truncate">
                    {u.fullName}
                    {u.followedBy && (
                      <> · Followed by {u.followedBy}{u.followerCount > 1 && ` + ${u.followerCount - 1} more`}</>
                    )}
                  </p>
                </Link>
                <FollowButton username={u.username} initial={u.isFollowing} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ---- explore grid (posts + reels) ---- */
        loading ? <Spinner /> : items.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Nothing to explore yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {items.map((item) => (
              <Link
                key={item.id}
                to={item.kind === "reel" ? "/reels" : `/post/${item.id}`}
                className="relative group aspect-square overflow-hidden bg-neutral-800"
              >
                {item.kind === "reel" ? (
                  <video src={item.imageUrl} className="w-full h-full object-cover" muted preload="metadata" />
                ) : (
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                )}
                {item.kind === "reel" && (
                  <BsCameraReelsFill className="absolute top-2 right-2 text-white drop-shadow" size={18} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition
                                flex items-center justify-center gap-5 text-white font-semibold">
                  <span className="flex items-center gap-1"><FaRegHeart /> {item._count?.likes ?? 0}</span>
                  <span className="flex items-center gap-1"><FaRegComment /> {item._count?.comments ?? 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
