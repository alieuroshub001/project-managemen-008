// components/employee/attendance/CheckOutModal.tsx
'use client';

import { Modal, Form, Input, Button, Typography } from 'antd';
import { useState } from 'react';

const { Text } = Typography;
const { TextArea } = Input;

interface Task {
  task: string;
  description?: string;
  hoursSpent?: number;
}

interface CheckOutModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CheckOutModal({ visible, onCancel, onSuccess }: CheckOutModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Partial<Task>>({});
  const [loading, setLoading] = useState(false);

  const addTask = () => {
    const name = newTask.task?.trim();
    if (!name) return; // guard: must have a task name

    // Build a fully-typed Task before inserting
    const toAdd: Task = {
      task: name,
      description: newTask.description?.trim() || undefined,
      hoursSpent: Number.isFinite(Number(newTask.hoursSpent))
        ? Number(newTask.hoursSpent)
        : undefined,
    };

    setTasks(prev => [...prev, toAdd]);
    setNewTask({});
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/employee/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          checkOutReason: values.reason,
          tasksCompleted: tasks,
        }),
      });

      const data = await response.json();
      if (data.data) onSuccess();
    } catch (error) {
      console.error('Failed to check out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Check Out" open={visible} onCancel={onCancel} footer={null} width={800}>
      <Form onFinish={handleSubmit}>
        <Form.Item name="reason" label="Reason for early check-out (if applicable)">
          <TextArea rows={2} />
        </Form.Item>

        <div className="mb-4">
          <div className="text-lg font-medium mb-2">Tasks Completed Today</div>

          <div className="space-y-2 mb-4">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-1">
                  <Text strong>{task.task}</Text>
                  {task.description && <Text type="secondary"> - {task.description}</Text>}
                  {typeof task.hoursSpent === 'number' && <Text> ({task.hoursSpent} hrs)</Text>}
                </div>
                <Button type="link" danger onClick={() => removeTask(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              placeholder="Task name"
              value={newTask.task || ''}
              onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="Hours spent"
              type="number"
              value={newTask.hoursSpent ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setNewTask({
                  ...newTask,
                  hoursSpent: val === '' ? undefined : Number(val),
                });
              }}
              className="w-24"
            />
            <Button onClick={addTask}>Add Task</Button>
          </div>

          <Input.TextArea
            placeholder="Task description"
            value={newTask.description || ''}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="mt-2"
          />
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Confirm Check Out
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
