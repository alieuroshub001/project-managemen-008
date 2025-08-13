// app/dashboard/employee/profile/page.tsx
import React from 'react';
import EmployeeProfile from '@/components/Employee/Profile/EmployeeProfile';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <EmployeeProfile />
    </div>
  );
}
