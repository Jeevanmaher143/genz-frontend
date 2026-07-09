import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GoHome, GoHomeFill } from "react-icons/go";
import { BiMoviePlay, BiSolidMoviePlay } from "react-icons/bi";
import { RiMessengerLine } from "react-icons/ri";
import { FiSearch, FiPlusSquare } from "react-icons/fi";
import { FaRegHeart } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessagesContext";
import Avatar from "./Avatar";
import NotificationsPanel from "./NotificationsPanel";

export function MobileTopBar() {
  const { unread } = useMessages();
  const navigate = useNavigate();
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-neutral-800 h-[54px] flex items-center px-4">
      {/* GenZ wordmark (no logo image) */}
      <Link to="/" className="text-2xl font-bold brand-text">GenZ</Link>

      {/* right actions: create, notifications, messages */}
      <div className="ml-auto flex items-center gap-5 text-[26px]">
        <button onClick={() => setCreateOpen(true)} aria-label="Create"><FiPlusSquare /></button>
        <button onClick={() => setNotifsOpen(true)} aria-label="Notifications"><FaRegHeart size={24} /></button>
        <Link to="/messages" className="relative" aria-label="Messages">
          <RiMessengerLine />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-ig-pink text-white text-[10px] font-bold leading-none min-w-[16px] h-4 px-1 rounded-full grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>

      {notifsOpen && <NotificationsPanel onClose={() => setNotifsOpen(false)} />}

      {/* create chooser: Post or Reel */}
      {createOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-end sm:items-center justify-center" onClick={() => setCreateOpen(false)}>
          <div className="bg-neutral-800 w-full sm:max-w-xs rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <p className="text-center font-bold py-4 border-b border-neutral-700">Create</p>
            <button onClick={() => { setCreateOpen(false); navigate("/create"); }}
              className="w-full py-4 text-sm font-semibold hover:bg-neutral-700 transition">📷 Post</button>
            <button onClick={() => { setCreateOpen(false); navigate("/reels"); }}
              className="w-full py-4 text-sm font-semibold border-t border-neutral-700 hover:bg-neutral-700 transition">🎬 Reel</button>
            <button onClick={() => setCreateOpen(false)}
              className="w-full py-4 text-sm border-t border-neutral-700 text-gray-400">Cancel</button>
          </div>
        </div>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const active = (p) => pathname === p;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black border-t border-neutral-800 h-14
                    flex items-center justify-around text-[27px] pb-[env(safe-area-inset-bottom)]">
      <Link to="/" className="p-1.5">{active("/") ? <GoHomeFill /> : <GoHome />}</Link>
      <Link to="/reels" className="p-1.5">{active("/reels") ? <BiSolidMoviePlay /> : <BiMoviePlay />}</Link>
      <Link to="/explore" className="p-1.5"><FiSearch /></Link>
      <Link to={`/u/${user?.username}`} className="p-1">
        <Avatar src={user?.avatarUrl} username={user?.username} size={27} ring={pathname === `/u/${user?.username}`} />
      </Link>
    </nav>
  );
}
