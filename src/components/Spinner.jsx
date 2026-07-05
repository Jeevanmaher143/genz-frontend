export default function Spinner({ full = false }) {
  const spinner = (
    <div className="w-8 h-8 border-[3px] border-gray-200 border-t-ig-blue rounded-full animate-spin" />
  );
  if (full) {
    return <div className="min-h-screen grid place-items-center">{spinner}</div>;
  }
  return <div className="grid place-items-center py-10">{spinner}</div>;
}
