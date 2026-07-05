import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// Renders a shared-post preview inside a chat bubble. `postId` parsed from a [post:ID] marker.
export default function SharedPost({ postId, mine }) {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    api.get(`/posts/${postId}`)
      .then((res) => setPost(res.data.post))
      .catch(() => setGone(true));
  }, [postId]);

  if (gone) return <div className="text-xs italic opacity-70">Post unavailable</div>;
  if (!post) return <div className="w-44 h-44 bg-neutral-700 rounded-lg animate-pulse" />;

  return (
    <button onClick={() => navigate(`/post/${post.id}`)}
      className={`block w-48 rounded-xl overflow-hidden border ${mine ? "border-white/30" : "border-neutral-700"} bg-neutral-900 text-left`}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-xs font-semibold truncate">{post.author.username}</span>
      </div>
      <img src={post.imageUrl} alt="" className="w-full h-44 object-cover" />
      {post.caption && <p className="text-xs px-2 py-1.5 line-clamp-2 text-gray-300">{post.caption}</p>}
    </button>
  );
}
