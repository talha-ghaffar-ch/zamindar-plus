import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const AUTH_TOKEN_STORAGE_KEY = 'zamindar-plus-mobile-auth-token';
export const API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

let authToken: string | null = null;

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  farmerType: string | null;
  role: string;
  emailVerified: boolean;
  profileImageUrl: string | null;
  preferredAreaUnit: string;
  preferredCurrency: string;
  preferredLanguage: string;
  googleConnected?: boolean;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type MessageResponse = {
  message: string;
};

export type ReportSummary = {
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
  zameenCount: number;
  cropCount: number;
  expenseCount: number;
  incomeCount: number;
};

export type MonthlySummaryReport = {
  year: number;
  month: number;
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
};

export type CropProfitabilityReport = {
  cropId: string;
  cropName: string;
  zameenName: string;
  status: string;
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
};

export type Profile = {
  id: string;
  profileName: string;
  city: string | null;
  chakAreaName: string | null;
  villageName: string | null;
};

export type Zameen = {
  id: string;
  profileId: string;
  zameenName: string;
  totalAreaValue: number;
  totalAreaUnit: string;
  ownershipType: string | null;
};

export type Crop = {
  id: string;
  zameenId: string;
  cropName: string;
  cropAreaValue: number;
  cropAreaUnit: string;
  status: string;
  startMonth: number | null;
  startYear: number | null;
};

export type Expense = {
  id: string;
  cropId: string;
  expenseCategory: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentStatus: string | null;
};

export type Income = {
  id: string;
  cropId: string;
  quantity: number | null;
  quantityUnit: string | null;
  rate: number | null;
  totalAmount: number;
  incomeDate: string;
  paymentStatus: string | null;
  buyerName: string | null;
};

export type FarmData = {
  summary: ReportSummary | null;
  monthlyReports: MonthlySummaryReport[];
  cropProfitability: CropProfitabilityReport[];
  profiles: Profile[];
  zameen: Zameen[];
  crops: Crop[];
  expenses: Expense[];
  income: Income[];
};

export type AiChatHistoryMessage = {
  role: 'assistant' | 'user';
  text: string;
};

export async function initAuthToken() {
  authToken = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return authToken;
}

export function getAuthToken() {
  return authToken;
}

export async function setAuthToken(token: string) {
  authToken = token;
  await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export async function clearAuthToken() {
  authToken = null;
  await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return `API request failed: ${response.status}`;
  }

  try {
    const parsed = JSON.parse(text) as {message?: string | string[]};

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(' ');
    }

    return parsed.message ?? text;
  } catch {
    return text;
  }
}

export function login(email: string, password: string) {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  });
}

export function signup(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  farmerType?: string;
}) {
  return requestJson<{message: string; verificationRequired: boolean}>(
    '/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function verifyEmail(token: string) {
  return requestJson<MessageResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({token}),
  });
}

export function forgotPassword(email: string) {
  return requestJson<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({email}),
  });
}

export function resetPassword(token: string, password: string) {
  return requestJson<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({token, password}),
  });
}

export function getMe() {
  return requestJson<User>('/auth/me');
}

export async function loadFarmData(): Promise<FarmData> {
  const [
    summary,
    monthlyReports,
    cropProfitability,
    profiles,
    zameen,
    crops,
    expenses,
    income,
  ] = await Promise.all([
    requestJson<ReportSummary>('/reports/summary'),
    requestJson<MonthlySummaryReport[]>('/reports/monthly-summary'),
    requestJson<CropProfitabilityReport[]>('/reports/crop-profitability'),
    requestJson<Profile[]>('/profiles'),
    requestJson<Zameen[]>('/zameen'),
    requestJson<Crop[]>('/crops'),
    requestJson<Expense[]>('/expenses'),
    requestJson<Income[]>('/income'),
  ]);

  return {
    summary,
    monthlyReports,
    cropProfitability,
    profiles,
    zameen,
    crops,
    expenses,
    income,
  };
}

export function createProfile(payload: {
  profileName: string;
  city?: string;
  chakAreaName?: string;
  villageName?: string;
}) {
  return requestJson<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createZameen(payload: {
  profileId: string;
  zameenName: string;
  totalAreaValue: number;
  totalAreaUnit: string;
  totalAreaSqft: number;
  ownershipType?: string;
}) {
  return requestJson<Zameen>('/zameen', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createCrop(payload: {
  zameenId: string;
  cropName: string;
  cropAreaValue: number;
  cropAreaUnit: string;
  cropAreaSqft: number;
  startMonth?: number;
  startYear?: number;
  status?: string;
}) {
  return requestJson<Crop>('/crops', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createExpense(payload: {
  cropId: string;
  expenseCategory: string;
  description: string;
  amount: number;
  expenseDate: string;
  expenseMonth: number;
  expenseYear: number;
  paymentStatus?: string;
}) {
  return requestJson<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createIncome(payload: {
  cropId: string;
  quantity?: number;
  quantityUnit?: string;
  rate?: number;
  totalAmount: number;
  incomeDate: string;
  incomeMonth: number;
  incomeYear: number;
  paymentStatus?: string;
  buyerName?: string;
}) {
  return requestJson<Income>('/income', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendAiMessage(
  message: string,
  history: AiChatHistoryMessage[],
) {
  return requestJson<{reply: string}>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({message, history}),
  });
}
