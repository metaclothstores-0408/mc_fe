import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="mc-container py-12 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition mb-6">
        <ArrowLeft size={14} /> Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Terms of Service</h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">SHADE 01 · MetaCloth Atelier</p>
        </div>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/10 pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Service Overview</h2>
          <p>
            SHADE 01 provides bespoke, 260+ GSM combed cotton streetwear with customizable avatars and high-density Direct-to-Film (DTF) prints manufactured in Tirupur, India.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Custom Apparel & Return Policy</h2>
          <p>
            Due to the custom on-demand nature of personalized garments, printed orders cannot be cancelled or returned once physical production commences, except in cases of verified manufacturing defects or transit damage.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Shipping & Delivery</h2>
          <p>
            Standard production and dispatch takes 3–5 business days. Delivery across major Indian cities takes approximately 4–7 business days via our courier partners.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Acceptable Content</h2>
          <p>
            Users agree not to upload artwork containing hate speech, copyright-infringing assets without license, or unlawful imagery. We reserve the right to decline print orders that violate legal standards.
          </p>
        </section>
      </div>
    </div>
  );
}
