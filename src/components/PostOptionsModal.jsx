import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";

const REASONS = [
  "It's spam",
  "I just don't like it",
  "Nudity or sexual activity",
  "Hate speech or symbols",
  "Violence or dangerous organizations",
  "Bullying or harassment",
  "False information",
  "Scam or fraud",
  "Intellectual property violation",
];

// Instagram-style post ⋯ options sheet with the full Report flow:
// menu -> "Why are you reporting this post?" -> "Thanks for your feedback".
export default function PostOptionsModal({ post, isFollowingAuthor, onClose, onShare, onUnfollowed }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("menu"); // menu | report | thanks

  const unfollow = async () => {
    try {
      await api.post(`/users/${post.author.username}/follow`);
      toast.success(`Unfollowed ${post.author.username}`);
      onUnfollowed?.();
    } catch { toast.error("Could not unfollow"); }
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success("Link copied to clipboard");
    } catch { toast.error("Could not copy link"); }
    onClose();
  };

  const block = async () => {
    try {
      await api.post(`/users/${post.author.username}/block`);
      toast.success(`Blocked ${post.author.username}`);
    } catch { toast.error("Could not block"); }
    onClose();
  };

  const Row = ({ children, danger, bold, onClick }) => (
    <button onClick={onClick}
      className={`w-full py-3.5 text-sm text-center border-t border-neutral-700 first:border-t-0 hover:bg-neutral-700/60 transition
                  ${danger ? "text-ig-pink font-bold" : bold ? "font-bold" : ""}`}>
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-neutral-800 w-full max-w-sm rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* ---- step 1: options menu ---- */}
        {step === "menu" && (
          <div>
            <Row danger onClick={() => setStep("report")}>Report</Row>
            {isFollowingAuthor && <Row danger onClick={unfollow}>Unfollow</Row>}
            <Row onClick={() => { toast("Added to favorites"); onClose(); }}>Add to favorites</Row>
            <Row onClick={() => { onClose(); navigate(`/u/${post.author.username}`); }}>About this account</Row>
            <Row onClick={() => { onClose(); navigate(`/post/${post.id}`); }}>Go to post</Row>
            <Row onClick={() => { onClose(); onShare?.(); }}>Share to…</Row>
            <Row onClick={copyLink}>Copy link</Row>
            <Row onClick={() => { toast("Embed — coming soon"); onClose(); }}>Embed</Row>
            <Row onClick={onClose}>Cancel</Row>
          </div>
        )}

        {/* ---- step 2: report reasons ---- */}
        {step === "report" && (
          <div>
            <div className="py-4 text-center border-b border-neutral-700">
              <p className="font-bold">Report</p>
              <p className="text-sm text-gray-300 mt-1">Why are you reporting this post?</p>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              {REASONS.map((r) => (
                <button key={r} onClick={() => setStep("thanks")}
                  className="w-full px-5 py-3.5 text-sm text-left border-t border-neutral-700 first:border-t-0 hover:bg-neutral-700/60 transition">
                  {r}
                </button>
              ))}
            </div>
            <Row onClick={onClose}>Cancel</Row>
          </div>
        )}

        {/* ---- step 3: thanks ---- */}
        {step === "thanks" && (
          <div>
            <div className="px-6 pt-8 pb-6 text-center space-y-4">
              <FiCheckCircle size={52} className="mx-auto text-green-500" />
              <p className="font-bold text-lg">Thanks for your feedback</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                When you see something you don&apos;t like on GenZ, you can report it if it
                doesn&apos;t follow our Community Standards, or you can remove the person who
                shared it from your experience.
              </p>
            </div>
            <Row danger bold onClick={block}>Block {post.author.username}</Row>
            <Row onClick={() => { toast("Community Standards — coming soon"); }}>
              <span className="text-ig-blue">Learn more about our Community Standards</span>
            </Row>
            <Row onClick={onClose}>Close</Row>
          </div>
        )}
      </div>
    </div>
  );
}
