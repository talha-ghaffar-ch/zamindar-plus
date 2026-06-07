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
  userId: string;
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