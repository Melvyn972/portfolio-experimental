import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://melvynthierrybellefond.xyz"),
  title: {
    default: "Côte Melvyn — Melvyn Thierry-Bellefond",
    template: "%s · Côte Melvyn",
  },
  description:
    "Portfolio-jeu cinématique méditerranéen. Melvyn Thierry-Bellefond — Développeur Full-Stack & Expert IT. Conduit, explore, découvre.",
  keywords: [
    "Melvyn Thierry-Bellefond",
    "développeur full-stack",
    "portfolio interactif",
    "React Three Fiber",
    "Côte Melvyn",
    "freelance IT",
    "PME",
  ],
  authors: [{ name: "Melvyn Thierry-Bellefond" }],
  creator: "Melvyn Thierry-Bellefond",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Côte Melvyn",
    title: "Côte Melvyn — Melvyn Thierry-Bellefond",
    description:
      "Une route côtière méditerranéenne à explorer. Développeur Full-Stack & Expert IT — solutions numériques pour PME.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Côte Melvyn — Melvyn Thierry-Bellefond",
    description: "Portfolio-jeu cinématique méditerranéen. Conduisez, descendez, explorez le belvédère.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icons/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#c8dde8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
