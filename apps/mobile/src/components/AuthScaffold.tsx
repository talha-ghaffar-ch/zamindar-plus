import React, {useEffect} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {ArrowLeft, LogIn, UserPlus} from 'lucide-react-native';
import {fonts, theme} from '../theme';
import {AppText} from './AppText';

const authBg = require('../assets/auth-bg.jpg');

type Tabs = {
  active: 'login' | 'signup';
  onChange: (mode: 'login' | 'signup') => void;
};

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  tabs?: Tabs;
  onBack?: () => void;
  /** Smaller hero so long forms (signup) fit without scrolling. */
  compactHero?: boolean;
  children: React.ReactNode;
};

export function AuthScaffold({
  eyebrow = 'Secure access',
  title,
  subtitle,
  tabs,
  onBack,
  compactHero,
  children,
}: Props) {
  const enter = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, {duration: 720, easing: Easing.out(Easing.cubic)});
    breathe.value = withRepeat(
      withTiming(1, {duration: 4200, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, [enter, breathe]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      {translateY: (1 - enter.value) * 24 - breathe.value * 4},
      {scale: 0.92 + enter.value * 0.08 + breathe.value * 0.014},
    ],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    opacity: enter.value * (0.55 + breathe.value * 0.45),
    transform: [{scaleX: enter.value * (0.7 + breathe.value * 0.3)}],
  }));

  return (
    <View style={styles.root}>
      <Image source={authBg} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.scrimTop} pointerEvents="none" />
      <View style={styles.scrim} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never">
            <Animated.View
              style={[styles.hero, compactHero && styles.heroCompact, heroStyle]}>
              <AppText
                style={[styles.heroTitle, compactHero && styles.heroTitleCompact]}>
                Zamindar
              </AppText>
              <AppText
                style={[
                  styles.heroTitle,
                  styles.heroAccent,
                  compactHero && styles.heroTitleCompact,
                ]}>
                Plus
              </AppText>
              <Animated.View
                style={[
                  styles.heroLine,
                  compactHero && styles.heroLineCompact,
                  lineStyle,
                ]}
              />
            </Animated.View>

            <View style={styles.card}>
              <AppText
                variant="caption"
                color={theme.colors.primary}
                style={styles.eyebrow}>
                {eyebrow.toUpperCase()}
              </AppText>
              <AppText variant="h1" style={styles.title}>
                {title}
              </AppText>
              <AppText
                variant="body"
                color={theme.colors.textSecondary}
                style={styles.subtitle}>
                {subtitle}
              </AppText>

              {tabs ? (
                <View style={styles.segment}>
                  <SegButton
                    icon={
                      <LogIn
                        size={15}
                        color={
                          tabs.active === 'login'
                            ? theme.colors.primary
                            : theme.colors.textMuted
                        }
                      />
                    }
                    label="Sign in"
                    active={tabs.active === 'login'}
                    onPress={() => tabs.onChange('login')}
                  />
                  <SegButton
                    icon={
                      <UserPlus
                        size={15}
                        color={
                          tabs.active === 'signup'
                            ? theme.colors.primary
                            : theme.colors.textMuted
                        }
                      />
                    }
                    label="Create account"
                    active={tabs.active === 'signup'}
                    onPress={() => tabs.onChange('signup')}
                  />
                </View>
              ) : onBack ? (
                <Pressable onPress={onBack} hitSlop={8} style={styles.back}>
                  <ArrowLeft size={16} color={theme.colors.primary} />
                  <AppText variant="small" color={theme.colors.primary}>
                    Back to sign in
                  </AppText>
                </Pressable>
              ) : null}

              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SegButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.seg, active && styles.segActive]}>
      {icon}
      <AppText
        variant="small"
        color={active ? theme.colors.primary : theme.colors.textMuted}
        style={styles.segLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.palette.night},
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,18,14,0.34)',
  },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(5,16,13,0.28)',
  },
  safe: {flex: 1},
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  hero: {alignItems: 'center', marginBottom: theme.spacing.lg},
  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: 42,
    lineHeight: 42,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: {width: 0, height: 10},
    textShadowRadius: 26,
  },
  heroAccent: {color: '#FFF4CF'},
  heroLine: {
    marginTop: 10,
    width: 116,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#F1B457',
  },
  heroCompact: {marginBottom: theme.spacing.sm},
  heroTitleCompact: {fontSize: 30, lineHeight: 32},
  heroLineCompact: {marginTop: 7, width: 84, height: 2},
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: theme.spacing.lg,
    ...theme.shadow.floating,
  },
  eyebrow: {marginBottom: 6},
  title: {marginBottom: 5},
  subtitle: {marginBottom: theme.spacing.md},
  segment: {
    flexDirection: 'row',
    gap: 5,
    padding: 5,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(238,246,243,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(100,121,114,0.18)',
    marginBottom: theme.spacing.md,
  },
  seg: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  segActive: {
    backgroundColor: '#FFFFFF',
    ...theme.shadow.soft,
  },
  segLabel: {fontFamily: fonts.extrabold},
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
});
