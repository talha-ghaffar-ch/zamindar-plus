import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from './config';

const AUTH_TOKEN_STORAGE_KEY = 'zamindar-plus-mobile-auth-token';
const DEFAULT_TIMEOUT_MS = 20000;

// The app connects only to the live production backend (EC2 + Docker), through
// Caddy — exactly like the website.
export const API_URL = API_BASE_URL;

let authToken: string | null = null;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

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

export type CreateProfileInput = {
  profileName: string;
  city?: string;
  chakAreaName?: string;
  villageName?: string;
};

export type CreateZameenInput = {
  profileId: string;
  zameenName: string;
  totalAreaValue: number;
  totalAreaUnit: string;
  totalAreaSqft: number;
  ownershipType?: string;
};

export type CreateCropInput = {
  zameenId: string;
  cropName: string;
  cropAreaValue: number;
  cropAreaUnit: string;
  cropAreaSqft: number;
  startMonth?: number;
  startYear?: number;
  status?: string;
};

export type CreateExpenseInput = {
  cropId: string;
  expenseCategory: string;
  description: string;
  amount: number;
  expenseDate: string;
  expenseMonth: number;
  expenseYear: number;
  paymentStatus?: string;
};

export type CreateIncomeInput = {
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
};

export type UpdateProfileInput = Partial<CreateProfileInput>;
export type UpdateZameenInput = Partial<CreateZameenInput>;
export type UpdateCropInput = Partial<CreateCropInput>;
export type UpdateExpenseInput = Partial<CreateExpenseInput>;
export type UpdateIncomeInput = Partial<CreateIncomeInput>;

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Core request helper (timeout + typed errors + empty-body safe)
// ---------------------------------------------------------------------------

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
        ...options?.headers,
      },
    });
  } catch (error) {
    clearTimeout(timer);
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('Request timed out. Check your connection.', 0);
    }
    throw new ApiError(
      'Network error. Please check your internet connection.',
      0,
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response), response.status);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function getErrorMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return `Request failed (${response.status}).`;
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

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

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

export function resendVerification(email: string) {
  return requestJson<MessageResponse>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({email}),
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

/** Exchange a Google ID token ("credential") for an app session. */
export function googleLogin(credential: string) {
  return requestJson<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({credential}),
  });
}

export function connectGoogle(credential: string) {
  return requestJson<MessageResponse>('/auth/connect-google', {
    method: 'POST',
    body: JSON.stringify({credential}),
  });
}

export function disconnectGoogle() {
  return requestJson<MessageResponse>('/auth/disconnect-google', {
    method: 'POST',
  });
}

export function getMe() {
  return requestJson<User>('/auth/me');
}

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  farmerType?: string;
  preferredAreaUnit?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
};

/** Update the signed-in user's own account settings. */
export function updateUser(id: string, payload: UpdateUserInput) {
  return requestJson<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Aggregated dashboard load
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export const getProfiles = () => requestJson<Profile[]>('/profiles');

export function createProfile(payload: CreateProfileInput) {
  return requestJson<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProfile(id: string, payload: UpdateProfileInput) {
  return requestJson<Profile>(`/profiles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteProfile(id: string) {
  return requestJson<void>(`/profiles/${id}`, {method: 'DELETE'});
}

// ---------------------------------------------------------------------------
// Zameen (land)
// ---------------------------------------------------------------------------

export const getZameen = () => requestJson<Zameen[]>('/zameen');

export const getZameenByProfile = (profileId: string) =>
  requestJson<Zameen[]>(`/zameen/profile/${profileId}`);

export function createZameen(payload: CreateZameenInput) {
  return requestJson<Zameen>('/zameen', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateZameen(id: string, payload: UpdateZameenInput) {
  return requestJson<Zameen>(`/zameen/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteZameen(id: string) {
  return requestJson<void>(`/zameen/${id}`, {method: 'DELETE'});
}

// ---------------------------------------------------------------------------
// Crops
// ---------------------------------------------------------------------------

export const getCrops = () => requestJson<Crop[]>('/crops');

export const getCropsByZameen = (zameenId: string) =>
  requestJson<Crop[]>(`/crops/zameen/${zameenId}`);

export function createCrop(payload: CreateCropInput) {
  return requestJson<Crop>('/crops', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCrop(id: string, payload: UpdateCropInput) {
  return requestJson<Crop>(`/crops/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteCrop(id: string) {
  return requestJson<void>(`/crops/${id}`, {method: 'DELETE'});
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export const getExpenses = () => requestJson<Expense[]>('/expenses');

export const getExpensesByCrop = (cropId: string) =>
  requestJson<Expense[]>(`/expenses/crop/${cropId}`);

export const getExpensesByMonth = (year: number, month: number) =>
  requestJson<Expense[]>(`/expenses/month/${year}/${month}`);

export function createExpense(payload: CreateExpenseInput) {
  return requestJson<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateExpense(id: string, payload: UpdateExpenseInput) {
  return requestJson<Expense>(`/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(id: string) {
  return requestJson<void>(`/expenses/${id}`, {method: 'DELETE'});
}

// ---------------------------------------------------------------------------
// Income
// ---------------------------------------------------------------------------

export const getIncome = () => requestJson<Income[]>('/income');

export const getIncomeByCrop = (cropId: string) =>
  requestJson<Income[]>(`/income/crop/${cropId}`);

export const getIncomeByMonth = (year: number, month: number) =>
  requestJson<Income[]>(`/income/month/${year}/${month}`);

export function createIncome(payload: CreateIncomeInput) {
  return requestJson<Income>('/income', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateIncome(id: string, payload: UpdateIncomeInput) {
  return requestJson<Income>(`/income/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteIncome(id: string) {
  return requestJson<void>(`/income/${id}`, {method: 'DELETE'});
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const getSummary = () => requestJson<ReportSummary>('/reports/summary');

export const getMonthlySummary = () =>
  requestJson<MonthlySummaryReport[]>('/reports/monthly-summary');

export const getCropProfitability = () =>
  requestJson<CropProfitabilityReport[]>('/reports/crop-profitability');

// ---------------------------------------------------------------------------
// AI assistant
// ---------------------------------------------------------------------------

export type AiActionEntity =
  | 'profile'
  | 'zameen'
  | 'crop'
  | 'expense'
  | 'income';

export type AiAction = {
  type: 'created' | 'updated' | 'deleted';
  entity: AiActionEntity;
  id: string;
  label: string;
};

export type AiChatResponse = {
  reply: string;
  actions?: AiAction[];
  /** Set when the turn failed, so the UI can explain why in the user's language. */
  errorCode?: 'RATE_LIMITED' | 'UNAVAILABLE' | 'FAILED';
};

export function sendAiMessage(
  message: string,
  history: AiChatHistoryMessage[],
  language?: string,
) {
  return requestJson<AiChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({message, history, language}),
  });
}
