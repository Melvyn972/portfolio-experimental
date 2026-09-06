import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
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
    default: "Melvyn Thierry-Bellefond — Atelier Mécanique Digitale",
    template: "%s · Melvyn Thierry-Bellefond",
  },
  description:
    "Développeur Full-Stack & Expert IT. Portfolio immersif 3D — concepteur, déployeur et pilote de solutions numériques sur-mesure pour PME, commerces et équipes multisites.",
  keywords: [
    "développeur full-stack",
    "freelance",
    "React",
    "Symfony",
    "Next.js",
    "Melvyn Thierry-Bellefond",
    "Gennevilliers",
    "auto-entreprise",
  ],
  authors: [{ name: "Melvyn Thierry-Bellefond" }],
  creator: "Melvyn Thierry-Bellefond",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Atelier Mécanique Digitale",
    title: "Melvyn Thierry-Bellefond — Développeur Full-Stack & Expert IT",
    description:
      "Entrez dans l'atelier : un univers 3D où tech et mécanique se rencontrent. Sites, apps métier, TMA, SEO, infra.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Melvyn Thierry-Bellefond — Atelier Mécanique Digitale",
    description:
      "Portfolio immersif 3D d'un développeur full-stack & expert IT. Couteau suisse IT des PME.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
