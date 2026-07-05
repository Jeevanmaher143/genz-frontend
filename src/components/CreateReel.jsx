import { useRef, useState } from "react";
import { FiArrowLeft, FiX, FiMapPin, FiSmile, FiChevronDown, FiChevronUp, FiUserPlus } from "react-icons/fi";
import { BsCameraReels } from "react-icons/bs";
import { FaUserTag } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

const MAX = 2200;

export default function CreateReel({ onClose, onCreated }) {
  const { user } = useAuth();
  const fileRef = useRef();
  const [step, setStep] = useState("select"); // select | edit
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [shareFb, setShareFb] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const pick = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) return toast.error("Please select a video");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep("edit");
  };

  const tryClose = () => {
    if (step === "edit" && (file || caption)) setConfirmDiscard(true);
    else onClose();
  };

  const share = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("video", file);
    // location/alt are appended to the caption (backend stores caption only for now)
    let cap = caption.trim();
    if (location.trim()) cap += `\n📍 ${location.trim()}`;
    fd.append("caption", cap);
    try {
      await api.post("/reels", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Reel shared!");
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-2 sm:p-6">
      <button onClick={tryClose} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><FiX size={28} /></button>

      <div className="bg-neutral-900 rounded-xl overflow-hidden w-full max-w-[420px] md:max-w-[860px] h-[92vh] md:h-[640px] flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <button onClick={step === "edit" ? tryClose : onClose} className="text-white">
            <FiArrowLeft size={22} />
          </button>
          <span className="font-semibold">{step === "select" ? "Create new reel" : "New reel"}</span>
          {step === "edit" ? (
            <button onClick={share} disabled={uploading} className="text-ig-blue font-semibold disabled:opacity-50">
              {uploading ? "Sharing…" : "Share"}
            </button>
          ) : <span className="w-12" />}
        </div>

        {/* body */}
        {step === "select" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <BsCameraReels size={72} className="text-gray-200" />
            <p className="text-lg">Drag photos and videos here</p>
            <button onClick={() => fileRef.current.click()} className="btn-primary">Select from computer</button>
          </div>
        ) : (
          <div className="flex-1 grid md:grid-cols-[1fr_340px] min-h-0">
            {/* video preview */}
            <div className="relative bg-black grid place-items-center min-h-0">
              <video src={preview} className="max-h-full max-w-full object-contain" controls playsInline />
              <button onClick={() => toast("Tag people — coming soon")}
                className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 text-sm">
                <FaUserTag /> Tag people
              </button>
            </div>

            {/* right panel */}
            <div className="border-t md:border-t-0 md:border-l border-neutral-800 overflow-y-auto">
              {/* author */}
              <div className="flex items-center gap-2 px-4 py-3">
                <Avatar src={user?.avatarUrl} username={user?.username} size={30} />
                <span className="font-semibold text-sm">{user?.username}</span>
              </div>

              {/* caption */}
              <div className="px-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, MAX))}
                  placeholder="Write a caption…"
                  rows={5}
                  className="w-full bg-transparent text-sm resize-none focus:outline-none"
                />
                <div className="flex items-center justify-between text-gray-500 pb-2 border-b border-neutral-800">
                  <FiSmile />
                  <span className="text-xs">{caption.length}/{MAX.toLocaleString()}</span>
                </div>
              </div>

              {/* add location */}
              <div className="px-4 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location"
                    className="flex-1 bg-transparent text-sm focus:outline-none" />
                  <FiMapPin className="text-gray-400" />
                </div>
              </div>

              {/* add collaborators (decorative) */}
              <button onClick={() => toast("Collaborators — coming soon")}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-neutral-800 text-sm">
                Add collaborators <FiUserPlus className="text-gray-400" />
              </button>

              {/* share to (decorative) */}
              <div className="px-4 py-3 border-b border-neutral-800">
                <p className="font-semibold text-sm mb-2">Share to</p>
                <div className="flex items-center gap-2">
                  <Avatar username={user?.username} size={28} />
                  <div className="flex-1">
                    <p className="text-sm">{user?.fullName || user?.username}</p>
                    <p className="text-xs text-gray-500">Facebook · Friends</p>
                  </div>
                  <button onClick={() => setShareFb((v) => !v)}
                    className={`w-10 h-6 rounded-full transition relative ${shareFb ? "bg-ig-blue" : "bg-neutral-600"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${shareFb ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>

              {/* accessibility (collapsible) */}
              <div className="px-4 py-3 border-b border-neutral-800">
                <button onClick={() => setAccOpen((v) => !v)} className="w-full flex items-center justify-between font-semibold text-sm">
                  Accessibility {accOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {accOpen && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500">Alt text describes your reel for people with visual impairments.</p>
                    <input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Write alt text…"
                      className="w-full bg-neutral-800 rounded px-3 py-2 text-sm focus:outline-none" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files[0])} />
      </div>

      {/* discard confirm */}
      {confirmDiscard && (
        <div className="fixed inset-0 z-[90] bg-black/60 grid place-items-center" onClick={() => setConfirmDiscard(false)}>
          <div className="bg-neutral-800 rounded-xl w-72 text-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5">
              <p className="font-semibold">Discard reel?</p>
              <p className="text-gray-400 text-sm mt-1">If you leave, your edits won&apos;t be saved.</p>
            </div>
            <button onClick={onClose} className="w-full py-3 border-t border-neutral-700 text-ig-pink font-semibold">Discard</button>
            <button onClick={() => setConfirmDiscard(false)} className="w-full py-3 border-t border-neutral-700">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
