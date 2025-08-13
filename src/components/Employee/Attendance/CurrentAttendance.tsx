// components/employee/attendance/CurrentAttendance.tsx
'use client';

import { useState } from 'react';
import { Card, Typography, Button } from 'antd';
import { format, parseISO } from 'date-fns';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';
import BreakModal from './BreakModal';
import NamazModal from './NamazModal';
import { AttendanceRecord } from './type';

const { Title, Text } = Typography;

interface CurrentAttendanceProps {
  currentRecord: AttendanceRecord | null;
  setCurrentRecord: (record: AttendanceRecord | null) => void;
  refetchRecords: () => void;
}

export default function CurrentAttendance({ 
  currentRecord, 
  setCurrentRecord,
  refetchRecords
}: CurrentAttendanceProps) {
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
  const [breakModalVisible, setBreakModalVisible] = useState(false);
  const [namazModalVisible, setNamazModalVisible] = useState(false);

  const handleBreak = async (action: 'start' | 'end') => {
    try {
      const response = await fetch('/api/employee/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: `break-${action}`,
        }),
      });

      const data = await response.json();
      if (data.data) {
        setCurrentRecord(data.data);
        setBreakModalVisible(false);
        refetchRecords();
      }
    } catch (error) {
      console.error(`Failed to ${action} break:`, error);
    }
  };

  const handleNamaz = async (action: 'start' | 'end') => {
    try {
      const response = await fetch('/api/employee/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: `namaz-${action}`,
        }),
      });

      const data = await response.json();
      if (data.data) {
        setCurrentRecord(data.data);
        setNamazModalVisible(false);
        refetchRecords();
      }
    } catch (error) {
      console.error(`Failed to ${action} namaz:`, error);
    }
  };

  // Helper to check if any break/namaz is active
  const isBreakActive = currentRecord?.breaks?.some(b => !b.end) ?? false;
  const isNamazActive = currentRecord?.namaz?.some(n => !n.end) ?? false;

  return (
    <div className="mb-6">
      <Card title="Today's Attendance" className="mb-4">
        {currentRecord ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <Text strong>Status: </Text>
              <Text>{currentRecord.status}</Text>
            </div>
            <div className="flex justify-between">
              <Text strong>Check In: </Text>
              <Text>{format(parseISO(currentRecord.checkIn), 'hh:mm a')}</Text>
            </div>
            <div className="flex justify-between">
              <Text strong>Shift: </Text>
              <Text>
                {currentRecord.shift === 'morning' ? 'Morning (8am-4pm)' :
                 currentRecord.shift === 'evening' ? 'Evening (4pm-12am)' :
                 'Night (12am-8am)'}
              </Text>
            </div>

            <div className="flex space-x-2 mt-4">
              <Button 
                type="primary" 
                onClick={() => setBreakModalVisible(true)}
              >
                {isBreakActive ? 'Back from Break' : 'Take Break'}
              </Button>
              <Button 
                type="primary" 
                onClick={() => setNamazModalVisible(true)}
              >
                {isNamazActive ? 'Back from Namaz' : 'Take Namaz'}
              </Button>
              <Button 
                type="primary" 
                danger 
                onClick={() => setCheckOutModalVisible(true)}
              >
                Check Out
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Text>You haven't checked in today</Text>
            <Button 
              type="primary" 
              className="ml-4" 
              onClick={() => setCheckInModalVisible(true)}
            >
              Check In
            </Button>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CheckInModal
        visible={checkInModalVisible}
        onCancel={() => setCheckInModalVisible(false)}
        onSuccess={(record) => {
          setCurrentRecord(record);
          refetchRecords();
        }}
      />

      <CheckOutModal
        visible={checkOutModalVisible}
        onCancel={() => setCheckOutModalVisible(false)}
        onSuccess={() => {
          setCurrentRecord(null);
          refetchRecords();
        }}
      />

      <BreakModal
        visible={breakModalVisible}
        onCancel={() => setBreakModalVisible(false)}
        onAction={handleBreak}
        isBreakActive={isBreakActive}
      />

      <NamazModal
        visible={namazModalVisible}
        onCancel={() => setNamazModalVisible(false)}
        onAction={handleNamaz}
        isNamazActive={isNamazActive}
      />
    </div>
  );
}