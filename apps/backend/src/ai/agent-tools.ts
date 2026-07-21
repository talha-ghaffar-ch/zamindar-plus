export const AREA_UNIT_VALUES = [
  'Acre',
  'Killa',
  'Murabba',
  'Kanal',
  'Marla',
  'Square feet',
];

export const EXPENSE_CATEGORY_VALUES = [
  'Land preparation',
  'Seed / Sowing',
  'Fertilizer',
  'Spray / Pesticide',
  'Water / Irrigation',
  'Labour',
  'Machinery / Diesel',
  'Rent / Thekka',
  'Transport',
  'Other expense',
];

export const QUANTITY_UNIT_VALUES = [
  'Maund',
  'Kg',
  'Ton',
  'Quintal',
  'Bag / Bori',
  'Crate',
  'Bale',
  'Trolley',
  'Liter',
];

export const OWNERSHIP_TYPE_VALUES = [
  'Own Land',
  'Thekka Land',
  'Batai Land',
  'Family Land',
  'Managed Land',
];

export const CROP_STATUS_VALUES = ['Active', 'Completed'];

type SchemaProperty = {
  type: string;
  description?: string;
  enum?: string[];
  format?: string;
};

export type FunctionDeclaration = {
  name: string;
  description: string;
  parameters?: {
    type: 'OBJECT';
    properties: Record<string, SchemaProperty>;
    required?: string[];
  };
};

const areaUnitProperty: SchemaProperty = {
  type: 'STRING',
  description: 'Area unit',
  enum: AREA_UNIT_VALUES,
};

export const AGENT_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'list_profiles',
    description: 'List the user profiles with their ids.',
  },
  {
    name: 'create_profile',
    description: 'Create a new farm profile for the current user.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileName: {
          type: 'STRING',
          description: 'Name of the profile (min 2 chars)',
        },
        city: { type: 'STRING', description: 'City' },
        chakAreaName: {
          type: 'STRING',
          description: 'Chak / area name',
        },
        villageName: { type: 'STRING', description: 'Village name' },
      },
      required: ['profileName'],
    },
  },
  {
    name: 'update_profile',
    description: 'Update a profile. Pass only changed fields.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: { type: 'STRING', description: 'Profile id' },
        profileName: { type: 'STRING', description: 'New profile name' },
        city: { type: 'STRING', description: 'New city' },
        chakAreaName: { type: 'STRING', description: 'New chak / area name' },
        villageName: { type: 'STRING', description: 'New village name' },
      },
      required: ['profileId'],
    },
  },
  {
    name: 'delete_profile',
    description:
      'Delete a profile and every record under it. Needs explicit user confirmation first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: { type: 'STRING', description: 'Profile id' },
      },
      required: ['profileId'],
    },
  },
  {
    name: 'list_zameen',
    description:
      'List zameen with total, used and available area. Optionally filter by profile.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: {
          type: 'STRING',
          description: 'Filter by profile id',
        },
      },
    },
  },
  {
    name: 'create_zameen',
    description: 'Add a zameen under a profile. Give area as value + unit.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: {
          type: 'STRING',
          description: 'Parent profile id',
        },
        zameenName: {
          type: 'STRING',
          description: 'Zameen name',
        },
        totalAreaValue: {
          type: 'NUMBER',
          description: 'Area value, e.g. 5',
        },
        totalAreaUnit: areaUnitProperty,
        murabbaNumber: {
          type: 'STRING',
          description: 'Murabba number',
        },
        killaNumber: { type: 'STRING', description: 'Killa number' },
        khasraNumber: {
          type: 'STRING',
          description: 'Khasra number',
        },
        ownershipType: {
          type: 'STRING',
          description: 'Ownership type',
          enum: OWNERSHIP_TYPE_VALUES,
        },
      },
      required: ['profileId', 'zameenName', 'totalAreaValue', 'totalAreaUnit'],
    },
  },
  {
    name: 'update_zameen',
    description:
      'Update a zameen. Pass only changed fields; for area pass value and unit together.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: { type: 'STRING', description: 'Zameen id' },
        zameenName: { type: 'STRING', description: 'New name' },
        totalAreaValue: { type: 'NUMBER', description: 'New area value' },
        totalAreaUnit: areaUnitProperty,
        murabbaNumber: { type: 'STRING', description: 'New murabba number' },
        killaNumber: { type: 'STRING', description: 'New killa number' },
        khasraNumber: { type: 'STRING', description: 'New khasra number' },
        ownershipType: {
          type: 'STRING',
          description: 'New ownership type',
          enum: OWNERSHIP_TYPE_VALUES,
        },
      },
      required: ['zameenId'],
    },
  },
  {
    name: 'delete_zameen',
    description:
      'Delete a zameen and every record under it. Needs explicit user confirmation first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: { type: 'STRING', description: 'Zameen id' },
      },
      required: ['zameenId'],
    },
  },
  {
    name: 'list_crops',
    description:
      'List crops with area, status and season. Optionally filter by zameen.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: {
          type: 'STRING',
          description: 'Filter by zameen id',
        },
      },
    },
  },
  {
    name: 'create_crop',
    description:
      'Add a crop under a zameen. Area must fit the zameen free area.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: {
          type: 'STRING',
          description: 'Parent zameen id',
        },
        cropName: {
          type: 'STRING',
          description: 'Crop name',
        },
        cropAreaValue: {
          type: 'NUMBER',
          description: 'Crop area value',
        },
        cropAreaUnit: areaUnitProperty,
        startMonth: {
          type: 'INTEGER',
          description: 'Sowing month 1-12',
        },
        startYear: { type: 'INTEGER', description: 'Sowing year' },
        expectedEndMonth: {
          type: 'INTEGER',
          description: 'Harvest month 1-12',
        },
        expectedEndYear: {
          type: 'INTEGER',
          description: 'Harvest year',
        },
        status: {
          type: 'STRING',
          description: 'Crop status (default Active)',
          enum: CROP_STATUS_VALUES,
        },
      },
      required: ['zameenId', 'cropName', 'cropAreaValue', 'cropAreaUnit'],
    },
  },
  {
    name: 'update_crop',
    description:
      'Update a crop. Pass only changed fields; for area pass value and unit together.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: { type: 'STRING', description: 'Crop id' },
        cropName: { type: 'STRING', description: 'New crop name' },
        cropAreaValue: { type: 'NUMBER', description: 'New area value' },
        cropAreaUnit: areaUnitProperty,
        startMonth: { type: 'INTEGER', description: 'New sowing month 1-12' },
        startYear: { type: 'INTEGER', description: 'New sowing year' },
        expectedEndMonth: {
          type: 'INTEGER',
          description: 'New harvest month 1-12',
        },
        expectedEndYear: {
          type: 'INTEGER',
          description: 'New harvest year',
        },
        status: {
          type: 'STRING',
          description: 'New status',
          enum: CROP_STATUS_VALUES,
        },
      },
      required: ['cropId'],
    },
  },
  {
    name: 'delete_crop',
    description:
      'Delete a crop and its expenses and income. Needs explicit user confirmation first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: { type: 'STRING', description: 'Crop id' },
      },
      required: ['cropId'],
    },
  },
  {
    name: 'list_expenses',
    description: 'List expenses. Filter by crop and/or year and month.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'Filter by crop id',
        },
        year: { type: 'INTEGER', description: 'Year' },
        month: {
          type: 'INTEGER',
          description: 'Month 1-12 (needs year)',
        },
      },
    },
  },
  {
    name: 'create_expense',
    description: 'Record an expense against a crop.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'Crop id',
        },
        expenseCategory: {
          type: 'STRING',
          description: 'Expense category',
          enum: EXPENSE_CATEGORY_VALUES,
        },
        description: {
          type: 'STRING',
          description: 'Short description',
        },
        amount: {
          type: 'NUMBER',
          description: 'Amount PKR',
        },
        expenseDate: {
          type: 'STRING',
          description: 'Date YYYY-MM-DD',
        },
        paymentStatus: {
          type: 'STRING',
          description: 'Payment status (default Paid)',
          enum: ['Paid', 'Unpaid'],
        },
      },
      required: [
        'cropId',
        'expenseCategory',
        'description',
        'amount',
        'expenseDate',
      ],
    },
  },
  {
    name: 'update_expense',
    description: 'Update an expense. Pass only changed fields.',
    parameters: {
      type: 'OBJECT',
      properties: {
        expenseId: { type: 'STRING', description: 'Expense id' },
        expenseCategory: {
          type: 'STRING',
          description: 'New category',
          enum: EXPENSE_CATEGORY_VALUES,
        },
        description: { type: 'STRING', description: 'New description' },
        amount: { type: 'NUMBER', description: 'New amount PKR' },
        expenseDate: {
          type: 'STRING',
          description: 'New date YYYY-MM-DD',
        },
        paymentStatus: {
          type: 'STRING',
          description: 'New payment status',
          enum: ['Paid', 'Unpaid'],
        },
      },
      required: ['expenseId'],
    },
  },
  {
    name: 'delete_expense',
    description: 'Delete an expense. Needs explicit user confirmation first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        expenseId: { type: 'STRING', description: 'Expense id' },
      },
      required: ['expenseId'],
    },
  },
  {
    name: 'list_income',
    description: 'List income. Filter by crop and/or year and month.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'Filter by crop id',
        },
        year: { type: 'INTEGER', description: 'Year' },
        month: {
          type: 'INTEGER',
          description: 'Month 1-12 (needs year)',
        },
      },
    },
  },
  {
    name: 'create_income',
    description:
      'Record income against a crop. If quantity and rate are given, total = quantity * rate.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'Crop id',
        },
        totalAmount: {
          type: 'NUMBER',
          description: 'Total amount PKR',
        },
        incomeDate: {
          type: 'STRING',
          description: 'Date YYYY-MM-DD',
        },
        quantity: {
          type: 'NUMBER',
          description: 'Quantity sold',
        },
        quantityUnit: {
          type: 'STRING',
          description: 'Unit of quantity',
          enum: QUANTITY_UNIT_VALUES,
        },
        rate: {
          type: 'NUMBER',
          description: 'Rate per unit PKR',
        },
        paymentStatus: {
          type: 'STRING',
          description: 'Payment status (default Received)',
          enum: ['Received', 'Pending'],
        },
        buyerName: { type: 'STRING', description: 'Buyer name' },
      },
      required: ['cropId', 'totalAmount', 'incomeDate'],
    },
  },
  {
    name: 'update_income',
    description: 'Update an income record. Pass only changed fields.',
    parameters: {
      type: 'OBJECT',
      properties: {
        incomeId: { type: 'STRING', description: 'Income record id' },
        totalAmount: { type: 'NUMBER', description: 'New total PKR' },
        incomeDate: {
          type: 'STRING',
          description: 'New date YYYY-MM-DD',
        },
        quantity: { type: 'NUMBER', description: 'New quantity' },
        quantityUnit: {
          type: 'STRING',
          description: 'New quantity unit',
          enum: QUANTITY_UNIT_VALUES,
        },
        rate: { type: 'NUMBER', description: 'New rate PKR' },
        paymentStatus: {
          type: 'STRING',
          description: 'New payment status',
          enum: ['Received', 'Pending'],
        },
        buyerName: { type: 'STRING', description: 'New buyer name' },
      },
      required: ['incomeId'],
    },
  },
  {
    name: 'delete_income',
    description:
      'Delete an income record. Needs explicit user confirmation first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        incomeId: { type: 'STRING', description: 'Income record id' },
      },
      required: ['incomeId'],
    },
  },
  {
    name: 'get_report_summary',
    description:
      'Overall totals: income, expense, net profit and record counts.',
  },
  {
    name: 'get_crop_profitability',
    description: 'Per-crop expense, income and net profit.',
  },
  {
    name: 'get_monthly_summary',
    description: 'Month-by-month income and expense totals.',
  },
];
