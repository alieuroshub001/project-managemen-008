import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import OnboardingTask from '@/models/OnboardingTask';
import User from '@/models/User';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Get onboarding tasks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const assignedTo = searchParams.get('assignedTo');
    const completed = searchParams.get('completed');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // For non-HR/admins, only show tasks assigned to them or for their own onboarding
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      query.$or = [
        { assignedTo: session.user.id },
        { employeeId: session.user.id }
      ];
    } else {
      // HR/admins can filter by specific employee or assignee
      if (employeeId && isValidObjectId(employeeId)) {
        query.employeeId = employeeId;
      }
      if (assignedTo && isValidObjectId(assignedTo)) {
        query.assignedTo = assignedTo;
      }
    }

    // Completed status filter
    if (completed) {
      query.completed = completed === 'true';
    }

    const tasks = await OnboardingTask.find(query)
      .populate('employeeId', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await OnboardingTask.countDocuments(query);

    return NextResponse.json<IApiResponse>({
      success: true,
      data: {
        tasks,
        page,
        limit,
        total
      },
      message: 'Onboarding tasks fetched successfully'
    });

  } catch (error) {
    console.error('GET onboarding tasks error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch onboarding tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new onboarding task
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // Only HR and admins can create onboarding tasks
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to create onboarding tasks'
      }, { status: 403 });
    }

    const {
      title,
      description,
      assignedTo,
      dueDate,
      employeeId
    } = await request.json();

    if (!title || !description || !assignedTo || !employeeId) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Required fields: title, description, assignedTo, employeeId'
      }, { status: 400 });
    }

    if (!isValidObjectId(assignedTo) || !isValidObjectId(employeeId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid assignedTo or employeeId'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Employee not found'
      }, { status: 404 });
    }

    // Check if assignee exists
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Assignee not found'
      }, { status: 404 });
    }

    const task = await OnboardingTask.create({
      title,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      employeeId,
      completed: false
    });

    const populatedTask = await OnboardingTask.findById(task._id)
      .populate('employeeId', 'name email')
      .populate('assignedTo', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedTask,
      message: 'Onboarding task created successfully'
    });

  } catch (error) {
    console.error('POST onboarding task error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to create onboarding task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}