// components/employee/attendance/types.ts
export interface Task {
  task: string;
  description?: string;
  hoursSpent?: number;
}

export interface AttendanceRecord {
  breaks: {
    start: string;
    end?: string;
  }[];
  namaz: {
    start: string;
    end?: string;
  }[];
  id: string;
  date: string;
  shift: string;
  checkIn: string;
  checkOut?: string;
  status: string;
  tasksCompleted?: Task[];
  totalHours?: number;
  totalBreakMinutes?: number;
  totalNamazMinutes?: number;
}