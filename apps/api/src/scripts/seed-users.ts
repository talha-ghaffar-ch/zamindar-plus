import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';

type SeedUserConfig = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
};

const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
] as const;

function getRequiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to seed users.`);
  }

  return value;
}

async function upsertSeedUser(prisma: PrismaClient, config: SeedUserConfig) {
  const passwordHash = await bcrypt.hash(config.password, 12);

  await prisma.user.upsert({
    where: {
      email: config.email,
    },
    update: {
      firstName: config.firstName,
      lastName: config.lastName,
      passwordHash,
      role: config.role,
      authProvider: 'PASSWORD',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    },
    create: {
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
      passwordHash,
      role: config.role,
      authProvider: 'PASSWORD',
      farmerType: 'Land Owner',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
}

async function main() {
  const missingVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing seed environment variables: ${missingVariables.join(', ')}`,
    );
  }

  const adapter = new PrismaPg({
    connectionString: getRequiredEnvironmentVariable('DATABASE_URL'),
  });
  const prisma = new PrismaClient({ adapter });

  try {
    await upsertSeedUser(prisma, {
      email: getRequiredEnvironmentVariable('SEED_ADMIN_EMAIL').toLowerCase(),
      password: getRequiredEnvironmentVariable('SEED_ADMIN_PASSWORD'),
      firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Admin',
      lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || 'User',
      role: 'ADMIN',
    });
    const testEmail = process.env.SEED_TEST_EMAIL?.trim().toLowerCase();
    const testPassword = process.env.SEED_TEST_PASSWORD?.trim();

    if (testEmail && testPassword) {
      await upsertSeedUser(prisma, {
        email: testEmail,
        password: testPassword,
        firstName: process.env.SEED_TEST_FIRST_NAME?.trim() || 'Test',
        lastName: process.env.SEED_TEST_LAST_NAME?.trim() || 'Farmer',
        role: 'USER',
      });
    }

    console.log('Seed users are ready.');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
