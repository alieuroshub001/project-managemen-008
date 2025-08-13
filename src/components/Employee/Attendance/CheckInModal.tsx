// components/employee/attendance/CheckInModal.tsx
'use client';

import { Modal, Form, Select, Input, Button } from 'antd';
import { useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;

interface CheckInModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (record: any) => void;
}

export default function CheckInModal({ visible, onCancel, onSuccess }: CheckInModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const shiftOptions = [
    { value: 'morning', label: 'Morning (8am-4pm)' },
    { value: 'evening', label: 'Evening (4pm-12am)' },
    { value: 'night', label: 'Night (12am-8am)' },
  ];

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shift: values.shift,
          checkInReason: values.checkInTime > values.shiftStartTime ? values.reason : undefined,
        }),
      });

      const data = await response.json();
      if (data.data) {
        onSuccess(data.data);
        form.resetFields();
      }
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Check In"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} onFinish={handleSubmit}>
        <Form.Item
          name="shift"
          label="Shift"
          rules={[{ required: true, message: 'Please select your shift' }]}
        >
          <Select placeholder="Select your shift">
            {shiftOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="reason"
          label="Reason for late check-in (if applicable)"
        >
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Confirm Check In
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}