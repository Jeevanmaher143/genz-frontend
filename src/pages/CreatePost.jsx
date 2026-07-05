import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiImage } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function CreatePost() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please choose an image");
    setBusy(true);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("caption", caption);
    try {
      await api.post("/posts", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Posted!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold">Create new post</h2>
          <button onClick={submit} disabled={busy || !file}
            className="text-ig-blue font-semibold text-sm disabled:opacity-40">
            {busy ? "Sharing…" : "Share"}
          </button>
        </div>

        {/* image picker / preview */}
        {preview ? (
          <img src={preview} alt="preview" className="w-full max-h-[460px] object-contain bg-black/5" />
        ) : (
          <button
            onClick={() => fileRef.current.click()}
            className="w-full aspect-square grid place-items-center text-gray-400 hover:bg-neutral-900 transition"
          >
            <div className="text-center">
              <FiImage size={56} className="mx-auto mb-3" />
              <p className="font-medium">Click to select a photo</p>
              <p className="text-xs">PNG, JPG up to 10MB</p>
            </div>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => pick(e.target.files[0])} />

        {/* caption */}
        <form onSubmit={submit} className="p-4 space-y-3">
          {preview && (
            <button type="button" onClick={() => fileRef.current.click()}
              className="text-sm text-ig-blue font-semibold">Change photo</button>
          )}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption…"
            rows={3}
            className="input resize-none"
          />
        </form>
      </div>
    </div>
  );
}
