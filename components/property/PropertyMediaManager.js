"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function PropertyMediaManager({ propertyId }) {
  const supabase = supabaseBrowser();
  const bucket = "property-media";

  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  function publicUrl(path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function load() {
    setError("");
    const { data, error } = await supabase
      .from("property_media")
      .select("id, path, sort_order, created_at")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) setError(error.message);
    setItems(data || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      // next sort order should be after the last one
      const currentMax = items.reduce(
        (max, it) => Math.max(max, Number(it.sort_order) || 0),
        -1
      );
      let nextOrder = currentMax + 1;

      for (const file of files) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const fileName = `${crypto.randomUUID()}-${safeName}`;
        const path = `${propertyId}/${fileName}`;

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase.from("property_media").insert({
          property_id: propertyId,
          media_type: "image",
          path,
          sort_order: nextOrder,
        });
        if (dbErr) throw dbErr;

        nextOrder += 1;
      }

      await load();
      e.target.value = "";
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(mediaId, path) {
    setBusyId(mediaId);
    setError("");

    try {
      const { error: delErr } = await supabase.storage
        .from(bucket)
        .remove([path]);
      if (delErr) throw delErr;

      const { error: dbErr } = await supabase
        .from("property_media")
        .delete()
        .eq("id", mediaId);
      if (dbErr) throw dbErr;

      await load();
    } catch (err) {
      setError(err?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  // ✅ Make selected image cover = sort_order 0, shift others up
  async function setAsCover(mediaId) {
    setBusyId(mediaId);
    setError("");

    try {
      const cover = items.find((x) => x.id === mediaId);
      if (!cover) return;

      // shift every other item up by 1, then set this one to 0
      // (keeps a stable ordering and avoids duplicates)
      for (const it of items) {
        if (it.id === mediaId) continue;
        const { error } = await supabase
          .from("property_media")
          .update({ sort_order: (Number(it.sort_order) || 0) + 1 })
          .eq("id", it.id);
        if (error) throw error;
      }

      const { error: coverErr } = await supabase
        .from("property_media")
        .update({ sort_order: 0 })
        .eq("id", mediaId);
      if (coverErr) throw coverErr;

      await load();
    } catch (err) {
      setError(err?.message || "Set cover failed");
    } finally {
      setBusyId(null);
    }
  }

  // ✅ swap sort_order with previous/next
  async function move(mediaId, dir) {
    setBusyId(mediaId);
    setError("");

    try {
      const idx = items.findIndex((x) => x.id === mediaId);
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;

      const a = items[idx];
      const b = items[swapIdx];

      const aOrder = Number(a.sort_order) || 0;
      const bOrder = Number(b.sort_order) || 0;

      // swap orders
      const { error: e1 } = await supabase
        .from("property_media")
        .update({ sort_order: bOrder })
        .eq("id", a.id);
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("property_media")
        .update({ sort_order: aOrder })
        .eq("id", b.id);
      if (e2) throw e2;

      await load();
    } catch (err) {
      setError(err?.message || "Reorder failed");
    } finally {
      setBusyId(null);
    }
  }

  const coverId = items.length ? items[0].id : null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Images</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onUpload}
          disabled={uploading}
        />
      </div>

      {uploading ? (
        <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {!items.length ? (
        <p className="mt-3 text-sm text-muted-foreground">No images yet.</p>
      ) : (
        <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m, i) => (
            <div
              key={m.id}
              className="rounded-xl border bg-background overflow-hidden"
            >
              <img
                src={publicUrl(m.path)}
                alt="Property"
                className="w-full h-32 object-cover"
              />

              <div className="p-2 flex flex-col gap-2">
                {m.id === coverId ? (
                  <div className="text-xs font-semibold text-primary">
                    ⭐ Cover
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Order: {m.sort_order}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                    disabled={busyId === m.id || m.id === coverId}
                    onClick={() => setAsCover(m.id)}
                  >
                    Set cover
                  </button>

                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                    disabled={busyId === m.id || i === 0}
                    onClick={() => move(m.id, "up")}
                  >
                    Up
                  </button>

                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                    disabled={busyId === m.id || i === items.length - 1}
                    onClick={() => move(m.id, "down")}
                  >
                    Down
                  </button>

                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                    disabled={busyId === m.id}
                    onClick={() => remove(m.id, m.path)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
