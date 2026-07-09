import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BsGrid3X3, BsBookmark, BsCameraReels, BsPersonSquare } from "react-icons/bs";
import { FiPlus, FiMoreHorizontal, FiTrash2, FiLock, FiSettings, FiLink, FiUserPlus } from "react-icons/fi";
import { GoVerified } from "react-icons/go";
import { FaRegHeart, FaRegComment } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import FollowListModal from "../components/FollowListModal";
import DeletePostModal from "../components/DeletePostModal";
import SavedSection from "../components/SavedSection";
import { useAuth } from "../context/AuthContext";

function Stat({ value, label, onClick }) {
  return (
    <button onClick={onClick} className="text-sm hover:opacity-80">
      <b className="font-semibold">{value}</b> <span className="text-gray-400">{label}</span>
    </button>
  );
}

// split a bio: plain text lines + a trailing website line rendered as a blue link
function parseBio(bio = "") {
  const lines = (bio || "").split("\n");
  const urlIdx = lines.findIndex((l) => /(https?:\/\/|www\.|\.\w{2,}\/?$)/i.test(l.trim()) && !l.includes(" "));
  if (urlIdx === -1) return { text: bio, link: null };
  const link = lines[urlIdx].trim();
  const text = lines.filter((_, i) => i !== urlIdx).join("\n").trim();
  return { text, link };
}
function linkHref(l) {
  return l.startsWith("http") ? l : `https://${l}`;
}

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [stories, setStories] = useState([]);
  const [following, setFollowing] = useState(false);
  const [requested, setRequested] = useState(false);
  const [locked, setLocked] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("posts");
  const [listModal, setListModal] = useState(null); // "followers" | "following" | null

  const isMe = me?.username === username;

  useEffect(() => {
    setLoading(true);
    setTab("posts");
    Promise.all([
      api.get(`/users/${username}`),
      api.get(`/users/${username}/posts`),
      api.get(`/users/${username}/stories`),
      api.get(`/users/${username}/reels`),
    ])
      .then(([profileRes, postsRes, storiesRes, reelsRes]) => {
        setData(profileRes.data.user);
        setFollowing(profileRes.data.isFollowing);
        setRequested(profileRes.data.isRequested || false);
        setLocked(profileRes.data.locked || false);
        setBlockedByMe(profileRes.data.blockedByMe || false);
        setPosts(postsRes.data.posts);
        setStories(storiesRes.data.stories);
        setReels(reelsRes.data.reels);
      })
      .catch(() => toast.error("User not found"))
      .finally(() => setLoading(false));
  }, [username]);

  const toggleFollow = async () => {
    try {
      const res = await api.post(`/users/${username}/follow`);
      setFollowing(res.data.following);
      setRequested(res.data.requested || false);
      if (res.data.following) setLocked(false); // accepted/public follow → content visible again on reload
    } catch {
      toast.error("Action failed");
    }
  };

  const toggleBlock = async () => {
    setMenuOpen(false);
    try {
      const res = await api.post(`/users/${username}/block`);
      if (res.data.blocked) {
        toast.success(`Blocked ${username}`);
        setBlockedByMe(true); setLocked(true); setFollowing(false); setRequested(false);
        setPosts([]); setReels([]); setStories([]);
      } else {
        toast.success(`Unblocked ${username}`);
        window.location.reload();
      }
    } catch {
      toast.error("Action failed");
    }
  };

  if (loading) return <Spinner />;
  if (!data) return <p className="text-center text-gray-400 py-10">User not found.</p>;

  const TABS = [
    { key: "posts", label: "POSTS", Icon: BsGrid3X3 },
    ...(isMe ? [{ key: "saved", label: "SAVED", Icon: BsBookmark }] : []),
    { key: "reels", label: "REELS", Icon: BsCameraReels },
    { key: "tagged", label: "TAGGED", Icon: BsPersonSquare },
  ];

  const { text: bioText, link: bioLink } = parseBio(data.bio);

  // action buttons (shared between desktop inline + mobile)
  const btn = "font-semibold text-sm rounded-lg px-4 py-1.5 transition";
  const btnGray = `bg-neutral-800 hover:bg-neutral-700 ${btn}`;
  const ActionButtons = ({ full }) => (
    isMe ? (
      <>
        <Link to="/settings" className={`${btnGray} ${full ? "flex-1 text-center" : ""}`}>Edit profile</Link>
        <button onClick={() => toast("Archive — coming soon")} className={`${btnGray} ${full ? "flex-1" : ""}`}>View archive</button>
      </>
    ) : blockedByMe ? (
      <button onClick={toggleBlock} className={`btn-primary ${full ? "flex-1" : "px-6"} py-1.5`}>Unblock</button>
    ) : (
      <>
        <button onClick={toggleFollow}
          className={(following || requested) ? `${btnGray} ${full ? "flex-1" : "px-6"}` : `btn-primary ${full ? "flex-1" : "px-7"} py-1.5`}>
          {following ? "Following" : requested ? "Requested" : "Follow"}
        </button>
        <Link to={`/messages/${data.id}`} className={`${btnGray} ${full ? "flex-1 text-center" : ""}`}>Message</Link>
      </>
    )
  );

  const shareProfile = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success("Profile link copied"); }
    catch { toast.error("Could not copy"); }
  };

  return (
    <div className="max-w-[935px] mx-auto px-4 pt-3 sm:pt-0">
      {/* ================= MOBILE header (matches Instagram app) ================= */}
      <div className="sm:hidden">
        {/* avatar + stats row (username lives in the top app bar) */}
        <div className="flex items-center gap-5 mb-4">
          <div className="relative shrink-0">
            {isMe && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-800 text-[10px] px-2.5 py-1 rounded-2xl rounded-bl-md z-10 whitespace-nowrap">Note…</span>
            )}
            <Avatar src={data.avatarUrl} username={data.username} size={82} />
          </div>
          <div className="flex-1 flex justify-around text-center">
            <div><div className="font-semibold text-base">{data._count.posts}</div><div className="text-sm text-gray-300">posts</div></div>
            <button onClick={() => setListModal("followers")}><div className="font-semibold text-base">{data._count.followers.toLocaleString()}</div><div className="text-sm text-gray-300">followers</div></button>
            <button onClick={() => setListModal("following")}><div className="font-semibold text-base">{data._count.following.toLocaleString()}</div><div className="text-sm text-gray-300">following</div></button>
          </div>
        </div>

        {/* name + bio + link */}
        <div className="text-[13px] leading-[1.4] mb-4">
          {data.fullName && <p className="font-semibold">{data.fullName}</p>}
          {bioText && <p className="text-gray-100 whitespace-pre-line">{bioText}</p>}
          {bioLink && (
            <a href={linkHref(bioLink)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#e0f1ff] font-semibold mt-1">
              <FiLink size={12} /> {bioLink.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {/* buttons: Edit profile · Share profile · +  (or Follow · Message · +) */}
        <div className="flex gap-2 mb-6">
          {isMe ? (
            <>
              <Link to="/settings" className={`flex-1 text-center ${btnGray}`}>Edit profile</Link>
              <button onClick={shareProfile} className={`flex-1 ${btnGray}`}>Share profile</button>
            </>
          ) : blockedByMe ? (
            <button onClick={toggleBlock} className="btn-primary flex-1 py-1.5">Unblock</button>
          ) : (
            <>
              <button onClick={toggleFollow} className={(following || requested) ? `flex-1 ${btnGray}` : "btn-primary flex-1 py-1.5"}>
                {following ? "Following" : requested ? "Requested" : "Follow"}
              </button>
              <Link to={`/messages/${data.id}`} className={`flex-1 text-center ${btnGray}`}>Message</Link>
            </>
          )}
          {isMe ? (
            <button onClick={shareProfile} className={`${btnGray} px-3 grid place-items-center`} aria-label="Add"><FiUserPlus size={16} /></button>
          ) : (
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className={`${btnGray} px-3 grid place-items-center h-full`} aria-label="Options"><FiMoreHorizontal size={18} /></button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-40 bg-neutral-800 rounded-xl shadow-2xl w-52 overflow-hidden border border-neutral-700">
                    <button onClick={toggleBlock} className="w-full text-left px-4 py-3 text-sm text-ig-pink font-semibold hover:bg-neutral-700">{blockedByMe ? "Unblock" : "Block"}</button>
                    <button onClick={() => { setMenuOpen(false); toast("Reported — thanks for your feedback"); }} className="w-full text-left px-4 py-3 text-sm text-ig-pink hover:bg-neutral-700 border-t border-neutral-700">Report</button>
                    <button onClick={shareProfile} className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-700 border-t border-neutral-700">Share to…</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= DESKTOP header ================= */}
      <header className="hidden sm:flex sm:flex-row mb-11">
        {/* avatar */}
        <div className="flex justify-center sm:basis-[300px] sm:shrink-0">
          <div className="relative">
            {isMe && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-800 text-[11px] px-3 py-1 rounded-2xl rounded-bl-md z-10 shadow">
                Note…
              </span>
            )}
            <div className="w-[90px] h-[90px] sm:w-[150px] sm:h-[150px]">
              <Avatar src={data.avatarUrl} username={data.username} size={150} />
            </div>
          </div>
        </div>

        {/* right column */}
        <section className="flex-1 min-w-0">
          {/* row 1: username + actions */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5">
            <div className="flex items-center gap-2 relative">
              <h1 className="text-xl font-normal leading-none">{data.username}</h1>
              {isMe ? (
                <Link to="/settings" className="text-white hover:opacity-70"><FiSettings size={24} /></Link>
              ) : (
                <>
                  <GoVerified className="text-ig-blue" size={18} />
                  <button onClick={() => setMenuOpen((v) => !v)} className="text-white hover:opacity-70 px-1">
                    <FiMoreHorizontal size={22} />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                      <div className="absolute left-full top-6 z-40 bg-neutral-800 rounded-xl shadow-2xl w-56 overflow-hidden border border-neutral-700">
                        <button onClick={toggleBlock} className="w-full text-left px-4 py-3 text-sm text-ig-pink font-semibold hover:bg-neutral-700">
                          {blockedByMe ? "Unblock" : "Block"}
                        </button>
                        <button onClick={() => { setMenuOpen(false); toast("Restricted"); }}
                          className="w-full text-left px-4 py-3 text-sm text-ig-pink hover:bg-neutral-700 border-t border-neutral-700">Restrict</button>
                        <button onClick={() => { setMenuOpen(false); toast("Reported — thanks for your feedback"); }}
                          className="w-full text-left px-4 py-3 text-sm text-ig-pink hover:bg-neutral-700 border-t border-neutral-700">Report</button>
                        <button onClick={async () => { setMenuOpen(false); try { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); } catch { /* ignore */ } }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-700 border-t border-neutral-700">Share to…</button>
                        <Link to={`/messages/${data.id}`} onClick={() => setMenuOpen(false)}
                          className="block px-4 py-3 text-sm hover:bg-neutral-700 border-t border-neutral-700">Send message</Link>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* row 2: name/note line — right under username */}
          {data.fullName && <p className="text-[13px] mb-4">{data.fullName}</p>}

          {/* row 3: stats (desktop) */}
          <div className="hidden sm:flex gap-10 mb-4 text-[15px]">
            <Stat value={data._count.posts} label="posts" />
            <Stat value={data._count.followers.toLocaleString()} label="followers" onClick={() => setListModal("followers")} />
            <Stat value={data._count.following.toLocaleString()} label="following" onClick={() => setListModal("following")} />
          </div>

          {/* row 4: bio + link */}
          <div className="text-[13px] leading-[1.4]">
            {bioText && <p className="text-gray-100 whitespace-pre-line">{bioText}</p>}
            {bioLink && (
              <a href={linkHref(bioLink)} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#e0f1ff] font-semibold mt-1">
                <FiLink size={12} /> {bioLink.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </section>
      </header>

      {/* Action buttons — desktop only (mobile has its own row above) */}
      <div className="hidden sm:flex gap-2 mb-8"><ActionButtons full /></div>

      {/* ---- Private account lock ---- */}
      {locked && (
        <div className="border-t border-neutral-800 py-14 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full border-2 border-white grid place-items-center">
            <FiLock size={26} />
          </div>
          <p className="font-semibold">This account is private</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Follow this account to see their photos, videos and reels.
          </p>
        </div>
      )}

      {/* ---- Highlights ---- */}
      {!locked && (stories.length > 0 || isMe) && (
        <div className="flex gap-5 overflow-x-auto pb-6 mb-2 no-scrollbar">
          {isMe && (
            <button onClick={() => toast("New highlight — coming soon")} className="flex flex-col items-center gap-1 shrink-0 w-[76px]">
              <div className="w-[72px] h-[72px] rounded-full border border-neutral-700 grid place-items-center text-gray-400">
                <FiPlus size={26} />
              </div>
              <span className="text-xs text-gray-300">New</span>
            </button>
          )}
          {stories.map((s, i) => (
            <Link key={s.id} to={`/post/${posts[0]?.id || ""}`} className="flex flex-col items-center gap-1 shrink-0 w-[76px]">
              <div className="w-[72px] h-[72px] rounded-full p-[2px] border border-neutral-700">
                <img src={s.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-xs text-gray-300 truncate w-full text-center">{s.caption || `Story ${i + 1}`}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ---- Tabs ---- */}
      {!locked && (
      <div className="border-t border-neutral-800 flex justify-center gap-12">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 py-3 text-xs font-semibold tracking-wider -mt-px border-t transition ${
              tab === key ? "border-white text-white" : "border-transparent text-gray-500"
            }`}>
            <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      )}

      {/* ---- Tab content ---- */}
      {!locked && (
      <div className="pt-4">
        {tab === "posts" && (
          <PostGrid
            posts={posts}
            emptyText="No posts yet."
            isMine={isMe}
            onDeleted={(id) => {
              setPosts((list) => list.filter((p) => p.id !== id));
              setData((d) => d && ({ ...d, _count: { ...d._count, posts: Math.max(0, d._count.posts - 1) } }));
            }}
          />
        )}
        {tab === "saved" && (isMe ? <SavedSection /> : <EmptyTab Icon={BsBookmark} title="Save" text="Save photos and videos that you want to see again." />)}
        {tab === "reels" && (
          reels.length === 0
            ? <EmptyTab Icon={BsCameraReels} title="Reels" text="Short videos will appear here." />
            : (
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {reels.map((r) => (
                  <Link key={r.id} to="/reels" className="relative aspect-[9/16] overflow-hidden bg-neutral-900">
                    <video src={r.imageUrl} className="w-full h-full object-cover" muted preload="metadata" />
                    <span className="absolute bottom-1 left-1 text-white text-xs flex items-center gap-1">
                      <BsCameraReels size={12} /> {r._count?.likes ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            )
        )}
        {tab === "tagged" && <EmptyTab Icon={BsPersonSquare} title="Photos of you" text="When people tag you in photos, they'll appear here." />}
      </div>
      )}

      {listModal && !locked && (
        <FollowListModal
          username={username}
          type={listModal}
          isMe={isMe}
          onClose={() => setListModal(null)}
          onChanged={() => setData((d) => d && ({ ...d, _count: { ...d._count, followers: Math.max(0, d._count.followers - 1) } }))}
        />
      )}
    </div>
  );
}

function PostGrid({ posts, emptyText, isMine, onDeleted }) {
  const [menuFor, setMenuFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);

  if (posts.length === 0) return <p className="text-center text-gray-400 py-12">{emptyText}</p>;
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
      {posts.map((p) => (
        <div key={p.id} className="relative group aspect-square overflow-hidden bg-neutral-900">
          <Link to={`/post/${p.id}`} className="absolute inset-0">
            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition
                            flex items-center justify-center gap-6 text-white font-semibold">
              <span className="flex items-center gap-1.5"><FaRegHeart /> {p._count?.likes ?? 0}</span>
              <span className="flex items-center gap-1.5"><FaRegComment /> {p._count?.comments ?? 0}</span>
            </div>
          </Link>

          {isMine && (
            <div className="absolute top-1.5 right-1.5 z-10">
              <button
                onClick={(e) => { e.preventDefault(); setMenuFor(menuFor === p.id ? null : p.id); }}
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
              >
                <FiMoreHorizontal size={16} />
              </button>
              {menuFor === p.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                  <div className="absolute right-0 top-8 z-20 bg-neutral-800 rounded-lg shadow-xl w-36 overflow-hidden border border-neutral-700">
                    <button
                      onClick={() => { setMenuFor(null); setDeleteFor(p.id); }}
                      className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm text-ig-pink font-semibold hover:bg-neutral-700"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {deleteFor && (
        <DeletePostModal
          postId={deleteFor}
          onClose={() => setDeleteFor(null)}
          onDeleted={() => onDeleted?.(deleteFor)}
        />
      )}
    </div>
  );
}

function EmptyTab({ Icon, title, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full border-2 border-white grid place-items-center mb-4">
        <Icon size={28} />
      </div>
      <h3 className="text-2xl font-light mb-1">{title}</h3>
      <p className="text-gray-400 text-sm max-w-xs">{text}</p>
    </div>
  );
}
