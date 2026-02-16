"use client";

import { useState } from "react";

export default function CopyPhoneButton({ phone }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {}
  }

  if (!phone) return null;

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
      title="Copy phone"
    >
      {copied ? "Copied ✅" : "Copy"}
    </button>
  );
}
