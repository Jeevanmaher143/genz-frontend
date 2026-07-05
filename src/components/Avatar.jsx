// Round avatar with a graceful fallback to the first letter of the username
export default function Avatar({ src, username = "?", size = 40, ring = false }) {
  const dimension = { width: size, height: size };
  const letter = username?.[0]?.toUpperCase() || "?";

  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden grid place-items-center bg-gradient-to-br from-ig-pink to-ig-blue text-white font-semibold ${
        ring ? "ring-2 ring-offset-2 ring-ig-pink" : ""
      }`}
      style={dimension}
    >
      {src ? (
        <img src={src} alt={username} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{letter}</span>
      )}
    </div>
  );
}
