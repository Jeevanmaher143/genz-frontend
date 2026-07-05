import { AiFillHeart } from "react-icons/ai";

// A lightweight CSS phone-mockup collage (stand-in for Instagram's promo image)
export default function PhoneHero() {
  return (
    <div className="relative w-[320px] h-[360px] self-start">
      {/* back cards */}
      <div className="absolute left-0 top-10 w-32 h-56 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 rotate-[-8deg] shadow-2xl" />
      <div className="absolute right-2 top-6 w-32 h-56 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 rotate-[8deg] shadow-2xl" />

      {/* main phone */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-44 h-72 rounded-3xl bg-neutral-800 border-4 border-neutral-700 shadow-2xl overflow-hidden">
        <div className="h-full bg-gradient-to-b from-indigo-500 via-purple-600 to-pink-500 grid place-items-center">
          <span className="text-5xl">📸</span>
        </div>
      </div>

      {/* floating bubbles */}
      <div className="absolute left-2 bottom-8 bg-white text-rose-500 rounded-full p-2 shadow-lg">
        <AiFillHeart size={22} />
      </div>
      <div className="absolute right-4 bottom-16 bg-white rounded-full px-3 py-1 shadow-lg text-lg">🔥💬✨</div>
      <div className="absolute right-0 top-2 bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-1 shadow-lg">⭐ Close</div>
    </div>
  );
}
