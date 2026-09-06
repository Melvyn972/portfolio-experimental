"use client";

import Link from "next/link";

/**
 * Mobile: primary action is the HTML CV; PDF is an explicit download
 * (Content-Disposition: attachment) — never force an inline PDF viewer.
 */
export function CvToolbar() {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-black/10 bg-[#f7f5f0]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="font-mono text-xs tracking-wider uppercase text-[#6b5a2a]">
          ← Retour à l&apos;atelier
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/cv-pdf"
            className="inline-flex min-h-11 items-center rounded-full bg-[#c9a227] px-4 py-2 font-mono text-[11px] tracking-wider text-[#12141a] uppercase"
          >
            Télécharger PDF
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center rounded-full border border-black/20 px-4 py-2 font-mono text-[11px] tracking-wider uppercase"
          >
            Imprimer
          </button>
        </div>
      </div>
      <p className="mx-auto max-w-3xl px-4 pb-3 font-mono text-[10px] leading-relaxed text-[#5a6478] md:px-6 md:hidden">
        Sur mobile, lisez le CV ci-dessous. Le PDF se télécharge (pas d&apos;aperçu intégré).
      </p>
    </div>
  );
}
