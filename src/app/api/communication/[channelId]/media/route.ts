// app/api/communication/[channelId]/media/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import UserChannel from '@/models/UserChannel';
import User from '@/models/User';
import { IApiResponse } from '@/types';
import mongoose from 'mongoose';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Helper function to get user by session
async function getUserFromSession(session: any) {
  await connectToDatabase();
  
  if (isValidObjectId(session.user.id)) {
    return { userId: session.user.id };
  }
  
  let user;
  if (session.user.email) {
    user = await User.findOne({ email: session.user.email }).select('_id');
  }
  
  if (!user) {
    throw new Error('User not found in database');
  }
  
  return { userId: user._id.toString() };
}

export async function GET(
  request: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // Validate channelId
    if (!isValidObjectId(params.channelId)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid channel ID'
      }, { status: 400 });
    }

    // Get the actual user ID from the database
    const { userId } = await getUserFromSession(session);

    // Check if user has access to the channel
    const userChannel = await UserChannel.findOne({
      channelId: params.channelId,
      userId: userId
    });
    
    if (!userChannel) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'You do not have access to this channel'
      }, { status: 403 });
    }

    // Get all messages with attachments
    const messages = await Message.find({
      channelId: params.channelId,
      attachments: { $exists: true, $not: { $size: 0 } }
    })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 });

    // Extract and format media files
    const mediaFiles: any[] = [];
    
    messages.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach((attachment: any) => {
          // Parse the attachment data if it's stored as JSON string
          let attachmentData;
          try {
            attachmentData = typeof attachment === 'string' ? JSON.parse(attachment) : attachment;
          } catch {
            // If parsing fails, assume it's a simple URL string
            attachmentData = {
              secure_url: attachment,
              original_filename: 'Unknown file',
              format: 'unknown',
              bytes: 0,
              type: 'document'
            };
          }

          mediaFiles.push({
            _id: message._id,
            secure_url: attachmentData.secure_url,
            original_filename: attachmentData.original_filename || 'Unknown file',
            format: attachmentData.format || 'unknown',
            bytes: attachmentData.bytes || 0,
            type: attachmentData.type || 'document',
            resource_type: attachmentData.resource_type || 'raw',
            createdAt: message.createdAt,
            sender: message.sender
          });
        });
      }
    });

    return NextResponse.json<IApiResponse>({
      success: true,
      data: mediaFiles,
      message: 'Media files fetched successfully'
    });

  } catch (error) {
    console.error('GET media files error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to fetch media files',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}