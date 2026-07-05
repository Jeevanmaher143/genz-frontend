import toast from "react-hot-toast";
import api from "../api/axios";

// Instagram-style destructive confirm sheet for deleting a post/reel.
export default function DeletePostModal({ postId, onClose, onDeleted }) {
  const del = async () => {
    try {
      await api.delete(`/posts/${postId}`);
      toast.success("Post deleted");
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete post");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-neutral-800 w-full max-w-xs rounded-xl overflow-hidden text-center" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5">
          <p className="font-semibold">Delete post?</p>
          <p className="text-gray-400 text-sm mt-1">This can&apos;t be undone.</p>
        </div>
        <button onClick={del} className="w-full py-3 border-t border-neutral-700 text-ig-pink font-semibold">Delete</button>
        <button onClick={onClose} className="w-full py-3 border-t border-neutral-700">Cancel</button>
      </div>
    </div>
  );
}
