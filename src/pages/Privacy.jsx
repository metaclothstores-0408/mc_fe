import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function Privacy() {
  return (
    <div className="mc-container py-12 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition mb-6">
        <ArrowLeft size={14} /> Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">SHADE 01 · MetaCloth Atelier</p>
        </div>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/10 pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            When you visit SHADE 01 (MetaCloth) or place an order, we collect necessary customer details including your name, shipping address, contact phone number, email address, and order customizations. For Google Sign-In, we only receive your public profile name and email address to authenticate your atelier account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. How We Use Your Data</h2>
          <p>
            Your information is strictly used for order fulfillment, high-density DTF manufacturing at our Tirupur hub, courier dispatch notification, and account management. We never sell or rent your personal information to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Payment & Transaction Security</h2>
          <p>
            All payment transactions are encrypted and processed securely through RBI-authorized payment aggregators (such as Razorpay). We do not store sensitive payment credentials, debit/credit card numbers, or UPI PINs on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. User Artwork & Custom Graphics</h2>
          <p>
            Graphics and avatars uploaded for on-demand DTF garment printing remain the intellectual property of the respective creator. Uploaded graphics are processed solely for garment rendering and physical printing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Contact Us</h2>
          <p>
            If you have questions regarding your data or wish to request data deletion, contact our privacy officer at <a href="mailto:support@metacloth.store" className="text-white underline">support@metacloth.store</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
