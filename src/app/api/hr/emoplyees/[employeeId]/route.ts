import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/EmployeeProfile';
import User from '@/models/User';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Get employee profile by ID
export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    if (!isValidObjectId(params.employeeId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid employee ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    // For non-HR/admins, only allow viewing their own profile
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role) && 
        params.employeeId !== session.user.id) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You can only view your own profile'
      }, { status: 403 });
    }

    const profile = await EmployeeProfile.findOne({ userId: params.employeeId })
      .populate('userId', 'name email role')
      .populate('manager', 'name email');

    if (!profile) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Employee profile not found'
      }, { status: 404 });
    }

    return NextResponse.json<IApiResponse>({
      success: true,
      data: profile,
      message: 'Employee profile fetched successfully'
    });

  } catch (error) {
    console.error('GET employee profile error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch employee profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update employee profile
export async function PUT(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    if (!isValidObjectId(params.employeeId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid employee ID'
      }, { status: 400 });
    }

    // Only HR, admins, or the employee themselves can update
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role) && 
        params.employeeId !== session.user.id) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to update this profile'
      }, { status: 403 });
    }

    await connectToDatabase();

    const profile = await EmployeeProfile.findOne({ userId: params.employeeId });
    if (!profile) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Employee profile not found'
      }, { status: 404 });
    }

    const {
      department,
      position,
      salary,
      employmentType,
      manager,
      skills,
      emergencyContacts
    } = await request.json();

    // Regular employees can only update some fields
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      if (department || position || salary || employmentType || manager) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'You can only update your skills and emergency contacts'
        }, { status: 403 });
      }
    }

    // Update fields if provided
    if (department) profile.department = department;
    if (position) profile.position = position;
    if (salary !== undefined) profile.salary = salary;
    if (employmentType) profile.employmentType = employmentType;
    if (manager !== undefined) {
      if (manager === null) {
        profile.manager = undefined;
      } else if (isValidObjectId(manager)) {
        profile.manager = manager;
      } else {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'Invalid manager ID'
        }, { status: 400 });
      }
    }
    if (skills) profile.skills = skills;
    if (emergencyContacts) profile.emergencyContacts = emergencyContacts;

    await profile.save();

    const populatedProfile = await EmployeeProfile.findOne({ userId: params.employeeId })
      .populate('userId', 'name email role')
      .populate('manager', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedProfile,
      message: 'Employee profile updated successfully'
    });

  } catch (error) {
    console.error('PUT employee profile error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to update employee profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}