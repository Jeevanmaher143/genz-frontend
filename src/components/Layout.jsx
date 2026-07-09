import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { MobileTopBar, MobileBottomNav } from "./MobileNav";

// Instagram-style app shell:
// - desktop/tablet: fixed left sidebar (icon-only, expands on hover as an
//   overlay), content is always offset by the collapsed width
// - mobile: top bar + bottom tab nav
// On the Messages/Reels pages the content is full-bleed/full-height with its
// own internal scrolling.
export default function Layout() {
  const { pathname } = useLocation();
  const isMessages = pathname.startsWith("/messages");
  const isReels = pathname.startsWith("/reels");
  const fullBleed = isMessages || isReels;

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />
      <MobileTopBar />

      <main className="md:ml-[72px] pb-14 md:pb-0">
        {fullBleed ? (
          <Outlet />
        ) : (
          <div className="max-w-5xl mx-auto px-0 sm:px-4 py-0 sm:py-6 md:py-8">
            <Outlet />
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
