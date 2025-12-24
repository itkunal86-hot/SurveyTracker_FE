export interface SurveyCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CLOSED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceAssignment {
  id: string;
  deviceId: string;
  deviceName: string;
  surveyId: string;
  surveyName?: string;
  fromDate: string;
  toDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SurveyAttribute {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  dataType: 'NUMBER' | 'TEXT' | 'DATE' | 'DROPDOWN';
  dropdownOptions?: string[];
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyHistoryLog {
  id: string;
  deviceId: string;
  deviceName: string;
  surveyId: string;
  surveyName: string;
  fromDate: string;
  toDate: string;
  duration?: number; // in days
  createdAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SURVEY MANAGER';
  company: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface AdminStats {
  totalCategories: number;
  totalSurveys: number;
  activeSurveys: number;
  totalDevices: number;
  assignedDevices: number;
  totalAttributes: number;
}
