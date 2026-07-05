import { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const SavedContext = createContext(null);

// Tracks which posts/reels the current user has saved, so every bookmark
// icon shows the right state and toggles instantly.
export function SavedProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  const refresh = useCallback(() => {
    if (!user) { setIds(new Set()); return; }
    api.get("/saved").then((r) => setIds(new Set(r.data.ids))).catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isSaved = (postId) => ids.has(postId);

  const toggleSave = async (postId) => {
    // optimistic
    setIds((s) => {
      const next = new Set(s);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      const res = await api.post(`/saved/${postId}`);
      toast.success(res.data.saved ? "Saved" : "Removed from saved");
      return res.data.saved;
    } catch {
      refresh(); // revert on failure
      toast.error("Could not save");
    }
  };

  return (
    <SavedContext.Provider value={{ isSaved, toggleSave, refresh }}>
      {children}
    </SavedContext.Provider>
  );
}

export const useSaved = () => useContext(SavedContext) || { isSaved: () => false, toggleSave: () => {}, refresh: () => {} };
