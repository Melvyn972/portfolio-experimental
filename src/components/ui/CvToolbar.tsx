"use client";

import Link from "next/link";

export function CvToolbar() {
  return (
    <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-[#f7f5f0]/95 px-4 py-3 backdrop-blur md:px-8">
      <Link href="/" className="font-mono text-xs tracking-wider uppercase text-[#6b5a2a]">
        ← Retour à l&apos;atelier
      </Link>
      <div className="flex gap-2">
        <a
          href="/cv-melvyn-thierry-bellefond.pdf"
          download
          className="rounded-full bg-[#c9a227] px-4 py-2 font-mono text-[11px] tracking-wider text-[#12141a] uppercase"
        >
          PDF
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border border-black/20 px-4 py-2 font-mono text-[11px] tracking-wider uppercase"
        >
          Imprimer
        </button>
      </div>
    </div>
  );
}
