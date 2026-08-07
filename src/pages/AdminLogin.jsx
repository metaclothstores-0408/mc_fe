import { useState } from "react";
import { LockKeyhole, ShieldCheck, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  saveUser,
  saveAccessToken,
} from "../lib/storage";

export default function AdminLogin({ setUser }) {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.adminLogin({
        email,
        password,
      });

      console.log("Admin login response:", response);

      /*
       * Expected backend response:
       *
       * {
       *   accessToken: "...",
       *   user: {
       *      id: 1,
       *      fullName: "...",
       *      email: "...",
       *      role: "ADMIN"
       *   }
       * }
       */

      const token = response.accessToken;

      const user =
        response.user || {
          id: response.userId,
          full_name: response.fullName,
          email: response.email || email,
          role: response.role,
        };

      if (!token) {
        throw new Error("Login successful but access token was not returned.");
      }

      if (user.role !== "ADMIN") {
        throw new Error("You do not have administrator access.");
      }

      // Store JWT
      saveAccessToken(token);

      // Store logged-in user
      saveUser(user);

      // Update React state
      setUser(user);

      // Go to admin dashboard
      nav("/admin", { replace: true });

    } catch (err) {
      console.error("Admin login failed:", err);
      setError(err.message || "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">

          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border">
              <ShieldCheck size={32} />
            </div>
          </div>

          <div className="text-2xl font-semibold">
            MC.
          </div>

          <div className="text-sm opacity-60 mt-2">
            Restricted access
          </div>

          <h1 className="text-3xl font-semibold mt-4">
            Admin Control Desk
          </h1>

          <p className="text-sm opacity-60 mt-2">
            Operations, inventory and order fulfillment.
          </p>

        </div>

        <form onSubmit={login}>

          <input
            className="mc-input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            type="email"
            autoComplete="username"
          />

          <input
            className="mc-input w-full mt-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="current-password"
          />

          {error && (
            <div className="mt-4 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Enter Control Desk"}

            {!loading && <ArrowRight size={18} />}
          </button>

        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm opacity-60 hover:opacity-100"
          >
            ← Back to customer sign in
          </Link>
        </div>

      </div>
    </div>
  );
}