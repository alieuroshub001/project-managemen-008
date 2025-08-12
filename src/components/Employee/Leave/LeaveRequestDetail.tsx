"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Descriptions, Badge, message, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import { IApiResponse, ILeaveRequest, IAttachment, UserRole } from '@/types';

type Props = {
  requestId?: string;
  userId?: string;
  role?: UserRole;
};

const statusColors: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

export default function LeaveRequestDetail({ requestId, userId, role }: Props) {
  const router = useRouter();
  // Fallback to route param if prop not provided (supports direct route usage)
  const routeParams = useParams<{ requestId: string }>();
  const id = requestId ?? routeParams?.requestId;

  const [leaveRequest, setLeaveRequest] = useState<ILeaveRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) fetchLeaveRequest(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLeaveRequest = async (rid: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employee/leave/${rid}`);
      const data: IApiResponse = await res.json();

      if (data.success) {
        setLeaveRequest(data.data as ILeaveRequest);
      } else {
        message.error(data.message || 'Failed to fetch leave request');
        router.push('/dashboard/leave');
      }
    } catch (err) {
      console.error('Failed to fetch leave request:', err);
      message.error('Failed to fetch leave request');
      router.push('/dashboard/leave');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'cancel' | 'delete') => {
    if (!id) return;
    try {
      setActionLoading(true);

      if (action === 'delete') {
        const res = await fetch(`/api/employee/leave/${id}`, { method: 'DELETE' });
        const data: IApiResponse = await res.json();

        if (data.success) {
          message.success('Leave request deleted successfully');
          router.push('/dashboard/leave');
        } else {
          message.error(data.message || 'Failed to delete leave request');
        }
        return;
      }

      const res = await fetch(`/api/employee/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data: IApiResponse = await res.json();

      if (data.success) {
        message.success(`Leave request ${action}d successfully`);
        fetchLeaveRequest(id);
      } else {
        message.error(data.message || `Failed to ${action} leave request`);
      }
    } catch (err) {
      console.error(`Failed to ${action} leave request:`, err);
      message.error(`Failed to ${action} leave request`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!id) return <div>Invalid request</div>;
  if (!leaveRequest) return <div>Loading...</div>;

  const days = dayjs(leaveRequest.endDate).diff(leaveRequest.startDate, 'day') + 1;

  // Normalize attachments to handle both string[] and IAttachment[]
  const attachments: (IAttachment | string)[] =
    (leaveRequest.attachments ?? []) as (IAttachment | string)[];

  // (Optional) you can use userId/role to conditionally render actions
  const canEditOrCancel = leaveRequest.status === 'pending';
  const canDelete = true; // adjust with role if needed

  return (
    <Card
      title="Leave Request Details"
      loading={loading}
      extra={<Button onClick={() => router.push('/dashboard/leave')}>Back to List</Button>}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Type">
          {leaveRequest.type.charAt(0).toUpperCase() + leaveRequest.type.slice(1)}
        </Descriptions.Item>

        <Descriptions.Item label="Dates">
          {dayjs(leaveRequest.startDate).format('MMM D, YYYY')} – {dayjs(leaveRequest.endDate).format('MMM D, YYYY')}
        </Descriptions.Item>

        <Descriptions.Item label="Days">
          {days} day{days !== 1 ? 's' : ''}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Badge
            color={statusColors[leaveRequest.status]}
            text={leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1)}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Reason">
          {leaveRequest.reason}
        </Descriptions.Item>

        {attachments.length > 0 && (
          <Descriptions.Item label="Attachments">
            <ul className="list-disc pl-5">
              {attachments.map((att: IAttachment | string, index: number) => {
                const url = typeof att === 'string' ? att : att.url;
                const name =
                  typeof att === 'string'
                    ? (att.split('/').pop() || 'file')
                    : (att.name ?? url.split('/').pop() ?? 'file');

                return (
                  <li key={index}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </Descriptions.Item>
        )}

        {leaveRequest.reviewedBy && (
          <>
            <Descriptions.Item label="Reviewed By">
              {(leaveRequest.reviewedBy as any)?.name || 'System'}
            </Descriptions.Item>
            <Descriptions.Item label="Reviewed At">
              {dayjs(leaveRequest.reviewedAt).format('MMM D, YYYY h:mm A')}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      <div className="mt-6 flex justify-end gap-2">
        {canEditOrCancel && (
          <>
            <Button type="primary" onClick={() => router.push(`/dashboard/leave/${id}/edit`)}>
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to cancel this request?"
              onConfirm={() => handleAction('cancel')}
              okText="Yes"
              cancelText="No"
            >
              <Button danger loading={actionLoading}>
                Cancel Request
              </Button>
            </Popconfirm>
          </>
        )}

        {canDelete && (
          <Popconfirm
            title="Are you sure you want to delete this request?"
            onConfirm={() => handleAction('delete')}
            okText="Yes"
            cancelText="No"
          >
            <Button danger loading={actionLoading}>
              Delete
            </Button>
          </Popconfirm>
        )}
      </div>
    </Card>
  );
}
