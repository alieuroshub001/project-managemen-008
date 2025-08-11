// app/api/employee/tasks/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import connectToDatabase from '../../../../../lib/db';
import Task from '../../../../../models/Task';
import { IApiResponse } from '../../../../../types/index';
import mongoose from 'mongoose';

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Update task (limited to status, actual hours, and comments for employees)
export async function PUT(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employee') {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    if (!isValidObjectId(params.taskId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid task ID'
      }, { status: 400 });
    }

    const {
      status,
      actualHours,
      comment
    } = await request.json();

    await connectToDatabase();

    const task = await Task.findOne({
      _id: params.taskId,
      assignedTo: session.user.id
    });

    if (!task) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Task not found or not assigned to you'
      }, { status: 404 });
    }

    // Update task fields
    if (status) task.status = status;
    if (actualHours !== undefined) task.actualHours = actualHours;

    // Add comment if provided
    if (comment && comment.trim()) {
      task.comments.push({
        content: comment.trim(),
        user: session.user.id
      });
    }

    // If task is being marked as completed, set completedAt
    if (status === 'completed' && task.status !== 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    // Update project progress
    await updateProjectProgress(task.project);

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedTask,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error('PUT employee task error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to update task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function updateProjectProgress(projectId: string) {
  const totalTasks = await Task.countDocuments({ project: projectId });
  const completedTasks = await Task.countDocuments({ 
    project: projectId, 
    status: 'completed' 
  });

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  await Project.findByIdAndUpdate(projectId, { 
    progress,
    updatedAt: new Date()
  });
}