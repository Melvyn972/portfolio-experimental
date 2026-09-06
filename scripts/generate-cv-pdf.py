from pathlib import Path

lines = [
    ("Melvyn Thierry-Bellefond", 16),
    ("Developpeur Full-Stack & Expert IT", 11),
    ("", 10),
    ("Gennevilliers / Ile-de-France", 10),
    ("~22 ans  |  Permis A et B, vehicule", 10),
    ("melvyn.thierrybellefond@gmail.com", 10),
    ("GitHub: Melvyn972", 10),
    ("LinkedIn: melvyn-thierry-bellefond", 10),
    ("", 10),
    ("PROFIL", 12),
    ("Concepteur, deployeur et pilote de solutions", 10),
    ("numeriques sur-mesure pour PME, commerces", 10),
    ("et equipes multisites.", 10),
    ("Double culture tech + mecanique: demonter,", 10),
    ("diagnostiquer, optimiser, remonter plus propre.", 10),
    ("Ambition: couteau suisse IT des PME.", 10),
    ("", 10),
    ("EXPERIENCES", 12),
    ("2024-2027  Alternance", 10),
    ("Developpeur Web & Charge de Missions IT", 10),
    ("Passion Beaute (~100 magasins)", 10),
    ("- E-ResaPB & VDAPB (Symfony/React/MySQL/Redis)", 10),
    ("- Support TeamViewer multisite, budget IT", 10),
    ("- Migration Free Pro B2B 12 PDV (-66%)", 10),
    ("", 10),
    ("2023-2024  Alternance - Developpeur PHP", 10),
    ("Prisma Media", 10),
    ("", 10),
    ("2022-2023  Alternance - Webmaster", 10),
    ("Search Artisan (WP/Webflow/SEO Ads)", 10),
    ("", 10),
    ("PROJETS CLES", 12),
    ("VDAPB - Symfony 7 + React 18 (BDC, DN, factures)", 10),
    ("E-ResaPB - Click & Collect (93 magasins)", 10),
    ("Migration Free Pro / Planning RH + Intranet", 10),
    ("HubAnimal (TS) / ArtWise (Twig)", 10),
    ("CynaStoreWeb (Next.js 14, Prisma, Stripe)", 10),
    ("Cold Call Agency (freelance)", 10),
    ("", 10),
    ("COMPETENCES", 12),
    ("Front: HTML/CSS/JS/TS/React/Vue/Vite/Tailwind", 10),
    ("Back: PHP/Symfony/Express/Nest/API Platform", 10),
    ("Data: MySQL/SQLite/Redis/Supabase/Neon", 10),
    ("Outils: Figma/DataGrip/Power BI/GitHub/Docker", 10),
    ("Infra: O2switch/cPanel, VLAN, fibre/4G/5G", 10),
    ("Pilotage IT, SEO/CMS, Ads, Search Console", 10),
    ("", 10),
    ("FORMATION", 12),
    ("2025-2027  Mastere Lead Dev Full-Stack - IIM", 10),
    ("Bachelor Coordinateur de Projets Informatiques", 10),
    ("BTS SIO SLAM", 10),
    ("", 10),
    ("Freelance (auto-entreprise):", 10),
    ("melvyn.thierrybellefond@gmail.com", 10),
]


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


parts = ["BT"]
first = True
for text, size in lines:
    leading = -20 if size >= 14 else (-16 if size >= 12 else -13)
    if first:
        parts.append(f"/F1 {size} Tf 48 800 Td ({esc(text)}) Tj")
        first = False
    else:
        parts.append(f"0 {leading} Td /F1 {size} Tf ({esc(text)}) Tj")
parts.append("ET")
stream = "\n".join(parts).encode("latin-1", errors="replace")

objects = [
    b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    (
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
    ),
    b"4 0 obj<< /Length %d >>stream\n" % len(stream) + stream + b"\nendstream\nendobj\n",
    b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
]

out = bytearray(b"%PDF-1.4\n")
offsets = [0]
for obj in objects:
    offsets.append(len(out))
    out.extend(obj)
xref = len(out)
out.extend(b"xref\n0 %d\n" % (len(objects) + 1))
out.extend(b"0000000000 65535 f \n")
for off in offsets[1:]:
    out.extend(b"%010d 00000 n \n" % off)
out.extend(
    b"trailer<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n"
    % (len(objects) + 1, xref)
)
path = Path("public/cv-melvyn-thierry-bellefond.pdf")
path.write_bytes(out)
print("Wrote", path, path.stat().st_size)
