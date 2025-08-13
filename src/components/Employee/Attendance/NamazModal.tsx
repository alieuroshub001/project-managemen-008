// components/employee/attendance/NamazModal.tsx
'use client';

import { Modal, Button, Typography } from 'antd';
import { useState } from 'react';

const { Text } = Typography;

interface NamazModalProps {
  visible: boolean;
  onCancel: () => void;
  onAction: (action: 'start' | 'end') => void;
  isNamazActive: boolean;
}

export default function NamazModal({ 
  visible, 
  onCancel, 
  onAction,
  isNamazActive
}: NamazModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAction(isNamazActive ? 'end' : 'start');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isNamazActive ? 'Back from Namaz' : 'Take Namaz'}
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
        {isNamazActive 
          ? 'Are you sure you want to end your namaz?' 
          : 'Are you sure you want to take namaz?'}
      </Text>
    </Modal>
  );
}