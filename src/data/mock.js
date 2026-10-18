export const avatars = Array.from({ length: 40 }, (_, i) => {
  const packs = ["Cyberpunk", "Anime", "Geometric Mascots", "Retro Pop"];
  return {
    id: i + 1,
    title: `${packs[i % 4]} Avatar ${String(i + 1).padStart(2, "0")}`,
    category: packs[i % 4],
    imageUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=metacloth-${i + 1}`
  };
});

export const curatedDrops = [
  {
    id: "drop-01",
    title: "VOID ARCHIVE 01",
    subtitle: "Minimal Brutalism",
    textMark: "VOID",
    subMark: "ARCHIVE 01",
    author: "B&D Studio",
    price: 999
  },
  {
    id: "drop-02",
    title: "TOKYO NOIR KANJI",
    subtitle: "East Meets Dark",
    textMark: "東京",
    subMark: "NOIR EDITION",
    author: "B&D Studio",
    price: 999
  },
  {
    id: "drop-03",
    title: "BRUTALIST CIPHER",
    subtitle: "Technical Streetwear",
    textMark: "B & D",
    subMark: "// 240 GSM",
    author: "B&D Studio",
    price: 999
  }
];

export const products = [
  {
    id: 1, name: "B&D Void Oversized Tee", garmentType: "OVERSIZED", basePrice: 999,
    description: "240 GSM heavyweight combed cotton in our signature drop-shoulder boxy cut with high-contrast DTF graphic.",
    tags: ["Drop 01", "Best Seller"], customizable: false,
    variants: [
      { id: 101, colorName: "Noir Black", colorHex: "#0B0B0C", size: "L", stock: 25, image: "https://placehold.co/900x1100/0B0B0C/F4F4F5?text=B%26D+VOID" },
      { id: 102, colorName: "Chalk White", colorHex: "#F7F7F8", size: "L", stock: 20, image: "https://placehold.co/900x1100/F7F7F8/0B0B0C?text=B%26D+VOID" }
    ]
  },
  {
    id: 2, name: "B&D Tokyo Noir Kanji Tee", garmentType: "OVERSIZED", basePrice: 999,
    description: "Minimalist brutalist typography celebrating Tokyo streetwear culture. 240 GSM premium Tirupur cotton.",
    tags: ["Drop 02", "Oversized"], customizable: false,
    variants: [
      { id: 201, colorName: "Noir Black", colorHex: "#0B0B0C", size: "M", stock: 30, image: "https://placehold.co/900x1100/0B0B0C/F4F4F5?text=TOKYO+NOIR" },
      { id: 202, colorName: "Chalk White", colorHex: "#F7F7F8", size: "XL", stock: 15, image: "https://placehold.co/900x1100/F7F7F8/0B0B0C?text=TOKYO+NOIR" }
    ]
  },
  {
    id: 3, name: "B&D Heavy Fleece Hoodie", garmentType: "HOODIE", basePrice: 1699,
    description: "380 GSM ultra-heavyweight brushed fleece hoodie. Roomy streetwear drape with double-lined hood.",
    tags: ["Heavyweight", "Winter"], customizable: false,
    variants: [
      { id: 301, colorName: "Noir Black", colorHex: "#0B0B0C", size: "L", stock: 12, image: "https://placehold.co/900x1100/0B0B0C/F4F4F5?text=B%26D+HOODIE" }
    ]
  },
  {
    id: 4, name: "B&D Atelier Custom Tee", garmentType: "OVERSIZED", basePrice: 999,
    description: "240 GSM blank canvas ready for your custom graphic with high-definition DTF print from Tirupur.",
    tags: ["Atelier", "Custom"], customizable: true,
    variants: [
      { id: 401, colorName: "Noir Black", colorHex: "#0B0B0C", size: "M", stock: 50, image: "https://placehold.co/900x1100/0B0B0C/F4F4F5?text=B%26D+ATELIER" },
      { id: 402, colorName: "Chalk White", colorHex: "#F7F7F8", size: "M", stock: 50, image: "https://placehold.co/900x1100/F7F7F8/0B0B0C?text=B%26D+ATELIER" }
    ]
  }
];

export const garmentOptions = [
  { type: "OVERSIZED", label: "Oversized Boxy Tee", gsm: "240 GSM", price: 999, description: "Drop-shoulder relaxed streetwear cut" },
  { type: "ROUND_NECK", label: "Classic Round Neck", gsm: "220 GSM", price: 849, description: "Standard daily essential cut" },
  { type: "HOODIE", label: "Fleece Hoodie", gsm: "380 GSM", price: 1699, description: "Heavyweight brushed fleece" }
];

export const colors = [
  { name: "Noir Black", hex: "#0B0B0C", gsm: "240 GSM", category: "Monochrome" },
  { name: "Chalk White", hex: "#F7F7F8", gsm: "240 GSM", category: "Monochrome" },
  { name: "Vintage Charcoal", hex: "#222226", gsm: "240 GSM", category: "Monochrome" },
  { name: "Raw Bone / Ecru", hex: "#EAE7DF", gsm: "240 GSM", category: "Monochrome" }
];

export const sizes = ["S", "M", "L", "XL", "XXL"];

export const zones = [
  { id: "BACK_FULL", label: "Back Full" },
  { id: "CHEST_CENTER", label: "Chest Center" },
  { id: "POCKET_LEFT", label: "Pocket Left" }
];