const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const AUTH_TOKEN_STORAGE_KEY = 'zamindar-plus-auth-token';

export type ReportSummary = {
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
  zameenCount: number;
  cropCount: number;
  expenseCount: number;
  incomeCount: number;
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

export type Profile = {
  id: string;
  userId: string;
  profileName: string;
  city: string | null;
  chakAreaName: string | null;
  villageName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProfilePayload = {
  profileName: string;
  city?: string;
  chakAreaName?: string;
  villageName?: string;
  notes?: string;
};

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  farmerType?: string;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Zameen = {
  id: string;
  profileId: string;
  murabbaNumber: string | null;
  zameenName: string;
  killaNumber: string | null;
  khasraNumber: string | null;
  totalAreaValue: number;
  totalAreaUnit: string;
  totalAreaSqft: number;
  ownershipType: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateZameenPayload = {
  profileId: string;
  murabbaNumber?: string;
  zameenName: string;
  killaNumber?: string;
  khasraNumber?: string;
  totalAreaValue: number;
  totalAreaUnit: string;
  totalAreaSqft: number;
  ownershipType?: string;
  notes?: string;
};

export type Crop = {
  id: string;
  zameenId: string;
  cropName: string;
  cropAreaValue: number;
  cropAreaUnit: string;
  cropAreaSqft: number;
  startMonth: number | null;
  startYear: number | null;
  expectedEndMonth: number | null;
  expectedEndYear: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCropPayload = {
  zameenId: string;
  cropName: string;
  cropAreaValue: number;
  cropAreaUnit: string;
  cropAreaSqft: number;
  startMonth?: number;
  startYear?: number;
  expectedEndMonth?: number;
  expectedEndYear?: number;
  status?: string;
  notes?: string;
};

export type Expense = {
  id: string;
  cropId: string;
  expenseCategory: string;
  description: string;
  amount: number;
  expenseDate: string;
  expenseMonth: number;
  expenseYear: number;
  paymentStatus: string | null;
  paymentMethod: string | null;
  notes: string | null;
  receiptImageUrl: string | null;
  sharedGroupId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateExpensePayload = {
  cropId: string;
  expenseCategory: string;
  description: string;
  amount: number;
  expenseDate: string;
  expenseMonth: number;
  expenseYear: number;
  paymentStatus?: string;
  paymentMethod?: string;
  notes?: string;
};

export type Income = {
  id: string;
  cropId: string;
  incomeType: string;
  quantity: number | null;
  quantityUnit: string | null;
  rate: number | null;
  totalAmount: number;
  incomeDate: string;
  incomeMonth: number;
  incomeYear: number;
  paymentStatus: string | null;
  buyerName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateIncomePayload = {
  cropId: string;
  incomeType: string;
  quantity?: number;
  quantityUnit?: string;
  rate?: number;
  totalAmount: number;
  incomeDate: string;
  incomeMonth: number;
  incomeYear: number;
  paymentStatus?: string;
  buyerName?: string;
  notes?: string;
};

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response) {
  const errorText = await response.text();

  if (!errorText) {
    return `API request failed: ${response.status}`;
  }

  try {
    const parsedError = JSON.parse(errorText) as { message?: string | string[] };

    if (Array.isArray(parsedError.message)) {
      return parsedError.message.join(' ');
    }

    if (parsedError.message) {
      return parsedError.message;
    }
  } catch {
    return errorText;
  }

  return errorText;
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function signup(payload: CreateUserPayload) {
  return requestJson<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return requestJson<User>('/auth/me');
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

export function updateUser(id: string, payload: UpdateUserPayload) {
  return requestJson<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: string) {
  return requestJson<{ deleted: true; id: string }>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export function getProfiles() {
  return requestJson<Profile[]>('/profiles');
}

export function createProfile(payload: CreateProfilePayload) {
  return requestJson<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getZameen() {
  return requestJson<Zameen[]>('/zameen');
}

export function createZameen(payload: CreateZameenPayload) {
  return requestJson<Zameen>('/zameen', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCrops() {
  return requestJson<Crop[]>('/crops');
}

export function createCrop(payload: CreateCropPayload) {
  return requestJson<Crop>('/crops', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getExpenses() {
  return requestJson<Expense[]>('/expenses');
}

export function createExpense(payload: CreateExpensePayload) {
  return requestJson<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getIncome() {
  return requestJson<Income[]>('/income');
}

export function createIncome(payload: CreateIncomePayload) {
  return requestJson<Income>('/income', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
