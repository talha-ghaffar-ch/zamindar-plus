export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyEmail: {email?: string};
  ResetPassword: {email?: string};
};

export type RecordsStackParamList = {
  RecordsHome: undefined;
  ProfileDetail: {profileId: string};
  ZameenDetail: {zameenId: string};
  CropDetail: {cropId: string};
  Ledger: {kind: 'expense' | 'income'};
};

export type AppTabParamList = {
  Home: undefined;
  Records: undefined;
  Reports: undefined;
  Assistant: undefined;
  Settings: undefined;
};
