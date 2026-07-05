import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Avatar from "./Avatar";

// "Suggested for you" — friends-of-friends (people your follows follow),
// rendered in Instagram's sidebar style: blue Follow text-link + context line.
export default function Suggestions() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    api.get("/users/suggestions")
      .then((res) => setPeople(res.data.users.slice(0, 5)))
      .catch(() => {});
  }, []);

  const follow = async (u) => {
    // optimistic: mark row done immediately
    setPeople((list) => list.map((x) => (x.id === u.id ? { ...x, _state: "busy" } : x)));
    try {
      const res = await api.post(`/users/${u.username}/follow`);
      setPeople((list) => list.map((x) =>
        x.id === u.id ? { ...x, _state: res.data.requested ? "requested" : "following" } : x
      ));
    } catch {
      setPeople((list) => list.map((x) => (x.id === u.id ? { ...x, _state: undefined } : x)));
      toast.error("Could not follow");
    }
  };

  if (people.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-semibold">Suggested for you</span>
        <Link to="/explore" className="text-xs font-semibold hover:text-gray-400">See all</Link>
      </div>

      <div className="space-y-3">
        {people.map((u) => (
          <div key={u.id} className="flex items-center gap-3">
            <Link to={`/u/${u.username}`}><Avatar src={u.avatarUrl} username={u.username} size={44} /></Link>
            <div className="min-w-0 flex-1">
              <Link to={`/u/${u.username}`} className="font-semibold text-sm block truncate hover:text-gray-300">
                {u.username}
              </Link>
              <p className="text-gray-500 text-xs truncate">
                {u.followedBy
                  ? <>Followed by {u.followedBy}{u.mutualCount > 1 && ` + ${u.mutualCount - 1}`}</>
                  : "Suggested for you"}
              </p>
            </div>
            <button
              onClick={() => follow(u)}
              disabled={u._state === "busy" || u._state === "following" || u._state === "requested"}
              className={`text-xs font-semibold shrink-0 ${
                u._state === "following" || u._state === "requested"
                  ? "text-gray-500"
                  : "text-ig-blue hover:text-white"
              }`}
            >
              {u._state === "following" ? "Following" : u._state === "requested" ? "Requested" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
