import { useRef, useState, useEffect } from "react";
import { FiSearch, FiUser, FiBell, FiLock, FiStar, FiSlash, FiMapPin, FiMessageSquare, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";

const MAX_BIO = 150;

// Instagram-style Settings: left menu + right content pane.
export default function Settings() {
  const [section, setSection] = useState("edit");
  const [q, setQ] = useState("");

  const MENU = [
    { header: "Your account" },
    { key: "accounts", icon: <FiUser />, label: "Accounts Center", sub: "Password, security, personal details" },
    { header: "How you use GenZ" },
    { key: "edit", icon: <FiUser />, label: "Edit profile" },
    { key: "notifications", icon: <FiBell />, label: "Notifications" },
    { header: "Who can see your content" },
    { key: "privacy", icon: <FiLock />, label: "Account privacy" },
    { key: "close", icon: <FiStar />, label: "Close Friends" },
    { key: "blocked", icon: <FiSlash />, label: "Blocked" },
    { key: "story", icon: <FiMapPin />, label: "Story and location" },
    { header: "How others can interact with you" },
    { key: "comments", icon: <FiMessageSquare />, label: "Comments" },
    { key: "hidden", icon: <FiEyeOff />, label: "Hidden words" },
  ];

  const visible = MENU.filter((m) =>
    m.header ? true : m.label.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="grid md:grid-cols-[340px_1fr] h-[calc(100dvh-6rem)] md:h-[calc(100vh-4rem)] -my-4 md:-my-8">
      {/* ---- left: settings menu (own scroll) ---- */}
      <div className="border-r border-neutral-800 overflow-y-auto min-h-0 py-6 pr-3">
        <h1 className="text-2xl font-bold px-3 pb-5">Settings</h1>

        <div className="relative mb-4 px-3">
          <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
            className="w-full bg-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none" />
        </div>

        {visible.map((m, i) =>
          m.header ? (
            <p key={i} className="text-gray-500 text-xs font-semibold px-4 pt-5 pb-2">{m.header}</p>
          ) : (
            <button key={m.key}
              onClick={() => setSection(m.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition ${
                section === m.key ? "bg-neutral-800 font-semibold" : "hover:bg-neutral-900"
              }`}>
              <span className="text-lg shrink-0">{m.icon}</span>
              <span className="min-w-0">
                {m.label}
                {m.sub && <span className="block text-xs text-gray-500 font-normal">{m.sub}</span>}
              </span>
            </button>
          )
        )}
      </div>

      {/* ---- right: content (own scroll) ---- */}
      <div className="overflow-y-auto min-h-0 py-8 px-6 md:px-12">
        <div className="max-w-2xl">
          {section === "edit" ? <EditProfilePane />
            : section === "privacy" ? <AccountPrivacyPane />
            : section === "close" ? <CloseFriendsPane />
            : section === "blocked" ? <BlockedPane />
            : <ComingSoonPane name={MENU.find((m) => m.key === section)?.label} />}
        </div>
      </div>
    </div>
  );
}

function AccountPrivacyPane() {
  const { user, setUser } = useAuth();
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.isPrivate));
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !isPrivate;
    setIsPrivate(next); // optimistic
    setBusy(true);
    try {
      await api.put("/users/me/privacy", { isPrivate: next });
      setUser((u) => ({ ...u, isPrivate: next }));
      toast.success(next ? "Your account is now private" : "Your account is now public");
    } catch {
      setIsPrivate(!next);
      toast.error("Could not update privacy");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <h2 className="text-xl font-bold">Account privacy</h2>

      <div className="flex items-center justify-between bg-neutral-900 rounded-2xl p-5">
        <span className="font-medium">Private account</span>
        <button onClick={toggle} disabled={busy}
          className={`w-12 h-7 rounded-full relative transition ${isPrivate ? "bg-white" : "bg-neutral-600"}`}>
          <span className={`absolute top-0.5 w-6 h-6 rounded-full transition ${
            isPrivate ? "right-0.5 bg-black" : "left-0.5 bg-white"
          }`} />
        </button>
      </div>

      <div className="text-sm text-gray-300 space-y-4 leading-relaxed">
        <p>
          When your account is public, your profile and posts can be seen by anyone, on or off GenZ,
          even if they don&apos;t have a GenZ account.
        </p>
        <p>
          When your account is private, only the followers you approve can see what you share,
          including your photos, videos and reels, and your followers and following lists. Certain info
          on your profile, like your profile picture and username, is visible to everyone on and off GenZ.{" "}
          <span className="text-ig-blue">Learn more</span>
        </p>
      </div>
    </div>
  );
}

function EditProfilePane() {
  const { user, setUser } = useAuth();
  const fileRef = useRef();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatarUrl || null);
  const [threads, setThreads] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = (f) => {
    if (!f) return;
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData();
    fd.append("fullName", fullName);
    fd.append("bio", bio);
    if (avatarFile) fd.append("avatar", avatarFile);
    try {
      const res = await api.put("/users/me", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUser((u) => ({ ...u, ...res.data.user }));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8 pb-10">
      <h2 className="text-xl font-bold">Edit profile</h2>

      {/* avatar card */}
      <div className="flex items-center gap-4 bg-neutral-900 rounded-2xl p-4">
        <Avatar src={preview} username={user?.username} size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{user?.username}</p>
          <p className="text-gray-400 text-sm truncate">{fullName}</p>
        </div>
        <button type="button" onClick={() => fileRef.current.click()} className="btn-primary py-1.5 px-4 text-sm">
          Change photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
      </div>

      {/* name */}
      <div>
        <label className="block font-bold mb-2">Name</label>
        <input className="input rounded-xl py-3" value={fullName} placeholder="Full name"
          onChange={(e) => setFullName(e.target.value)} />
      </div>

      {/* website — display-only, like Instagram web */}
      <div>
        <label className="block font-bold mb-2">Website</label>
        <input className="input rounded-xl py-3 opacity-60 cursor-not-allowed" value="" placeholder="Website" disabled />
        <p className="text-gray-500 text-xs mt-2">
          Editing your links is only available on mobile. Visit the GenZ app and edit your profile to change the websites in your bio.
        </p>
      </div>

      {/* bio */}
      <div>
        <label className="block font-bold mb-2">Bio</label>
        <div className="relative">
          <textarea className="input rounded-xl resize-none pr-16 py-3" rows={3} maxLength={MAX_BIO}
            value={bio} placeholder="Bio" onChange={(e) => setBio(e.target.value)} />
          <span className="absolute bottom-2 right-3 text-gray-500 text-xs">{bio.length} / {MAX_BIO}</span>
        </div>
      </div>

      {/* threads badge toggle (decorative) */}
      <div>
        <label className="block font-bold mb-2">Show Threads badge</label>
        <div className="flex items-center justify-between bg-neutral-900 rounded-2xl p-4">
          <span className="text-sm">Show Threads badge</span>
          <button type="button" onClick={() => setThreads((v) => !v)}
            className={`w-11 h-6 rounded-full relative transition ${threads ? "bg-ig-blue" : "bg-neutral-600"}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${threads ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      <button className="btn-primary px-8" disabled={busy}>{busy ? "Saving…" : "Submit"}</button>
    </form>
  );
}

function CloseFriendsPane() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/close-friends").then((r) => setUsers(r.data.users)).catch(() => {});
  }, []);

  const toggle = async (u) => {
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, isClose: !x.isClose } : x)));
    try {
      const res = await api.post(`/close-friends/${u.id}`);
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, isClose: res.data.close } : x)));
    } catch {
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, isClose: !x.isClose } : x)));
      toast.error("Could not update");
    }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(q.toLowerCase()) ||
    (u.fullName || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">Close friends</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        We don&apos;t send notifications when you edit your close friends list.{" "}
        <span className="text-ig-blue">How it works</span>
      </p>

      <div className="relative mb-4">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
          className="w-full bg-neutral-800 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">Follow people to add them to your close friends.</p>
      ) : filtered.map((u) => (
        <button key={u.id} onClick={() => toggle(u)} className="flex items-center gap-3 w-full py-2.5 text-left">
          <Avatar src={u.avatarUrl} username={u.username} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{u.username}</p>
            <p className="text-gray-400 text-sm truncate">{u.fullName}</p>
          </div>
          <span className={`w-6 h-6 rounded-full grid place-items-center border-2 ${
            u.isClose ? "bg-ig-blue border-ig-blue" : "border-gray-500"
          }`}>
            {u.isClose && <span className="text-white text-xs">✓</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function BlockedPane() {
  const [users, setUsers] = useState([]);

  const load = () => api.get("/users/blocked/list").then((r) => setUsers(r.data.users)).catch(() => {});
  useEffect(() => { load(); }, []);

  const unblock = async (u) => {
    try {
      await api.post(`/users/${u.username}/block`);
      toast.success(`Unblocked ${u.username}`);
      load();
    } catch { toast.error("Could not unblock"); }
  };

  return (
    <div className="pb-10">
      <h2 className="text-2xl font-bold mb-1">Blocked profiles</h2>
      <p className="text-sm text-gray-400 mb-6">
        You can block profiles at any time. When you block someone, they can&apos;t see your profile, posts, reels or stories.
      </p>
      {users.length === 0 ? (
        <p className="text-gray-500 text-sm py-8">You haven&apos;t blocked anyone.</p>
      ) : users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 py-2.5">
          <Avatar src={u.avatarUrl} username={u.username} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{u.username}</p>
            <p className="text-gray-400 text-sm truncate">Includes other accounts they may have or create</p>
          </div>
          <button onClick={() => unblock(u)}
            className="bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-semibold rounded-lg px-5 py-2 shrink-0">
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}

function ComingSoonPane({ name }) {
  return (
    <div className="py-20 text-center text-gray-500">
      <h2 className="text-xl font-bold text-white mb-2">{name}</h2>
      <p className="text-sm">This setting is coming soon.</p>
    </div>
  );
}
