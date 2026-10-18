import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Sparkles, ShoppingBag, Star } from "lucide-react";
import { products, sizes } from "../data/mock";
import { money } from "../lib/storage";
import { api } from "../lib/api";

export default function Product({ addToCart, notify }) {
  const { id } = useParams();
  const product = products.find(p => p.id === Number(id));
  const navigate = useNavigate();
  const [size, setSize] = useState("L");
  const [variantId, setVariantId] = useState(product?.variants[0]?.id);
  const [qty, setQty] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const variant = useMemo(() => product?.variants.find(v => v.id === variantId) || product?.variants[0], [product, variantId]);

  useEffect(() => {
    if (!product) return;

    const loadReviews = async () => {
      try {
        setReviewLoading(true);
        const data = await api.getProductReviews(product.id);
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        setReviewLoading(false);
      }
    };

    loadReviews();
  }, [product]);

  const averageRating = reviews.length === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const submitReview = async () => {
    if (reviewRating === 0) { notify("Please select a rating"); return; }
    if (!reviewComment.trim()) { notify("Please write a review"); return; }
    try {
      setReviewSubmitting(true);
      const newReview = await api.createReview(product.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviews(prev => [newReview, ...prev]);
      setReviewRating(0);
      setReviewComment("");
      notify("Review submitted successfully");
    } catch (error) {
      console.error("Review submission failed:", error);
      notify(error.message || "Unable to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!product) return (
    <div className="mc-container py-20">
      <h1 className="text-2xl font-bold text-white">Product not found.</h1>
      <Link className="mt-5 inline-block text-zinc-400 hover:text-white underline" to="/shop">
        Back to collection
      </Link>
    </div>
  );

  const add = () => { 
    addToCart({
      id: `product-${product.id}-${variant.id}-${size}`, 
      productId: product.id, 
      name: product.name, 
      price: product.basePrice, 
      quantity: qty, 
      size, 
      variantId: variant.id, 
      color: variant.colorName, 
      image: variant.image
    }); 
    notify("Added to bag"); 
  };

  return (
    <div className="mc-container py-8 sm:py-12">
      <Link to="/shop" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition">
        <ArrowLeft size={15} /> Back to collection
      </Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#121215]">
          <img src={variant.image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
        </div>
        <div className="lg:py-5">
          <div className="flex flex-wrap gap-2">
            {product.tags.map(t => (
              <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono uppercase tracking-wider text-white">
                {t}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-white">{product.name}</h1>
          <div className="mt-4 text-xl font-bold font-mono text-white">{money(product.basePrice)}</div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">{product.description}</p>
          
          {product.customizable && (
            <Link to="/studio" className="mt-6 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 p-4 hover:bg-white/10 transition">
              <Sparkles className="text-white shrink-0" size={20} />
              <div>
                <b className="block text-sm text-white">Customize in B&D Atelier</b>
                <span className="text-xs text-zinc-400">Open B&D Atelier and map your custom chest artwork on this blank.</span>
              </div>
            </Link>
          )}

          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Shade</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button 
                    key={v.id} 
                    onClick={() => setVariantId(v.id)} 
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      variant.id === v.id ? "border-white bg-white/15 text-white" : "border-white/10 text-zinc-400 hover:border-white/25"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: v.colorHex }} />
                    {v.colorName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Size (Tirupur Boxy Fit)</label>
              <div className="grid grid-cols-5 gap-2">
                {sizes.map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSize(s)} 
                    className={`rounded-xl border py-3 text-xs font-bold transition ${
                      size === s ? "border-white bg-white/20 text-white ring-1 ring-white/30" : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 p-2 bg-white/[0.02]">
              <div className="flex items-center gap-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="mc-btn-ghost p-2"><Minus size={15} /></button>
                <span className="w-8 text-center text-xs font-mono font-bold text-white">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="mc-btn-ghost p-2"><Plus size={15} /></button>
              </div>
              <button onClick={add} className="mc-btn-primary min-w-44">
                <ShoppingBag size={17} /> Add to bag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <section className="mt-20 border-t border-white/10 pt-12">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <h2 className="text-2xl font-black text-white">Customer Reviews</h2>
            <div className="mt-6 flex items-center gap-4">
              <span className="text-5xl font-black font-mono text-white">{averageRating.toFixed(1)}</span>
              <div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={18} 
                      className={star <= Math.round(averageRating) ? "fill-white text-white" : "text-zinc-700"} 
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-zinc-500 font-mono">Based on {reviews.length} reviews</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Write a review</h3>
              <div className="mt-4">
                <p className="mb-2 text-xs text-zinc-400">Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)}>
                      <Star 
                        size={24} 
                        className={star <= reviewRating ? "fill-white text-white" : "text-zinc-700 hover:text-white"} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea 
                value={reviewComment} 
                onChange={e => setReviewComment(e.target.value)} 
                placeholder="Share your feedback on the fabric, drape, and print..." 
                maxLength={1000} 
                rows={4} 
                className="mc-input mt-4 text-xs" 
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">{reviewComment.length}/1000</span>
                <button onClick={submitReview} disabled={reviewSubmitting} className="mc-btn-primary text-xs">
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {reviewLoading ? (
            <p className="text-xs text-zinc-500 font-mono">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-white/10 p-8 text-center">
              <p className="text-xs text-zinc-400">No reviews yet.</p>
              <p className="mt-1 text-xs text-zinc-600">Be the first to review this monochrome piece.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{review.userName}</p>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={13} 
                            className={star <= review.rating ? "fill-white text-white" : "text-zinc-800"} 
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-zinc-300">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}