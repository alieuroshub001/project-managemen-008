import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Get all leave requests for the employee
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employee') {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query for the employee's leave requests
    const query: any = { employeeId: session.user.id };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const leaveRequests = await LeaveRequest.find(query)
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
    console.error('GET employee leave requests error:', error);
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
    if (!session?.user || session.user.role !== 'employee') {
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

    // Check for overlapping leave requests
    const overlappingLeave = await LeaveRequest.findOne({
      employeeId: session.user.id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        // Existing leave starts during new leave
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        // Existing leave ends during new leave
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        // New leave spans existing leave
        { 
          startDate: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(endDate) }
        }
      ]
    });

    if (overlappingLeave) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You already have an approved or pending leave request for this period'
      }, { status: 400 });
    }

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
      .populate('employeeId', 'name email')
      .populate('reviewedBy', 'name email');

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