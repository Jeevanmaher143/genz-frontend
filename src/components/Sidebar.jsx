import { Link, useLocation } from "react-router-dom";
import { GoHome, GoHomeFill } from "react-icons/go";
import { FiSearch, FiMenu, FiPlusSquare } from "react-icons/fi";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { BiMoviePlay, BiSolidMoviePlay } from "react-icons/bi";
import { RiMessengerLine, RiMessengerFill, RiApps2Line } from "react-icons/ri";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessagesContext";
import Avatar from "./Avatar";
import MoreMenu from "./MoreMenu";
import NotificationsPanel from "./NotificationsPanel";

// Instagram-style left navigation rail (desktop / tablet).
// Collapsed = icon rail (72px). Hovering expands it to show labels — with a
// short hover-intent delay (like instagram.com) so quick mouse passes don't
// flicker the rail open. Mobile uses the top/bottom bars instead.
export default function Sidebar() {
  const { user } = useAuth();
  const { unread } = useMessages();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hoverTimer = useRef(null);

  // hover intent: expand only after the cursor rests 200ms on the rail,
  // collapse after a brief 120ms grace so tiny slips don't snap it shut
  const onEnter = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(true), 40); // near-instant, feels live
  };
  const onLeave = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(false), 100);
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const active = (p) => pathname === p;

  // Messages page keeps the rail collapsed so the inbox gets the width
  const forceCollapsed = pathname.startsWith("/messages");
  const expanded = hovered && !forceCollapsed;

  const glow = expanded ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" : "";

  // labels are absolutely positioned (never affect layout), so they can truly
  // SLIDE in from the left with a per-item stagger — like instagram.com
  const Item = ({ to, onClick, icon, activeIcon, label, isActive, badge, order = 0 }) => {
    const content = (
      <div className={`relative flex items-center h-12 px-3 rounded-lg hover:bg-neutral-900/70 transition-colors w-full ${glow}`}>
        <span className="relative w-6 h-6 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
          <span className="text-[24px] leading-none">{isActive ? activeIcon : icon}</span>
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-ig-pink text-white text-[10px] font-bold leading-none min-w-[16px] h-4 px-1 rounded-full grid place-items-center">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
        <span
          className={`absolute left-14 top-1/2 -translate-y-1/2 text-[15px] whitespace-nowrap
                      transition-all duration-500 will-change-[transform,opacity]
                      [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]
                      ${isActive ? "font-bold" : ""}
                      ${expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none"}`}
          style={{ transitionDelay: expanded ? `${60 + order * 45}ms` : "0ms" }}
        >
          {label}
        </span>
      </div>
    );
    return to
      ? <Link to={to} className="group block">{content}</Link>
      : <button onClick={onClick} className="group block w-full text-left">{content}</button>;
  };

  return (
    <aside
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`hidden md:flex flex-col fixed left-0 top-0 h-screen px-3 py-5 z-40
                 transition-[width] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]
                 ${expanded ? "w-[245px]" : "w-[72px] bg-black"}`}
    >
      {/* logo — always the GenZ wordmark, collapsed or expanded */}
      <Link to="/" className="flex items-center h-12 px-2 mb-24">
        <span className={`text-xl font-bold brand-text whitespace-nowrap ${glow}`}>
          GenZ
        </span>
      </Link>

      <nav className="flex-1 flex flex-col gap-0.5">
        <Item order={0} to="/" icon={<GoHome />} activeIcon={<GoHomeFill />} label="Home" isActive={active("/")} />
        <Item order={1} to="/explore" icon={<FiSearch />} activeIcon={<FiSearch strokeWidth={3} />} label="Search" isActive={active("/explore")} />
        <Item order={2} to="/reels" icon={<BiMoviePlay />} activeIcon={<BiSolidMoviePlay />} label="Reels" isActive={active("/reels")} />
        <Item order={3} to="/messages" icon={<RiMessengerLine />} activeIcon={<RiMessengerFill />} label="Messages"
          isActive={pathname.startsWith("/messages")} badge={unread} />
        <Item order={4} onClick={() => setNotifsOpen(true)} icon={<FaRegHeart size={22} />} activeIcon={<FaHeart size={22} />}
          label="Notifications" isActive={notifsOpen} />
        <Item order={5} to="/create" icon={<FiPlusSquare />} activeIcon={<FiPlusSquare strokeWidth={2.5} />} label="Create" isActive={active("/create")} />
        <Item order={6} to={`/u/${user?.username}`}
          icon={<Avatar src={user?.avatarUrl} username={user?.username} size={24} />}
          activeIcon={<Avatar src={user?.avatarUrl} username={user?.username} size={24} ring />}
          label="Profile" isActive={pathname === `/u/${user?.username}`} />
      </nav>

      <div className="relative flex flex-col gap-0.5 mt-auto">
        <Item order={7} onClick={() => setMoreOpen((v) => !v)} icon={<FiMenu />} activeIcon={<FiMenu strokeWidth={2.5} />} label="More" isActive={moreOpen} />
        {moreOpen && <MoreMenu onClose={() => setMoreOpen(false)} />}
        <Item order={8} onClick={() => {}} icon={<RiApps2Line />} activeIcon={<RiApps2Line />} label="Also from GenZ Labs" />
      </div>

      {notifsOpen && <NotificationsPanel onClose={() => setNotifsOpen(false)} />}
    </aside>
  );
}
