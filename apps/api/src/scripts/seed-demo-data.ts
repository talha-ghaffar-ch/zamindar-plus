import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';

const ADMIN_EMAIL = (
  process.env.SEED_ADMIN_EMAIL?.trim() || 'zamindarplus@gmail.com'
).toLowerCase();

const AREA_TO_SQFT = {
  Acre: 43560,
  Killa: 43560,
  Murabba: 1089000,
  Kanal: 5445,
  Marla: 272.25,
} as const;

type AreaUnit = keyof typeof AREA_TO_SQFT;

type TransactionTemplate = {
  date: string;
  category?: string;
  description?: string;
  amount?: number;
  paymentStatus?: string;
  quantity?: number;
  quantityUnit?: string;
  rate?: number;
  totalAmount?: number;
  buyerName?: string;
};

type CropTemplate = {
  name: string;
  areaValue: number;
  areaUnit: AreaUnit;
  startMonth: number;
  startYear: number;
  status: 'Active' | 'Completed';
  expenses: TransactionTemplate[];
  income: TransactionTemplate[];
};

type ZameenTemplate = {
  name: string;
  areaValue: number;
  areaUnit: AreaUnit;
  ownershipType: string;
  murabbaNumber?: string;
  killaNumber?: string;
  khasraNumber?: string;
  crops: CropTemplate[];
};

type ProfileTemplate = {
  name: string;
  city: string;
  area: string;
  village: string;
  zameen: ZameenTemplate[];
};

function toSquareFeet(value: number, unit: AreaUnit) {
  return value * AREA_TO_SQFT[unit];
}

function dateParts(dateText: string) {
  const date = new Date(`${dateText}T00:00:00.000Z`);

  return {
    date,
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}

function expense(
  date: string,
  category: string,
  description: string,
  amount: number,
  paymentStatus = 'Paid',
): TransactionTemplate {
  return {
    date,
    category,
    description,
    amount,
    paymentStatus,
  };
}

function income(
  date: string,
  buyerName: string,
  quantity: number,
  quantityUnit: string,
  rate: number,
  paymentStatus = 'Received',
): TransactionTemplate {
  return {
    date,
    buyerName,
    quantity,
    quantityUnit,
    rate,
    totalAmount: quantity * rate,
    paymentStatus,
  };
}

function cropExpenses(seedDate: string, cropName: string, baseAmount: number) {
  const [yearText, monthText] = seedDate.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;

  return [
    expense(
      `${year}-${String(month).padStart(2, '0')}-05`,
      'Land preparation',
      `${cropName} land preparation and ridge work`,
      baseAmount,
    ),
    expense(
      `${year}-${String(month).padStart(2, '0')}-11`,
      'Seed / Sowing',
      `${cropName} seed and sowing labour`,
      Math.round(baseAmount * 0.72),
    ),
    expense(
      `${year}-${String(nextMonth).padStart(2, '0')}-03`,
      'Fertilizer',
      `${cropName} fertilizer first application`,
      Math.round(baseAmount * 0.9),
    ),
    expense(
      `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-17`,
      'Water / Irrigation',
      `${cropName} irrigation and tube well expense`,
      Math.round(baseAmount * 0.48),
    ),
    expense(
      `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-24`,
      'Spray / Pesticide',
      `${cropName} spray and crop protection`,
      Math.round(baseAmount * 0.54),
      'Unpaid',
    ),
    expense(
      `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-28`,
      'Machinery / Diesel',
      `${cropName} diesel and machinery operation`,
      Math.round(baseAmount * 0.62),
    ),
  ];
}

const demoProfiles: ProfileTemplate[] = [
  {
    name: 'Main Family Farm',
    city: 'Lahore',
    area: 'Chak 42-B',
    village: 'Barki Road',
    zameen: [
      {
        name: 'Canal Side Block',
        areaValue: 26,
        areaUnit: 'Acre',
        ownershipType: 'Own Land',
        murabbaNumber: 'M-18',
        killaNumber: '7-12',
        khasraNumber: '144/2',
        crops: [
          {
            name: 'Wheat',
            areaValue: 14,
            areaUnit: 'Acre',
            startMonth: 11,
            startYear: 2025,
            status: 'Completed',
            expenses: cropExpenses('2025-11', 'Wheat', 142000),
            income: [
              income('2026-04-16', 'Al Rehman Flour Mills', 610, 'Maund', 4150),
              income('2026-04-25', 'Lahore Grain Market', 390, 'Maund', 4225),
              income('2026-05-03', 'Chaudhry Traders', 155, 'Maund', 4180, 'Pending'),
            ],
          },
          {
            name: 'Fodder',
            areaValue: 5,
            areaUnit: 'Acre',
            startMonth: 2,
            startYear: 2026,
            status: 'Active',
            expenses: cropExpenses('2026-02', 'Fodder', 54000),
            income: [
              income('2026-04-12', 'Dairy Farm Unit 1', 42, 'Trolley', 13500),
              income('2026-05-15', 'Local Dairy Buyer', 38, 'Trolley', 14200),
            ],
          },
        ],
      },
      {
        name: 'Motor Pump Block',
        areaValue: 18,
        areaUnit: 'Acre',
        ownershipType: 'Family Land',
        murabbaNumber: 'M-19',
        killaNumber: '1-6',
        khasraNumber: '148/9',
        crops: [
          {
            name: 'Rice',
            areaValue: 12,
            areaUnit: 'Acre',
            startMonth: 6,
            startYear: 2026,
            status: 'Active',
            expenses: cropExpenses('2026-06', 'Rice', 168000),
            income: [
              income('2026-10-20', 'Punjab Rice Exporters', 520, 'Maund', 5050, 'Pending'),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Kasur Lease Farm',
    city: 'Kasur',
    area: 'Chak 16-K',
    village: 'Mustafabad',
    zameen: [
      {
        name: 'Thekka East Strip',
        areaValue: 32,
        areaUnit: 'Acre',
        ownershipType: 'Thekka Land',
        murabbaNumber: 'T-04',
        killaNumber: '13-20',
        khasraNumber: '88/11',
        crops: [
          {
            name: 'Sugarcane',
            areaValue: 21,
            areaUnit: 'Acre',
            startMonth: 9,
            startYear: 2025,
            status: 'Active',
            expenses: cropExpenses('2025-09', 'Sugarcane', 225000),
            income: [
              income('2026-01-25', 'Kasur Sugar Mills', 860, 'Maund', 520),
              income('2026-02-18', 'Kasur Sugar Mills', 940, 'Maund', 535),
              income('2026-03-10', 'Private Cane Buyer', 420, 'Maund', 545, 'Pending'),
            ],
          },
        ],
      },
      {
        name: 'Vegetable Tunnel Area',
        areaValue: 8,
        areaUnit: 'Acre',
        ownershipType: 'Managed Land',
        murabbaNumber: 'T-05',
        killaNumber: '3-5',
        khasraNumber: '90/4',
        crops: [
          {
            name: 'Vegetables',
            areaValue: 6,
            areaUnit: 'Acre',
            startMonth: 1,
            startYear: 2026,
            status: 'Active',
            expenses: cropExpenses('2026-01', 'Vegetables', 87000),
            income: [
              income('2026-03-14', 'Lahore Sabzi Mandi', 220, 'Crate', 780),
              income('2026-04-02', 'Model Town Retailer', 175, 'Crate', 820),
              income('2026-04-28', 'Local Commission Agent', 140, 'Crate', 800),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Gujranwala Rice Belt',
    city: 'Gujranwala',
    area: 'Qila Didar Singh',
    village: 'Aroop',
    zameen: [
      {
        name: 'Paddy North Field',
        areaValue: 24,
        areaUnit: 'Acre',
        ownershipType: 'Own Land',
        murabbaNumber: 'G-11',
        killaNumber: '8-14',
        khasraNumber: '230/6',
        crops: [
          {
            name: 'Rice',
            areaValue: 18,
            areaUnit: 'Acre',
            startMonth: 6,
            startYear: 2025,
            status: 'Completed',
            expenses: cropExpenses('2025-06', 'Rice', 184000),
            income: [
              income('2025-10-12', 'Gujranwala Rice Mills', 780, 'Maund', 4920),
              income('2025-10-28', 'Export Quality Traders', 340, 'Maund', 5150),
            ],
          },
        ],
      },
      {
        name: 'Tube Well South Field',
        areaValue: 16,
        areaUnit: 'Acre',
        ownershipType: 'Own Land',
        murabbaNumber: 'G-12',
        killaNumber: '2-9',
        khasraNumber: '236/1',
        crops: [
          {
            name: 'Wheat',
            areaValue: 10,
            areaUnit: 'Acre',
            startMonth: 11,
            startYear: 2025,
            status: 'Completed',
            expenses: cropExpenses('2025-11', 'Wheat', 112000),
            income: [
              income('2026-04-08', 'Gujranwala Grain Center', 480, 'Maund', 4180),
              income('2026-04-21', 'Village Stockist', 215, 'Maund', 4100),
            ],
          },
          {
            name: 'Maize',
            areaValue: 4,
            areaUnit: 'Acre',
            startMonth: 3,
            startYear: 2026,
            status: 'Active',
            expenses: cropExpenses('2026-03', 'Maize', 69000),
            income: [
              income('2026-07-05', 'Feed Mill Buyer', 310, 'Maund', 2350, 'Pending'),
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Khanewal Cotton Project',
    city: 'Khanewal',
    area: 'Chak 72/10-R',
    village: 'Mian Channu',
    zameen: [
      {
        name: 'Cotton Trial Block',
        areaValue: 20,
        areaUnit: 'Acre',
        ownershipType: 'Batai Land',
        murabbaNumber: 'K-07',
        killaNumber: '4-10',
        khasraNumber: '301/5',
        crops: [
          {
            name: 'Cotton',
            areaValue: 13,
            areaUnit: 'Acre',
            startMonth: 4,
            startYear: 2026,
            status: 'Active',
            expenses: cropExpenses('2026-04', 'Cotton', 158000),
            income: [
              income('2026-09-18', 'Multan Cotton Ginners', 95, 'Bale', 17800, 'Pending'),
            ],
          },
        ],
      },
      {
        name: 'Mixed Cropping Block',
        areaValue: 14,
        areaUnit: 'Acre',
        ownershipType: 'Own Land',
        murabbaNumber: 'K-08',
        killaNumber: '11-16',
        khasraNumber: '304/8',
        crops: [
          {
            name: 'Wheat',
            areaValue: 7,
            areaUnit: 'Acre',
            startMonth: 11,
            startYear: 2025,
            status: 'Completed',
            expenses: cropExpenses('2025-11', 'Wheat', 86000),
            income: [
              income('2026-04-18', 'Mian Channu Grain Dealer', 315, 'Maund', 4120),
            ],
          },
          {
            name: 'Cotton',
            areaValue: 5,
            areaUnit: 'Acre',
            startMonth: 4,
            startYear: 2026,
            status: 'Active',
            expenses: cropExpenses('2026-04', 'Cotton', 76000),
            income: [
              income('2026-09-22', 'Local Cotton Agent', 35, 'Bale', 17600, 'Pending'),
            ],
          },
        ],
      },
    ],
  },
];

function getRequiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function ensureAdminUser(prisma: PrismaClient) {
  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: ADMIN_EMAIL,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (existingAdmin) {
    if (existingAdmin.role !== 'ADMIN') {
      return prisma.user.update({
        where: {
          id: existingAdmin.id,
        },
        data: {
          role: 'ADMIN',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
        },
      });
    }

    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash(
    getRequiredEnvironmentVariable('SEED_ADMIN_PASSWORD'),
    12,
  );

  return prisma.user.create({
    data: {
      firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Core',
      lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || 'Admin',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      authProvider: 'PASSWORD',
      farmerType: 'Land Owner',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      preferredAreaUnit: 'Acre',
      preferredCurrency: 'PKR',
      preferredLanguage: 'English',
    },
    select: {
      id: true,
      email: true,
    },
  });
}

async function seedDemoData(prisma: PrismaClient, userId: string) {
  await prisma.profile.deleteMany({
    where: {
      userId,
    },
  });

  let profileCount = 0;
  let zameenCount = 0;
  let cropCount = 0;
  let expenseCount = 0;
  let incomeCount = 0;

  for (const profileTemplate of demoProfiles) {
    const profile = await prisma.profile.create({
      data: {
        userId,
        profileName: profileTemplate.name,
        city: profileTemplate.city,
        chakAreaName: profileTemplate.area,
        villageName: profileTemplate.village,
      },
    });
    profileCount += 1;

    for (const zameenTemplate of profileTemplate.zameen) {
      const zameen = await prisma.zameen.create({
        data: {
          profileId: profile.id,
          zameenName: zameenTemplate.name,
          murabbaNumber: zameenTemplate.murabbaNumber,
          killaNumber: zameenTemplate.killaNumber,
          khasraNumber: zameenTemplate.khasraNumber,
          totalAreaValue: zameenTemplate.areaValue,
          totalAreaUnit: zameenTemplate.areaUnit,
          totalAreaSqft: toSquareFeet(
            zameenTemplate.areaValue,
            zameenTemplate.areaUnit,
          ),
          ownershipType: zameenTemplate.ownershipType,
        },
      });
      zameenCount += 1;

      for (const cropTemplate of zameenTemplate.crops) {
        const crop = await prisma.crop.create({
          data: {
            zameenId: zameen.id,
            cropName: cropTemplate.name,
            cropAreaValue: cropTemplate.areaValue,
            cropAreaUnit: cropTemplate.areaUnit,
            cropAreaSqft: toSquareFeet(
              cropTemplate.areaValue,
              cropTemplate.areaUnit,
            ),
            startMonth: cropTemplate.startMonth,
            startYear: cropTemplate.startYear,
            status: cropTemplate.status,
          },
        });
        cropCount += 1;

        for (const expenseTemplate of cropTemplate.expenses) {
          const parts = dateParts(expenseTemplate.date);

          await prisma.expense.create({
            data: {
              cropId: crop.id,
              expenseCategory: expenseTemplate.category ?? 'Other expense',
              description:
                expenseTemplate.description ??
                `${cropTemplate.name} operating expense`,
              amount: expenseTemplate.amount ?? 0,
              expenseDate: parts.date,
              expenseMonth: parts.month,
              expenseYear: parts.year,
              paymentStatus: expenseTemplate.paymentStatus ?? 'Paid',
            },
          });
          expenseCount += 1;
        }

        for (const incomeTemplate of cropTemplate.income) {
          const parts = dateParts(incomeTemplate.date);

          await prisma.income.create({
            data: {
              cropId: crop.id,
              quantity: incomeTemplate.quantity,
              quantityUnit: incomeTemplate.quantityUnit,
              rate: incomeTemplate.rate,
              totalAmount: incomeTemplate.totalAmount ?? 0,
              incomeDate: parts.date,
              incomeMonth: parts.month,
              incomeYear: parts.year,
              paymentStatus: incomeTemplate.paymentStatus ?? 'Received',
              buyerName: incomeTemplate.buyerName,
            },
          });
          incomeCount += 1;
        }
      }
    }
  }

  return {
    profileCount,
    zameenCount,
    cropCount,
    expenseCount,
    incomeCount,
  };
}

async function main() {
  const adapter = new PrismaPg({
    connectionString: getRequiredEnvironmentVariable('DATABASE_URL'),
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await ensureAdminUser(prisma);
    const counts = await seedDemoData(prisma, admin.id);

    console.log(`Professional demo data seeded for ${admin.email}.`);
    console.log(
      [
        `${counts.profileCount} profiles`,
        `${counts.zameenCount} zameen records`,
        `${counts.cropCount} crops`,
        `${counts.expenseCount} expenses`,
        `${counts.incomeCount} income records`,
      ].join(', '),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
