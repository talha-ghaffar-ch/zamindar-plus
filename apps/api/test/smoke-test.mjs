import { spawn } from 'node:child_process';

const port = 3300 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const ownerEmail = `smoke-owner-${testRunId}@example.com`;
const otherEmail = `smoke-other-${testRunId}@example.com`;
const password = 'Password123';
let serverOutput = '';
let ownerAuth = null;
let otherAuth = null;

const server = spawn(process.execPath, ['dist/src/main.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    JWT_SECRET: process.env.JWT_SECRET ?? 'zamindar-plus-smoke-test-secret',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  const expectedStatus = options.expectedStatus ?? 200;

  if (response.status !== expectedStatus) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    throw new Error(
      `${options.method ?? 'GET'} ${path} expected ${expectedStatus}, got ${
        response.status
      }: ${text}\n${serverOutput}`,
    );
  }

  return data;
}

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30000) {
    if (server.exitCode !== null) {
      throw new Error(`API exited early.\n${serverOutput}`);
    }

    try {
      const response = await fetch(`${baseUrl}/`);

      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(`API did not start in time.\n${serverOutput}`);
}

async function signup(email) {
  return requestJson('/auth/signup', {
    method: 'POST',
    expectedStatus: 201,
    body: {
      firstName: 'Smoke',
      lastName: 'Farmer',
      email,
      phone: '03000000000',
      password,
      farmerType: 'Land Owner',
    },
  });
}

async function signupAndVerify(email) {
  const signupResponse = await signup(email);

  assert(
    signupResponse.verificationRequired === true,
    'Signup did not require email verification.',
  );
  assert(
    signupResponse.devVerificationToken,
    'Signup did not return a test verification token.',
  );

  await requestJson('/auth/login', {
    method: 'POST',
    expectedStatus: 401,
    body: {
      email,
      password,
    },
  });

  const verificationResponse = await requestJson('/auth/verify-email', {
    method: 'POST',
    body: {
      token: signupResponse.devVerificationToken,
    },
  });

  assert(
    verificationResponse.message.includes('verified'),
    'Email verification did not complete.',
  );

  return requestJson('/auth/login', {
    method: 'POST',
    body: {
      email,
      password,
    },
  });
}

async function cleanupAccount(auth) {
  if (!auth?.accessToken || !auth?.user?.id) {
    return;
  }

  try {
    await requestJson(`/users/${auth.user.id}`, {
      method: 'DELETE',
      token: auth.accessToken,
    });
  } catch {
    // The test should report the original failure; cleanup is best effort.
  }
}

try {
  await waitForServer();

  await requestJson('/profiles', {
    expectedStatus: 401,
  });

  await requestJson('/auth/signup', {
    method: 'POST',
    expectedStatus: 400,
    body: {
      firstName: 'A',
      lastName: 'Farmer',
      email: 'not-an-email',
      password: 'short',
      unexpectedField: true,
    },
  });

  ownerAuth = await signupAndVerify(ownerEmail);
  otherAuth = await signupAndVerify(otherEmail);

  await requestJson('/users', {
    method: 'POST',
    expectedStatus: 403,
    token: ownerAuth.accessToken,
    body: {
      firstName: 'Blocked',
      lastName: 'User',
      email: `blocked-${testRunId}@example.com`,
      password,
    },
  });

  const loginResponse = await requestJson('/auth/login', {
    method: 'POST',
    body: {
      email: ownerEmail,
      password,
    },
  });

  assert(loginResponse.accessToken, 'Login did not return an access token.');

  const updatedOwner = await requestJson(`/users/${ownerAuth.user.id}`, {
    method: 'PATCH',
    token: ownerAuth.accessToken,
    body: {
      firstName: 'Updated',
      preferredAreaUnit: 'Kanal',
      preferredCurrency: 'PKR',
      preferredLanguage: 'English',
      dateFormat: 'YYYY-MM-DD',
      emailNotifications: false,
      smsNotifications: true,
      weeklyReport: false,
      profileImageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" />',
    },
  });

  assert(updatedOwner.firstName === 'Updated', 'User first name was not updated.');
  assert(
    updatedOwner.preferredAreaUnit === 'Kanal',
    'Preferred area unit was not saved.',
  );
  assert(
    updatedOwner.emailNotifications === false,
    'Email notification setting was not saved.',
  );
  assert(
    updatedOwner.smsNotifications === true,
    'SMS notification setting was not saved.',
  );
  assert(updatedOwner.weeklyReport === false, 'Weekly report setting was not saved.');

  const profile = await requestJson('/profiles', {
    method: 'POST',
    expectedStatus: 201,
    token: ownerAuth.accessToken,
    body: {
      profileName: 'Smoke Farm',
      city: 'Lahore',
    },
  });

  assert(
    profile.userId === ownerAuth.user.id,
    'Profile was not assigned to the authenticated user.',
  );

  const otherProfiles = await requestJson('/profiles', {
    token: otherAuth.accessToken,
  });

  assert(otherProfiles.length === 0, 'Other user could see owner profiles.');

  await requestJson(`/profiles/${profile.id}`, {
    method: 'PATCH',
    expectedStatus: 404,
    token: otherAuth.accessToken,
    body: {
      profileName: 'Unauthorized edit',
    },
  });

  const zameen = await requestJson('/zameen', {
    method: 'POST',
    expectedStatus: 201,
    token: ownerAuth.accessToken,
    body: {
      profileId: profile.id,
      zameenName: 'Smoke Zameen',
      totalAreaValue: 1,
      totalAreaUnit: 'Acre',
      totalAreaSqft: 43560,
      ownershipType: 'Own land',
    },
  });

  const crop = await requestJson('/crops', {
    method: 'POST',
    expectedStatus: 201,
    token: ownerAuth.accessToken,
    body: {
      zameenId: zameen.id,
      cropName: 'Wheat',
      cropAreaValue: 1,
      cropAreaUnit: 'Acre',
      cropAreaSqft: 43560,
      startMonth: 6,
      startYear: 2026,
      status: 'Active',
    },
  });

  await requestJson('/crops', {
    method: 'POST',
    expectedStatus: 400,
    token: ownerAuth.accessToken,
    body: {
      zameenId: zameen.id,
      cropName: 'Rice',
      cropAreaValue: 0.01,
      cropAreaUnit: 'Marla',
      cropAreaSqft: 272.25,
    },
  });

  const expense = await requestJson('/expenses', {
    method: 'POST',
    expectedStatus: 201,
    token: ownerAuth.accessToken,
    body: {
      cropId: crop.id,
      expenseCategory: 'Fertilizer',
      description: 'Smoke expense',
      amount: 1000,
      expenseDate: '2026-06-08',
      expenseMonth: 6,
      expenseYear: 2026,
      paymentStatus: 'Paid',
    },
  });

  assert(expense.amount === 1000, 'Expense amount was not saved.');

  const income = await requestJson('/income', {
    method: 'POST',
    expectedStatus: 201,
    token: ownerAuth.accessToken,
    body: {
      cropId: crop.id,
      quantity: 10,
      quantityUnit: 'Maund',
      rate: 200,
      totalAmount: 2000,
      incomeDate: '2026-06-08',
      incomeMonth: 6,
      incomeYear: 2026,
      paymentStatus: 'Received',
      buyerName: 'Smoke Buyer',
    },
  });

  assert(income.totalAmount === 2000, 'Income amount was not saved.');

  await requestJson(`/income/${income.id}`, {
    method: 'DELETE',
    expectedStatus: 404,
    token: otherAuth.accessToken,
  });

  const summary = await requestJson('/reports/summary', {
    token: ownerAuth.accessToken,
  });

  assert(summary.totalExpense === 1000, 'Summary expense total is incorrect.');
  assert(summary.totalIncome === 2000, 'Summary income total is incorrect.');
  assert(summary.netProfit === 1000, 'Summary net profit is incorrect.');
  assert(summary.zameenCount === 1, 'Summary zameen count is incorrect.');
  assert(summary.cropCount === 1, 'Summary crop count is incorrect.');
  assert(summary.expenseCount === 1, 'Summary expense count is incorrect.');
  assert(summary.incomeCount === 1, 'Summary income count is incorrect.');

  const cropReports = await requestJson('/reports/crop-profitability', {
    token: ownerAuth.accessToken,
  });

  assert(cropReports.length === 1, 'Crop report row count is incorrect.');
  assert(cropReports[0].cropId === crop.id, 'Crop report crop id is incorrect.');
  assert(
    cropReports[0].netProfit === 1000,
    'Crop report net profit is incorrect.',
  );

  const monthlyReports = await requestJson('/reports/monthly-summary', {
    token: ownerAuth.accessToken,
  });

  assert(monthlyReports.length === 1, 'Monthly report row count is incorrect.');
  assert(monthlyReports[0].year === 2026, 'Monthly report year is incorrect.');
  assert(monthlyReports[0].month === 6, 'Monthly report month is incorrect.');
  assert(
    monthlyReports[0].netProfit === 1000,
    'Monthly report net profit is incorrect.',
  );

  await cleanupAccount(ownerAuth);
  ownerAuth = null;
  await cleanupAccount(otherAuth);
  otherAuth = null;

  console.log('API smoke test passed.');
} finally {
  await cleanupAccount(ownerAuth);
  await cleanupAccount(otherAuth);
  server.kill();
}
