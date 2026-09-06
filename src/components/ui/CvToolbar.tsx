"use client";

import Link from "next/link";

export function CvToolbar() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dccfb8] bg-[#f7f1e6]/95 px-4 py-3 backdrop-blur print:hidden">
      <Link href="/" className="font-display text-sm text-[#2c241c]">
        ← Côte Melvyn
      </Link>
      <div className="flex gap-3 text-sm">
        <a href="/cv-melvyn-thierry-bellefond.pdf" className="text-[#5c4a36] underline decoration-[#b08d57]/50">
          PDF
        </a>
        <button type="button" className="text-[#5c4a36]" onClick={() => window.print()}>
          Imprimer
        </button>
      </div>
    </div>
  );
}
