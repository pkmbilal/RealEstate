"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PropertyGallery({ images = [] }) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [active, setActive] = useState(0);

  const hasImages = safeImages.length > 0;
  const canPrev = active > 0;
  const canNext = active < safeImages.length - 1;

  function prev() {
    setActive((i) => Math.max(0, i - 1));
  }

  function next() {
    setActive((i) => Math.min(safeImages.length - 1, i + 1));
  }

  if (!hasImages) return null;

  return (
    <div className="mt-4 space-y-3">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        <img
          src={safeImages[active]}
          alt="Property"
          className="w-full h-[220px] sm:h-[320px] md:h-[420px] object-cover"
        />

        {/* Arrows */}
        {safeImages.length > 1 ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={prev}
              disabled={!canPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={next}
              disabled={!canNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}
      </div>

      {/* Thumbnails (clickable) */}
      {safeImages.length > 1 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          {safeImages.map((url, idx) => (
            <button
              key={url + idx}
              type="button"
              onClick={() => setActive(idx)}
              className={`overflow-hidden rounded-xl border bg-muted text-left transition ${
                idx === active ? "ring-2 ring-primary" : "hover:opacity-90"
              }`}
            >
              <img src={url} alt="Thumb" className="w-full h-24 object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
