import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminAvatars({ notify }) {

  const [avatars, setAvatars] = useState([]);

  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    category: "PRESET_PHASE_1"
  });

  async function load() {

    const data = await api.getAvatars();

    setAvatars(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {

    e.preventDefault();

    try {

      await api.createAvatar(form);

      notify("Avatar created");

      setForm({
        title: "",
        imageUrl: "",
        category: "PRESET_PHASE_1"
      });

      load();

    } catch (error) {

      notify(error.message);

    }
  }

  return (

    <div>

      <h1 className="text-3xl font-black">
        Avatars
      </h1>

      <form
        onSubmit={submit}
        className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-[#18181B] p-6"
      >

        <h2 className="font-bold">
          Add Avatar
        </h2>

        <div className="mt-5 space-y-4">

          <input
            placeholder="Avatar title"
            value={form.title}
            onChange={e =>
              setForm({
                ...form,
                title: e.target.value
              })
            }
            className="mc-input w-full"
            required
          />

          <input
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={e =>
              setForm({
                ...form,
                imageUrl: e.target.value
              })
            }
            className="mc-input w-full"
            required
          />

          <input
            placeholder="Category"
            value={form.category}
            onChange={e =>
              setForm({
                ...form,
                category: e.target.value
              })
            }
            className="mc-input w-full"
          />

          <button className="mc-btn-primary">
            Add Avatar
          </button>

        </div>

      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {avatars.map(avatar => (

          <div
            key={avatar.id}
            className="overflow-hidden rounded-2xl border border-white/10"
          >

            <img
              src={avatar.imageUrl}
              alt={avatar.title}
              className="aspect-square w-full object-cover"
            />

            <div className="p-4">

              <div className="font-semibold">
                {avatar.title}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                {avatar.category}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}