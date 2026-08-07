export const avatars = Array.from({ length: 40 }, (_, i) => {
  const packs = ["Cyberpunk", "Anime", "Geometric Mascots", "Retro Pop"];
  return {
    id: i + 1,
    title: `${packs[i % 4]} Avatar ${String(i + 1).padStart(2, "0")}`,
    category: packs[i % 4],
    imageUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=metacloth-${i + 1}`
  };
});

export const products = [
  {
    id: 1, name: "MC Signal Tee", garmentType: "ROUND_NECK", basePrice: 899,
    description: "Premium heavyweight cotton with the signature MC signal mark.",
    tags: ["Best Seller", "Everyday"], customizable: false,
    variants: [
      { id: 101, colorName: "Obsidian", colorHex: "#101014", size: "M", stock: 18, image: "https://placehold.co/900x1100/101014/F4F4F5?text=MC+SIGNAL" },
      { id: 102, colorName: "Slate", colorHex: "#29292E", size: "L", stock: 14, image: "https://placehold.co/900x1100/29292E/F4F4F5?text=MC+SIGNAL" }
    ]
  },
  {
    id: 2, name: "After Dark Oversized", garmentType: "OVERSIZED", basePrice: 1199,
    description: "Relaxed oversized silhouette designed for premium streetwear styling.",
    tags: ["Oversized", "New"], customizable: false,
    variants: [
      { id: 201, colorName: "Black", colorHex: "#111111", size: "M", stock: 21, image: "https://placehold.co/900x1100/111111/F4F4F5?text=AFTER+DARK" },
      { id: 202, colorName: "Stone", colorHex: "#77746C", size: "L", stock: 11, image: "https://placehold.co/900x1100/77746C/111111?text=AFTER+DARK" }
    ]
  },
  {
    id: 3, name: "Violet Circuit Hoodie", garmentType: "HOODIE", basePrice: 1699,
    description: "Heavy fleece hoodie with a subtle cyber-violet circuit graphic.",
    tags: ["Premium", "Hoodie"], customizable: false,
    variants: [
      { id: 301, colorName: "Black", colorHex: "#111114", size: "L", stock: 9, image: "https://placehold.co/900x1100/111114/F4F4F5?text=VIOLET+CIRCUIT" }
    ]
  },
  {
    id: 4, name: "MC Studio Base Tee", garmentType: "ROUND_NECK", basePrice: 749,
    description: "Clean customizer-ready base tee for your personalized MC Studio design.",
    tags: ["Customize"], customizable: true,
    variants: [
      { id: 401, colorName: "Obsidian", colorHex: "#0B0B0C", size: "M", stock: 30, image: "https://placehold.co/900x1100/0B0B0C/F4F4F5?text=MC+STUDIO" },
      { id: 402, colorName: "White", colorHex: "#E7E5E4", size: "M", stock: 30, image: "https://placehold.co/900x1100/E7E5E4/18181B?text=MC+STUDIO" },
      { id: 403, colorName: "Violet", colorHex: "#7C3AED", size: "M", stock: 16, image: "https://placehold.co/900x1100/7C3AED/FFFFFF?text=MC+STUDIO" }
    ]
  }
];

export const garmentOptions = [
  { type: "ROUND_NECK", label: "Round Neck", price: 749 },
  { type: "OVERSIZED", label: "Oversized", price: 899 },
  { type: "HOODIE", label: "Hoodie", price: 1499 },
  { type: "ACID_WASH", label: "Acid Wash", price: 1099 },
  { type: "SPORTS", label: "Sports Jersey", price: 999 }
];

export const colors = [
  { name: "Obsidian", hex: "#0B0B0C" },
  { name: "Slate", hex: "#29292E" },
  { name: "Stone", hex: "#A8A29E" },
  { name: "White", hex: "#F4F4F5" },
  { name: "Violet", hex: "#7C3AED" }
];

export const sizes = ["S", "M", "L", "XL", "XXL"];
export const zones = [
  { id: "CHEST_CENTER", label: "Chest Center" },
  { id: "POCKET_LEFT", label: "Pocket Left" },
  { id: "BACK_FULL", label: "Back Full" }
];