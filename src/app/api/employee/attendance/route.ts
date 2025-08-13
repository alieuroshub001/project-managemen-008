// app/api/employee/attendance/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import AttendanceRecord from '@/models/AttendanceRecord';
import connectToDatabase from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET all attendance records for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const records = await AttendanceRecord.find({ employeeId: session.user.id })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

// POST create a new attendance record (check-in)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { shift, checkInReason } = await request.json();
    await connectToDatabase();

    // Check if there's already a record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await AttendanceRecord.findOne({
      employeeId: session.user.id,
      date: today,
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Attendance already recorded for today' },
        { status: 400 }
      );
    }

    const newRecord = {
      employeeId: session.user.id,
      date: today,
      checkIn: new Date(),
      status: 'present',
      shift,
      checkInReason,
    };

    const createdRecord = await AttendanceRecord.create(newRecord);
    return NextResponse.json({ data: createdRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    );
  }
}

// PUT update attendance record (check-out, breaks, etc)
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      action,
      checkOutReason,
      tasksCompleted,
    } = await request.json();
    await connectToDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await AttendanceRecord.findOne({
      employeeId: session.user.id,
      date: today,
    });

    if (!record) {
      return NextResponse.json(
        { error: 'No attendance record found for today' },
        { status: 404 }
      );
    }

    const now = new Date();

    switch (action) {
      case 'checkout':
        record.checkOut = now;
        record.checkOutReason = checkOutReason;
        record.tasksCompleted = tasksCompleted;
        // Calculate total working hours
        if (record.checkIn) {
          const diff = now.getTime() - record.checkIn.getTime();
          record.totalHours = diff / (1000 * 60 * 60); // Convert to hours
        }
        break;
      case 'break-start':
        record.breaks = record.breaks || [];
        record.breaks.push({ start: now });
        break;
      case 'break-end':
        if (record.breaks && record.breaks.length > 0) {
          const lastBreak = record.breaks[record.breaks.length - 1];
          if (!lastBreak.end) {
            lastBreak.end = now;
            if (lastBreak.start) {
              const breakDuration =
                (now.getTime() - lastBreak.start.getTime()) / (1000 * 60); // in minutes
              record.totalBreakMinutes = (record.totalBreakMinutes || 0) + breakDuration;
            }
          }
        }
        break;
      case 'namaz-start':
        record.namaz = record.namaz || [];
        record.namaz.push({ start: now });
        break;
      case 'namaz-end':
        if (record.namaz && record.namaz.length > 0) {
          const lastNamaz = record.namaz[record.namaz.length - 1];
          if (!lastNamaz.end) {
            lastNamaz.end = now;
            if (lastNamaz.start) {
              const namazDuration =
                (now.getTime() - lastNamaz.start.getTime()) / (1000 * 60); // in minutes
              record.totalNamazMinutes = (record.totalNamazMinutes || 0) + namazDuration;
            }
          }
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await record.save();
    return NextResponse.json({ data: record });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance record' },
      { status: 500 }
    );
  }
}