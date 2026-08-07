import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LoaderCircle, ShieldAlert } from "lucide-react";

import { getGoogleOAuthSession } from "../lib/api";
import {
  saveAccessToken,
  saveUser,
} from "../lib/storage";

export default function GoogleOAuthCallback({
  setUser,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function completeLogin() {
      const params =
        new URLSearchParams(location.search);

      const googleError =
        params.get("error");

      if (googleError) {
        setError(
          googleError === "google_auth_denied"
            ? "Google authorization was cancelled."
            : "Google authentication failed."
        );
        return;
      }

      try {
        const response =
          await getGoogleOAuthSession();

        if (cancelled) {
          return;
        }

        saveAccessToken(
          response.accessToken
        );

        saveUser(
          response.user
        );

        setUser(
          response.user
        );

        navigate("/", {
          replace: true,
        });

      } catch (err) {

        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to complete Google authentication."
          );
        }
      }
    }

    completeLogin();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-128px)] bg-[#0B0B0C] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.03] p-8 text-center">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <ShieldAlert size={26} />
          </div>

          <h1 className="text-2xl font-black text-white">
            Google sign-in failed
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {error}
          </p>

          <Link
            to="/signin"
            className="mc-btn-primary mt-6 w-full"
          >
            <ArrowLeft size={17} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-128px)] bg-[#0B0B0C] flex items-center justify-center px-4">
      <div className="text-center">

        <LoaderCircle
          size={38}
          className="mx-auto animate-spin text-violet-400"
        />

        <h1 className="mt-6 text-xl font-bold text-white">
          Signing you in with Google...
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}