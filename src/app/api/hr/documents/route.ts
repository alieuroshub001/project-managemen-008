import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import HRDocument from '@/models/HRdocument';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Get all HR documents
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
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query - only show documents accessible to user's role
    const query: any = {
      accessibleTo: session.user.role
    };

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    const documents = await HRDocument.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HRDocument.countDocuments(query);

    return NextResponse.json<IApiResponse>({
      success: true,
      data: {
        documents,
        page,
        limit,
        total
      },
      message: 'HR documents fetched successfully'
    });

  } catch (error) {
    console.error('GET HR documents error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch HR documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new HR document
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // Only HR and admins can upload documents
    if (!['hr', 'admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have permission to upload HR documents'
      }, { status: 403 });
    }

    const {
      title,
      description,
      category,
      file,
      accessibleTo
    } = await request.json();

    if (!title || !category || !file || !accessibleTo || !accessibleTo.length) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Required fields: title, category, file, accessibleTo'
      }, { status: 400 });
    }

    await connectToDatabase();

    const document = await HRDocument.create({
      title,
      description: description || undefined,
      category,
      file,
      accessibleTo,
      createdBy: session.user.id
    });

    const populatedDoc = await HRDocument.findById(document._id)
      .populate('createdBy', 'name email');

    return NextResponse.json<IApiResponse>({
      success: true,
      data: populatedDoc,
      message: 'HR document created successfully'
    });

  } catch (error) {
    console.error('POST HR document error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to create HR document',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}