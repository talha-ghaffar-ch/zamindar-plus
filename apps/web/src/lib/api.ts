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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getReportSummary() {
  return getJson<ReportSummary>('/reports/summary');
}

export function getUsers() {
  return getJson<User[]>('/users');
}