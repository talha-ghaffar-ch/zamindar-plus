import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {X} from 'lucide-react-native';
import {theme} from '../theme';
import {haptics} from '../haptics';
import * as api from '../api';
import {
  areaUnits,
  cropNames,
  cropStatuses,
  expenseCategories,
  expensePaymentStatuses,
  formatDate,
  incomePaymentStatuses,
  ownershipTypes,
  parseDisplayDate,
  quantityUnits,
  toSquareFeet,
} from '../domain';
import {AppText} from './AppText';
import {Input} from './Input';
import {Button} from './Button';
import {ChipGroup} from './ChipGroup';

export type EditTarget =
  | {type: 'profile'; data: api.Profile}
  | {type: 'zameen'; data: api.Zameen}
  | {type: 'crop'; data: api.Crop}
  | {type: 'expense'; data: api.Expense}
  | {type: 'income'; data: api.Income};

type Props = {
  target: EditTarget | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function EditRecordModal({target, onClose, onSaved}: Props) {
  return (
    <Modal
      visible={!!target}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3">{target ? titleFor(target.type) : ''}</AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <X color={theme.colors.textSecondary} size={22} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}>
            {target ? (
              <EditBody
                key={`${target.type}-${target.data.id}`}
                target={target}
                onClose={onClose}
                onSaved={onSaved}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function titleFor(type: EditTarget['type']) {
  return {
    profile: 'Edit profile',
    zameen: 'Edit zameen',
    crop: 'Edit crop',
    expense: 'Edit expense',
    income: 'Edit income',
  }[type];
}

function EditBody({target, onClose, onSaved}: {target: EditTarget} & Omit<Props, 'target'>) {
  switch (target.type) {
    case 'profile':
      return <ProfileBody data={target.data} onClose={onClose} onSaved={onSaved} />;
    case 'zameen':
      return <ZameenBody data={target.data} onClose={onClose} onSaved={onSaved} />;
    case 'crop':
      return <CropBody data={target.data} onClose={onClose} onSaved={onSaved} />;
    case 'expense':
      return <ExpenseBody data={target.data} onClose={onClose} onSaved={onSaved} />;
    case 'income':
      return <IncomeBody data={target.data} onClose={onClose} onSaved={onSaved} />;
  }
}

function useSaver(onClose: () => void, onSaved: () => void | Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (fn: () => Promise<void>) => {
    setError(null);
    setSaving(true);
    try {
      await fn();
      haptics.success();
      await onSaved();
      onClose();
    } catch (e) {
      haptics.error();
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return {saving, error, save};
}

function Err({error}: {error: string | null}) {
  return error ? (
    <AppText variant="small" color={theme.colors.danger} style={styles.err}>
      {error}
    </AppText>
  ) : null;
}

function ProfileBody({data, onClose, onSaved}: {data: api.Profile} & Omit<Props, 'target'>) {
  const [profileName, setProfileName] = useState(data.profileName);
  const [city, setCity] = useState(data.city ?? '');
  const [chakAreaName, setChak] = useState(data.chakAreaName ?? '');
  const [villageName, setVillage] = useState(data.villageName ?? '');
  const {saving, error, save} = useSaver(onClose, onSaved);
  return (
    <View>
      <Input label="Profile name" value={profileName} onChangeText={setProfileName} />
      <Input label="City" value={city} onChangeText={setCity} containerStyle={styles.gap} />
      <Input label="Chak / area" value={chakAreaName} onChangeText={setChak} containerStyle={styles.gap} />
      <Input label="Village" value={villageName} onChangeText={setVillage} containerStyle={styles.gap} />
      <Err error={error} />
      <Button
        title="Save changes"
        loading={saving}
        disabled={profileName.trim().length < 2 || saving}
        style={styles.save}
        onPress={() =>
          save(async () => {
            await api.updateProfile(data.id, {
              profileName: profileName.trim(),
              city: city.trim() || undefined,
              chakAreaName: chakAreaName.trim() || undefined,
              villageName: villageName.trim() || undefined,
            });
          })
        }
      />
    </View>
  );
}

function ZameenBody({data, onClose, onSaved}: {data: api.Zameen} & Omit<Props, 'target'>) {
  const [zameenName, setName] = useState(data.zameenName);
  const [areaValue, setArea] = useState(String(data.totalAreaValue));
  const [areaUnit, setUnit] = useState(data.totalAreaUnit);
  const [ownershipType, setOwnership] = useState(data.ownershipType ?? ownershipTypes[0]);
  const {saving, error, save} = useSaver(onClose, onSaved);
  return (
    <View>
      <Input label="Zameen name" value={zameenName} onChangeText={setName} />
      <Input label="Area" keyboardType="numeric" value={areaValue} onChangeText={setArea} containerStyle={styles.gap} />
      <View style={styles.gap}>
        <ChipGroup label="Unit" options={areaUnits} value={areaUnit} onChange={setUnit} />
      </View>
      <View style={styles.gap}>
        <ChipGroup label="Ownership" options={ownershipTypes} value={ownershipType} onChange={setOwnership} />
      </View>
      <Err error={error} />
      <Button
        title="Save changes"
        loading={saving}
        disabled={zameenName.trim().length < 2 || Number(areaValue) <= 0 || saving}
        style={styles.save}
        onPress={() =>
          save(async () => {
            const value = Number(areaValue);
            await api.updateZameen(data.id, {
              zameenName: zameenName.trim(),
              totalAreaValue: value,
              totalAreaUnit: areaUnit,
              totalAreaSqft: toSquareFeet(value, areaUnit),
              ownershipType,
            });
          })
        }
      />
    </View>
  );
}

function CropBody({data, onClose, onSaved}: {data: api.Crop} & Omit<Props, 'target'>) {
  const [cropName, setName] = useState(data.cropName);
  const [areaValue, setArea] = useState(String(data.cropAreaValue));
  const [areaUnit, setUnit] = useState(data.cropAreaUnit);
  const [status, setStatus] = useState(data.status);
  const [startMonth, setMonth] = useState(data.startMonth ? String(data.startMonth) : '');
  const [startYear, setYear] = useState(data.startYear ? String(data.startYear) : '');
  const {saving, error, save} = useSaver(onClose, onSaved);
  const cropOptions = cropNames.includes(cropName as (typeof cropNames)[number])
    ? cropNames
    : ([cropName, ...cropNames] as readonly string[]);
  return (
    <View>
      <ChipGroup label="Crop" options={cropOptions} value={cropName} onChange={setName} />
      <Input label="Area" keyboardType="numeric" value={areaValue} onChangeText={setArea} containerStyle={styles.gap} />
      <View style={styles.gap}>
        <ChipGroup label="Unit" options={areaUnits} value={areaUnit} onChange={setUnit} />
      </View>
      <View style={styles.row}>
        <Input label="Start month" keyboardType="numeric" value={startMonth} onChangeText={setMonth} containerStyle={styles.half} />
        <Input label="Start year" keyboardType="numeric" value={startYear} onChangeText={setYear} containerStyle={styles.half} />
      </View>
      <View style={styles.gap}>
        <ChipGroup label="Status" options={cropStatuses} value={status} onChange={setStatus} />
      </View>
      <Err error={error} />
      <Button
        title="Save changes"
        loading={saving}
        disabled={Number(areaValue) <= 0 || saving}
        style={styles.save}
        onPress={() =>
          save(async () => {
            const value = Number(areaValue);
            await api.updateCrop(data.id, {
              cropName,
              cropAreaValue: value,
              cropAreaUnit: areaUnit,
              cropAreaSqft: toSquareFeet(value, areaUnit),
              status,
              startMonth: Number(startMonth) || undefined,
              startYear: Number(startYear) || undefined,
            });
          })
        }
      />
    </View>
  );
}

function ExpenseBody({data, onClose, onSaved}: {data: api.Expense} & Omit<Props, 'target'>) {
  const [category, setCategory] = useState(data.expenseCategory);
  const [description, setDescription] = useState(data.description);
  const [amount, setAmount] = useState(String(data.amount));
  const [date, setDate] = useState(formatDate(data.expenseDate));
  const [paymentStatus, setStatus] = useState(data.paymentStatus ?? expensePaymentStatuses[0]);
  const {saving, error, save} = useSaver(onClose, onSaved);
  const catOptions = expenseCategories.includes(category as (typeof expenseCategories)[number])
    ? expenseCategories
    : ([category, ...expenseCategories] as readonly string[]);
  return (
    <View>
      <ChipGroup label="Category" options={catOptions} value={category} onChange={setCategory} />
      <Input label="Description" value={description} onChangeText={setDescription} containerStyle={styles.gap} />
      <Input label="Amount (Rs)" keyboardType="numeric" value={amount} onChangeText={setAmount} containerStyle={styles.gap} />
      <Input label="Date (DD/MM/YYYY)" value={date} onChangeText={setDate} containerStyle={styles.gap} />
      <View style={styles.gap}>
        <ChipGroup label="Status" options={expensePaymentStatuses} value={paymentStatus} onChange={setStatus} />
      </View>
      <Err error={error} />
      <Button
        title="Save changes"
        loading={saving}
        disabled={description.trim().length === 0 || Number(amount) <= 0 || saving}
        style={styles.save}
        onPress={() =>
          save(async () => {
            const parsed = parseDisplayDate(date);
            await api.updateExpense(data.id, {
              expenseCategory: category,
              description: description.trim(),
              amount: Number(amount),
              expenseDate: parsed.isoDate,
              expenseMonth: parsed.month,
              expenseYear: parsed.year,
              paymentStatus,
            });
          })
        }
      />
    </View>
  );
}

function IncomeBody({data, onClose, onSaved}: {data: api.Income} & Omit<Props, 'target'>) {
  const [quantity, setQuantity] = useState(data.quantity != null ? String(data.quantity) : '');
  const [quantityUnit, setQUnit] = useState(data.quantityUnit ?? quantityUnits[0]);
  const [rate, setRate] = useState(data.rate != null ? String(data.rate) : '');
  const [totalAmount, setTotal] = useState(String(data.totalAmount));
  const [buyerName, setBuyer] = useState(data.buyerName ?? '');
  const [date, setDate] = useState(formatDate(data.incomeDate));
  const [paymentStatus, setStatus] = useState(data.paymentStatus ?? incomePaymentStatuses[0]);
  const {saving, error, save} = useSaver(onClose, onSaved);
  return (
    <View>
      <View style={styles.row}>
        <Input label="Quantity" keyboardType="numeric" value={quantity} onChangeText={setQuantity} containerStyle={styles.half} />
        <Input label="Rate" keyboardType="numeric" value={rate} onChangeText={setRate} containerStyle={styles.half} />
      </View>
      <View style={styles.gap}>
        <ChipGroup label="Quantity unit" options={quantityUnits} value={quantityUnit} onChange={setQUnit} />
      </View>
      <Input label="Total amount (Rs)" keyboardType="numeric" value={totalAmount} onChangeText={setTotal} containerStyle={styles.gap} />
      <Input label="Buyer" value={buyerName} onChangeText={setBuyer} containerStyle={styles.gap} />
      <Input label="Date (DD/MM/YYYY)" value={date} onChangeText={setDate} containerStyle={styles.gap} />
      <View style={styles.gap}>
        <ChipGroup label="Status" options={incomePaymentStatuses} value={paymentStatus} onChange={setStatus} />
      </View>
      <Err error={error} />
      <Button
        title="Save changes"
        loading={saving}
        disabled={Number(totalAmount) <= 0 || saving}
        style={styles.save}
        onPress={() =>
          save(async () => {
            const parsed = parseDisplayDate(date);
            await api.updateIncome(data.id, {
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
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end'},
  backdropTap: {flex: 1},
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '88%',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  body: {paddingBottom: theme.spacing.xxl},
  gap: {marginTop: theme.spacing.lg},
  row: {flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg},
  half: {flex: 1},
  err: {marginTop: theme.spacing.lg},
  save: {marginTop: theme.spacing.xl},
});
