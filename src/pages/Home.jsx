import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import StoriesBar from "../components/StoriesBar";
import Suggestions from "../components/Suggestions";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/feed")
      .then((res) => setPosts(res.data.posts))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 justify-center">
      {/* Feed column */}
      <div className="max-w-[470px] w-full mx-auto">
        <StoriesBar />

        {posts.length === 0 ? (
          <div className="card p-10 text-center mt-4">
            <h2 className="text-lg font-semibold mb-1">Your feed is empty</h2>
            <p className="text-gray-400 text-sm mb-4">
              Follow people or create your first post to get started.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/explore" className="btn-primary">Explore</Link>
              <Link to="/create" className="font-semibold text-ig-blue py-2 px-4">Create post</Link>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block pt-2">
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/u/${user?.username}`}>
            <Avatar src={user?.avatarUrl} username={user?.username} size={54} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/u/${user?.username}`} className="font-semibold text-sm block truncate">
              {user?.username}
            </Link>
            <p className="text-gray-400 text-sm truncate">{user?.fullName}</p>
          </div>
          <Link to="/login" className="text-ig-blue text-xs font-semibold shrink-0">Switch</Link>
        </div>

        <Suggestions />

        {/* footer links, Instagram style */}
        <div className="text-xs text-gray-600 leading-relaxed mt-8 space-y-3">
          <p>
            {["About", "Help", "Press", "API", "Jobs", "Privacy", "Terms", "Locations", "Language", "GenZ Verified"].map((l, i) => (
              <span key={l}>{i > 0 && " · "}{l}</span>
            ))}
          </p>
          <p className="uppercase">© {new Date().getFullYear()} GenZ from GenZ Labs</p>
        </div>
      </aside>
    </div>
  );
}
