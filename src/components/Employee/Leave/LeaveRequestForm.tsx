"use client";

import { useState } from 'react';
import { Button, Form, Input, DatePicker, Select, Upload, message, Card } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import { IApiResponse } from '@/types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

type Props = {
  userId?: string;
  initialValues?: {
    _id?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    attachments?: string[];
  };
};

type FormValues = {
  type: string;
  dates: [Dayjs, Dayjs];
  reason: string;
};

export default function LeaveRequestForm({ userId, initialValues }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const router = useRouter();

  const onFinish = async (values: FormValues) => {
    try {
      setLoading(true);

      const payload = {
        userId, // include if provided
        type: values.type,
        startDate: values.dates[0].toDate().toISOString(),
        endDate: values.dates[1].toDate().toISOString(),
        reason: values.reason,
        attachments: fileList.map((f) => f.name as string),
      };

      const isEdit = Boolean(initialValues?._id);
      const url = isEdit
        ? `/api/employee/leave/${initialValues?._id}`
        : '/api/employee/leave';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: IApiResponse = await res.json();

      if (data.success) {
        message.success(data.message ?? 'Saved');
        router.push('/dashboard/leave');
      } else {
        message.error(data.message ?? 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      message.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  return (
    <Card title={initialValues?._id ? 'Edit Leave Request' : 'New Leave Request'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={
          initialValues?._id
            ? {
                type: initialValues.type,
                reason: initialValues.reason,
                dates: [dayjs(initialValues.startDate), dayjs(initialValues.endDate)],
              }
            : {}
        }
      >
        <Form.Item
          name="type"
          label="Leave Type"
          rules={[{ required: true, message: 'Please select leave type' }]}
        >
          <Select
            placeholder="Select leave type"
            options={[
              { label: 'Vacation', value: 'vacation' },
              { label: 'Sick Leave', value: 'sick' },
              { label: 'Personal', value: 'personal' },
              { label: 'Other', value: 'other' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="dates"
          label="Date Range"
          rules={[{ required: true, message: 'Please select date range' }]}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: 'Please enter reason for leave' }]}
        >
          <TextArea rows={4} placeholder="Enter reason for leave" />
        </Form.Item>

        <Form.Item label="Attachments">
          <Upload fileList={fileList} onChange={handleUploadChange} beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Select Files</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues?._id ? 'Update Request' : 'Submit Request'}
          </Button>
          <Button className="ml-2" onClick={() => router.push('/dashboard/leave')}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
