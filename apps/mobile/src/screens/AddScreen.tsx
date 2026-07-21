import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {CheckCircle2} from 'lucide-react-native';
import {Screen} from '../components/Screen';
import {AppText} from '../components/AppText';
import {Input} from '../components/Input';
import {Button} from '../components/Button';
import {ChipGroup} from '../components/ChipGroup';
import {OptionChips} from '../components/OptionChips';
import {useFarmData} from '../context/FarmDataContext';
import type {TranslationKey} from '@zamindar/shared';
import {useI18n} from '../i18n/useT';
import {theme} from '../theme';
import {haptics} from '../haptics';
import * as api from '../api';
import {
  areaUnits,
  cropNames,
  cropStatuses,
  expenseCategories,
  expensePaymentStatuses,
  incomePaymentStatuses,
  ownershipTypes,
  parseDisplayDate,
  quantityUnits,
  todayDisplayDate,
  toSquareFeet,
} from '../domain';

type AddType = 'profile' | 'zameen' | 'crop' | 'expense' | 'income';

const TYPES: {key: AddType; labelKey: TranslationKey}[] = [
  {key: 'profile', labelKey: 'zameen.profile'},
  {key: 'zameen', labelKey: 'crops.zameen'},
  {key: 'crop', labelKey: 'crops.colCrop'},
  {key: 'expense', labelKey: 'dashboard.expense'},
  {key: 'income', labelKey: 'dashboard.income'},
];

export function AddScreen() {
  const {t} = useI18n();
  const {data, reload} = useFarmData();
  const [type, setType] = useState<AddType>('profile');
  const [saved, setSaved] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const onSaved = async (message: string) => {
    haptics.success();
    setSaved(message);
    setFormKey(k => k + 1);
    await reload();
  };

  const profileOptions = (data?.profiles ?? []).map(p => ({
    label: p.profileName,
    value: p.id,
  }));
  const zameenOptions = (data?.zameen ?? []).map(z => ({
    label: z.zameenName,
    value: z.id,
  }));
  const cropOptions = (data?.crops ?? []).map(c => ({
    label: c.cropName,
    value: c.id,
  }));

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AppText variant="h1" style={styles.title}>
          Add record
        </AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}>
          {TYPES.map(item => (
            <TypePill
              key={item.key}
              label={t(item.labelKey)}
              active={item.key === type}
              onPress={() => {
                setType(item.key);
                setSaved(null);
              }}
            />
          ))}
        </ScrollView>

        {saved ? (
          <View style={styles.savedBanner}>
            <CheckCircle2 color={theme.colors.income} size={18} />
            <AppText variant="small" color={theme.colors.income} style={styles.savedText}>
              {saved}
            </AppText>
          </View>
        ) : null}

        <View style={styles.form} key={formKey}>
          {type === 'profile' && <ProfileForm onSaved={onSaved} />}
          {type === 'zameen' && (
            <ZameenForm profiles={profileOptions} onSaved={onSaved} />
          )}
          {type === 'crop' && (
            <CropForm zameen={zameenOptions} onSaved={onSaved} />
          )}
          {type === 'expense' && (
            <ExpenseForm crops={cropOptions} onSaved={onSaved} />
          )}
          {type === 'income' && (
            <IncomeForm crops={cropOptions} onSaved={onSaved} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function TypePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.pillWrap}>
      <Button
        title={label}
        variant={active ? 'primary' : 'secondary'}
        size="md"
        fullWidth={false}
        onPress={onPress}
      />
    </View>
  );
}

// --- shared bits ------------------------------------------------------------

function useSubmit() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setSaving(true);
    try {
      await fn();
    } catch (e) {
      haptics.error();
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return {saving, error, run};
}

function FormError({error}: {error: string | null}) {
  if (!error) {
    return null;
  }
  return (
    <AppText variant="small" color={theme.colors.danger} style={styles.error}>
      {error}
    </AppText>
  );
}

// --- Profile ----------------------------------------------------------------

function ProfileForm({onSaved}: {onSaved: (m: string) => void}) {
  const {t} = useI18n();
  const [profileName, setProfileName] = useState('');
  const [city, setCity] = useState('');
  const [chakAreaName, setChakAreaName] = useState('');
  const [villageName, setVillageName] = useState('');
  const {saving, error, run} = useSubmit();

  const submit = () =>
    run(async () => {
      await api.createProfile({
        profileName: profileName.trim(),
        city: city.trim() || undefined,
        chakAreaName: chakAreaName.trim() || undefined,
        villageName: villageName.trim() || undefined,
      });
      onSaved(`Profile "${profileName.trim()}" added`);
    });

  return (
    <View>
      <Input label={t('profiles.name')} value={profileName} onChangeText={setProfileName} />
      <Input label="City (optional)" value={city} onChangeText={setCity} containerStyle={styles.gap} />
      <Input
        label="Chak / area (optional)"
        value={chakAreaName}
        onChangeText={setChakAreaName}
        containerStyle={styles.gap}
      />
      <Input
        label="Village (optional)"
        value={villageName}
        onChangeText={setVillageName}
        containerStyle={styles.gap}
      />
      <FormError error={error} />
      <Button
        title={t('mobile.saveProfile')}
        onPress={submit}
        loading={saving}
        disabled={profileName.trim().length < 2 || saving}
        style={styles.submit}
      />
    </View>
  );
}

// --- Zameen -----------------------------------------------------------------

function ZameenForm({
  profiles,
  onSaved,
}: {
  profiles: {label: string; value: string}[];
  onSaved: (m: string) => void;
}) {
  const {t} = useI18n();
  const [profileId, setProfileId] = useState<string | null>(
    profiles[0]?.value ?? null,
  );
  const [zameenName, setZameenName] = useState('');
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState<string>(areaUnits[0]);
  const [ownershipType, setOwnershipType] = useState<string>(ownershipTypes[0]);
  const {saving, error, run} = useSubmit();

  const valid =
    !!profileId && zameenName.trim().length >= 2 && Number(areaValue) > 0;

  const submit = () =>
    run(async () => {
      const value = Number(areaValue);
      await api.createZameen({
        profileId: profileId as string,
        zameenName: zameenName.trim(),
        totalAreaValue: value,
        totalAreaUnit: areaUnit,
        totalAreaSqft: toSquareFeet(value, areaUnit),
        ownershipType,
      });
      onSaved(`Zameen "${zameenName.trim()}" added`);
    });

  return (
    <View>
      <OptionChips
        label={t('zameen.profile')}
        options={profiles}
        value={profileId}
        onChange={setProfileId}
        emptyText={t('mobile.addProfileFirst')}
      />
      <Input label={t('zameen.name')} value={zameenName} onChangeText={setZameenName} containerStyle={styles.gap} />
      <Input
        label={t('zameen.colArea')}
        keyboardType="numeric"
        value={areaValue}
        onChangeText={setAreaValue}
        containerStyle={styles.gap}
      />
      <View style={styles.gap}>
        <ChipGroup label={t('mobile.unit')} options={areaUnits} value={areaUnit} onChange={setAreaUnit} />
      </View>
      <View style={styles.gap}>
        <ChipGroup
          label={t('mobile.ownership')}
          options={ownershipTypes}
          value={ownershipType}
          onChange={setOwnershipType}
        />
      </View>
      <FormError error={error} />
      <Button
        title={t('mobile.saveZameen')}
        onPress={submit}
        loading={saving}
        disabled={!valid || saving}
        style={styles.submit}
      />
    </View>
  );
}

// --- Crop -------------------------------------------------------------------

function CropForm({
  zameen,
  onSaved,
}: {
  zameen: {label: string; value: string}[];
  onSaved: (m: string) => void;
}) {
  const {t} = useI18n();
  const [zameenId, setZameenId] = useState<string | null>(zameen[0]?.value ?? null);
  const [cropName, setCropName] = useState<string>(cropNames[0]);
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState<string>(areaUnits[0]);
  const [status, setStatus] = useState<string>(cropStatuses[0]);
  const now = new Date();
  const [startMonth, setStartMonth] = useState(String(now.getMonth() + 1));
  const [startYear, setStartYear] = useState(String(now.getFullYear()));
  const {saving, error, run} = useSubmit();

  const valid = !!zameenId && cropName.trim().length > 0 && Number(areaValue) > 0;

  const submit = () =>
    run(async () => {
      const value = Number(areaValue);
      await api.createCrop({
        zameenId: zameenId as string,
        cropName,
        cropAreaValue: value,
        cropAreaUnit: areaUnit,
        cropAreaSqft: toSquareFeet(value, areaUnit),
        status,
        startMonth: Number(startMonth) || undefined,
        startYear: Number(startYear) || undefined,
      });
      onSaved(`Crop "${cropName}" added`);
    });

  return (
    <View>
      <OptionChips
        label={t('crops.zameen')}
        options={zameen}
        value={zameenId}
        onChange={setZameenId}
        emptyText={t('mobile.addZameenFirst')}
      />
      <View style={styles.gap}>
        <ChipGroup label={t('crops.colCrop')} options={cropNames} value={cropName} onChange={setCropName} />
      </View>
      <Input
        label={t('zameen.colArea')}
        keyboardType="numeric"
        value={areaValue}
        onChangeText={setAreaValue}
        containerStyle={styles.gap}
      />
      <View style={styles.gap}>
        <ChipGroup label={t('mobile.unit')} options={areaUnits} value={areaUnit} onChange={setAreaUnit} />
      </View>
      <View style={styles.row}>
        <Input
          label={t('mobile.startMonth')}
          keyboardType="numeric"
          value={startMonth}
          onChangeText={setStartMonth}
          containerStyle={styles.half}
        />
        <Input
          label={t('mobile.startYear')}
          keyboardType="numeric"
          value={startYear}
          onChangeText={setStartYear}
          containerStyle={styles.half}
        />
      </View>
      <View style={styles.gap}>
        <ChipGroup label={t('crops.status')} options={cropStatuses} value={status} onChange={setStatus} />
      </View>
      <FormError error={error} />
      <Button
        title={t('mobile.saveCrop')}
        onPress={submit}
        loading={saving}
        disabled={!valid || saving}
        style={styles.submit}
      />
    </View>
  );
}

// --- Expense ----------------------------------------------------------------

function ExpenseForm({
  crops,
  onSaved,
}: {
  crops: {label: string; value: string}[];
  onSaved: (m: string) => void;
}) {
  const {t} = useI18n();
  const [cropId, setCropId] = useState<string | null>(crops[0]?.value ?? null);
  const [category, setCategory] = useState<string>(expenseCategories[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayDisplayDate());
  const [paymentStatus, setPaymentStatus] = useState<string>(expensePaymentStatuses[0]);
  const {saving, error, run} = useSubmit();

  const valid = !!cropId && description.trim().length > 0 && Number(amount) > 0;

  const submit = () =>
    run(async () => {
      const parsed = parseDisplayDate(date);
      await api.createExpense({
        cropId: cropId as string,
        expenseCategory: category,
        description: description.trim(),
        amount: Number(amount),
        expenseDate: parsed.isoDate,
        expenseMonth: parsed.month,
        expenseYear: parsed.year,
        paymentStatus,
      });
      onSaved(`Expense of Rs ${Number(amount).toLocaleString()} added`);
    });

  return (
    <View>
      <OptionChips
        label={t('crops.colCrop')}
        options={crops}
        value={cropId}
        onChange={setCropId}
        emptyText={t('mobile.addCropFirst')}
      />
      <View style={styles.gap}>
        <ChipGroup
          label={t('expenses.category')}
          options={expenseCategories}
          value={category}
          onChange={setCategory}
        />
      </View>
      <Input label={t('expenses.description')} value={description} onChangeText={setDescription} containerStyle={styles.gap} />
      <Input
        label="Amount (Rs)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        containerStyle={styles.gap}
      />
      <Input
        label="Date (DD/MM/YYYY)"
        value={date}
        onChangeText={setDate}
        containerStyle={styles.gap}
      />
      <View style={styles.gap}>
        <ChipGroup
          label={t('crops.status')}
          options={expensePaymentStatuses}
          value={paymentStatus}
          onChange={setPaymentStatus}
        />
      </View>
      <FormError error={error} />
      <Button
        title={t('mobile.saveExpense')}
        onPress={submit}
        loading={saving}
        disabled={!valid || saving}
        style={styles.submit}
      />
    </View>
  );
}

// --- Income -----------------------------------------------------------------

function IncomeForm({
  crops,
  onSaved,
}: {
  crops: {label: string; value: string}[];
  onSaved: (m: string) => void;
}) {
  const {t} = useI18n();
  const [cropId, setCropId] = useState<string | null>(crops[0]?.value ?? null);
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<string>(quantityUnits[0]);
  const [rate, setRate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [date, setDate] = useState(todayDisplayDate());
  const [paymentStatus, setPaymentStatus] = useState<string>(incomePaymentStatuses[0]);
  const {saving, error, run} = useSubmit();

  const valid = !!cropId && Number(totalAmount) > 0;

  const submit = () =>
    run(async () => {
      const parsed = parseDisplayDate(date);
      await api.createIncome({
        cropId: cropId as string,
        quantity: quantity ? Number(quantity) : undefined,
        quantityUnit: quantity ? quantityUnit : undefined,
        rate: rate ? Number(rate) : undefined,
        totalAmount: Number(totalAmount),
        incomeDate: parsed.isoDate,
        incomeMonth: parsed.month,
        incomeYear: parsed.year,
        buyerName: buyerName.trim() || undefined,
        paymentStatus,
      });
      onSaved(`Income of Rs ${Number(totalAmount).toLocaleString()} added`);
    });

  return (
    <View>
      <OptionChips
        label={t('crops.colCrop')}
        options={crops}
        value={cropId}
        onChange={setCropId}
        emptyText={t('mobile.addCropFirst')}
      />
      <View style={styles.row}>
        <Input
          label="Quantity (optional)"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
          containerStyle={styles.half}
        />
        <Input
          label="Rate (optional)"
          keyboardType="numeric"
          value={rate}
          onChangeText={setRate}
          containerStyle={styles.half}
        />
      </View>
      <View style={styles.gap}>
        <ChipGroup
          label={t('income.quantityUnit')}
          options={quantityUnits}
          value={quantityUnit}
          onChange={setQuantityUnit}
        />
      </View>
      <Input
        label="Total amount (Rs)"
        keyboardType="numeric"
        value={totalAmount}
        onChangeText={setTotalAmount}
        containerStyle={styles.gap}
      />
      <Input
        label="Buyer (optional)"
        value={buyerName}
        onChangeText={setBuyerName}
        containerStyle={styles.gap}
      />
      <Input
        label="Date (DD/MM/YYYY)"
        value={date}
        onChangeText={setDate}
        containerStyle={styles.gap}
      />
      <View style={styles.gap}>
        <ChipGroup
          label={t('crops.status')}
          options={incomePaymentStatuses}
          value={paymentStatus}
          onChange={setPaymentStatus}
        />
      </View>
      <FormError error={error} />
      <Button
        title={t('mobile.saveIncome')}
        onPress={submit}
        loading={saving}
        disabled={!valid || saving}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  title: {marginBottom: theme.spacing.lg},
  typeRow: {gap: theme.spacing.sm, paddingBottom: theme.spacing.sm},
  pillWrap: {},
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(47,191,113,0.12)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  savedText: {flex: 1},
  form: {marginTop: theme.spacing.xl},
  gap: {marginTop: theme.spacing.lg},
  row: {flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg},
  half: {flex: 1},
  error: {marginTop: theme.spacing.lg},
  submit: {marginTop: theme.spacing.xl},
});
