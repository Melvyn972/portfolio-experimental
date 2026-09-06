import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/** Force attachment so mobile browsers download instead of opening a broken inline PDF viewer. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "cv-melvyn-thierry-bellefond.pdf");
  const data = await readFile(filePath);

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cv-melvyn-thierry-bellefond.pdf"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}
