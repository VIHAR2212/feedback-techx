import { getDatabase } from '@/lib/mongodb';
import { GEMSTONE_TIERS } from '@/lib/models';
import { csvCell } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/admin/export — the full observation ledger as CSV.
// Admin-only; src/proxy.ts guards every /api/admin/* path.
//
// Streamed straight off a MongoDB cursor in batches rather than collected
// into an array first. A 20k-explorer event produces on the order of 100k
// rows; buffering those as JS objects and then as one CSV string would blow
// a lambda's memory well before the download started. Streaming keeps
// memory flat regardless of ledger size, and the browser begins saving
// immediately instead of waiting for the whole query.

const HEADER = [
  'Name',
  'Email',
  'Department',
  'Lab',
  'Product ID',
  'Rating',
  'Gemstone',
  'Comment',
  'Timestamp',
];

type Row = {
  studentName?: string;
  studentEmail?: string;
  studentDepartment?: string;
  labId?: string;
  tableId?: string;
  rating?: number;
  comment?: string;
  timestamp?: string | Date;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query: Record<string, unknown> = {};
    const email = searchParams.get('email');
    const productId = searchParams.get('productId');
    const department = searchParams.get('department');
    if (email) query.studentEmail = email.toLowerCase();
    if (productId) query.tableId = productId;
    if (department) query.studentDepartment = department;

    const db = await getDatabase();
    const cursor = db
      .collection<Row>('feedback')
      .find(query, {
        projection: { _id: 0 },
        // Bounded batches keep the driver from materialising the whole
        // result set in the socket buffer.
        batchSize: 500,
      })
      .sort({ timestamp: -1 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      // One document per pull. The stream machinery calls this again as the
      // client drains the response, which is what keeps memory flat however
      // large the ledger grows.
      async pull(controller) {
        try {
          const doc = await cursor.next();
          if (!doc) {
            await cursor.close();
            controller.close();
            return;
          }
          const gem =
            GEMSTONE_TIERS.find((t) => t.tier === doc.rating)?.name ?? String(doc.rating ?? '');
          const line =
            [
              doc.studentName,
              doc.studentEmail,
              doc.studentDepartment,
              doc.labId,
              doc.tableId,
              doc.rating,
              gem,
              doc.comment,
              doc.timestamp instanceof Date ? doc.timestamp.toISOString() : doc.timestamp,
            ]
              .map(csvCell)
              .join(',') + '\n';
          controller.enqueue(encoder.encode(line));
        } catch (err) {
          await cursor.close().catch(() => {});
          controller.error(err);
        }
      },
      async cancel() {
        await cursor.close().catch(() => {});
      },
      start(controller) {
        // UTF-8 BOM so Excel opens accented names correctly.
        controller.enqueue(encoder.encode('﻿' + HEADER.map(csvCell).join(',') + '\n'));
      },
    });

    const stamp = new Date().toISOString().split('T')[0];
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="uncharted-feedback-${stamp}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting feedback:', error);
    return Response.json({ error: 'Failed to export feedback' }, { status: 500 });
  }
}
