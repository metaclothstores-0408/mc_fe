import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { saveUser } from "../lib/storage";
import { startGoogleOAuth } from "../lib/api";

export default function Auth({ setUser }) {
  const location = useLocation();
  const nav = useNavigate();
  const isSignup = location.pathname === "/signup";
  const [method, setMethod] = useState("google");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const finish = () => {
    const user = {
      id: "local-user",
      full_name: name || "MetaCloth Customer",
      email: email || "customer@metacloth.local",
      phone_number: phone || null,
      auth_provider: method === "google" ? "GOOGLE" : "PHONE",
      role: "CUSTOMER",
    };
    saveUser(user);
    setUser(user);
    nav("/");
  };

  return (
    <div className="min-h-[calc(100vh-128px)] bg-[#0B0B0C]">
      <div className="mx-auto grid min-h-[calc(100vh-128px)] max-w-7xl lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="relative">
            <Link to="/" className="text-xl font-black tracking-tight">MC<span className="text-violet-500">.</span></Link>
            <p className="mt-20 max-w-md text-5xl font-black leading-[1.05]">Wear your<br/><span className="text-violet-400">own identity.</span></p>
            <p className="mt-6 max-w-md text-zinc-500">Premium tech-streetwear with a personalized avatar built into your look.</p>
          </div>
          <div className="relative grid grid-cols-3 gap-3 text-xs text-zinc-500">
            {["40 preset avatars", "Premium garments", "Track every order"].map((x) => <div key={x} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><CheckCircle2 size={15} className="mb-3 text-violet-400"/>{x}</div>)}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><Link to="/" className="text-xl font-black">MC<span className="text-violet-500">.</span></Link></div>
            <div className="mb-7 flex rounded-2xl border border-white/10 bg-white/[.03] p-1">
              <Link to="/signin" className={`flex-1 rounded-xl py-3 text-center text-sm font-semibold ${!isSignup ? "bg-white/10 text-white" : "text-zinc-500"}`}>Sign in</Link>
              <Link to="/signup" className={`flex-1 rounded-xl py-3 text-center text-sm font-semibold ${isSignup ? "bg-violet-600 text-white" : "text-zinc-500"}`}>Create account</Link>
            </div>
            <h1 className="text-3xl font-black">{isSignup ? "Create your MetaCloth account" : "Welcome back"}</h1>
            <p className="mt-2 text-sm text-zinc-500">{isSignup ? "Start building your personal collection." : "Sign in to access your collection and orders."}</p>

            {isSignup && <input className="mc-input mt-6" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />}

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/[.03] p-1">
              <button onClick={() => setMethod("google")} className={`rounded-lg py-2.5 text-sm ${method === "google" ? "bg-white/10 text-white" : "text-zinc-500"}`}>Google</button>
              <button onClick={() => setMethod("phone")} className={`rounded-lg py-2.5 text-sm ${method === "phone" ? "bg-white/10 text-white" : "text-zinc-500"}`}>Phone OTP</button>
            </div>

            {method === "google" ? (
            <>
              <button
                onClick={startGoogleOAuth}
                className="mc-btn-primary mt-4 w-full"
                type="button"
              >
                Continue with Google
                <ArrowRight size={17} />
              </button>
            </>
          ) : 
            <>
              <input className="mc-input mt-4" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" inputMode="tel" />
              {!otpSent ? <button onClick={() => setOtpSent(true)} className="mc-btn-primary mt-3 w-full"><Phone size={17}/> Send OTP</button> : <>
                <input className="mc-input mt-3" placeholder="Enter 6-digit OTP" inputMode="numeric" />
                <button onClick={finish} className="mc-btn-primary mt-3 w-full">Verify & continue <ArrowRight size={17}/></button>
              </>}
            </>}

            <div className="mt-6 flex gap-2 rounded-xl border border-white/5 bg-white/[.02] p-3 text-xs leading-5 text-zinc-600">
  <ShieldCheck
    size={15}
    className="mt-0.5 shrink-0 text-zinc-500"
  />
  Secure authentication powered by MetaCloth and Google OAuth.
</div>
            <div className="mt-8 text-center text-xs text-zinc-600"><Sparkles size={13} className="mr-1 inline text-violet-500"/> Admins use the separate <Link className="text-violet-400 hover:text-violet-300" to="/admin/login">Admin Control Desk</Link>.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
