import React, { useState } from "react";

const USERS = [
  { name: "Basuki Rachmad", email: "Basuki.rachmad@deltadatamandiri.com", username: "Basuki", password: "Basuki123" },
  { name: "Lexiandy Kuswandana", email: "lexiandy.kuswandana@deltadatamandiri.com", username: "Lexiandy", password: "Lexiandy123" },
  { name: "Hansel Daniel Susanto", email: "hansel.susanto@deltadatamandiri.com", username: "Hansel", password: "Hansel123" },
  { name: "Febrian Sulistyono", email: "febrian.sulistyono@deltadatamandiri.com", username: "Febrian", password: "Febrian123" },
  { name: "Ni Made Meliana Listyawati", email: "meliana.listyawati@deltadatamandiri.com", username: "Meliana", password: "Meliana123" },
  { name: "Zachrun Puady Thahir", email: "zachrun.thahir@deltadatamandiri.com", username: "Zachrun", password: "Zachrun123" },
  { name: "Arieca Irfansyah Putra", email: "arieca.putra@deltadatamandiri.com", username: "Arieca", password: "Arieca123" },
  { name: "Hafidz Jaelani", email: "hafidz.jaelani@deltadatamandiri.com", username: "Hafidz", password: "Hafidz123" },
  { name: "Arthur Jeremy", email: "arthur.jeremy@deltadatamandiri.com", username: "Arthur", password: "Arthur123" },
  { name: "Andika Kusriyanto", email: "andika.kusriyanto@deltadatamandiri.com", username: "Andika", password: "Andika123" },
  { name: "Nico Juanto", email: "nico.juanto@deltadatamandiri.com", username: "Nico", password: "Nico123" },
];

async function fetchUserGroup(fullName) {
  try {
    const res = await fetch(`/api/get-group?username=${encodeURIComponent(fullName)}`);
    if (res.ok) {
      const data = await res.json();
      return data.group || "";
    }
  } catch (err) {
    // Ignore fetch errors, fallback to empty group
  }
  return "";
}

export default function LoginPage({ onLogin }) {
  const [selected, setSelected] = useState(USERS[0].username);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    const user = USERS.find(u => u.username === selected);
    if (user && password === user.password) {
      setError("");
      setLoading(true);
      let group = "";
      try {
        group = await fetchUserGroup(user.name); // <-- send full name here
      } catch {
        group = "";
      }
      setLoading(false);
      onLogin({ ...user, group });
    } else {
      setError("Invalid password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      <div className="bg-white/10 rounded-2xl shadow-2xl p-8 space-y-6 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-blue-300 mb-4">SOC Scheduler Login</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-blue-200 font-semibold mb-1">User</label>
            <select
              className="w-full rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selected}
              onChange={e => setSelected(e.target.value)}
            >
              {USERS.map(u => (
                <option key={u.username} value={u.username}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-blue-200 font-semibold mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
