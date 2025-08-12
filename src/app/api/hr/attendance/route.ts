import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import AttendanceRecord from '@/models/AttendanceRecord';
import User from '@/models/User';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Get attendance records
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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // For non-HR/admins, only show their own records
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
    if (dateFrom && dateTo) {
      query.date = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    } else if (dateFrom) {
      query.date = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      query.date = { $lte: new Date(dateTo) };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const attendanceRecords = await AttendanceRecord.find(query)
      .populate('employeeId', 'name email')
      .sort({ date: -1, checkIn: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AttendanceRecord.countDocuments(query);

    return NextResponse.json<IApiResponse>({
      success: true,
      data: {
        attendanceRecords,
        page,
        limit,
        total
      },
      message: 'Attendance records fetched successfully'
    });

  } catch (error) {
    console.error('GET attendance records error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create or update attendance record (check-in/check-out)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { action } = await request.json(); // 'check-in' or 'check-out'

    if (!action || (action !== 'check-in' && action !== 'check-out')) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid action. Must be "check-in" or "check-out"'
      }, { status: 400 });
    }

    await connectToDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if record exists for today
    let record = await AttendanceRecord.findOne({
      employeeId: session.user.id,
      date: today
    });

    const now = new Date();

    if (action === 'check-in') {
      if (record) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'You have already checked in today'
        }, { status: 400 });
      }

      // Create new check-in record
      record = await AttendanceRecord.create({
        employeeId: session.user.id,
        date: today,
        checkIn: now,
        status: now.getHours() > 9 ? 'late' : 'present' // Simple late check
      });
    } else { // check-out
      if (!record) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'You need to check in first before checking out'
        }, { status: 400 });
      }

      if (record.checkOut) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'You have already checked out today'
        }, { status: 400 });
      }

      // Update with check-out time
      record.checkOut = now;
      
      // Calculate if it's a half-day (less than 4 hours)
      const hoursWorked = (now.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
      if (hoursWorked < 4) {
        record.status = 'half-day';
      }
      
      await record.save();
    }

    const populatedRecord = await AttendanceRecord.findById(record._id)
      .populate('employeeId', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedRecord,
      message: `Successfully ${action === 'check-in' ? 'checked in' : 'checked out'}`
    });

  } catch (error) {
    console.error('POST attendance record error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to process attendance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}