import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import EmployeeProfile from '@/models/EmployeeProfile';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Get all employees (with optional filtering)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // Only HR, admin, and superadmin can access
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to access employee data'
      }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const employmentType = searchParams.get('employmentType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by department if provided
    if (department) {
      query.department = department;
    }

    // Filter by employment type if provided
    if (employmentType) {
      query.employmentType = employmentType;
    }

    // Text search if provided
    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await EmployeeProfile.find(query)
      .populate('userId', 'name email role')
      .populate('manager', 'name email')
      .sort({ hireDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EmployeeProfile.countDocuments(query);

    return NextResponse.json<IApiResponse>({
      success: true,
      data: {
        employees,
        page,
        limit,
        total
      },
      message: 'Employees fetched successfully'
    });

  } catch (error) {
    console.error('GET employees error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch employees',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new employee profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // Only HR, admin, and superadmin can create profiles
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to create employee profiles'
      }, { status: 403 });
    }

    const {
      userId,
      employeeId,
      department,
      position,
      hireDate,
      salary,
      employmentType,
      manager,
      skills,
      emergencyContacts
    } = await request.json();

    if (!userId || !employeeId || !department || !position || !hireDate) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Required fields: userId, employeeId, department, position, hireDate'
      }, { status: 400 });
    }

    if (!isValidObjectId(userId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid user ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if employee ID is unique
    const existingEmployee = await EmployeeProfile.findOne({ employeeId });
    if (existingEmployee) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Employee ID already exists'
      }, { status: 400 });
    }

    // Check if profile already exists for this user
    const existingProfile = await EmployeeProfile.findOne({ userId });
    if (existingProfile) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Employee profile already exists for this user'
      }, { status: 400 });
    }

    // Validate manager if provided
    if (manager && !isValidObjectId(manager)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid manager ID'
      }, { status: 400 });
    }

    const employeeProfile = await EmployeeProfile.create({
      userId,
      employeeId,
      department,
      position,
      hireDate: new Date(hireDate),
      salary,
      employmentType: employmentType || 'full-time',
      manager: manager || undefined,
      skills: skills || [],
      emergencyContacts: emergencyContacts || []
    });

    const populatedProfile = await EmployeeProfile.findById(employeeProfile._id)
      .populate('userId', 'name email role')
      .populate('manager', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedProfile,
      message: 'Employee profile created successfully'
    });

  } catch (error) {
    console.error('POST employee error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to create employee profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}