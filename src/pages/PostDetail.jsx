import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import Spinner from "../components/Spinner";

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then((res) => setPost(res.data.post))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!post) return <p className="text-center text-gray-400 py-10">Post not found.</p>;

  return (
    <div className="max-w-xl mx-auto">
      <PostCard post={post} />
    </div>
  );
}
