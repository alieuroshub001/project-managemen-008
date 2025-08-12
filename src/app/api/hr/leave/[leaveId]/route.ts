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

// Update leave request (approve/reject/cancel)
export async function PUT(
  request: Request,
  { params }: { params: { leaveId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

    const leaveRequest = await LeaveRequest.findById(params.leaveId);
    if (!leaveRequest) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Leave request not found'
      }, { status: 404 });
    }

    const { action } = await request.json(); // 'approve', 'reject', or 'cancel'

    if (!action || (action !== 'approve' && action !== 'reject' && action !== 'cancel')) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid action. Must be "approve", "reject", or "cancel"'
      }, { status: 400 });
    }

    // Check permissions
    if (action === 'cancel') {
      // Only the requester can cancel their own request
      if (leaveRequest.employeeId.toString() !== session.user.id) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'You can only cancel your own leave requests'
        }, { status: 403 });
      }
    } else {
      // Only HR/admins can approve/reject
      if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'You do not have permission to approve/reject leave requests'
        }, { status: 403 });
      }
    }

    // Update status based on action
    if (action === 'approve') {
      leaveRequest.status = 'approved';
    } else if (action === 'reject') {
      leaveRequest.status = 'rejected';
    } else {
      leaveRequest.status = 'cancelled';
    }

    leaveRequest.reviewedBy = session.user.id;
    leaveRequest.reviewedAt = new Date();
    await leaveRequest.save();

    const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
      .populate('employeeId', 'name email')
      .populate('reviewedBy', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedRequest,
      message: `Leave request ${action}d successfully`
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

// Delete leave request
export async function DELETE(
  request: Request,
  { params }: { params: { leaveId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

    const leaveRequest = await LeaveRequest.findById(params.leaveId);
    if (!leaveRequest) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Leave request not found'
      }, { status: 404 });
    }

    // Only the requester or HR/admins can delete
    if (leaveRequest.employeeId.toString() !== session.user.id && 
        !['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to delete this leave request'
      }, { status: 403 });
    }

    await LeaveRequest.findByIdAndDelete(params.leaveId);

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