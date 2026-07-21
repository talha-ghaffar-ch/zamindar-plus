import type { Messages } from './index';

/**
 * Roman Urdu catalog — natural spoken Pakistani Urdu written in English
 * letters. Consistent spelling conventions, conversational yet professional.
 */
export const roman: Messages = {
  common: {
    appName: 'Zamindar Plus',
    tagline: 'Har Kheti Ka Smart Hisab',
    loading: 'Load ho raha hai…',
    saving: 'Save ho raha hai…',
    save: 'Save karein',
    saveChanges: 'Tabdeeliyan save karein',
    cancel: 'Cancel karein',
    delete: 'Delete karein',
    edit: 'Tabdeel karein',
    add: 'Shamil karein',
    remove: 'Hatayein',
    close: 'Band karein',
    back: 'Wapas',
    confirm: 'Tasdeeq karein',
    search: 'Talash karein',
    filter: 'Filter karein',
    all: 'Sab',
    yes: 'Ji haan',
    no: 'Nahi',
    none: 'Koi nahi',
    optional: 'Ikhtiyari',
    required: 'Lazmi',
    comingSoon: 'Jald aa raha hai',
    retry: 'Dobara koshish karein',
    view: 'Dekhein',
    open: 'Kholein',
    of: 'mein se',
    andMore: 'aur {count} mazeed',
  },

  nav: {
    dashboard: 'Dashboard',
    profiles: 'Profiles',
    zameen: 'Zameen',
    crops: 'Faslein',
    expenses: 'Kharchay',
    income: 'Aamdani',
    reports: 'Reports',
    ai: 'Zamindar AI',
    admin: 'Admin',
    help: 'Madad',
    settings: 'Settings',
    signOut: 'Sign out',
    openSidebar: 'Sidebar kholein',
    closeSidebar: 'Sidebar band karein',
    workspace: 'Workspace',
    sectionUnavailable: 'Ye section dastyab nahi',
    chooseSection: 'Sidebar se koi section muntakhab karein.',
    openingWorkspace: 'Workspace khul raha hai…',
  },

  language: {
    title: 'Zabaan',
    subtitle: 'Poori app ke liye zabaan muntakhab karein.',
    english: 'English',
    urdu: 'Urdu',
    roman: 'Roman Urdu',
    englishNote: 'International English',
    urduNote: 'Khaalis Urdu (اردو)',
    romanNote: 'English letters mein Urdu',
    current: 'Mojooda zabaan',
    changed: 'Zabaan tabdeel ho gayi',
  },

  theme: {
    switchToDark: 'Dark theme lagayein',
    switchToLight: 'Light theme lagayein',
  },

  ai: {
    title: 'Aap ka farm ledger agent',
    subtitle:
      'Apni zabaan mein bataiye — apni zameen, fasal, kharchay, aamdani aur munafa shamil karein, tabdeel karein ya dekhein. Baqi kaam main khud kar deta hoon.',
    badge: 'Live agent',
    eyebrow: 'Zamindar AI',
    greeting:
      'Assalam o alaikum. Main Zamindar AI hoon. Apni zabaan mein bataiye kya karna hai — koi zameen, fasal, kharcha ya aamdani add karni ho, ya apne records ke baare mein poochna ho. Main seedha aap ke liye kaam kar doon ga.',
    placeholder: 'Zamindar AI ko bataiye kya karna hai…',
    thinking: 'Soch raha hoon…',
    live: 'Zamindar AI · Live',
    check: 'Dekhein',
    sendMessage: 'Message bhejein',
    couldNotRespond: 'Zamindar AI jawab nahi de saka.',
    suggestion1: 'Chak 45 ke naam se naya profile banayein',
    suggestion2: 'Is profile mein 5 acre zameen "Wheat Field" add karein',
    suggestion3: 'Wheat fasal par 20,000 fertilizer ka kharcha likhein',
    suggestion4: 'Is saal maine kitna munafa kamaya?',
  },

  validation: {
    required: 'Ye khana lazmi hai.',
    minLength: 'Kam az kam {count} characters likhein.',
    invalidEmail: 'Durust email address likhein.',
    invalidNumber: 'Durust number likhein.',
    positiveNumber: 'Sifar se bara number likhein.',
    passwordsDoNotMatch: 'Password aapas mein match nahi karte.',
    genericError: 'Kuch ghalat ho gaya. Dobara koshish karein.',
  },
};
