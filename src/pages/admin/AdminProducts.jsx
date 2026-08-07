import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const emptyVariant = {
  colorName: "",
  colorHex: "#000000",
  size: "M",
  stockQuantity: 0,
  mockupFrontUrl: "",
  mockupBackUrl: ""
};

export default function AdminProducts({ notify }) {

  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    garmentType: "ROUND_NECK",
    basePrice: "",
    printSurcharge: 0,
    customizable: true,
    variants: [
      { ...emptyVariant }
    ]
  });

  async function load() {

    const data = await api.getProducts();

    setProducts(data);
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {

    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function updateVariant(index, field, value) {

    setForm(prev => {

      const variants = [...prev.variants];

      variants[index] = {
        ...variants[index],
        [field]: value
      };

      return {
        ...prev,
        variants
      };
    });
  }

  function addVariant() {

    setForm(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { ...emptyVariant }
      ]
    }));
  }

  async function submit(e) {

    e.preventDefault();

    try {

      await api.createProduct({
        ...form,
        basePrice: Number(form.basePrice),
        printSurcharge: Number(form.printSurcharge),
        variants: form.variants.map(v => ({
          ...v,
          stockQuantity: Number(v.stockQuantity)
        }))
      });

      notify("Product created");

      setForm({
        name: "",
        description: "",
        garmentType: "ROUND_NECK",
        basePrice: "",
        printSurcharge: 0,
        customizable: true,
        variants: [{ ...emptyVariant }]
      });

      load();

    } catch (error) {

      notify(error.message);

    }
  }

  return (

    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-black">
          Products
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Manage your MetaCloth catalog.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-white/10 bg-[#18181B] p-6"
      >

        <h2 className="text-xl font-bold">
          Add Product
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <input
            placeholder="Product name"
            value={form.name}
            onChange={e => update("name", e.target.value)}
            className="mc-input"
            required
          />

          <select
            value={form.garmentType}
            onChange={e => update("garmentType", e.target.value)}
            className="mc-input"
          >
            <option value="ROUND_NECK">Round Neck</option>
            <option value="OVERSIZED">Oversized</option>
            <option value="HOODIE">Hoodie</option>
            <option value="ACID_WASH">Acid Wash</option>
            <option value="SPORTS">Sports</option>
          </select>

          <input
            type="number"
            placeholder="Base price"
            value={form.basePrice}
            onChange={e => update("basePrice", e.target.value)}
            className="mc-input"
            required
          />

          <input
            type="number"
            placeholder="Print surcharge"
            value={form.printSurcharge}
            onChange={e => update("printSurcharge", e.target.value)}
            className="mc-input"
          />

        </div>

        <textarea
          placeholder="Product description"
          value={form.description}
          onChange={e => update("description", e.target.value)}
          className="mc-input mt-4 min-h-28 w-full"
        />

        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.customizable}
            onChange={e => update("customizable", e.target.checked)}
          />
          Customizable
        </label>

        <div className="mt-8">

          <div className="flex items-center justify-between">

            <h3 className="font-semibold">
              Variants
            </h3>

            <button
              type="button"
              onClick={addVariant}
              className="mc-btn-ghost"
            >
              + Add variant
            </button>

          </div>

          <div className="mt-4 space-y-4">

            {form.variants.map((variant, index) => (

              <div
                key={index}
                className="rounded-xl border border-white/10 p-4"
              >

                <div className="grid gap-3 md:grid-cols-3">

                  <input
                    placeholder="Color"
                    value={variant.colorName}
                    onChange={e =>
                      updateVariant(
                        index,
                        "colorName",
                        e.target.value
                      )
                    }
                    className="mc-input"
                    required
                  />

                  <input
                    type="text"
                    placeholder="#000000"
                    value={variant.colorHex}
                    onChange={e =>
                      updateVariant(
                        index,
                        "colorHex",
                        e.target.value
                      )
                    }
                    className="mc-input"
                    required
                  />

                  <select
                    value={variant.size}
                    onChange={e =>
                      updateVariant(
                        index,
                        "size",
                        e.target.value
                      )
                    }
                    className="mc-input"
                  >
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                    <option>XXL</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Stock"
                    value={variant.stockQuantity}
                    onChange={e =>
                      updateVariant(
                        index,
                        "stockQuantity",
                        e.target.value
                      )
                    }
                    className="mc-input"
                  />

                  <input
                    placeholder="Front image URL"
                    value={variant.mockupFrontUrl}
                    onChange={e =>
                      updateVariant(
                        index,
                        "mockupFrontUrl",
                        e.target.value
                      )
                    }
                    className="mc-input md:col-span-2"
                    required
                  />

                  <input
                    placeholder="Back image URL"
                    value={variant.mockupBackUrl}
                    onChange={e =>
                      updateVariant(
                        index,
                        "mockupBackUrl",
                        e.target.value
                      )
                    }
                    className="mc-input md:col-span-3"
                  />

                </div>

              </div>

            ))}

          </div>

        </div>

        <button
          type="submit"
          className="mc-btn-primary mt-6"
        >
          Create Product
        </button>

      </form>

      <div className="space-y-3">

        {products.map(product => (

          <div
            key={product.id}
            className="flex items-center justify-between rounded-xl border border-white/10 p-4"
          >

            <div>
              <div className="font-semibold">
                {product.name}
              </div>

              <div className="text-xs text-zinc-500">
                ₹{product.basePrice}
              </div>
            </div>

            <div className="text-xs text-zinc-500">
              {product.active ? "Active" : "Inactive"}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}