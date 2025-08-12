import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import User from '@/models/User';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Get all leave requests (with optional filtering)
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by type if provided
    if (type) {
      query.type = type;
    }

    // For non-HR/admins, only show their own requests
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      query.employeeId = session.user.id;
    } else if (employeeId) {
      // HR/admins can filter by specific employee
      if (isValidObjectId(employeeId)) {
        query.employeeId = employeeId;
      } else {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'Invalid employee ID'
        }, { status: 400 });
      }
    }

    // Date range filter
    if (startDate && endDate) {
      query.$or = [
        // Leaves that start within the range
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        // Leaves that end within the range
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        // Leaves that span the entire range
        { 
          $and: [
            { startDate: { $lte: new Date(startDate) } },
            { endDate: { $gte: new Date(endDate) } }
          ]
        }
      ];
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employeeId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LeaveRequest.countDocuments(query);

    return NextResponse.json<IApiResponse>({
      success: true,
      data: {
        leaveRequests,
        page,
        limit,
        total
      },
      message: 'Leave requests fetched successfully'
    });

  } catch (error) {
    console.error('GET leave requests error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new leave request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const {
      type,
      startDate,
      endDate,
      reason,
      attachments
    } = await request.json();

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Required fields: type, startDate, endDate, reason'
      }, { status: 400 });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Start date cannot be after end date'
      }, { status: 400 });
    }

    await connectToDatabase();

    const leaveRequest = await LeaveRequest.create({
      employeeId: session.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'pending',
      attachments: attachments || []
    });

    const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
      .populate('employeeId', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedRequest,
      message: 'Leave request created successfully'
    });

  } catch (error) {
    console.error('POST leave request error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to create leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}