import { NextResponse } from 'next/server';
import { saveFeedback, updateUserProgress, DuplicateFeedbackError } from '@/lib/services';
import { getProductById } from '@/lib/mock-data';

function asString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// POST /api/feedback — submit one discovery (feedback entry).
// Server-side validation: the product must exist, rating must be 1–5,
// timestamps are always generated server-side (client values ignored).
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const tableId = asString(body?.tableId, 64);
    if (!tableId || !getProductById(tableId)) {
      return NextResponse.json(
        { message: 'Unknown product id.' },
        { status: 400 }
      );
    }

    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

    const studentEmail = asString(body?.studentEmail, 120);
    if (!studentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      return NextResponse.json(
        { message: 'A valid student email is required.' },
        { status: 400 }
      );
    }

    const submissionId = asString(body?.submissionId, 64) || undefined;

    const saved = await saveFeedback({
      submissionId,
      studentName: asString(body?.studentName, 80) || 'Anonymous Explorer',
      studentEmail,
      studentDepartment: asString(body?.studentDepartment, 80),
      labId: getProductById(tableId)!.lab.labId,
      tableId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comment: asString(body?.comment, 1000),
      timestamp: new Date().toISOString(),
    });

    await updateUserProgress(studentEmail, tableId, {
      name: saved.studentName,
      department: saved.studentDepartment,
    });

    return NextResponse.json(
      { message: 'Discovery logged successfully', id: saved._id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DuplicateFeedbackError) {
      return NextResponse.json(
        { message: 'You already logged a discovery for this product.' },
        { status: 409 }
      );
    }
    console.error('API Route Error:', error);
    return NextResponse.json(
      { message: 'Error submitting discovery.' },
      { status: 500 }
    );
  }
}
