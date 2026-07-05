import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiChevronLeft, FiX, FiTrash2 } from "react-icons/fi";
import { BsBookmark, BsCameraReelsFill } from "react-icons/bs";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useSaved } from "../context/SavedContext";

// Profile > SAVED tab: "All posts" + user collections (create, open, manage).
export default function SavedSection() {
  const { refresh } = useSaved();
  const [items, setItems] = useState([]);          // all saved
  const [collections, setCollections] = useState([]);
  const [view, setView] = useState(null);          // null=overview | "all" | collection id
  const [colItems, setColItems] = useState([]);
  const [colName, setColName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [picking, setPicking] = useState(false);   // add-items modal for a collection

  const load = () => {
    api.get("/saved").then((r) => setItems(r.data.items)).catch(() => {});
    api.get("/saved/collections").then((r) => setCollections(r.data.collections)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openCollection = async (id, name) => {
    setView(id); setColName(name);
    const r = await api.get(`/saved/collections/${id}`);
    setColItems(r.data.items);
  };

  const createCollection = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.post("/saved/collections", { name: newName.trim() });
      setNewName(""); setCreating(false); load();
      toast.success("Collection created");
    } catch { toast.error("Could not create"); }
  };

  const removeCollection = async (id) => {
    await api.delete(`/saved/collections/${id}`);
    setView(null); load();
    toast.success("Collection deleted");
  };

  const togglePick = async (postId, inCol) => {
    await api.put(`/saved/${postId}/collection`, { collectionId: inCol ? null : view });
    const r = await api.get(`/saved/collections/${view}`);
    setColItems(r.data.items);
    load();
  };

  const unsave = async (postId) => {
    await api.post(`/saved/${postId}`);
    refresh(); load();
    if (view && view !== "all") {
      const r = await api.get(`/saved/collections/${view}`);
      setColItems(r.data.items);
    }
  };

  const Grid = ({ list, manage }) => (
    list.length === 0 ? (
      <p className="text-center text-gray-400 py-12 text-sm">Nothing here yet.</p>
    ) : (
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {list.map((p) => (
          <div key={p.id} className="relative group aspect-square overflow-hidden bg-neutral-900">
            <Link to={p.type === "reel" ? "/reels" : `/post/${p.id}`}>
              {p.type === "reel"
                ? <video src={p.imageUrl} className="w-full h-full object-cover" muted preload="metadata" />
                : <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
            </Link>
            {p.type === "reel" && <BsCameraReelsFill className="absolute top-2 right-2 text-white drop-shadow" size={16} />}
            {manage && (
              <button onClick={() => unsave(p.id)}
                className="absolute bottom-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                title="Remove from saved">
                <FiX size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    )
  );

  /* ---------- collection detail view ---------- */
  if (view && view !== "all") {
    const inCol = new Set(colItems.map((i) => i.id));
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setView(null); load(); }}><FiChevronLeft size={22} /></button>
          <h3 className="font-bold">{colName}</h3>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setPicking(true)} className="bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg px-3 py-1.5">
              + Add from saved
            </button>
            <button onClick={() => removeCollection(view)} className="bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg px-3 py-1.5 text-ig-pink">
              <FiTrash2 className="inline mr-1" size={12} />Delete
            </button>
          </div>
        </div>
        <Grid list={colItems} manage />

        {/* picker: choose saved items for this collection */}
        {picking && (
          <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4" onClick={() => setPicking(false)}>
            <div className="bg-neutral-900 w-full max-w-lg rounded-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <span className="font-semibold">Add to “{colName}”</span>
                <button onClick={() => setPicking(false)}><FiX size={20} /></button>
              </div>
              <div className="overflow-y-auto p-3 grid grid-cols-3 gap-1.5">
                {items.map((p) => {
                  const selected = inCol.has(p.id);
                  return (
                    <button key={p.id} onClick={() => togglePick(p.id, selected)}
                      className={`relative aspect-square overflow-hidden rounded ${selected ? "ring-2 ring-ig-blue" : ""}`}>
                      {p.type === "reel"
                        ? <video src={p.imageUrl} className="w-full h-full object-cover" muted preload="metadata" />
                        : <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                      {selected && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-ig-blue grid place-items-center text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- "All posts" view ---------- */
  if (view === "all") {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView(null)}><FiChevronLeft size={22} /></button>
          <h3 className="font-bold">All posts</h3>
        </div>
        <Grid list={items} manage />
      </div>
    );
  }

  /* ---------- overview: collection cards ---------- */
  const Card = ({ cover, name, count, onClick }) => (
    <button onClick={onClick} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-900 text-left group">
      {cover ? (
        cover.type === "reel"
          ? <video src={cover.imageUrl} className="w-full h-full object-cover" muted preload="metadata" />
          : <img src={cover.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full grid place-items-center text-gray-600"><BsBookmark size={28} /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-2 left-3">
        <p className="font-semibold text-sm">{name}</p>
        {count != null && <p className="text-xs text-gray-300">{count} items</p>}
      </div>
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">Only you can see what you&apos;ve saved</p>
        <button onClick={() => setCreating(true)} className="text-ig-blue text-sm font-semibold flex items-center gap-1">
          <FiPlus /> New collection
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card cover={items[0]} name="All posts" count={items.length} onClick={() => setView("all")} />
        {collections.map((c) => (
          <Card key={c.id} cover={c.cover} name={c.name} count={c.count} onClick={() => openCollection(c.id, c.name)} />
        ))}
      </div>

      {/* create collection modal */}
      {creating && (
        <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4" onClick={() => setCreating(false)}>
          <form onSubmit={createCollection} className="bg-neutral-800 w-full max-w-xs rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <p className="text-center font-bold py-4 border-b border-neutral-700">New collection</p>
            <div className="p-4">
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name (e.g. Sports)" maxLength={40}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
            </div>
            <button type="submit" disabled={!newName.trim()}
              className="w-full py-3 border-t border-neutral-700 text-ig-blue font-semibold disabled:opacity-40">
              Create
            </button>
            <button type="button" onClick={() => setCreating(false)} className="w-full py-3 border-t border-neutral-700">Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
