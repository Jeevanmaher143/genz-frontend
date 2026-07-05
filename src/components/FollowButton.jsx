import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

// Toggleable follow button with private-account support:
// Follow -> (public) Following | (private) Requested -> tap again to cancel.
export default function FollowButton({ username, initial = false, requestedInitial = false, size = "sm", onChange }) {
  const [following, setFollowing] = useState(initial);
  const [requested, setRequested] = useState(requestedInitial);
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/users/${username}/follow`);
      setFollowing(res.data.following);
      setRequested(res.data.requested || false);
      onChange?.(res.data);
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  const pad = size === "sm" ? "py-1 px-4 text-xs" : "py-1.5 px-5 text-sm";
  const label = following ? "Following" : requested ? "Requested" : "Follow";
  const neutral = following || requested;

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        neutral
          ? `bg-neutral-800 text-white font-semibold rounded-lg ${pad} hover:bg-neutral-700 transition disabled:opacity-60`
          : `bg-ig-blue text-white font-semibold rounded-lg ${pad} hover:bg-[#1aa0f7] transition disabled:opacity-60`
      }
    >
      {label}
    </button>
  );
}
