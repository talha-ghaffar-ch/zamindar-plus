import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  API_URL,
  clearAuthToken,
  createCrop,
  createExpense,
  createIncome,
  createProfile,
  createZameen,
  forgotPassword,
  getMe,
  initAuthToken,
  loadFarmData,
  login,
  resetPassword,
  sendAiMessage,
  setAuthToken,
  signup,
  verifyEmail,
  type AiChatHistoryMessage,
  type Crop,
  type FarmData,
  type Profile,
  type User,
  type Zameen,
} from './src/api';
import {
  areaUnits,
  cropNames,
  expenseCategories,
  formatCurrency,
  formatDate,
  parseDisplayDate,
  quantityUnits,
  todayDisplayDate,
  toSquareFeet,
} from './src/domain';

type Tab = 'home' | 'add' | 'records' | 'reports' | 'ai';
type AuthMode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';
type AddMode = 'profile' | 'zameen' | 'crop' | 'expense' | 'income';

const emptyFarmData: FarmData = {
  summary: null,
  monthlyReports: [],
  cropProfitability: [],
  profiles: [],
  zameen: [],
  crops: [],
  expenses: [],
  income: [],
};

const tabs: Array<{key: Tab; label: string; icon: string}> = [
  {key: 'home', label: 'Home', icon: '⌂'},
  {key: 'add', label: 'Add', icon: '+'},
  {key: 'records', label: 'Records', icon: '▦'},
  {key: 'reports', label: 'Reports', icon: '↗'},
  {key: 'ai', label: 'AI', icon: '✦'},
];

const addModes: Array<{key: AddMode; label: string}> = [
  {key: 'profile', label: 'Profile'},
  {key: 'zameen', label: 'Zameen'},
  {key: 'crop', label: 'Crop'},
  {key: 'expense', label: 'Expense'},
  {key: 'income', label: 'Income'},
];

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f2d27" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [farmData, setFarmData] = useState<FarmData>(emptyFarmData);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 3000);
  }, []);

  const refreshFarmData = useCallback(async () => {
    const data = await loadFarmData();
    setFarmData(data);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const token = await initAuthToken();

        if (!token) {
          return;
        }

        const currentUser = await getMe();
        const data = await loadFarmData();

        if (isActive) {
          setUser(currentUser);
          setFarmData(data);
        }
      } catch {
        await clearAuthToken();
      } finally {
        if (isActive) {
          setIsBooting(false);
        }
      }
    }

    restoreSession().catch(() => {
      setIsBooting(false);
    });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleAuthenticated(authUser: User, accessToken: string) {
    await setAuthToken(accessToken);
    setUser(authUser);
    setFarmData(await loadFarmData());
    setActiveTab('home');
    showNotice('Welcome back to Zamindar Plus');
  }

  async function handleRefresh() {
    if (!user) {
      return;
    }

    setIsRefreshing(true);
    setError('');

    try {
      await refreshFarmData();
      showNotice('Records refreshed');
    } catch (refreshError) {
      setError(getErrorText(refreshError, 'Could not refresh records.'));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSignOut() {
    await clearAuthToken();
    setUser(null);
    setFarmData(emptyFarmData);
    setActiveTab('home');
    showNotice('Signed out');
  }

  if (isBooting) {
    return <SplashScreen />;
  }

  if (!user) {
    return (
      <AuthScreen
        error={error}
        notice={notice}
        onAuthenticated={handleAuthenticated}
        onError={setError}
        onNotice={showNotice}
      />
    );
  }

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandText}>Zamindar Plus</Text>
          <Text style={styles.brandSubText}>Farm ledger mobile</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={styles.avatarButton}
          onPress={() => setSettingsOpen(true)}>
          <Text style={styles.avatarText}>{user.firstName.slice(0, 1)}</Text>
        </Pressable>
      </View>

      {notice ? <Banner tone="success" message={notice} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + 96},
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }>
        {activeTab === 'home' ? (
          <HomeScreen
            farmData={farmData}
            user={user}
            onNavigate={setActiveTab}
          />
        ) : null}

        {activeTab === 'add' ? (
          <AddScreen
            farmData={farmData}
            onCreated={async message => {
              await refreshFarmData();
              showNotice(message);
            }}
            onError={setError}
          />
        ) : null}

        {activeTab === 'records' ? <RecordsScreen farmData={farmData} /> : null}
        {activeTab === 'reports' ? <ReportsScreen farmData={farmData} /> : null}
        {activeTab === 'ai' ? <AiScreen /> : null}
      </ScrollView>

      <View style={[styles.bottomNav, {paddingBottom: Math.max(insets.bottom, 8)}]}>
        {tabs.map(tab => (
          <Pressable
            accessibilityRole="button"
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key ? styles.tabButtonActive : null,
            ]}
            onPress={() => setActiveTab(tab.key)}>
            <Text
              style={[
                styles.tabIcon,
                activeTab === tab.key ? styles.tabIconActive : null,
              ]}>
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key ? styles.tabLabelActive : null,
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <SettingsModal
        visible={settingsOpen}
        user={user}
        onClose={() => setSettingsOpen(false)}
        onSignOut={handleSignOut}
      />
    </SafeAreaView>
  );
}

function SplashScreen() {
  return (
    <SafeAreaView style={styles.splash}>
      <View style={styles.logoMark}>
        <Text style={styles.logoIcon}>⌁</Text>
      </View>
      <Text style={styles.splashTitle}>Zamindar Plus</Text>
      <Text style={styles.splashText}>Opening your farm ledger...</Text>
      <ActivityIndicator color="#f8d57a" size="large" />
    </SafeAreaView>
  );
}

function AuthScreen({
  error,
  notice,
  onAuthenticated,
  onError,
  onNotice,
}: {
  error: string;
  notice: string;
  onAuthenticated: (user: User, accessToken: string) => Promise<void>;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSaving, setIsSaving] = useState(false);
  const [loginForm, setLoginForm] = useState({email: '', password: ''});
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    farmerType: 'Land Owner',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({code: '', password: ''});

  async function runAuthAction(action: () => Promise<void>) {
    setIsSaving(true);
    onError('');

    try {
      await action();
    } catch (authError) {
      onError(getErrorText(authError, 'Authentication failed.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogin() {
    await runAuthAction(async () => {
      const response = await login(loginForm.email.trim(), loginForm.password);
      await onAuthenticated(response.user, response.accessToken);
    });
  }

  async function handleSignup() {
    await runAuthAction(async () => {
      await signup({
        firstName: signupForm.firstName.trim(),
        lastName: signupForm.lastName.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        phone: signupForm.phone.trim() || undefined,
        farmerType: signupForm.farmerType,
      });
      setMode('verify');
      onNotice('Account created. Check your email for the code.');
    });
  }

  async function handleVerify() {
    await runAuthAction(async () => {
      await verifyEmail(verificationCode.trim());
      setMode('login');
      onNotice('Email verified. You can sign in now.');
    });
  }

  async function handleForgotPassword() {
    await runAuthAction(async () => {
      await forgotPassword(forgotEmail.trim());
      setMode('reset');
      onNotice('Password reset code sent if the email exists.');
    });
  }

  async function handleResetPassword() {
    await runAuthAction(async () => {
      await resetPassword(resetForm.code.trim(), resetForm.password);
      setMode('login');
      onNotice('Password reset. Sign in with your new password.');
    });
  }

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.authKeyboard}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.mobileHero}>
            <View style={styles.logoMark}>
              <Text style={styles.logoIcon}>⌁</Text>
            </View>
            <Text style={styles.heroEyebrow}>Farm records made simple</Text>
            <Text style={styles.heroTitle}>Zamindar Plus</Text>
            <Text style={styles.heroText}>
              Add kharcha, aamdani, zameen, and crop records without digging
              through a crowded desktop-style menu.
            </Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.modeSwitch}>
              <SegmentButton
                active={mode === 'login'}
                label="Sign in"
                onPress={() => {
                  setMode('login');
                  onError('');
                }}
              />
              <SegmentButton
                active={mode === 'signup'}
                label="Create account"
                onPress={() => {
                  setMode('signup');
                  onError('');
                }}
              />
            </View>

            {notice ? <Banner tone="success" message={notice} /> : null}
            {error ? <Banner tone="error" message={error} /> : null}

            {mode === 'login' ? (
              <>
                <Text style={styles.formTitle}>Welcome back</Text>
                <TextField
                  label="Email"
                  value={loginForm.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={email => setLoginForm({...loginForm, email})}
                />
                <TextField
                  label="Password"
                  value={loginForm.password}
                  secureTextEntry
                  onChangeText={password =>
                    setLoginForm({...loginForm, password})
                  }
                />
                <PrimaryButton
                  label={isSaving ? 'Signing in...' : 'Sign in'}
                  disabled={
                    isSaving ||
                    !loginForm.email.trim() ||
                    loginForm.password.length < 8
                  }
                  onPress={handleLogin}
                />
                <Pressable onPress={() => setMode('forgot')}>
                  <Text style={styles.linkText}>Forgot password?</Text>
                </Pressable>
              </>
            ) : null}

            {mode === 'signup' ? (
              <>
                <Text style={styles.formTitle}>Create a farmer account</Text>
                <View style={styles.twoColumn}>
                  <TextField
                    label="First name"
                    value={signupForm.firstName}
                    onChangeText={firstName =>
                      setSignupForm({...signupForm, firstName})
                    }
                  />
                  <TextField
                    label="Last name"
                    value={signupForm.lastName}
                    onChangeText={lastName =>
                      setSignupForm({...signupForm, lastName})
                    }
                  />
                </View>
                <TextField
                  label="Email"
                  value={signupForm.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={email => setSignupForm({...signupForm, email})}
                />
                <TextField
                  label="Password"
                  value={signupForm.password}
                  secureTextEntry
                  onChangeText={password =>
                    setSignupForm({...signupForm, password})
                  }
                />
                <TextField
                  label="Phone optional"
                  value={signupForm.phone}
                  keyboardType="phone-pad"
                  onChangeText={phone => setSignupForm({...signupForm, phone})}
                />
                <ChipRow
                  label="Farmer type"
                  value={signupForm.farmerType}
                  options={['Land Owner', 'Tenant Farmer', 'Manager']}
                  onChange={farmerType =>
                    setSignupForm({...signupForm, farmerType})
                  }
                />
                <PrimaryButton
                  label={isSaving ? 'Creating...' : 'Create account'}
                  disabled={
                    isSaving ||
                    signupForm.firstName.trim().length < 2 ||
                    signupForm.lastName.trim().length < 2 ||
                    !signupForm.email.trim() ||
                    signupForm.password.length < 8
                  }
                  onPress={handleSignup}
                />
              </>
            ) : null}

            {mode === 'verify' ? (
              <>
                <Text style={styles.formTitle}>Verify your account</Text>
                <Text style={styles.helperText}>
                  Enter the 6-digit code sent to your email.
                </Text>
                <TextField
                  label="Verification code"
                  value={verificationCode}
                  keyboardType="number-pad"
                  onChangeText={setVerificationCode}
                />
                <PrimaryButton
                  label={isSaving ? 'Verifying...' : 'Verify account'}
                  disabled={isSaving || verificationCode.trim().length < 6}
                  onPress={handleVerify}
                />
              </>
            ) : null}

            {mode === 'forgot' ? (
              <>
                <Text style={styles.formTitle}>Reset password</Text>
                <Text style={styles.helperText}>
                  We will email a reset code if the account exists.
                </Text>
                <TextField
                  label="Email"
                  value={forgotEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setForgotEmail}
                />
                <PrimaryButton
                  label={isSaving ? 'Sending...' : 'Send reset code'}
                  disabled={isSaving || !forgotEmail.trim()}
                  onPress={handleForgotPassword}
                />
              </>
            ) : null}

            {mode === 'reset' ? (
              <>
                <Text style={styles.formTitle}>Set new password</Text>
                <TextField
                  label="Reset code"
                  value={resetForm.code}
                  keyboardType="number-pad"
                  onChangeText={code => setResetForm({...resetForm, code})}
                />
                <TextField
                  label="New password"
                  value={resetForm.password}
                  secureTextEntry
                  onChangeText={password =>
                    setResetForm({...resetForm, password})
                  }
                />
                <PrimaryButton
                  label={isSaving ? 'Saving...' : 'Save new password'}
                  disabled={
                    isSaving ||
                    resetForm.code.trim().length < 6 ||
                    resetForm.password.length < 8
                  }
                  onPress={handleResetPassword}
                />
              </>
            ) : null}

            <Text style={styles.apiHint}>API: {API_URL}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HomeScreen({
  farmData,
  user,
  onNavigate,
}: {
  farmData: FarmData;
  user: User;
  onNavigate: (tab: Tab) => void;
}) {
  const summary = farmData.summary;
  const hasAnyRecord =
    farmData.profiles.length +
      farmData.zameen.length +
      farmData.crops.length +
      farmData.expenses.length +
      farmData.income.length >
    0;

  return (
    <View>
      <View style={styles.welcomeCard}>
        <Text style={styles.eyebrow}>Assalam o alaikum</Text>
          <Text style={[styles.pageTitle, styles.welcomeCardTitle]}>
          {user.firstName}, your farm ledger is ready.
        </Text>
        <Text style={styles.pageText}>
          Use quick add for daily entries. Keep detailed reports one tap away.
        </Text>
      </View>

      {!hasAnyRecord ? (
        <View style={styles.onboardingCard}>
          <Text style={styles.cardTitle}>Start in three simple steps</Text>
          <StepLine number="1" text="Create a profile for your farm book." />
          <StepLine number="2" text="Add zameen under that profile." />
          <StepLine number="3" text="Add crops, then record expense and income." />
          <PrimaryButton label="Start adding records" onPress={() => onNavigate('add')} />
        </View>
      ) : null}

      <View style={styles.statsGrid}>
        <StatCard
          label="Income"
          value={summary ? formatCurrency(summary.totalIncome) : 'Loading'}
          tone="green"
        />
        <StatCard
          label="Expense"
          value={summary ? formatCurrency(summary.totalExpense) : 'Loading'}
          tone="red"
        />
        <StatCard
          label="Net profit"
          value={summary ? formatCurrency(summary.netProfit) : 'Loading'}
          tone="gold"
        />
        <StatCard
          label="Crops"
          value={summary ? String(summary.cropCount) : 'Loading'}
          tone="blue"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fast work</Text>
        <Text style={styles.sectionHint}>Most-used actions first</Text>
      </View>
      <View style={styles.quickGrid}>
        {[
          ['Add expense', 'Kharcha', 'add'],
          ['Add income', 'Aamdani', 'add'],
          ['Open records', 'Profiles to crops', 'records'],
          ['View reports', 'Profit picture', 'reports'],
        ].map(([title, subtitle, tab]) => (
          <Pressable
            key={title}
            style={styles.quickCard}
            onPress={() => onNavigate(tab as Tab)}>
            <Text style={styles.quickTitle}>{title}</Text>
            <Text style={styles.quickSubtitle}>{subtitle}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AddScreen({
  farmData,
  onCreated,
  onError,
}: {
  farmData: FarmData;
  onCreated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [mode, setMode] = useState<AddMode>('profile');

  return (
    <View>
      <Text style={styles.pageTitle}>Quick add</Text>
      <Text style={styles.pageText}>
        Add daily records without opening separate complex screens.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalChips}>
        {addModes.map(addMode => (
          <Pressable
            key={addMode.key}
            style={[styles.chip, mode === addMode.key ? styles.chipActive : null]}
            onPress={() => {
              onError('');
              setMode(addMode.key);
            }}>
            <Text
              style={[
                styles.chipText,
                mode === addMode.key ? styles.chipTextActive : null,
              ]}>
              {addMode.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {mode === 'profile' ? (
        <ProfileForm onCreated={onCreated} onError={onError} />
      ) : null}
      {mode === 'zameen' ? (
        <ZameenForm
          profiles={farmData.profiles}
          onCreated={onCreated}
          onError={onError}
        />
      ) : null}
      {mode === 'crop' ? (
        <CropForm
          zameen={farmData.zameen}
          onCreated={onCreated}
          onError={onError}
        />
      ) : null}
      {mode === 'expense' ? (
        <ExpenseForm
          crops={farmData.crops}
          onCreated={onCreated}
          onError={onError}
        />
      ) : null}
      {mode === 'income' ? (
        <IncomeForm
          crops={farmData.crops}
          onCreated={onCreated}
          onError={onError}
        />
      ) : null}
    </View>
  );
}

function ProfileForm({
  onCreated,
  onError,
}: {
  onCreated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    profileName: '',
    city: '',
    chakAreaName: '',
    villageName: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    await saveRecord(
      setIsSaving,
      onError,
      async () => {
        await createProfile({
          profileName: form.profileName.trim(),
          city: form.city.trim() || undefined,
          chakAreaName: form.chakAreaName.trim() || undefined,
          villageName: form.villageName.trim() || undefined,
        });
        setForm({profileName: '', city: '', chakAreaName: '', villageName: ''});
        await onCreated('Profile created successfully');
      },
      'Profile could not be created.',
    );
  }

  return (
    <FormCard title="Create profile" subtitle="A profile is one farm book or owner record.">
      <TextField
        label="Profile name"
        value={form.profileName}
        onChangeText={profileName => setForm({...form, profileName})}
      />
      <TextField
        label="City optional"
        value={form.city}
        onChangeText={city => setForm({...form, city})}
      />
      <TextField
        label="Area optional"
        value={form.chakAreaName}
        onChangeText={chakAreaName => setForm({...form, chakAreaName})}
      />
      <TextField
        label="Village optional"
        value={form.villageName}
        onChangeText={villageName => setForm({...form, villageName})}
      />
      <PrimaryButton
        label={isSaving ? 'Saving...' : 'Save profile'}
        disabled={isSaving || !form.profileName.trim()}
        onPress={handleSubmit}
      />
    </FormCard>
  );
}

function ZameenForm({
  profiles,
  onCreated,
  onError,
}: {
  profiles: Profile[];
  onCreated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    profileId: profiles[0]?.id ?? '',
    zameenName: '',
    totalAreaValue: '',
    totalAreaUnit: 'Acre',
    ownershipType: 'Owned',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!form.profileId && profiles[0]) {
      setForm(current => ({...current, profileId: profiles[0].id}));
    }
  }, [form.profileId, profiles]);

  async function handleSubmit() {
    await saveRecord(
      setIsSaving,
      onError,
      async () => {
        const areaValue = Number(form.totalAreaValue);
        await createZameen({
          profileId: form.profileId,
          zameenName: form.zameenName.trim(),
          totalAreaValue: areaValue,
          totalAreaUnit: form.totalAreaUnit,
          totalAreaSqft: toSquareFeet(areaValue, form.totalAreaUnit),
          ownershipType: form.ownershipType,
        });
        setForm({
          ...form,
          zameenName: '',
          totalAreaValue: '',
        });
        await onCreated('Zameen created successfully');
      },
      'Zameen could not be created.',
    );
  }

  return (
    <FormCard title="Add zameen" subtitle="Choose the profile first, then enter land area.">
      <Selector
        emptyText="Create a profile first."
        label="Profile"
        options={profiles.map(profile => ({
          label: profile.profileName,
          value: profile.id,
        }))}
        value={form.profileId}
        onChange={profileId => setForm({...form, profileId})}
      />
      <TextField
        label="Zameen name"
        value={form.zameenName}
        onChangeText={zameenName => setForm({...form, zameenName})}
      />
      <TextField
        label="Total area"
        value={form.totalAreaValue}
        keyboardType="numeric"
        onChangeText={totalAreaValue => setForm({...form, totalAreaValue})}
      />
      <ChipRow
        label="Area unit"
        value={form.totalAreaUnit}
        options={[...areaUnits]}
        onChange={totalAreaUnit => setForm({...form, totalAreaUnit})}
      />
      <ChipRow
        label="Ownership"
        value={form.ownershipType}
        options={['Owned', 'Lease', 'Shared']}
        onChange={ownershipType => setForm({...form, ownershipType})}
      />
      <PrimaryButton
        label={isSaving ? 'Saving...' : 'Save zameen'}
        disabled={
          isSaving ||
          !form.profileId ||
          !form.zameenName.trim() ||
          Number(form.totalAreaValue) <= 0
        }
        onPress={handleSubmit}
      />
    </FormCard>
  );
}

function CropForm({
  zameen,
  onCreated,
  onError,
}: {
  zameen: Zameen[];
  onCreated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const currentDate = new Date();
  const [form, setForm] = useState({
    zameenId: zameen[0]?.id ?? '',
    cropName: 'Wheat',
    cropAreaValue: '',
    cropAreaUnit: 'Acre',
    startMonth: String(currentDate.getMonth() + 1),
    startYear: String(currentDate.getFullYear()),
    status: 'Active',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!form.zameenId && zameen[0]) {
      setForm(current => ({...current, zameenId: zameen[0].id}));
    }
  }, [form.zameenId, zameen]);

  async function handleSubmit() {
    await saveRecord(
      setIsSaving,
      onError,
      async () => {
        const areaValue = Number(form.cropAreaValue);
        await createCrop({
          zameenId: form.zameenId,
          cropName: form.cropName,
          cropAreaValue: areaValue,
          cropAreaUnit: form.cropAreaUnit,
          cropAreaSqft: toSquareFeet(areaValue, form.cropAreaUnit),
          startMonth: Number(form.startMonth),
          startYear: Number(form.startYear),
          status: form.status,
        });
        setForm({...form, cropAreaValue: ''});
        await onCreated('Crop added successfully');
      },
      'Crop could not be created.',
    );
  }

  return (
    <FormCard title="Add crop" subtitle="Attach a crop cycle to one zameen record.">
      <Selector
        emptyText="Create zameen first."
        label="Zameen"
        options={zameen.map(record => ({
          label: record.zameenName,
          value: record.id,
        }))}
        value={form.zameenId}
        onChange={zameenId => setForm({...form, zameenId})}
      />
      <ChipRow
        label="Crop"
        value={form.cropName}
        options={[...cropNames]}
        onChange={cropName => setForm({...form, cropName})}
      />
      <TextField
        label="Crop area"
        value={form.cropAreaValue}
        keyboardType="numeric"
        onChangeText={cropAreaValue => setForm({...form, cropAreaValue})}
      />
      <ChipRow
        label="Area unit"
        value={form.cropAreaUnit}
        options={[...areaUnits]}
        onChange={cropAreaUnit => setForm({...form, cropAreaUnit})}
      />
      <View style={styles.twoColumn}>
        <TextField
          label="Start month"
          value={form.startMonth}
          keyboardType="numeric"
          onChangeText={startMonth => setForm({...form, startMonth})}
        />
        <TextField
          label="Start year"
          value={form.startYear}
          keyboardType="numeric"
          onChangeText={startYear => setForm({...form, startYear})}
        />
      </View>
      <ChipRow
        label="Status"
        value={form.status}
        options={['Active', 'Completed']}
        onChange={status => setForm({...form, status})}
      />
      <PrimaryButton
        label={isSaving ? 'Saving...' : 'Save crop'}
        disabled={
          isSaving ||
          !form.zameenId ||
          !form.cropName ||
          Number(form.cropAreaValue) <= 0
        }
        onPress={handleSubmit}
      />
    </FormCard>
  );
}

function ExpenseForm({
  crops,
  onCreated,
  onError,
}: {
  crops: Crop[];
  onCreated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    cropId: crops[0]?.id ?? '',
    expenseCategory: 'Seed',
    description: '',
    amount: '',
    expenseDate: todayDisplayDate(),
    paymentStatus: 'Paid',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!form.cropId && crops[0]) {
      setForm(current => ({...current, cropId: crops[0].id}));
    }
  }, [form.cropId, crops]);

  async function handleSubmit() {
    await saveRecord(
      setIsSaving,
      onError,
      async () => {
        const parsedDate = parseDisplayDate(form.expenseDate);
        await createExpense({
          cropId: form.cropId,
          expenseCategory: form.expenseCategory,
          description: form.description.trim(),
          amount: Number(form.amount),
          expenseDate: parsedDate.isoDate,
          expenseMonth: parsedDate.month,
          expenseYear: parsedDate.year,
          paymentStatus: form.paymentStatus,
        });
        setForm({...form, description: '', amount: ''});
        await onCreated('Expense added successfully');
      },
      'Expense could not be created.',
    );
  }

  return (
    <FormCard title="Add expense" subtitle="Record kharcha against a crop.">
      <Selector
        emptyText="Create a crop first."
        label="Crop"
        options={crops.map(crop => ({label: crop.cropName, value: crop.id}))}
        value={form.cropId}
        onChange={cropId => setForm({...form, cropId})}
      />
      <ChipRow
        label="Category"
        value={form.expenseCategory}
        options={[...expenseCategories]}
        onChange={expenseCategory => setForm({...form, expenseCategory})}
      />
      <TextField
        label="Description"
        value={form.description}
        onChangeText={description => setForm({...form, description})}
      />
      <TextField
        label="Amount"
        value={form.amount}
        keyboardType="numeric"
        onChangeText={amount => setForm({...form, amount})}
      />
      <TextField
        label="Date DD/MM/YYYY"
        value={form.expenseDate}
        keyboardType="numbers-and-punctuation"
        onChangeText={expenseDate => setForm({...form, expenseDate})}
      />
      <ChipRow
        label="Status"
        value={form.paymentStatus}
        options={['Paid', 'Unpaid']}
        onChange={paymentStatus => setForm({...form, paymentStatus})}
      />
      <PrimaryButton
        label={isSaving ? 'Saving...' : 'Save expense'}
        disabled={
          isSaving ||
          !form.cropId ||
          !form.description.trim() ||
          Number(form.amount) <= 0
        }
        onPress={handleSubmit}
      />
    </FormCard>
  );
}

function IncomeForm({
  crops,
  onCreated,
  onError,
}: {
  crops: Crop[];
  onCreated: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    cropId: crops[0]?.id ?? '',
    quantity: '',
    quantityUnit: 'Maund',
    rate: '',
    totalAmount: '',
    incomeDate: todayDisplayDate(),
    paymentStatus: 'Received',
    buyerName: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!form.cropId && crops[0]) {
      setForm(current => ({...current, cropId: crops[0].id}));
    }
  }, [form.cropId, crops]);

  async function handleSubmit() {
    await saveRecord(
      setIsSaving,
      onError,
      async () => {
        const parsedDate = parseDisplayDate(form.incomeDate);
        await createIncome({
          cropId: form.cropId,
          quantity: Number(form.quantity) || undefined,
          quantityUnit: form.quantityUnit,
          rate: Number(form.rate) || undefined,
          totalAmount: Number(form.totalAmount),
          incomeDate: parsedDate.isoDate,
          incomeMonth: parsedDate.month,
          incomeYear: parsedDate.year,
          paymentStatus: form.paymentStatus,
          buyerName: form.buyerName.trim() || undefined,
        });
        setForm({...form, quantity: '', rate: '', totalAmount: '', buyerName: ''});
        await onCreated('Income added successfully');
      },
      'Income could not be created.',
    );
  }

  return (
    <FormCard title="Add income" subtitle="Record a sale or received payment.">
      <Selector
        emptyText="Create a crop first."
        label="Crop"
        options={crops.map(crop => ({label: crop.cropName, value: crop.id}))}
        value={form.cropId}
        onChange={cropId => setForm({...form, cropId})}
      />
      <View style={styles.twoColumn}>
        <TextField
          label="Quantity optional"
          value={form.quantity}
          keyboardType="numeric"
          onChangeText={quantity => setForm({...form, quantity})}
        />
        <TextField
          label="Rate optional"
          value={form.rate}
          keyboardType="numeric"
          onChangeText={rate => setForm({...form, rate})}
        />
      </View>
      <ChipRow
        label="Quantity unit"
        value={form.quantityUnit}
        options={[...quantityUnits]}
        onChange={quantityUnit => setForm({...form, quantityUnit})}
      />
      <TextField
        label="Total amount"
        value={form.totalAmount}
        keyboardType="numeric"
        onChangeText={totalAmount => setForm({...form, totalAmount})}
      />
      <TextField
        label="Buyer optional"
        value={form.buyerName}
        onChangeText={buyerName => setForm({...form, buyerName})}
      />
      <TextField
        label="Date DD/MM/YYYY"
        value={form.incomeDate}
        keyboardType="numbers-and-punctuation"
        onChangeText={incomeDate => setForm({...form, incomeDate})}
      />
      <ChipRow
        label="Status"
        value={form.paymentStatus}
        options={['Received', 'Pending']}
        onChange={paymentStatus => setForm({...form, paymentStatus})}
      />
      <PrimaryButton
        label={isSaving ? 'Saving...' : 'Save income'}
        disabled={isSaving || !form.cropId || Number(form.totalAmount) <= 0}
        onPress={handleSubmit}
      />
    </FormCard>
  );
}

function RecordsScreen({farmData}: {farmData: FarmData}) {
  return (
    <View>
      <Text style={styles.pageTitle}>Records</Text>
      <Text style={styles.pageText}>
        A simple overview from profile to zameen, crop, kharcha, and aamdani.
      </Text>
      <RecordSection title="Profiles">
        {farmData.profiles.length === 0 ? (
          <EmptyText text="No profiles yet." />
        ) : (
          farmData.profiles.map(profile => (
            <RecordCard
              key={profile.id}
              title={profile.profileName}
              meta={[profile.chakAreaName, profile.villageName, profile.city]
                .filter(Boolean)
                .join(' • ')}
            />
          ))
        )}
      </RecordSection>
      <RecordSection title="Zameen">
        {farmData.zameen.length === 0 ? (
          <EmptyText text="No zameen records yet." />
        ) : (
          farmData.zameen.map(record => (
            <RecordCard
              key={record.id}
              title={record.zameenName}
              meta={`${record.totalAreaValue} ${record.totalAreaUnit} • ${
                record.ownershipType ?? 'Ownership not set'
              }`}
            />
          ))
        )}
      </RecordSection>
      <RecordSection title="Crops">
        {farmData.crops.length === 0 ? (
          <EmptyText text="No crops yet." />
        ) : (
          farmData.crops.map(crop => (
            <RecordCard
              key={crop.id}
              title={crop.cropName}
              meta={`${crop.cropAreaValue} ${crop.cropAreaUnit} • ${crop.status}`}
            />
          ))
        )}
      </RecordSection>
      <RecordSection title="Recent expenses">
        {farmData.expenses.slice(0, 8).map(expense => (
          <RecordCard
            key={expense.id}
            title={expense.description}
            meta={`${formatCurrency(expense.amount)} • ${formatDate(
              expense.expenseDate,
            )} • ${expense.paymentStatus ?? 'Status not set'}`}
          />
        ))}
        {farmData.expenses.length === 0 ? <EmptyText text="No expenses yet." /> : null}
      </RecordSection>
      <RecordSection title="Recent income">
        {farmData.income.slice(0, 8).map(income => (
          <RecordCard
            key={income.id}
            title={income.buyerName || 'Income entry'}
            meta={`${formatCurrency(income.totalAmount)} • ${formatDate(
              income.incomeDate,
            )} • ${income.paymentStatus ?? 'Status not set'}`}
          />
        ))}
        {farmData.income.length === 0 ? <EmptyText text="No income yet." /> : null}
      </RecordSection>
    </View>
  );
}

function ReportsScreen({farmData}: {farmData: FarmData}) {
  const maxMonthlyValue = Math.max(
    ...farmData.monthlyReports.map(report =>
      Math.max(report.totalExpense, report.totalIncome, Math.abs(report.netProfit)),
    ),
    1,
  );

  return (
    <View>
      <Text style={styles.pageTitle}>Reports</Text>
      <Text style={styles.pageText}>
        Mobile-first reporting: enough insight without overwhelming the user.
      </Text>
      <View style={styles.statsGrid}>
        <StatCard
          label="Net profit"
          value={formatCurrency(farmData.summary?.netProfit ?? 0)}
          tone="gold"
        />
        <StatCard
          label="Income"
          value={formatCurrency(farmData.summary?.totalIncome ?? 0)}
          tone="green"
        />
        <StatCard
          label="Expense"
          value={formatCurrency(farmData.summary?.totalExpense ?? 0)}
          tone="red"
        />
        <StatCard
          label="Transactions"
          value={String(
            (farmData.summary?.expenseCount ?? 0) +
              (farmData.summary?.incomeCount ?? 0),
          )}
          tone="blue"
        />
      </View>

      <View style={styles.reportCard}>
        <Text style={styles.cardTitle}>Monthly movement</Text>
        {farmData.monthlyReports.slice(0, 6).map(report => (
          <View key={`${report.year}-${report.month}`} style={styles.barRow}>
            <Text style={styles.barLabel}>
              {report.month}/{report.year}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  styles.barIncome,
                  {
                    width: `${Math.max(
                      (report.totalIncome / maxMonthlyValue) * 100,
                      4,
                    )}%`,
                  },
                ]}
              />
              <View
                style={[
                  styles.barFill,
                  styles.barExpense,
                  {
                    width: `${Math.max(
                      (report.totalExpense / maxMonthlyValue) * 100,
                      4,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
        {farmData.monthlyReports.length === 0 ? (
          <EmptyText text="Monthly charts will appear when entries exist." />
        ) : null}
      </View>

      <RecordSection title="Crop profitability">
        {farmData.cropProfitability.length === 0 ? (
          <EmptyText text="Crop profit reports will appear after crop entries." />
        ) : (
          farmData.cropProfitability.map(report => (
            <RecordCard
              key={report.cropId}
              title={report.cropName}
              meta={`${report.zameenName} • Net ${formatCurrency(
                report.netProfit,
              )}`}
            />
          ))
        )}
      </RecordSection>
    </View>
  );
}

function AiScreen() {
  const [messages, setMessages] = useState<AiChatHistoryMessage[]>([
    {
      role: 'assistant',
      text: 'Assalam o alaikum. Ask me about profiles, zameen, crops, expenses, income, reports, or farm workflow.',
    },
  ]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    const cleanMessage = message.trim();

    if (!cleanMessage || isSending) {
      return;
    }

    const nextMessages: AiChatHistoryMessage[] = [
      ...messages,
      {role: 'user', text: cleanMessage},
    ];
    setMessages(nextMessages);
    setMessage('');
    setIsSending(true);

    try {
      const response = await sendAiMessage(cleanMessage, messages);
      setMessages([...nextMessages, {role: 'assistant', text: response.reply}]);
    } catch (chatError) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          text: getErrorText(chatError, 'Zamindar AI could not respond right now.'),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View>
      <View style={styles.aiHero}>
        <View style={styles.aiOrb}>
          <Text style={styles.aiOrbText}>AI</Text>
        </View>
        <Text style={styles.pageTitle}>Zamindar AI</Text>
        <Text style={styles.pageText}>
          Project-focused help only. Chat is session-only and clears when the app
          restarts.
        </Text>
      </View>

      <View style={styles.chatBox}>
        {messages.map((chatMessage, index) => (
          <View
            key={`${chatMessage.role}-${index}`}
            style={[
              styles.chatBubble,
              chatMessage.role === 'user'
                ? styles.chatBubbleUser
                : styles.chatBubbleAssistant,
            ]}>
            <Text
              style={[
                styles.chatText,
                chatMessage.role === 'user' ? styles.chatTextUser : null,
              ]}>
              {chatMessage.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.chatComposer}>
        <TextInput
          style={styles.chatInput}
          value={message}
          placeholder="Ask about your farm ledger..."
          placeholderTextColor="#7d9289"
          onChangeText={setMessage}
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>{isSending ? '...' : 'Send'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SettingsModal({
  visible,
  user,
  onClose,
  onSignOut,
}: {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.settingsScreen}>
        <View style={styles.settingsHeader}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.pageText}>{user.email}</Text>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Role</Text>
            <Text style={styles.settingsValue}>{user.role}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Area unit</Text>
            <Text style={styles.settingsValue}>{user.preferredAreaUnit}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Currency</Text>
            <Text style={styles.settingsValue}>{user.preferredCurrency}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Google</Text>
            <Text style={styles.settingsValue}>
              {user.googleConnected ? 'Connected' : 'Not connected'}
            </Text>
          </View>
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Mobile v1 focus</Text>
          <Text style={styles.pageText}>
            This app keeps the phone experience simple: quick add, records,
            reports, and Zamindar AI. Advanced admin controls remain better on
            desktop for now.
          </Text>
        </View>
        <PrimaryButton label="Sign out" danger onPress={onSignOut} />
      </SafeAreaView>
    </Modal>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad' | 'phone-pad' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#7d9289"
        onChangeText={onChangeText}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  disabled,
  danger,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.primaryButton,
        danger ? styles.dangerButton : null,
        disabled ? styles.primaryButtonDisabled : null,
      ]}
      onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
      onPress={onPress}>
      <Text
        style={[
          styles.segmentButtonText,
          active ? styles.segmentButtonTextActive : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChipRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalChips}>
        {options.map(option => (
          <Pressable
            key={option}
            style={[styles.chip, value === option ? styles.chipActive : null]}
            onPress={() => onChange(option)}>
            <Text
              style={[
                styles.chipText,
                value === option ? styles.chipTextActive : null,
              ]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Selector({
  label,
  value,
  options,
  emptyText,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{label: string; value: string}>;
  emptyText: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) {
    return <Banner tone="warning" message={emptyText} />;
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalChips}>
        {options.map(option => (
          <Pressable
            key={option.value}
            style={[styles.chip, value === option.value ? styles.chipActive : null]}
            onPress={() => onChange(option.value)}>
            <Text
              style={[
                styles.chipText,
                value === option.value ? styles.chipTextActive : null,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function FormCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'green' | 'red' | 'gold' | 'blue';
}) {
  const toneStyle = {
    green: styles.statCardGreen,
    red: styles.statCardRed,
    gold: styles.statCardGold,
    blue: styles.statCardBlue,
  }[tone];

  return (
    <View style={[styles.statCard, toneStyle]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function RecordSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.recordSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function RecordCard({title, meta}: {title: string; meta?: string}) {
  return (
    <View style={styles.recordCard}>
      <Text style={styles.recordTitle}>{title}</Text>
      {meta ? <Text style={styles.recordMeta}>{meta}</Text> : null}
    </View>
  );
}

function EmptyText({text}: {text: string}) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function StepLine({number, text}: {number: string; text: string}) {
  return (
    <View style={styles.stepLine}>
      <Text style={styles.stepNumber}>{number}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function Banner({tone, message}: {tone: 'success' | 'error' | 'warning'; message: string}) {
  return (
    <View
      style={[
        styles.banner,
        tone === 'success' ? styles.bannerSuccess : null,
        tone === 'error' ? styles.bannerError : null,
        tone === 'warning' ? styles.bannerWarning : null,
      ]}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

async function saveRecord(
  setIsSaving: (value: boolean) => void,
  onError: (message: string) => void,
  action: () => Promise<void>,
  fallbackMessage: string,
) {
  setIsSaving(true);
  onError('');

  try {
    await action();
  } catch (error) {
    onError(getErrorText(error, fallbackMessage));
  } finally {
    setIsSaving(false);
  }
}

function getErrorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#edf6f1',
  },
  splash: {
    alignItems: 'center',
    backgroundColor: '#0f2d27',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: '#12a98f',
    borderRadius: 22,
    height: 76,
    justifyContent: 'center',
    shadowColor: '#10b89c',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    width: 76,
  },
  logoIcon: {
    color: '#fff8d7',
    fontSize: 40,
    fontWeight: '900',
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  splashText: {
    color: '#cce0d8',
    fontSize: 16,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#0f2d27',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  brandText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  brandSubText: {
    color: '#bdd8ce',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: '#f8c66d',
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: '#0f2d27',
    fontSize: 18,
    fontWeight: '900',
  },
  content: {
    padding: 16,
  },
  bottomNav: {
    backgroundColor: '#ffffff',
    borderTopColor: '#d5e4dd',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingHorizontal: 10,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: '#e3f7ef',
  },
  tabIcon: {
    color: '#557067',
    fontSize: 20,
    fontWeight: '900',
  },
  tabIconActive: {
    color: '#087a66',
  },
  tabLabel: {
    color: '#557067',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#087a66',
  },
  authScreen: {
    backgroundColor: '#0f2d27',
    flex: 1,
  },
  authKeyboard: {
    flex: 1,
  },
  authContent: {
    gap: 18,
    padding: 18,
  },
  mobileHero: {
    backgroundColor: '#123c34',
    borderColor: '#245d50',
    borderRadius: 30,
    borderWidth: 1,
    gap: 10,
    overflow: 'hidden',
    padding: 24,
  },
  heroEyebrow: {
    color: '#f8c66d',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  heroText: {
    color: '#d4e7df',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    gap: 14,
    padding: 18,
  },
  modeSwitch: {
    backgroundColor: '#edf6f1',
    borderRadius: 18,
    flexDirection: 'row',
    padding: 4,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 15,
    flex: 1,
    paddingVertical: 12,
  },
  segmentButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f2d27',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  segmentButtonText: {
    color: '#587168',
    fontSize: 15,
    fontWeight: '900',
  },
  segmentButtonTextActive: {
    color: '#087a66',
  },
  formTitle: {
    color: '#12221d',
    fontSize: 24,
    fontWeight: '900',
  },
  helperText: {
    color: '#5d746b',
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 7,
    marginTop: 4,
  },
  fieldLabel: {
    color: '#486259',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#f9fbfa',
    borderColor: '#cadbd4',
    borderRadius: 15,
    borderWidth: 1,
    color: '#10231e',
    fontSize: 16,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0c927b',
    borderRadius: 16,
    marginTop: 8,
    paddingVertical: 15,
  },
  dangerButton: {
    backgroundColor: '#b63d48',
    marginHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  linkText: {
    color: '#087a66',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },
  apiHint: {
    color: '#8ba099',
    fontSize: 11,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: '#123c34',
    borderRadius: 30,
    marginBottom: 16,
    padding: 22,
  },
  eyebrow: {
    color: '#f2b84b',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: '#11241f',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 35,
  },
  welcomeCardTitle: {
    color: '#ffffff',
  },
  pageText: {
    color: '#5b7169',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 6,
  },
  onboardingCard: {
    backgroundColor: '#fff8e8',
    borderColor: '#efd598',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    padding: 18,
  },
  stepLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  stepNumber: {
    backgroundColor: '#0f927a',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stepText: {
    color: '#233a33',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    borderRadius: 22,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
    padding: 16,
  },
  statCardGreen: {
    backgroundColor: '#ddf8ea',
  },
  statCardRed: {
    backgroundColor: '#ffebee',
  },
  statCardGold: {
    backgroundColor: '#fff2cf',
  },
  statCardBlue: {
    backgroundColor: '#e5f3ff',
  },
  statLabel: {
    color: '#52685f',
    fontSize: 13,
    fontWeight: '900',
  },
  statValue: {
    color: '#10231e',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 16,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#13261f',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHint: {
    color: '#657b72',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d6e5de',
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 18,
  },
  quickTitle: {
    color: '#0d7965',
    fontSize: 17,
    fontWeight: '900',
  },
  quickSubtitle: {
    color: '#637970',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  horizontalChips: {
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderColor: '#cfe0d9',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: '#0c927b',
    borderColor: '#0c927b',
  },
  chipText: {
    color: '#49635a',
    fontSize: 13,
    fontWeight: '900',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    gap: 12,
    marginTop: 8,
    padding: 18,
  },
  cardTitle: {
    color: '#12241f',
    fontSize: 21,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: '#62786f',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  recordSection: {
    gap: 10,
    marginTop: 18,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d6e5de',
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
  },
  recordTitle: {
    color: '#12241f',
    fontSize: 17,
    fontWeight: '900',
  },
  recordMeta: {
    color: '#647b72',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyText: {
    color: '#6e827a',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 10,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 12,
    marginBottom: 12,
    padding: 18,
  },
  barRow: {
    gap: 7,
  },
  barLabel: {
    color: '#50685f',
    fontSize: 12,
    fontWeight: '900',
  },
  barTrack: {
    backgroundColor: '#edf5f1',
    borderRadius: 999,
    height: 24,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 999,
    height: 10,
    marginLeft: 6,
    marginTop: 2,
  },
  barIncome: {
    backgroundColor: '#1aa77d',
  },
  barExpense: {
    backgroundColor: '#d85660',
  },
  aiHero: {
    alignItems: 'center',
    backgroundColor: '#123c34',
    borderRadius: 30,
    gap: 10,
    marginBottom: 16,
    padding: 24,
  },
  aiOrb: {
    alignItems: 'center',
    backgroundColor: '#13a98f',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    shadowColor: '#f2b84b',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    width: 68,
  },
  aiOrbText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  chatBox: {
    gap: 10,
    marginBottom: 12,
  },
  chatBubble: {
    borderRadius: 20,
    maxWidth: '88%',
    padding: 14,
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#0c927b',
  },
  chatText: {
    color: '#14251f',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  chatTextUser: {
    color: '#ffffff',
  },
  chatComposer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 10,
    padding: 8,
  },
  chatInput: {
    color: '#10231e',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    minHeight: 46,
    paddingHorizontal: 10,
  },
  sendButton: {
    backgroundColor: '#0c927b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  settingsScreen: {
    backgroundColor: '#edf6f1',
    flex: 1,
    padding: 16,
  },
  settingsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#0c927b',
    fontWeight: '900',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 12,
    marginBottom: 14,
    padding: 18,
  },
  settingsRow: {
    borderTopColor: '#edf3f0',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  settingsLabel: {
    color: '#61776e',
    fontWeight: '800',
  },
  settingsValue: {
    color: '#10231e',
    fontWeight: '900',
  },
  banner: {
    borderRadius: 16,
    marginBottom: 10,
    padding: 12,
  },
  bannerSuccess: {
    backgroundColor: '#dff7ea',
  },
  bannerError: {
    backgroundColor: '#ffe8eb',
  },
  bannerWarning: {
    backgroundColor: '#fff4d6',
  },
  bannerText: {
    color: '#263b34',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default App;
