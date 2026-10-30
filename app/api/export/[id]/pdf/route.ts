import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { PdfReportDocument } from "@/components/export/PdfReportDocument";
import {
  getResearchExportPayload,
  buildExportPayloadFromClient,
} from "@/lib/export-data";
import { exportClientPayloadSchema, type ResearchSummaryPayload } from "@/types/export";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

async function generatePdfResponse(reportPayload: ResearchSummaryPayload, id: string) {
  const element = React.createElement(PdfReportDocument, {
    report: reportPayload,
  }) as unknown as React.ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);
  const safeFilename = `causality-search-dossier-${id.slice(0, 16)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = await checkRateLimit(request, "export_pdf");
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Investigation ID is required" }, { status: 400 });
    }

    const reportPayload = await getResearchExportPayload(id);
    return await generatePdfResponse(reportPayload, id);
  } catch (error: unknown) {
    console.error("[ExportPdfRoute] GET PDF failure:", error);
    return NextResponse.json({ error: "Failed to compile PDF dossier" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = await checkRateLimit(request, "export_pdf");
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Investigation ID is required" }, { status: 400 });
    }

    let reportPayload: ResearchSummaryPayload | null = null;
    try {
      const body = await request.json();
      const parseResult = exportClientPayloadSchema.safeParse(body);
      if (parseResult.success) {
        reportPayload = buildExportPayloadFromClient(id, parseResult.data);
      }
    } catch {
      // Body empty or malformed; fall back to database
    }

    if (!reportPayload) {
      reportPayload = await getResearchExportPayload(id);
    }

    return await generatePdfResponse(reportPayload, id);
  } catch (error: unknown) {
    console.error("[ExportPdfRoute] POST PDF failure:", error);
    return NextResponse.json({ error: "Failed to compile PDF dossier" }, { status: 500 });
  }
}
