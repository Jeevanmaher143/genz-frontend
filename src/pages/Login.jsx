import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PhoneHero from "../components/PhoneHero";
import logo from "../assets/Logo.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [busy, setBusy] = useState(false);

  const canSubmit = form.identifier && form.password && !busy;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.identifier, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2 max-w-6xl w-full mx-auto px-6 items-center gap-8">
        {/* Left: hero */}
        <div className="hidden lg:flex flex-col items-center">
          <img src={logo} alt="GenZ" className="w-14 h-14 rounded-2xl self-start mb-6" />
          <h1 className="text-5xl font-semibold leading-tight self-start mb-8">
            See everyday moments from your{" "}
            <span className="bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] bg-clip-text text-transparent">
              close friends
            </span>
            .
          </h1>
          <PhoneHero />
        </div>

        {/* Right: form */}
        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-xl font-semibold mb-6">Log into GenZ</h2>
          <form onSubmit={submit} className="space-y-3">
            <input
              className="ig-input"
              placeholder="Mobile number, username or email"
              autoFocus
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            />
            <input
              className="ig-input"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button className="ig-btn" disabled={!canSubmit}>
              {busy ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-300 mt-5">Forgot password?</p>

          <div className="my-6 flex items-center gap-4 text-gray-500 text-xs">
            <span className="h-px bg-gray-700 flex-1" /> OR <span className="h-px bg-gray-700 flex-1" />
          </div>

          <button className="ig-btn-outline flex items-center justify-center gap-2">
            <FaFacebook className="text-[#0866ff]" /> Log in with Facebook
          </button>

          <Link to="/signup" className="ig-btn-outline block text-center mt-3 text-[#0095f6]">
            Create new account
          </Link>

          <p className="text-center text-gray-400 text-sm mt-10">⧉ Meta</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Footer() {
  const links = ["Meta", "About", "Blog", "Jobs", "Help", "API", "Privacy", "Terms", "Locations", "GenZ Lite", "Threads"];
  return (
    <footer className="text-gray-500 text-xs py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-4 gap-y-2">
        {links.map((l) => <span key={l}>{l}</span>)}
      </div>
      <p className="text-center mt-4">English &nbsp; © {new Date().getFullYear()} GenZ</p>
    </footer>
  );
}
