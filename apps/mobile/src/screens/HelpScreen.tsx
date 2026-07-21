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
import {useI18n} from '../i18n/useT';
import {theme} from '../theme';

type Tip = {
  icon: React.ReactNode;
  title: string;
  body: string;
  tint: string;
};

export function HelpScreen() {
  const {t} = useI18n();
  const TIPS: Tip[] = [
    {
      icon: <Sprout color={theme.colors.primary} size={20} />,
      tint: theme.palette.greenSoft,
      title: t('mobile.gettingStarted'),
      body: t('mobile.gettingStartedBody'),
    },
    {
      icon: <BarChart3 color={theme.colors.profit} size={20} />,
      tint: theme.palette.cyanSoft,
      title: t('mobile.yourDashboard'),
      body: t('mobile.dashboardBody'),
    },
    {
      icon: <Layers color={theme.colors.primary} size={20} />,
      tint: theme.palette.greenSoft,
      title: t('mobile.recordsLedgers'),
      body: t('mobile.recordsLedgersBody'),
    },
    {
      icon: <Plus color={theme.colors.income} size={20} />,
      tint: theme.palette.greenSoft,
      title: t('mobile.addingRecords'),
      body: t('mobile.addingRecordsBody'),
    },
    {
      icon: <ListChecks color={theme.colors.land} size={20} />,
      tint: theme.palette.amberSoft,
      title: t('mobile.reports'),
      body: t('mobile.reportsBody'),
    },
    {
      icon: <Sparkles color={theme.colors.accent} size={20} />,
      tint: theme.palette.amberSoft,
      title: t('dashboard.aiName'),
      body: t('mobile.assistantBody'),
    },
  ];

  const navigation = useNavigation();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DetailHeader title={t('mobile.helpTips')} onBack={() => navigation.goBack()} />
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
