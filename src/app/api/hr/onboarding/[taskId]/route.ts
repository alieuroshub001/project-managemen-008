import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import OnboardingTask from '@/models/OnboardingTask';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Update onboarding task
export async function PUT(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

    await connectToDatabase();

    const task = await OnboardingTask.findById(params.taskId);
    if (!task) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Task not found'
      }, { status: 404 });
    }

    // Only HR/admins or the assigned user can update
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role) && 
        task.assignedTo.toString() !== session.user.id) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to update this task'
      }, { status: 403 });
    }

    const {
      title,
      description,
      dueDate,
      completed
    } = await request.json();

    // HR/admins can update all fields
    if (['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      if (title) task.title = title;
      if (description) task.description = description;
      if (dueDate) task.dueDate = new Date(dueDate);
    }

    // Assigned user can only mark as completed
    if (completed !== undefined) {
      task.completed = completed;
      task.completedAt = completed ? new Date() : undefined;
    }

    await task.save();

    const populatedTask = await OnboardingTask.findById(task._id)
      .populate('employeeId', 'name email')
      .populate('assignedTo', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedTask,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error('PUT onboarding task error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to update task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete onboarding task
export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

    await connectToDatabase();

    // Only HR/admins can delete tasks
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to delete tasks'
      }, { status: 403 });
    }

    await OnboardingTask.findByIdAndDelete(params.taskId);

    return NextResponse.json<IApiResponse>({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('DELETE onboarding task error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}