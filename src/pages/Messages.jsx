import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RiMessengerLine } from "react-icons/ri";
import { FiEdit, FiSearch } from "react-icons/fi";
import { FaChevronDown } from "react-icons/fa";
import api from "../api/axios";
import Avatar from "../components/Avatar";
import ChatWindow from "../components/ChatWindow";
import NewNote from "../components/NewNote";
import { useAuth } from "../context/AuthContext";

function ago(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

// shared-post markers show as "sent an attachment", like Instagram
function preview(m) {
  if (/^\[post:/.test(m.text)) return `${m.fromMe ? "You" : ""} sent an attachment`.trim();
  return `${m.fromMe ? "You: " : ""}${m.text}`;
}

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [myNote, setMyNote] = useState(null);
  const [noteModal, setNoteModal] = useState(false);
  const [q, setQ] = useState("");

  const loadNotes = () => {
    api.get("/notes").then((res) => { setMyNote(res.data.myNote); setNotes(res.data.notes); }).catch(() => {});
  };

  useEffect(() => {
    api.get("/messages/conversations").then((res) => setConvos(res.data.conversations)).catch(() => {});
    loadNotes();
  }, [userId]);

  const filtered = convos.filter((c) =>
    c.user.username.toLowerCase().includes(q.toLowerCase()) ||
    (c.user.fullName || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="grid md:grid-cols-[350px_1fr] overflow-hidden h-[calc(100dvh-6rem)] md:h-screen">
      {/* ---- Left: inbox ---- */}
      <div className={`border-r border-neutral-800 flex flex-col min-h-0 overflow-hidden ${userId ? "hidden md:flex" : "flex"}`}>
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <button className="flex items-center gap-2 font-bold text-xl">
            {user?.username} <FaChevronDown size={13} className="mt-0.5" />
          </button>
          <FiEdit size={24} />
        </div>

        {/* search */}
        <div className="px-6 pb-3">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
              className="w-full bg-neutral-800 rounded-xl pl-11 pr-4 py-2.5 text-[15px] placeholder-gray-500 focus:outline-none" />
          </div>
        </div>

        {/* notes row — big avatars with the note bubble floating above, like IG */}
        <div className="flex gap-3 overflow-x-auto px-5 pt-6 pb-4 no-scrollbar">
          {/* your note → opens the New note modal */}
          <button onClick={() => setNoteModal(true)} className="flex flex-col items-center w-[84px] shrink-0 relative pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-neutral-800 text-[11px] leading-snug px-3 py-1.5 rounded-2xl rounded-bl-md max-w-[92px] truncate text-gray-100 shadow z-10">
              {myNote ? myNote.text : "Come back and share…"}
            </span>
            <Avatar src={user?.avatarUrl} username={user?.username} size={76} />
            <span className="text-[12px] text-gray-400 mt-1.5">Your note</span>
          </button>

          {/* others' notes */}
          {notes.map((n) => (
            <Link key={n.user.id} to={`/messages/${n.user.id}`} className="flex flex-col items-center w-[84px] shrink-0 relative pt-8">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-neutral-800 text-[11px] leading-snug px-3 py-1.5 rounded-2xl rounded-bl-md max-w-[92px] truncate text-gray-100 shadow z-10">
                {n.text}
              </span>
              <Avatar src={n.user.avatarUrl} username={n.user.username} size={76} />
              <span className="text-[12px] text-gray-300 truncate w-full text-center mt-1.5">{n.user.username}</span>
            </Link>
          ))}
        </div>

        {/* messages / requests */}
        <div className="flex items-center justify-between px-6 py-3">
          <span className="font-bold text-[16px]">Messages</span>
          <span className="text-gray-500 text-sm font-semibold">Requests</span>
        </div>

        {/* conversation list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm p-6 text-center">
              No conversations. Tap a name above or a profile&apos;s <b>Message</b> button to start one.
            </p>
          ) : filtered.map((c) => (
            <Link key={c.user.id} to={`/messages/${c.user.id}`}
              className={`flex items-center gap-3.5 px-6 py-2 hover:bg-neutral-900 transition ${
                userId === c.user.id ? "bg-neutral-900" : ""
              }`}>
              <Avatar src={c.user.avatarUrl} username={c.user.username} size={56} />
              <div className="min-w-0 flex-1">
                <p className={`text-[15px] truncate ${c.unread ? "font-bold" : "font-normal"}`}>
                  {c.user.fullName || c.user.username}
                </p>
                <p className={`text-[13px] truncate ${c.unread ? "text-white font-semibold" : "text-gray-500"}`}>
                  {preview(c.lastMessage)} · {ago(c.lastMessage.createdAt)}
                </p>
              </div>
              {c.unread > 0 && <span className="w-2 h-2 rounded-full bg-ig-blue shrink-0" />}
            </Link>
          ))}
        </div>
      </div>

      {noteModal && (
        <NewNote existing={myNote} onClose={() => setNoteModal(false)} onSaved={loadNotes} />
      )}

      {/* ---- Right: chat ---- */}
      <div className={`${userId ? "block" : "hidden md:block"} h-full min-h-0 overflow-hidden`}>
        {userId ? (
          <ChatWindow userId={userId} />
        ) : (
          <div className="h-full grid place-items-center text-center">
            <div>
              <div className="w-24 h-24 rounded-full border-2 border-white grid place-items-center mx-auto mb-4">
                <RiMessengerLine size={48} />
              </div>
              <p className="font-semibold text-lg">Your messages</p>
              <p className="text-gray-500 text-sm">Send private photos and messages to a friend.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
