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

// Get specific leave request details
export async function GET(
  request: Request,
  { params }: { params: { leaveId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employee') {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    if (!isValidObjectId(params.leaveId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid leave request ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    const leaveRequest = await LeaveRequest.findOne({
      _id: params.leaveId,
      employeeId: session.user.id
    })
    .populate('employeeId', 'name email')
    .populate('reviewedBy', 'name email');

    if (!leaveRequest) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Leave request not found or not yours'
      }, { status: 404 });
    }

    return NextResponse.json<IApiResponse>({
      success: true,
      data: leaveRequest,
      message: 'Leave request fetched successfully'
    });

  } catch (error) {
    console.error('GET leave request error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Cancel a leave request
// Update a leave request
export async function PUT(
  request: Request,
  { params }: { params: { leaveId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employee') {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    if (!isValidObjectId(params.leaveId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid leave request ID'
      }, { status: 400 });
    }

    const { action, ...updateData } = await request.json();

    // If action is 'update', handle as edit operation
    if (action === 'update') {
      await connectToDatabase();

      const leaveRequest = await LeaveRequest.findOne({
        _id: params.leaveId,
        employeeId: session.user.id,
        status: 'pending' // Can only edit pending requests
      });

      if (!leaveRequest) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'Leave request not found, not yours, or cannot be edited'
        }, { status: 404 });
      }

      // Update the leave request with new data
      Object.assign(leaveRequest, {
        type: updateData.type,
        startDate: new Date(updateData.startDate),
        endDate: new Date(updateData.endDate),
        reason: updateData.reason,
        attachments: updateData.attachments || []
      });

      await leaveRequest.save();

      const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
        .populate('employeeId', 'name email')
        .populate('reviewedBy', 'name email');

      return NextResponse.json<IApiResponse>({
        success: true,
        data: populatedRequest,
        message: 'Leave request updated successfully'
      });
    }

    // Otherwise, handle as cancellation (existing behavior)
    await connectToDatabase();

    const leaveRequest = await LeaveRequest.findOne({
      _id: params.leaveId,
      employeeId: session.user.id,
      status: 'pending' // Can only cancel pending requests
    });

    if (!leaveRequest) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Leave request not found, not yours, or cannot be cancelled'
      }, { status: 404 });
    }

    // Update status to cancelled
    leaveRequest.status = 'cancelled';
    leaveRequest.reviewedBy = session.user.id;
    leaveRequest.reviewedAt = new Date();
    await leaveRequest.save();

    const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
      .populate('employeeId', 'name email')
      .populate('reviewedBy', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedRequest,
      message: 'Leave request cancelled successfully'
    });

  } catch (error) {
    console.error('PUT leave request error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to update leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete a leave request (only if pending)
// Delete a leave request (only if pending)
export async function DELETE(
  request: Request,
  { params }: { params: { leaveId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employee') {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    if (!isValidObjectId(params.leaveId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid leave request ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    const leaveRequest = await LeaveRequest.findOne({
      _id: params.leaveId,
      employeeId: session.user.id
    });

    if (!leaveRequest) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Leave request not found or not yours'
      }, { status: 404 });
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Only pending leave requests can be deleted'
      }, { status: 400 });
    }

    await LeaveRequest.deleteOne({ _id: params.leaveId });

    return NextResponse.json<IApiResponse>({
      success: true,
      message: 'Leave request deleted successfully'
    });

  } catch (error) {
    console.error('DELETE leave request error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to delete leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}