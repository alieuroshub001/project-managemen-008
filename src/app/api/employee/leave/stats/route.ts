import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import LeaveRequest from '@/models/LeaveRequest';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

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

    // Get current year
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    // Get leave stats for the current year
    const leaveStats = await LeaveRequest.aggregate([
      {
        $match: {
          employeeId: new mongoose.Types.ObjectId(session.user.id),
          startDate: { $gte: yearStart, $lt: yearEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          totalDays: {
            $sum: {
              $divide: [
                { $subtract: ['$endDate', '$startDate'] },
                1000 * 60 * 60 * 24 // Convert milliseconds to days
              ]
            }
          },
          count: { $sum: 1 },
          approvedDays: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'approved'] },
                {
                  $divide: [
                    { $subtract: ['$endDate', '$startDate'] },
                    1000 * 60 * 60 * 24
                  ]
                },
                0
              ]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Calculate total leave days (adding 1 to include both start and end dates)
    const stats = leaveStats.reduce((acc, curr) => {
      acc[curr._id] = {
        totalDays: Math.ceil(curr.totalDays) + curr.count, // Add 1 day per request
        approvedDays: Math.ceil(curr.approvedDays) + (curr.count - curr.pendingCount),
        pendingDays: curr.pendingCount > 0 ? 
          Math.ceil(curr.totalDays / curr.count) * curr.pendingCount + curr.pendingCount : 0,
        count: curr.count
      };
      return acc;
    }, {});

    return NextResponse.json<IApiResponse>({
      success: true,
      data: stats,
      message: 'Leave statistics fetched successfully'
    });

  } catch (error) {
    console.error('GET leave stats error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}