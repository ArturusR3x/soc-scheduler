import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";

// API base URL
const API_BASE = "http://192.168.1.229";

export default function LoginPage({ onLogin }) {
  const [step, setStep] = useState(1); // 1: enter email, 2: set password, 3: enter password
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for cookie on mount
  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('soc_user='));
    if (cookie) {
      try {
        const user = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        if (user && user.email) {
          onLogin(user);
        }
      } catch {}
    }
  }, [onLogin]);

  // Step 1: Enter email and check user
  const handleEmailSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate email format before checking DB
    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // Check if email exists in DB (case-insensitive, backend handles it)
      const res = await fetch(`${API_BASE}/api/member-by-email?email=${encodeURIComponent(emailTrimmed)}`);
      if (!res.ok) {
        setError("Email not found in database. Please verify your email address.");
        setLoading(false);
        return;
      }
      // Email exists, proceed to password step
      const data = await res.json();
      setUser(data);
      if (!data.password) {
        setStep(2); // No password, ask to set new password
      } else {
        setStep(3); // Has password, ask for password
      }
    } catch {
      setError("Email not found in database. Please contact your administrator.");
    }
    setLoading(false);
  };

  // Step 2: Set new password
  const handleSetPassword = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!newPassword.trim() || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: newPassword })
      });
      if (!res.ok) throw new Error("Failed to set password");
      // After setting password, fetch user again to get updated password field
      const userRes = await fetch(`${API_BASE}/api/member-by-email?email=${encodeURIComponent(user.email)}`);
      const updatedUser = userRes.ok ? await userRes.json() : { ...user, password: newPassword };
      setUser(updatedUser);
      setStep(3);
      setPassword(""); // clear password field for next step
    } catch {
      setError("Failed to set password.");
    }
    setLoading(false);
  };

  // Step 3: Enter password and login
  const handleLogin = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (password === user.password) {
      setLoading(false);
      // Save user info in cookie for future logins
      document.cookie = `soc_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800`; // 7 days
      onLogin(user);
    } else {
      setError("Invalid password. Please try again.");
      setLoading(false);
    }
  };

  // Google login success handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Send credential to backend for verification and user lookup/creation
      const res = await fetch(`${API_BASE}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      if (res.ok) {
        const user = await res.json();
        document.cookie = `soc_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800`;
        onLogin(user);
      } else {
        setError("Google login failed or not authorized.");
      }
    } catch {
      setError("Google login failed.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      <div className="bg-white/10 rounded-2xl shadow-2xl p-8 space-y-6 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-blue-300 mb-4">SOC Scheduler Login</h1>
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div>
              <label className="block text-blue-200 font-semibold mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              disabled={loading}
            >
              {loading ? "Checking..." : "Next"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSetPassword}>
            <div>
              <label className="block text-blue-200 font-semibold mb-1">Set New Password</label>
              <input
                type="password"
                className="w-full rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Create password"
                autoComplete="new-password"
                required
              />
            </div>
            {/* Show password requirements */}
            <div className="text-xs text-blue-200 mb-2">
              Password must be at least 6 characters.
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Password"}
            </button>
          </form>
        )}
        {step === 3 && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-blue-200 font-semibold mb-1">Password</label>
              <input
                type="password"
                className="w-full rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
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
        )}
        <div className="flex flex-col items-center gap-2 mt-4">
          <span className="text-gray-300 text-xs">or</span>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed.")}
            useOneTap
          />
        </div>
      </div>
    </div>
  );
}
