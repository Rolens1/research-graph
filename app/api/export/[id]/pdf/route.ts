import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { PdfReportDocument } from "@/components/export/PdfReportDocument";
import { getResearchExportPayload } from "@/lib/export-data";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = await checkRateLimit(_request, "export_pdf");
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Investigation ID is required" }, { status: 400 });
    }

    // Assemble the complete research summary payload (database or mock fallback)
    const reportPayload = await getResearchExportPayload(id);

    // Compile vector PDF buffer using React PDF renderer
    const element = React.createElement(PdfReportDocument, {
      report: reportPayload,
    }) as unknown as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);
    const safeFilename = `chronocause-dossier-${id.slice(0, 16)}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    // Mask internal error details from response body
    const message = "Failed to compile PDF dossier. Please try again later.";
    console.error("[ExportPdfRoute] PDF generation failure:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
