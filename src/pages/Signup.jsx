import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/Logo.png";

const MONTHS = ["Month", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Day", ...Array.from({ length: 31 }, (_, i) => i + 1)];
const YEARS = ["Year", ...Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i)];

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", username: "",
    month: "Month", day: "Day", year: "Year",
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const canSubmit = form.email && form.password && form.fullName && form.username && !busy;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        username: form.username,
      });
      toast.success("Account created!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 w-full max-w-md mx-auto px-6 py-8">
        <Link to="/login" className="inline-flex text-gray-300 mb-4"><FiChevronLeft size={24} /></Link>
        <img src={logo} alt="GenZ" className="w-12 h-12 rounded-xl mb-3" />
        <h1 className="text-2xl font-bold">Get started on GenZ</h1>
        <p className="text-gray-400 text-sm mt-1 mb-6">Sign up to see photos and videos from your friends.</p>

        <form onSubmit={submit} className="space-y-5">
          <Field label="Mobile number or email">
            <input className="ig-input" type="email" placeholder="Mobile number or email"
              value={form.email} onChange={set("email")} required />
            <p className="text-gray-500 text-xs mt-1">You may receive notifications from us.</p>
          </Field>

          <Field label="Password">
            <input className="ig-input" type="password" placeholder="Password"
              value={form.password} onChange={set("password")} required />
          </Field>

          <Field label="Birthday">
            <div className="grid grid-cols-3 gap-2">
              <Select value={form.month} onChange={set("month")} options={MONTHS} />
              <Select value={form.day} onChange={set("day")} options={DAYS} />
              <Select value={form.year} onChange={set("year")} options={YEARS} />
            </div>
          </Field>

          <Field label="Name">
            <input className="ig-input" placeholder="Full name"
              value={form.fullName} onChange={set("fullName")} required />
          </Field>

          <Field label="Username">
            <input className="ig-input" placeholder="Username"
              value={form.username} onChange={set("username")} required />
          </Field>

          <p className="text-gray-500 text-xs leading-relaxed">
            By tapping Submit, you agree to create an account and to GenZ&apos;s Terms, Privacy Policy and Cookies Policy.
          </p>

          <button className="ig-btn" disabled={!canSubmit}>
            {busy ? "Creating…" : "Submit"}
          </button>
          <Link to="/login" className="ig-btn-outline block text-center">I already have an account</Link>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-semibold text-sm mb-2">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange}
      className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-neutral-500">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
