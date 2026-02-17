"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import CopyPhoneButton from "@/components/leads/CopyPhoneButton";
import { Phone, MessageCircle } from "lucide-react";

function digitsOnly(phone = "") {
  return String(phone).replace(/[^\d]/g, "");
}

function normalizeKsaNumber(phone) {
  const digits = digitsOnly(phone);
  if (!digits) return null;

  if (digits.startsWith("0")) return "966" + digits.slice(1);
  if (digits.startsWith("966")) return digits;
  if (digits.startsWith("5") && digits.length === 9) return "966" + digits;
  return digits;
}

function makeTelLink(phone) {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  return `tel:${digits}`;
}

function makeWhatsappLink({ phone, buyerName, propertyTitle, propertySlug }) {
  const normalized = normalizeKsaNumber(phone);
  if (!normalized) return null;

  const safeName = (buyerName || "").trim();
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const propertyUrl = propertySlug ? `${siteUrl}/property/${propertySlug}` : siteUrl;

  const msg =
    `${greeting}\n\n` +
    `Thanks for your inquiry about: ${propertyTitle || "the property"}.\n` +
    `Here’s the listing link:\n${propertyUrl}\n\n` +
    `Can I know your preferred time for a viewing?\n` +
    `— Zaeem RealEstate`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`;
}

export default function LeadActions({
  leadId,
  currentStatus,
  phone,
  buyerName,
  propertyTitle,
  propertySlug,
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const telHref = makeTelLink(phone);
  const waHref = makeWhatsappLink({ phone, buyerName, propertyTitle, propertySlug });

  async function markContactedIfNew() {
    if (!leadId) return;
    if (busy) return;
    if (String(currentStatus).trim() !== "new") return;

    setBusy(true);

    const { error } = await supabase
      .from("leads")
      .update({ status: "contacted" })
      .eq("id", leadId);

    setBusy(false);

    if (error) {
      // ✅ You will SEE the real reason (usually RLS)
      alert(`Failed to update lead status: ${error.message}`);
      console.error("Lead status update error:", error);
      return;
    }

    router.refresh();
  }

  async function onWhatsApp() {
    if (!waHref) return;

    // ✅ open immediately so popup blockers don't block it
    window.open(waHref, "_blank", "noreferrer");

    // ✅ then update status
    await markContactedIfNew();
  }

  async function onCall() {
    if (!telHref) return;

    // ✅ update first (call may navigate away)
    await markContactedIfNew();

    window.location.href = telHref;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {telHref ? (
        <button
          type="button"
          onClick={onCall}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
        >
          <Phone className="h-4 w-4" />
          Call
        </button>
      ) : null}

      {waHref ? (
        <button
          type="button"
          onClick={onWhatsApp}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </button>
      ) : null}

      <CopyPhoneButton phone={phone} />
    </div>
  );
}
