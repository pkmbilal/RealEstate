"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function FavoriteButton({ propertyId }) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setFav(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) setError(error.message);
    setFav(!!data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function toggle(e) {
    // ✅ prevent parent Link from being clicked
    e.preventDefault();
    e.stopPropagation();

    setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);

    if (fav) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", propertyId);

      if (error) setError(error.message);
      else setFav(false);
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        property_id: propertyId,
      });

      if (error) setError(error.message);
      else setFav(true);
    }

    setLoading(false);
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          cursor: "pointer",
        }}
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      >
        {fav ? "❤️" : "🤍"}
      </button>

      {error ? (
        <div style={{ color: "crimson", fontSize: 12 }}>{error}</div>
      ) : null}
    </div>
  );
}
