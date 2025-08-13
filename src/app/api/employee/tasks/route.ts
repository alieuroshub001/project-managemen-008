// app/api/employee/tasks/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { IApiResponse } from '@/types';

interface SessionUser {
  id: string;
  role: string;
  email?: string;
}
interface SessionData {
  user: SessionUser;
}

interface TaskQuery {
  assignedTo: string;
  status?: string;
  project?: string;
}

export async function GET(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionData | null;
    if (!session?.user || session.user.role !== 'employee') {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized',
      }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const projectId = searchParams.get('projectId') ?? undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build query for tasks assigned to the employee
    const query: TaskQuery = { assignedTo: session.user.id };
    if (status) query.status = status;
    if (projectId) query.project = projectId;

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(query);

    return NextResponse.json<IApiResponse>({
      success: true,
      data: { tasks, page, limit, total },
      message: 'Tasks fetched successfully',
    });

  } catch (error) {
    console.error('GET employee tasks error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch tasks',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
