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
    description:
      'List all farm profiles of the current user with their ids and details.',
  },
  {
    name: 'create_profile',
    description: 'Create a new farm profile for the current user.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileName: {
          type: 'STRING',
          description: 'Name of the profile (required, min 2 characters)',
        },
        city: { type: 'STRING', description: 'City (optional)' },
        chakAreaName: {
          type: 'STRING',
          description: 'Chak / area name (optional)',
        },
        villageName: { type: 'STRING', description: 'Village name (optional)' },
      },
      required: ['profileName'],
    },
  },
  {
    name: 'update_profile',
    description: 'Update an existing profile. Only pass fields to change.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: { type: 'STRING', description: 'Id of the profile' },
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
      'Delete a profile permanently. This also deletes all zameen, crops, expenses and income under it. Only call after the user has explicitly confirmed the deletion in chat.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: { type: 'STRING', description: 'Id of the profile' },
      },
      required: ['profileId'],
    },
  },
  {
    name: 'list_zameen',
    description:
      'List zameen (land parcels) of the user, optionally for one profile, including used and available area.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: {
          type: 'STRING',
          description: 'Filter by profile id (optional)',
        },
      },
    },
  },
  {
    name: 'create_zameen',
    description:
      'Add a new zameen (land parcel) under a profile. Area is given as value + unit; square feet is computed automatically.',
    parameters: {
      type: 'OBJECT',
      properties: {
        profileId: {
          type: 'STRING',
          description: 'Id of the parent profile (required)',
        },
        zameenName: {
          type: 'STRING',
          description: 'Name of the zameen (required, min 2 characters)',
        },
        totalAreaValue: {
          type: 'NUMBER',
          description: 'Total area value, e.g. 5 (required)',
        },
        totalAreaUnit: areaUnitProperty,
        murabbaNumber: {
          type: 'STRING',
          description: 'Murabba number (optional)',
        },
        killaNumber: { type: 'STRING', description: 'Killa number (optional)' },
        khasraNumber: {
          type: 'STRING',
          description: 'Khasra number (optional)',
        },
        ownershipType: {
          type: 'STRING',
          description: 'Ownership type (optional)',
          enum: OWNERSHIP_TYPE_VALUES,
        },
      },
      required: ['profileId', 'zameenName', 'totalAreaValue', 'totalAreaUnit'],
    },
  },
  {
    name: 'update_zameen',
    description:
      'Update an existing zameen. Only pass fields to change. If changing area, pass both totalAreaValue and totalAreaUnit.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: { type: 'STRING', description: 'Id of the zameen' },
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
      'Delete a zameen permanently. This also deletes all crops, expenses and income under it. Only call after the user has explicitly confirmed the deletion in chat.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: { type: 'STRING', description: 'Id of the zameen' },
      },
      required: ['zameenId'],
    },
  },
  {
    name: 'list_crops',
    description:
      'List crops of the user, optionally for one zameen, with area, status and season.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: {
          type: 'STRING',
          description: 'Filter by zameen id (optional)',
        },
      },
    },
  },
  {
    name: 'create_crop',
    description:
      'Add a new crop under a zameen. Crop area cannot exceed the available (unused) area of the zameen.',
    parameters: {
      type: 'OBJECT',
      properties: {
        zameenId: {
          type: 'STRING',
          description: 'Id of the parent zameen (required)',
        },
        cropName: {
          type: 'STRING',
          description: 'Crop name, e.g. Wheat, Rice (required)',
        },
        cropAreaValue: {
          type: 'NUMBER',
          description: 'Crop area value (required)',
        },
        cropAreaUnit: areaUnitProperty,
        startMonth: {
          type: 'INTEGER',
          description: 'Sowing month 1-12 (optional)',
        },
        startYear: { type: 'INTEGER', description: 'Sowing year (optional)' },
        expectedEndMonth: {
          type: 'INTEGER',
          description: 'Expected harvest month 1-12 (optional)',
        },
        expectedEndYear: {
          type: 'INTEGER',
          description: 'Expected harvest year (optional)',
        },
        status: {
          type: 'STRING',
          description: 'Crop status (optional, default Active)',
          enum: CROP_STATUS_VALUES,
        },
      },
      required: ['zameenId', 'cropName', 'cropAreaValue', 'cropAreaUnit'],
    },
  },
  {
    name: 'update_crop',
    description:
      'Update an existing crop. Only pass fields to change. If changing area, pass both cropAreaValue and cropAreaUnit.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: { type: 'STRING', description: 'Id of the crop' },
        cropName: { type: 'STRING', description: 'New crop name' },
        cropAreaValue: { type: 'NUMBER', description: 'New area value' },
        cropAreaUnit: areaUnitProperty,
        startMonth: { type: 'INTEGER', description: 'New sowing month 1-12' },
        startYear: { type: 'INTEGER', description: 'New sowing year' },
        expectedEndMonth: {
          type: 'INTEGER',
          description: 'New expected harvest month 1-12',
        },
        expectedEndYear: {
          type: 'INTEGER',
          description: 'New expected harvest year',
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
      'Delete a crop permanently. This also deletes all its expenses and income. Only call after the user has explicitly confirmed the deletion in chat.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: { type: 'STRING', description: 'Id of the crop' },
      },
      required: ['cropId'],
    },
  },
  {
    name: 'list_expenses',
    description:
      'List expenses of the user. Filter by crop id and/or by year and month.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'Filter by crop id (optional)',
        },
        year: { type: 'INTEGER', description: 'Filter by year (optional)' },
        month: {
          type: 'INTEGER',
          description: 'Filter by month 1-12 (optional, requires year)',
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
          description: 'Id of the crop (required)',
        },
        expenseCategory: {
          type: 'STRING',
          description: 'Expense category (required)',
          enum: EXPENSE_CATEGORY_VALUES,
        },
        description: {
          type: 'STRING',
          description: 'Short description of the expense (required)',
        },
        amount: {
          type: 'NUMBER',
          description: 'Amount in PKR (required)',
        },
        expenseDate: {
          type: 'STRING',
          description: 'Date in YYYY-MM-DD format (required)',
        },
        paymentStatus: {
          type: 'STRING',
          description: 'Payment status (optional, default Paid)',
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
    description: 'Update an existing expense. Only pass fields to change.',
    parameters: {
      type: 'OBJECT',
      properties: {
        expenseId: { type: 'STRING', description: 'Id of the expense' },
        expenseCategory: {
          type: 'STRING',
          description: 'New category',
          enum: EXPENSE_CATEGORY_VALUES,
        },
        description: { type: 'STRING', description: 'New description' },
        amount: { type: 'NUMBER', description: 'New amount in PKR' },
        expenseDate: {
          type: 'STRING',
          description: 'New date in YYYY-MM-DD format',
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
    description:
      'Delete an expense permanently. Only call after the user has explicitly confirmed the deletion in chat.',
    parameters: {
      type: 'OBJECT',
      properties: {
        expenseId: { type: 'STRING', description: 'Id of the expense' },
      },
      required: ['expenseId'],
    },
  },
  {
    name: 'list_income',
    description:
      'List income records of the user. Filter by crop id and/or by year and month.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'Filter by crop id (optional)',
        },
        year: { type: 'INTEGER', description: 'Filter by year (optional)' },
        month: {
          type: 'INTEGER',
          description: 'Filter by month 1-12 (optional, requires year)',
        },
      },
    },
  },
  {
    name: 'create_income',
    description:
      'Record income (sale) against a crop. If quantity and rate are given but no total, compute totalAmount = quantity * rate.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cropId: {
          type: 'STRING',
          description: 'Id of the crop (required)',
        },
        totalAmount: {
          type: 'NUMBER',
          description: 'Total amount in PKR (required)',
        },
        incomeDate: {
          type: 'STRING',
          description: 'Date in YYYY-MM-DD format (required)',
        },
        quantity: {
          type: 'NUMBER',
          description: 'Quantity sold (optional)',
        },
        quantityUnit: {
          type: 'STRING',
          description: 'Unit of quantity (optional)',
          enum: QUANTITY_UNIT_VALUES,
        },
        rate: {
          type: 'NUMBER',
          description: 'Rate per unit in PKR (optional)',
        },
        paymentStatus: {
          type: 'STRING',
          description: 'Payment status (optional, default Received)',
          enum: ['Received', 'Pending'],
        },
        buyerName: { type: 'STRING', description: 'Buyer name (optional)' },
      },
      required: ['cropId', 'totalAmount', 'incomeDate'],
    },
  },
  {
    name: 'update_income',
    description:
      'Update an existing income record. Only pass fields to change.',
    parameters: {
      type: 'OBJECT',
      properties: {
        incomeId: { type: 'STRING', description: 'Id of the income record' },
        totalAmount: { type: 'NUMBER', description: 'New total amount in PKR' },
        incomeDate: {
          type: 'STRING',
          description: 'New date in YYYY-MM-DD format',
        },
        quantity: { type: 'NUMBER', description: 'New quantity' },
        quantityUnit: {
          type: 'STRING',
          description: 'New quantity unit',
          enum: QUANTITY_UNIT_VALUES,
        },
        rate: { type: 'NUMBER', description: 'New rate per unit in PKR' },
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
      'Delete an income record permanently. Only call after the user has explicitly confirmed the deletion in chat.',
    parameters: {
      type: 'OBJECT',
      properties: {
        incomeId: { type: 'STRING', description: 'Id of the income record' },
      },
      required: ['incomeId'],
    },
  },
  {
    name: 'get_report_summary',
    description:
      'Get overall totals for the user: total income, total expense, net profit, and record counts.',
  },
  {
    name: 'get_crop_profitability',
    description:
      'Get per-crop profitability: total expense, total income and net profit for every crop.',
  },
  {
    name: 'get_monthly_summary',
    description:
      'Get month-by-month totals of income and expenses across the whole ledger.',
  },
];
