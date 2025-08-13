// components/employee/attendance/AttendanceHistory.tsx
'use client';

import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { format, parseISO, intervalToDuration, formatDuration } from 'date-fns';
import { AttendanceRecord } from './type';

const { Title } = Typography;

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  loading: boolean;
}

export default function AttendanceHistory({ records, loading }: AttendanceHistoryProps) {
  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => format(parseISO(date), 'MMM dd, yyyy'),
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift) => {
        switch (shift) {
          case 'morning': return 'Morning (8am-4pm)';
          case 'evening': return 'Evening (4pm-12am)';
          case 'night': return 'Night (12am-8am)';
          default: return shift;
        }
      },
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (checkIn) => format(parseISO(checkIn), 'hh:mm a'),
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (checkOut) => checkOut ? format(parseISO(checkOut), 'hh:mm a') : '-',
    },
    {
      title: 'Working Hours',
      key: 'hours',
      render: (_, record) => {
        if (!record.checkOut || !record.totalHours) return '-';
        const duration = intervalToDuration({
          start: 0,
          end: record.totalHours * 60 * 60 * 1000,
        });
        return formatDuration(duration, { format: ['hours', 'minutes'] });
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        switch (status) {
          case 'present': return <span className="text-green-500">Present</span>;
          case 'late': return <span className="text-yellow-500">Late</span>;
          case 'half-day': return <span className="text-orange-500">Half Day</span>;
          default: return status;
        }
      },
    },
    {
      title: 'Breaks',
      key: 'breaks',
      render: (_, record) => (
        <div>
          {record.breaks?.map((b, i) => (
            <div key={`break-${record.id}-${i}`}>
              {format(parseISO(b.start), 'hh:mm a')} - {b.end ? format(parseISO(b.end), 'hh:mm a') : 'Ongoing'}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Namaz',
      key: 'namaz',
      render: (_, record) => (
        <div>
          {record.namaz?.map((n, i) => (
            <div key={`namaz-${record.id}-${i}`}>
              {format(parseISO(n.start), 'hh:mm a')} - {n.end ? format(parseISO(n.end), 'hh:mm a') : 'Ongoing'}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Tasks',
      key: 'tasks',
      render: (_, record) => (
        <div>
          {record.tasksCompleted?.map((t, i) => (
            <div key={`task-${record.id}-${i}`}>
              {t.task} ({t.hoursSpent} hrs)
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <Title level={4} className="mt-6">Attendance History</Title>
      <Table 
        columns={columns} 
        dataSource={records} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div className="p-4 bg-gray-50">
              <div className="mb-2">
                <strong>Breaks:</strong>
                {record.breaks?.length ? (
                  <ul className="list-disc pl-5">
                    {record.breaks.map((b, i) => (
                      <li key={`break-detail-${record.id}-${i}`}>
                        {format(parseISO(b.start), 'hh:mm a')} - {b.end ? format(parseISO(b.end), 'hh:mm a') : 'Ongoing'}
                      </li>
                    ))}
                  </ul>
                ) : <span> No breaks taken</span>}
              </div>
              <div className="mb-2">
                <strong>Namaz:</strong>
                {record.namaz?.length ? (
                  <ul className="list-disc pl-5">
                    {record.namaz.map((n, i) => (
                      <li key={`namaz-detail-${record.id}-${i}`}>
                        {format(parseISO(n.start), 'hh:mm a')} - {n.end ? format(parseISO(n.end), 'hh:mm a') : 'Ongoing'}
                      </li>
                    ))}
                  </ul>
                ) : <span> No namaz recorded</span>}
              </div>
              <div>
                <strong>Tasks Completed:</strong>
                {record.tasksCompleted?.length ? (
                  <ul className="list-disc pl-5">
                    {record.tasksCompleted.map((t, i) => (
                      <li key={`task-detail-${record.id}-${i}`}>
                        {t.task} - {t.description} ({t.hoursSpent} hrs)
                      </li>
                    ))}
                  </ul>
                ) : <span> No tasks recorded</span>}
              </div>
            </div>
          ),
        }}
      />
    </>
  );
}