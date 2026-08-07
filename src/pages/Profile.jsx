import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearAuth, saveUser } from "../lib/storage";

export default function Profile({ user, setUser, notify }) {

  const location = useLocation();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSetup =
    new URLSearchParams(location.search).get("setup") === "1";

  useEffect(() => {

    let cancelled = false;

    async function loadProfile() {

      try {

        setLoading(true);
        setError("");

        const current = await api.getMe();

        if (cancelled) return;

        setName(current.fullName || "");
        setPhone(current.phoneNumber || "");
        setEmail(current.email || "");

        saveUser(current);
        setUser(current);

      } catch (err) {

        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load your profile."
          );
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };

  }, [setUser]);

  const onPhoneChange = (event) => {

    const digitsOnly =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 10);

    setPhone(digitsOnly);
  };

  const save = async (event) => {

    event.preventDefault();

    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    try {

      setSaving(true);

      const updated =
        await api.updateProfile({
          fullName: trimmedName,
          phoneNumber: phone,
        });

      saveUser(updated);
      setUser(updated);

      notify("Profile saved");

      if (isSetup) {
        nav("/profile", {
          replace: true,
        });
      }

    } catch (err) {

      setError(
        err.message ||
        "Unable to save your profile."
      );

    } finally {

      setSaving(false);

    }
  };

  const logout = () => {

    clearAuth();
    setUser(null);
    nav("/");
  };

  if (loading) {

    return (
      <div className="mc-container max-w-3xl py-10 sm:py-14">
        <p className="text-sm text-zinc-500">
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div className="mc-container max-w-3xl py-10 sm:py-14">

      <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">
        Account
      </p>

      <h1 className="text-4xl font-black">
        Profile
      </h1>

      {isSetup && (
        <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">

          <p className="text-sm font-semibold text-violet-300">
            Complete your MetaCloth profile
          </p>

          <p className="mt-1 text-sm text-violet-200/60">
            Add your phone number so we can complete your account.
          </p>

        </div>
      )}

      <form
        onSubmit={save}
        className="mt-8 rounded-2xl border border-white/10 bg-[#18181B] p-5 sm:p-7"
      >

        <div className="grid gap-5">

          <label>

            <span className="mb-2 block text-xs text-zinc-400">
              Full name
            </span>

            <input
              className="mc-input"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              maxLength={100}
              autoComplete="name"
              placeholder="Your full name"
            />

          </label>

          <label>

            <span className="mb-2 block text-xs text-zinc-400">
              Phone number
            </span>

            <input
              className="mc-input"
              value={phone}
              onChange={onPhoneChange}
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="9876543210"
            />

            <span className="mt-2 block text-xs text-zinc-600">
              Enter exactly 10 digits.
            </span>

          </label>

          <label>

            <span className="mb-2 block text-xs text-zinc-400">
              Email
            </span>

            <input
              className="mc-input cursor-not-allowed opacity-60"
              value={email}
              readOnly
              disabled
            />

            <span className="mt-2 block text-xs text-zinc-600">
              Your Google account email cannot be changed.
            </span>

          </label>

        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mc-btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>

      </form>

      <div className="mt-4 flex gap-3">

        <button
          onClick={() => nav("/orders")}
          className="mc-btn-secondary"
        >
          View orders
        </button>

        <button
          onClick={logout}
          className="mc-btn-ghost"
        >
          Sign out
        </button>

      </div>

    </div>
  );
}