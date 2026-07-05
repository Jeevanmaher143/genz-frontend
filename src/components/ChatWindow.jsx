import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiSend, FiPhone, FiVideo, FiInfo } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";
import Spinner from "./Spinner";
import SharedPost from "./SharedPost";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useMessages } from "../context/MessagesContext";

export default function ChatWindow({ userId }) {
  const { user: me } = useAuth();
  const { socket, connected } = useSocket();
  const { refresh } = useMessages();
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // load history
  useEffect(() => {
    setLoading(true);
    api.get(`/messages/${userId}`)
      .then((res) => { setOther(res.data.user); setMessages(res.data.messages); refresh(); })
      .finally(() => setLoading(false));
  }, [userId]);

  // live incoming messages + typing
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;

    const onReceive = (msg) => {
      if (msg.senderId === userId) {
        setMessages((m) => [...m, msg]);
        setTyping(false);
      }
    };
    const onTyping = ({ from }) => {
      if (from === userId) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 1500);
      }
    };
    s.on("dm:receive", onReceive);
    s.on("dm:typing", onTyping);
    return () => { s.off("dm:receive", onReceive); s.off("dm:typing", onTyping); };
  }, [socket, connected, userId]);

  // auto-scroll to newest
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    const s = socket?.current;
    if (!body || !s) return;

    s.emit("dm:send", { to: userId, text: body }, (ack) => {
      if (ack?.ok) setMessages((m) => [...m, ack.message]);
    });
    setText("");
  };

  const onType = (e) => {
    setText(e.target.value);
    socket?.current?.emit("dm:typing", { to: userId });
  };

  if (loading) return <Spinner />;
  if (!other) return <p className="text-center text-gray-400 py-10">User not found.</p>;

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
        <Link to={`/u/${other.username}`} className="flex items-center gap-3 min-w-0">
          <Avatar src={other.avatarUrl} username={other.username} size={44} />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{other.fullName || other.username}</p>
            <p className="text-xs text-gray-500 truncate">
              {other.username}{connected ? " · Active now" : ""}
            </p>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-5 text-xl text-gray-200">
          <button onClick={() => toast("Voice call — coming soon")}><FiPhone /></button>
          <button onClick={() => toast("Video call — coming soon")}><FiVideo /></button>
          <Link to={`/u/${other.username}`}><FiInfo /></Link>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">
            No messages yet. Say hi to {other.username}! 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === me.id;
          const shared = m.text.match(/^\[post:([\w-]+)\]\s*(.*)$/s);
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              {shared ? (
                <div className="space-y-1">
                  <SharedPost postId={shared[1]} mine={mine} />
                  {shared[2] && (
                    <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm break-words ${
                      mine ? "bg-ig-blue text-white ml-auto" : "bg-neutral-800 text-white"
                    }`}>{shared[2]}</div>
                  )}
                </div>
              ) : (
                <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm break-words ${
                  mine ? "bg-ig-blue text-white rounded-br-md" : "bg-neutral-800 text-white rounded-bl-md"
                }`}>
                  {m.text}
                </div>
              )}
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 px-3.5 py-2 rounded-2xl text-sm text-gray-400">typing…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <form onSubmit={send} className="flex items-center gap-2 border border-neutral-700 rounded-full px-4 py-2 mx-4 mb-4">
        <input
          value={text}
          onChange={onType}
          placeholder="Message…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button disabled={!text.trim()} className="text-ig-blue disabled:opacity-40">
          <FiSend size={20} />
        </button>
      </form>
    </div>
  );
}
