import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  BarChart3,
  Layers,
  ListChecks,
  Plus,
  Sparkles,
  Sprout,
} from 'lucide-react-native';
import {Screen} from '../components/Screen';
import {AppText} from '../components/AppText';
import {Card} from '../components/Card';
import {DetailHeader} from '../components/DetailHeader';
import {theme} from '../theme';

const TIPS: {icon: React.ReactNode; title: string; body: string; tint: string}[] = [
  {
    icon: <Sprout color={theme.colors.primary} size={20} />,
    tint: theme.palette.greenSoft,
    title: 'Getting started',
    body: 'Add a farm Profile first, then a Zameen (land) under it, then a Crop. Once you have a crop you can log Expenses and Income against it.',
  },
  {
    icon: <BarChart3 color={theme.colors.profit} size={20} />,
    tint: theme.palette.cyanSoft,
    title: 'Your dashboard',
    body: 'The Home tab shows your net-profit pulse, the profit-margin ring, and six live metric cards. Use the Quick actions to jump straight to adding records.',
  },
  {
    icon: <Layers color={theme.colors.primary} size={20} />,
    tint: theme.palette.greenSoft,
    title: 'Records & ledgers',
    body: 'Records lets you drill from a profile into its zameen, crops, and each crop’s ledger. Open All Expenses / All Income for a month-by-month view. Tap a header to edit, long-press a ledger row to delete.',
  },
  {
    icon: <Plus color={theme.colors.income} size={20} />,
    tint: theme.palette.greenSoft,
    title: 'Adding records',
    body: 'The Add tab has all five record types — Profile, Zameen, Crop, Expense, Income — with the same fields as the website (area units, categories, dates).',
  },
  {
    icon: <ListChecks color={theme.colors.land} size={20} />,
    tint: theme.palette.amberSoft,
    title: 'Reports',
    body: 'Reports shows income vs expense totals, a monthly trend chart, and profit per crop so you can see which crops earn the most.',
  },
  {
    icon: <Sparkles color={theme.colors.accent} size={20} />,
    tint: theme.palette.amberSoft,
    title: 'Zamindar AI',
    body: 'Ask the Assistant anything about your crops, costs, and profit in plain language — it understands your farm ledger.',
  },
];

export function HelpScreen() {
  const navigation = useNavigation();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DetailHeader title="Help & tips" onBack={() => navigation.goBack()} />
        <AppText variant="body" color={theme.colors.textSecondary} style={styles.intro}>
          A quick guide to getting the most out of Zamindar Plus.
        </AppText>

        {TIPS.map(tip => (
          <Card key={tip.title} elevated style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, {backgroundColor: tip.tint}]}>
                {tip.icon}
              </View>
              <View style={styles.textWrap}>
                <AppText variant="h3">{tip.title}</AppText>
                <AppText
                  variant="small"
                  color={theme.colors.textSecondary}
                  style={styles.body}>
                  {tip.body}
                </AppText>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  intro: {marginBottom: theme.spacing.lg},
  card: {marginBottom: theme.spacing.md},
  row: {flexDirection: 'row', gap: theme.spacing.md},
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {flex: 1},
  body: {marginTop: 4, lineHeight: 19},
});
