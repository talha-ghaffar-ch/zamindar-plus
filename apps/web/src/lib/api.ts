const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type ReportSummary = {
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  farmerType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  farmerType?: string;
};

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getReportSummary() {
  return requestJson<ReportSummary>('/reports/summary');
}

export function getUsers() {
  return requestJson<User[]>('/users');
}

export function createUser(payload: CreateUserPayload) {
  return requestJson<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}