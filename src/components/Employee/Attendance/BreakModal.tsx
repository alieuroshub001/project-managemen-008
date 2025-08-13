// components/employee/attendance/BreakModal.tsx
'use client';

import { Modal, Button, Typography } from 'antd';
import { useState } from 'react';

const { Text } = Typography;

interface BreakModalProps {
  visible: boolean;
  onCancel: () => void;
  onAction: (action: 'start' | 'end') => void;
  isBreakActive: boolean;
}

export default function BreakModal({ 
  visible, 
  onCancel, 
  onAction,
  isBreakActive
}: BreakModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAction(isBreakActive ? 'end' : 'start');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isBreakActive ? 'Back from Break' : 'Take Break'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="action"
          type="primary" 
          onClick={handleConfirm}
          loading={loading}
        >
          Confirm
        </Button>,
      ]}
    >
      <Text>
        {isBreakActive 
          ? 'Are you sure you want to end your break?' 
          : 'Are you sure you want to take a break?'}
      </Text>
    </Modal>
  );
}