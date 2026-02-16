"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function PropertyMediaManager({ propertyId }) {
  const supabase = supabaseBrowser();
  const bucket = "property-media";

  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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

  function publicUrl(path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const fileName = `${crypto.randomUUID()}-${safeName}`;
        const path = `${propertyId}/${fileName}`;

        // 1) upload to Storage
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (upErr) throw upErr;

        // 2) insert into DB table
        const { error: dbErr } = await supabase.from("property_media").insert({
          property_id: propertyId,
          media_type: "image",
          path,
          sort_order: 0,
        });

        if (dbErr) throw dbErr;
      }

      await load();
      e.target.value = "";
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(mediaId, path) {
    setError("");

    // delete from storage first
    const { error: delErr } = await supabase.storage.from(bucket).remove([path]);
    if (delErr) return setError(delErr.message);

    // delete from db
    const { error: dbErr } = await supabase.from("property_media").delete().eq("id", mediaId);
    if (dbErr) return setError(dbErr.message);

    await load();
  }

  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ fontWeight: 800, marginBottom: 10 }}>Images</h3>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onUpload}
        disabled={uploading}
      />

      {uploading ? <p style={{ marginTop: 8 }}>Uploading...</p> : null}
      {error ? <p style={{ color: "crimson", marginTop: 8 }}>{error}</p> : null}

      {!items.length ? (
        <p style={{ marginTop: 12, opacity: 0.75 }}>No images yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", marginTop: 12 }}>
          {items.map((m) => (
            <div key={m.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
              <img
                src={publicUrl(m.path)}
                alt="Property"
                style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8 }}
              />
              <button
                onClick={() => remove(m.id, m.path)}
                style={{ marginTop: 8, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
