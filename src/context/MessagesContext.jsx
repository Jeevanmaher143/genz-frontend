import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const MessagesContext = createContext(null);

// Tracks conversation summary so the nav/Reels can show unread count + recent avatars.
export function MessagesProvider({ children }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [convos, setConvos] = useState([]);

  const refresh = useCallback(() => {
    if (!user) { setConvos([]); return; }
    api.get("/messages/conversations").then((r) => setConvos(r.data.conversations)).catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // refresh whenever a new DM arrives in real-time
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    const onReceive = () => refresh();
    s.on("dm:receive", onReceive);
    return () => s.off("dm:receive", onReceive);
  }, [socket, connected, refresh]);

  const unread = convos.reduce((a, c) => a + (c.unread || 0), 0);
  const recent = convos.slice(0, 3).map((c) => c.user);

  return (
    <MessagesContext.Provider value={{ convos, unread, recent, refresh }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => useContext(MessagesContext) || { convos: [], unread: 0, recent: [], refresh: () => {} };
