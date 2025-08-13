// components/employee/attendance/AttendanceLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CurrentAttendance from './CurrentAttendance';
import AttendanceHistory from './AttendanceHistory';
import { AttendanceRecord } from './type';

export default function AttendanceLayout() {
  const { data: session } = useSession();
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAttendanceRecords();
    }
  }, [session]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employee/attendance');
      const data = await response.json();
      if (data.data) {
        setRecords(data.data);
        // Check if there's a record for today without checkOut
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = data.data.find(
          (record: AttendanceRecord) => record.date === today && !record.checkOut
        );
        if (todayRecord) {
          setCurrentRecord(todayRecord);
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <CurrentAttendance 
        currentRecord={currentRecord} 
        setCurrentRecord={setCurrentRecord}
        refetchRecords={fetchAttendanceRecords}
      />
      <AttendanceHistory 
        records={records} 
        loading={loading}
      />
    </div>
  );
}