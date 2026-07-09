import { Link, useLocation } from "react-router-dom";
import { GoHome, GoHomeFill } from "react-icons/go";
import { BiMoviePlay, BiSolidMoviePlay } from "react-icons/bi";
import { RiMessengerLine } from "react-icons/ri";
import { FiSearch, FiPlusSquare } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessagesContext";
import Avatar from "./Avatar";
import logo from "../assets/Logo.png";

export function MobileTopBar() {
  const { unread } = useMessages();
  return (
    <header className="md:hidden sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-neutral-800 h-[54px] flex items-center px-4">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="GenZ" className="w-7 h-7 rounded-lg" />
        <span className="text-2xl font-bold brand-text">GenZ</span>
      </Link>
      <div className="ml-auto flex items-center gap-5">
        <Link to="/messages" className="relative text-[26px]">
          <RiMessengerLine />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-ig-pink text-white text-[10px] font-bold leading-none min-w-[16px] h-4 px-1 rounded-full grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const active = (p) => pathname === p;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black border-t border-neutral-800 h-14
                    flex items-center justify-around text-[26px] pb-[env(safe-area-inset-bottom)]">
      <Link to="/" className="p-1.5">{active("/") ? <GoHomeFill /> : <GoHome />}</Link>
      <Link to="/explore" className="p-1.5"><FiSearch /></Link>
      <Link to="/reels" className="p-1.5">{active("/reels") ? <BiSolidMoviePlay /> : <BiMoviePlay />}</Link>
      <Link to="/create" className="p-1.5"><FiPlusSquare /></Link>
      <Link to={`/u/${user?.username}`} className="p-1">
        <Avatar src={user?.avatarUrl} username={user?.username} size={26} ring={pathname === `/u/${user?.username}`} />
      </Link>
    </nav>
  );
}
