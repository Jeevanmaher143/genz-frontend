import { useNavigate } from "react-router-dom";
import { FiSettings, FiBookmark, FiMoon, FiSun, FiAlertCircle } from "react-icons/fi";
import { BsGraphUp } from "react-icons/bs";
import { HiOutlineSwitchHorizontal, HiOutlineLogout } from "react-icons/hi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Instagram-style "More" popup — sits above the sidebar's More button.
export default function MoreMenu({ onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const Item = ({ icon, label, onClick }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-neutral-800 transition text-left"
    >
      <span className="text-lg">{icon}</span> {label}
    </button>
  );

  return (
    <>
      {/* click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute left-2 bottom-16 z-50 w-64 bg-neutral-800 rounded-xl shadow-2xl overflow-hidden border border-neutral-700">
        <div className="py-1">
          <Item icon={<FiSettings />} label="Settings" onClick={() => navigate("/settings")} />
          <Item icon={<BsGraphUp />} label="Your activity" onClick={() => toast("Your activity — coming soon")} />
          <Item icon={<FiBookmark />} label="Saved" onClick={() => navigate(`/u/${user?.username}?tab=saved`)} />
          <Item
            icon={theme === "dark" ? <FiMoon /> : <FiSun />}
            label={`Switch appearance${theme === "dark" ? " (Dark)" : " (Light)"}`}
            onClick={() => { toggleTheme(); toast.success(theme === "dark" ? "Switched to Light mode" : "Switched to Dark mode"); }}
          />
          <Item icon={<FiAlertCircle />} label="Report a problem" onClick={() => toast("Thanks — we'll look into it")} />
        </div>

        <div className="border-t border-neutral-700 py-1">
          <Item icon={<HiOutlineSwitchHorizontal />} label="Switch accounts" onClick={() => toast("Switch accounts — coming soon")} />
        </div>

        <div className="border-t border-neutral-700 py-1">
          <Item icon={<HiOutlineLogout />} label="Log out" onClick={() => { logout(); navigate("/login"); }} />
        </div>
      </div>
    </>
  );
}
