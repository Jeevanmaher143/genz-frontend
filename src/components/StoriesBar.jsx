import { useEffect, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StoryViewer from "./StoryViewer";

export default function StoriesBar() {
  const { user } = useAuth();
  const [myGroup, setMyGroup] = useState(null);
  const [others, setOthers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState(null); // { groups, startGroup }
  const [pendingFile, setPendingFile] = useState(null); // chosen file awaiting audience choice
  const fileRef = useRef();

  const load = () => {
    api.get("/feed/stories")
      .then((res) => {
        const groups = res.data.stories;
        setMyGroup(groups.find((g) => g.author.username === user?.username) || null);
        setOthers(groups.filter((g) => g.author.username !== user?.username));
      })
      .catch(() => {});
  };

  useEffect(() => { load(); }, [user]);

  const uploadStory = async (closeOnly) => {
    const file = pendingFile;
    setPendingFile(null);
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("media", file);
    fd.append("closeOnly", closeOnly ? "true" : "false");
    try {
      await api.post("/stories", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(closeOnly ? "Shared with close friends!" : "Story added!");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add story");
    } finally {
      setUploading(false);
    }
  };

  // ordered list the viewer cycles through: my stories first, then others
  const ordered = [...(myGroup ? [myGroup] : []), ...others];

  const openViewer = (startGroup) => setViewer({ groups: ordered, startGroup });

  const Ring = ({ avatarUrl, username, label, onClick, add, seen }) => (
    <button onClick={onClick} disabled={uploading} className="flex flex-col items-center gap-1 shrink-0 w-16">
      <div className="relative">
        <div className={`p-[2px] rounded-full ${
          add ? "" : seen ? "bg-neutral-700" : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
        }`}>
          <div className="p-[2px] bg-black rounded-full">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-ig-pink to-ig-blue grid place-items-center text-white font-semibold border border-neutral-800">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : <span>{username?.[0]?.toUpperCase()}</span>}
            </div>
          </div>
        </div>
        {add && (
          <span className="absolute bottom-0 right-0 bg-ig-blue rounded-full p-0.5 border-2 border-black">
            <FiPlus size={12} className="text-white" />
          </span>
        )}
      </div>
      <span className="text-[11px] truncate w-full text-center text-gray-300">{label}</span>
    </button>
  );

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-3 sm:px-0 pt-4 pb-4 mb-2 border-b border-neutral-800 no-scrollbar">
        {/* Your story: tap opens your stories if any, else upload. The + always uploads. */}
        <Ring
          avatarUrl={user?.avatarUrl}
          username={user?.username}
          label={uploading ? "Adding…" : "Your story"}
          add={!myGroup}
          onClick={() => (myGroup ? openViewer(0) : fileRef.current.click())}
        />
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden
          onChange={(e) => { if (e.target.files[0]) setPendingFile(e.target.files[0]); e.target.value = ""; }} />

        {others.map((g, idx) => (
          <Ring
            key={g.author.id}
            avatarUrl={g.author.avatarUrl}
            username={g.author.username}
            label={g.author.username}
            onClick={() => openViewer((myGroup ? 1 : 0) + idx)}
          />
        ))}
      </div>

      {viewer && (
        <StoryViewer
          groups={viewer.groups}
          startGroup={viewer.startGroup}
          onClose={() => { setViewer(null); load(); }}
        />
      )}

      {/* audience choice after picking a file */}
      {pendingFile && (
        <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4" onClick={() => setPendingFile(null)}>
          <div className="bg-neutral-800 w-full max-w-xs rounded-2xl overflow-hidden text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold py-4 border-b border-neutral-700">Share story to…</p>
            <button onClick={() => uploadStory(false)} className="w-full py-3.5 hover:bg-neutral-700 transition font-semibold">
              Your story <span className="block text-xs text-gray-400 font-normal">Everyone can see</span>
            </button>
            <button onClick={() => uploadStory(true)} className="w-full py-3.5 border-t border-neutral-700 hover:bg-neutral-700 transition font-semibold text-green-500">
              ⭐ Close friends <span className="block text-xs text-gray-400 font-normal">Only your close friends</span>
            </button>
            <button onClick={() => setPendingFile(null)} className="w-full py-3.5 border-t border-neutral-700">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
