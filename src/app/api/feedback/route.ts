import { NextResponse } from 'next/server';
import { saveFeedback, updateUserProgress } from '@/lib/services';

// POST /api/feedback — submit one discovery (feedback entry). Mirrors the
// original Minecraft signature so seniors can swap mock -> MongoDB without
// touching this file.
export async function POST(request: Request) {
  try {
    const newFeedback = await request.json();
    const saved = await saveFeedback(newFeedback);
    await updateUserProgress(newFeedback.studentEmail, newFeedback.tableId, {
      name: newFeedback.studentName,
      department: newFeedback.studentDepartment,
    });
    return NextResponse.json(
      { message: 'Discovery logged successfully', id: saved._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      {
        message: 'Error submitting discovery.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
