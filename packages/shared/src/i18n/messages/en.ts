/**
 * English catalog — the source of truth for the whole localization system.
 * Every other locale (`ur`, `roman`) must satisfy the `Messages` type derived
 * from this object, so keys can never drift between languages.
 *
 * Organised by feature namespace. Adding a feature = add a namespace here and
 * mirror it in the other locales.
 */
export const en = {
  common: {
    appName: 'Zamindar Plus',
    tagline: 'Har Kheti Ka Smart Hisab',
    loading: 'Loading…',
    saving: 'Saving…',
    save: 'Save',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    close: 'Close',
    back: 'Back',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    none: 'None',
    optional: 'Optional',
    required: 'Required',
    comingSoon: 'Coming soon',
    retry: 'Try again',
    view: 'View',
    open: 'Open',
    of: 'of',
    andMore: 'and {count} more',
  },

  nav: {
    dashboard: 'Dashboard',
    profiles: 'Profiles',
    zameen: 'Zameen',
    crops: 'Crops',
    expenses: 'Expenses',
    income: 'Income',
    reports: 'Reports',
    ai: 'Zamindar AI',
    admin: 'Admin',
    help: 'Help',
    settings: 'Settings',
    signOut: 'Sign out',
    openSidebar: 'Open sidebar',
    closeSidebar: 'Close sidebar',
    workspace: 'Workspace',
    sectionUnavailable: 'Section unavailable',
    chooseSection: 'Choose a section from the sidebar.',
    openingWorkspace: 'Opening workspace…',
  },

  language: {
    title: 'Language',
    subtitle: 'Choose the language for the entire app.',
    english: 'English',
    urdu: 'Urdu',
    roman: 'Roman Urdu',
    englishNote: 'International English',
    urduNote: 'Native Urdu (اردو)',
    romanNote: 'Urdu in English letters',
    current: 'Current language',
    changed: 'Language updated',
  },

  theme: {
    switchToDark: 'Switch to dark theme',
    switchToLight: 'Switch to light theme',
  },

  ai: {
    title: 'Your farm ledger agent',
    subtitle:
      'Tell me in your own language — add, update or check your zameen, crops, expenses, income, and profit. I handle it for you.',
    badge: 'Live agent',
    eyebrow: 'Zamindar AI',
    greeting:
      'Assalam o alaikum. I am Zamindar AI. Tell me what to do in your own words — add a zameen, crop, expense or income, or ask about your records. I will do it for you directly.',
    placeholder: 'Tell Zamindar AI what to do…',
    thinking: 'Thinking…',
    live: 'Zamindar AI · Live',
    check: 'Check',
    sendMessage: 'Send message',
    couldNotRespond: 'Zamindar AI could not respond.',
    suggestion1: 'Create a new profile named Chak 45',
    suggestion2: 'Add 5 acre zameen "Wheat Field" in this profile',
    suggestion3: 'Record a 20,000 fertilizer expense on the wheat crop',
    suggestion4: 'How much profit did I make this year?',
  },

  validation: {
    required: 'This field is required.',
    minLength: 'Please enter at least {count} characters.',
    invalidEmail: 'Please enter a valid email address.',
    invalidNumber: 'Please enter a valid number.',
    positiveNumber: 'Please enter a number greater than zero.',
    passwordsDoNotMatch: 'Passwords do not match.',
    genericError: 'Something went wrong. Please try again.',
  },
};
