
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    ReminderCard,
    useReminders,
    type CustomReminder,
} from '../../../entities/reminder';

import { useDeleteReminderAction } from '../../../features/delete-reminder';

const C = {
  navy: '#102647',
  blue: '#41668B',
  sky: '#EAF6FF',
  yellow: '#FFD33F',
  white: '#FFFFFF',
  border: '#E3EDF5',
  muted: '#8296AA',
};

const backgroundImage = require(
  '../../../../assets/images/lovablecar-main-background.png'
);

export default function RemindersPage() {
  const { t } = useTranslation();

  const {
    data: reminders = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useReminders();

  const { remove } = useDeleteReminderAction();

  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  const { upcoming, history } = useMemo(() => {
    const future: CustomReminder[] = [];
    const past: CustomReminder[] = [];

    for (const reminder of reminders) {
      if (
        reminder.status === 'PENDING' ||
        reminder.status === 'SENDING'
      ) {
        future.push(reminder);
      } else {
        past.push(reminder);
      }
    }

    future.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime(),
    );

    past.sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() -
        new Date(a.scheduledAt).getTime(),
    );

    return { upcoming: future, history: past };
  }, [reminders]);

  const completedCount = history.filter(
    (item) => item.status === 'SENT',
  ).length;

  function openCreate() {
    router.push('/reminder/new');
  }

  function openEdit(id: string) {
    router.push({
      pathname: '/reminder/[id]',
      params: { id },
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      await remove(id);
    } catch (error) {
      Alert.alert(
        t('reminders.deleteError'),
        error instanceof Error
          ? error.message
          : t('reminders.tryAgain'),
      );
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(reminder: CustomReminder) {
    Alert.alert(
      t('reminders.deleteTitle'),
      t('reminders.deleteDescription'),
      [
        {
          text: t('reminders.cancel'),
          style: 'cancel',
        },
        {
          text: t('reminders.delete'),
          style: 'destructive',
          onPress: () => {
            void handleDelete(reminder.id);
          },
        },
      ],
    );
  }

  function renderReminder(reminder: CustomReminder) {
    return (
      <ReminderCard
        key={reminder.id}
        reminder={reminder}
        onEdit={() => openEdit(reminder.id)}
        onDelete={() => confirmDelete(reminder)}
        deleting={deletingId === reminder.id}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={C.blue}
          />
        }
      >
        <ImageBackground
          source={backgroundImage}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroTop}>
            <View style={styles.heroHeading}>
              <Text style={styles.heroEyebrow}>
                LOVABLECAR
              </Text>

              <Text style={styles.heroTitle}>
                {t('reminders.title')}
              </Text>
            </View>

            <Pressable
              style={styles.addIconButton}
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel={t('reminders.add')}
            >
              <Ionicons
                name="add"
                size={26}
                color={C.white}
              />
            </Pressable>
          </View>

          <Text style={styles.heroSubtitle}>
            {t('reminders.subtitle')}
          </Text>

          <View style={styles.heroSummary}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={19}
                  color={C.navy}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {upcoming.length}
              </Text>

              <Text style={styles.summaryLabel}>
                {t('reminders.upcoming')}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color={C.navy}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {completedCount}
              </Text>

              <Text style={styles.summaryLabel}>
                {t('reminders.completed')}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <Pressable
          style={styles.addButton}
          onPress={openCreate}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={C.navy}
          />

          <Text style={styles.addButtonText}>
            {t('reminders.add')}
          </Text>
        </Pressable>

        <View style={styles.sections}>
          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator
                size="large"
                color={C.blue}
              />

              <Text style={styles.stateDescription}>
                {t('reminders.loading')}
              </Text>
            </View>
          ) : isError ? (
            <View style={styles.stateCard}>
              <Ionicons
                name="cloud-offline-outline"
                size={42}
                color={C.blue}
              />

              <Text style={styles.stateTitle}>
                {t('reminders.loadError')}
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={() => void refetch()}
              >
                <Text style={styles.retryText}>
                  {t('reminders.tryAgain')}
                </Text>
              </Pressable>
            </View>
          ) : reminders.length === 0 ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={36}
                  color={C.blue}
                />
              </View>

              <Text style={styles.stateTitle}>
                {t('reminders.emptyTitle')}
              </Text>

              <Text style={styles.stateDescription}>
                {t('reminders.emptyDescription')}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t('reminders.upcomingTitle')}
                </Text>

                <Text style={styles.sectionCount}>
                  {upcoming.length}
                </Text>
              </View>

              {upcoming.length > 0 ? (
                upcoming.map(renderReminder)
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>
                    {t('reminders.noUpcoming')}
                  </Text>
                </View>
              )}

              {history.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {t('reminders.history')}
                    </Text>

                    <Text style={styles.sectionCount}>
                      {history.length}
                    </Text>
                  </View>

                  {history.map(renderReminder)}
                </>
              )}
            </>
          )}

          <View style={styles.telegramInfo}>
            <View style={styles.telegramIcon}>
              <Ionicons
                name="paper-plane"
                size={20}
                color="#229ED9"
              />
            </View>

            <View style={styles.telegramContent}>
              <Text style={styles.telegramTitle}>
                {t('reminders.telegramTitle')}
              </Text>

              <Text style={styles.telegramText}>
                {t('reminders.telegramDescription')}
              </Text>
            </View>

            <Ionicons
              name="information-circle-outline"
              size={21}
              color={C.blue}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.white,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 115,
  },
  hero: {
    minHeight: 295,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroImage: {
    opacity: 0.65,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroHeading: {
    flex: 1,
    paddingRight: 12,
  },
  heroEyebrow: {
    color: C.blue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 5,
  },
  heroTitle: {
    color: C.navy,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    color: C.blue,
    fontSize: 13,
    lineHeight: 21,
    maxWidth: 280,
    marginTop: 12,
    marginBottom: 23,
  },
  addIconButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSummary: {
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 20,
    flexDirection: 'row',
    paddingVertical: 17,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    backgroundColor: '#EAF6FF',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryNumber: {
    color: C.navy,
    fontSize: 21,
    fontWeight: '900',
  },
  summaryLabel: {
    color: C.blue,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 9,
  },
  addButton: {
    backgroundColor: C.yellow,
    minHeight: 54,
    marginHorizontal: 16,
    marginTop: 17,
    marginBottom: 24,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButtonText: {
    color: C.navy,
    fontSize: 15,
    fontWeight: '800',
  },
  sections: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.navy,
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
    marginRight: 12,
  },
  sectionCount: {
    color: C.blue,
    fontSize: 13,
    fontWeight: '700',
  },
  stateCard: {
    backgroundColor: '#F7FBFF',
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    color: C.navy,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateDescription: {
    color: C.blue,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: C.navy,
    borderRadius: 13,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: {
    color: C.white,
    fontWeight: '700',
  },
  emptySection: {
    padding: 22,
    backgroundColor: '#F7FBFF',
    borderRadius: 18,
    marginBottom: 24,
  },
  emptySectionText: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 13,
  },
  telegramInfo: {
    backgroundColor: '#EAF6FF',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  telegramIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telegramContent: {
    flex: 1,
  },
  telegramTitle: {
    color: C.navy,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  telegramText: {
    color: C.blue,
    fontSize: 11,
    lineHeight: 17,
  },
});
