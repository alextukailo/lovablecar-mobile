import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ViewStyle } from 'react-native';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import type { ApiMaintenanceSchedule } from '../../../lib/maintenance.api';
import { useCarMaintenanceSchedules } from '../../../lib/maintenance.queries';
import { useCar, useDeleteCar } from '../../features/cars/hooks/useCars';
import { calculateMaintenanceStatus } from '../../features/maintenance/utils/maintenance-status';
import { useCarStore } from '../../store/car.store';

interface ApiService {
  id: string;
  date: string;
  mileage: number;
  title: string;
  cost?: string | number | null;
  currency?: string | null;
  workshop?: string | null;
}

async function fetchCarServices(carId: string): Promise<ApiService[]> {
  const response = await api.get<ApiService[]>(`/cars/${carId}/services`);
  return response.data;
}

const maintenanceLabels: Record<string, string> = {
  ENGINE_OIL: 'Engine oil + filter',
  TRANSMISSION_OIL: 'Transmission oil',
  BRAKE_FLUID: 'Brake fluid',
  HALDEX_OIL: 'Haldex oil',
};

function maintenanceName(schedule: ApiMaintenanceSchedule): string {
  if (schedule.type === 'CUSTOM') {
    return schedule.customTitle || 'Custom maintenance';
  }
  return maintenanceLabels[schedule.type] || schedule.type.replace(/_/g, ' ');
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString();
}

function formatCost(cost?: string | number | null): string {
  const numericCost = Number(cost ?? 0);
  return Number.isFinite(numericCost)
    ? numericCost.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';
}

function maintenanceInterval(schedule: ApiMaintenanceSchedule): string {
  const parts: string[] = [];
  if (schedule.intervalKm !== null) {
    parts.push(`${schedule.intervalKm.toLocaleString()} km`);
  }
  if (schedule.intervalMonths !== null) {
    parts.push(`${schedule.intervalMonths} months`);
  }
  return parts.length > 0 ? parts.join(' / ') : 'Not configured';
}

export default function CarDetailsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const carId = Array.isArray(params.id) ? params.id[0] : params.id;

  const selectCar = useCarStore((state) => state.selectCar);
  const selectedCarId = useCarStore((state) => state.selectedCarId);
  const clearSelectedCar = useCarStore((state) => state.clearSelectedCar);

  const {
    data: car,
    isLoading: isLoadingCar,
    isError: isCarError,
    refetch: refetchCar,
  } = useCar(carId);

  const {
    data: services = [],
    isLoading: isLoadingServices,
    isError: isServicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['cars', carId, 'services'],
    queryFn: () => fetchCarServices(carId!),
    enabled: Boolean(carId) && Boolean(car),
  });

  const {
    data: maintenanceSchedules = [],
    isLoading: isLoadingMaintenance,
    isError: isMaintenanceError,
    refetch: refetchMaintenance,
  } = useCarMaintenanceSchedules(car?.id);

  const deleteCar = useDeleteCar();
  const [showVehicleInfo, setShowVehicleInfo] = useState(false);

  useEffect(() => {
    if (car && selectedCarId !== car.id) {
      selectCar(car.id);
    }
  }, [car?.id, selectedCarId, selectCar]);

  const sortedServices = useMemo(
    () =>
      [...services].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [services],
  );

  const totalsByCurrency = useMemo(
    () =>
      sortedServices.reduce<Record<string, number>>((totals, service) => {
        const currency = service.currency || 'Unknown';
        const cost = Number(service.cost ?? 0);
        if (Number.isFinite(cost)) {
          totals[currency] = (totals[currency] ?? 0) + cost;
        }
        return totals;
      }, {}),
    [sortedServices],
  );

  const maintenanceCounts = useMemo(() => {
    const counts = { overdue: 0, dueSoon: 0, upcoming: 0 };
    if (!car) return counts;

    for (const schedule of maintenanceSchedules) {
      const status = calculateMaintenanceStatus(
        schedule,
        car.mileage,
      ).status;
      if (status === 'OVERDUE') counts.overdue += 1;
      else if (status === 'DUE_SOON') counts.dueSoon += 1;
      else if (status === 'UPCOMING') counts.upcoming += 1;
    }
    return counts;
  }, [maintenanceSchedules, car?.mileage]);

  const latestService = sortedServices[0];

  const handleDelete = () => {
    if (!car || deleteCar.isPending) return;

    Alert.alert(
      'Delete car?',
      `Delete ${car.make} ${car.model} and its service records? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCar.mutateAsync(car.id);
              if (selectedCarId === car.id) clearSelectedCar();
              router.replace('/(tabs)/cars');
            } catch (error) {
              console.error('Failed to delete car:', error);
              Alert.alert(
                'Unable to delete car',
                'The car was not deleted. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const openService = (serviceId: string) => {
    if (!car) return;
    router.push({
      pathname: '/service/[id]',
      params: { id: serviceId, vehicleId: car.id },
    });
  };

  const openNewService = () => {
    if (!car) return;
    router.push({
      pathname: '/service/new',
      params: { vehicleId: car.id },
    });
  };

  const openMaintenance = (schedule: ApiMaintenanceSchedule) => {
    if (!car) return;

    if (schedule.sourceServiceRecordId) {
      router.push({
        pathname: '/service/edit',
        params: {
          id: schedule.sourceServiceRecordId,
          carId: car.id,
        },
      });
      return;
    }

    router.push({
      pathname: '/maintenance/[id]',
      params: { id: schedule.id, carId: car.id },
    });
  };

    if (isLoadingCar) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#246BFD" />
        <Text style={styles.emptyDescription}>
          Loading car details...
        </Text>
      </View>
    );
  }

  if (isCarError) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Unable to load car</Text>
        <Text style={styles.emptyDescription}>
          Please check your connection and try again.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => void refetchCar()}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Car not found</Text>
        <Text style={styles.emptyDescription}>
          This car may have been deleted or is no longer available.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/cars')}
        >
          <Text style={styles.primaryButtonText}>Back to cars</Text>
        </Pressable>
      </View>
    );
  }

  const moneySummary = Object.entries(totalsByCurrency)
    .map(([currency, amount]) => `${formatCost(amount)} ${currency}`)
    .join(' · ');

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={10}>
            <Ionicons name="arrow-back" size={21} color={COLORS.navy} />
          </Pressable>
          <Text style={styles.topbarTitle}>My vehicle</Text>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push({ pathname: '/car/edit', params: { id: car.id } })}
          >
            <Ionicons name="create-outline" size={21} color={COLORS.navy} />
          </Pressable>
        </View>

        <ImageBackground
          source={require('../../../assets/images/cars-hero.png')}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTag}>
              <Ionicons name="car-sport" size={13} color={COLORS.navy} />
              <Text style={styles.heroTagText}>{car.isPrimary ? 'PRIMARY VEHICLE' : 'MY VEHICLE'}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{car.make} {car.model}</Text>
          <Text style={styles.heroSubtitle}>{car.year}{car.engine ? `  ·  ${car.engine}` : ''}</Text>
          <View style={styles.heroSpacer} />
          <View style={styles.mileagePill}>
            <Ionicons name="speedometer-outline" size={20} color={COLORS.navy} />
            <View>
              <Text style={styles.mileageCaption}>CURRENT MILEAGE</Text>
              <Text style={styles.mileageText}>{car.mileage.toLocaleString()} <Text style={styles.mileageUnit}>km</Text></Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Ionicons name="construct-outline" size={21} color={COLORS.blue} />
            <Text style={styles.quickStatValue}>{sortedServices.length}</Text>
            <Text style={styles.quickStatLabel}>Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Ionicons name="calendar-outline" size={21} color={COLORS.blue} />
            <Text style={styles.quickStatValue}>{maintenanceSchedules.length}</Text>
            <Text style={styles.quickStatLabel}>Reminders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Ionicons name="alert-circle-outline" size={21} color={maintenanceCounts.overdue ? COLORS.red : COLORS.blue} />
            <Text style={[styles.quickStatValue, maintenanceCounts.overdue > 0 && { color: COLORS.red }]}>{maintenanceCounts.overdue}</Text>
            <Text style={styles.quickStatLabel}>Overdue</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>STAY ON TRACK</Text>
            <Text style={styles.sectionTitle}>Maintenance</Text>
          </View>
          <View style={styles.sectionIcon}><Ionicons name="notifications-outline" size={20} color={COLORS.navy} /></View>
        </View>

        {maintenanceSchedules.length > 0 && !isLoadingMaintenance && !isMaintenanceError && (
          <View style={styles.statusSummary}>
            <StatusCount value={maintenanceCounts.overdue} label="Overdue" color={COLORS.red} />
            <StatusCount value={maintenanceCounts.dueSoon} label="Due soon" color={COLORS.orange} />
            <StatusCount value={maintenanceCounts.upcoming} label="Upcoming" color={COLORS.green} />
          </View>
        )}

        {isLoadingMaintenance ? (
          <View style={styles.emptyCard}><ActivityIndicator color={COLORS.blue} /></View>
        ) : isMaintenanceError ? (
          <Pressable style={styles.emptyCard} onPress={() => void refetchMaintenance()}>
            <Text style={styles.emptyText}>Unable to load reminders. Tap to retry.</Text>
          </Pressable>
        ) : maintenanceSchedules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={28} color={COLORS.blue} />
            <Text style={styles.emptyTitle}>No maintenance reminders yet</Text>
            <Text style={styles.emptyText}>Add a service and schedule its next maintenance.</Text>
            <Pressable style={styles.inlineAction} onPress={openNewService}><Text style={styles.inlineActionText}>Add a service  →</Text></Pressable>
          </View>
        ) : (
          maintenanceSchedules.map((schedule) => {
            const result = calculateMaintenanceStatus(schedule, car.mileage);
            const tone = result.status === 'OVERDUE' ? COLORS.red : result.status === 'DUE_SOON' ? COLORS.orange : result.status === 'UPCOMING' ? COLORS.green : COLORS.muted;
            const tint = result.status === 'OVERDUE' ? '#FFF0EF' : result.status === 'DUE_SOON' ? '#FFF6E5' : result.status === 'UPCOMING' ? '#EAF8F0' : '#F1F4F7';
            return (
              <Pressable key={schedule.id} style={styles.scheduleCard} onPress={() => openMaintenance(schedule)}>
                <View style={styles.scheduleTop}>
                  <View style={styles.scheduleIcon}><Ionicons name="build-outline" size={20} color={COLORS.blue} /></View>
                  <View style={styles.scheduleMain}>
                    <Text style={styles.scheduleName} numberOfLines={2}>{maintenanceName(schedule)}</Text>
                    <Text style={styles.scheduleInterval}>Every {maintenanceInterval(schedule)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                </View>
                <View style={styles.scheduleBottom}>
                  <View style={[styles.statusPill, { backgroundColor: tint }]}>
                    <View style={[styles.statusDot, { backgroundColor: tone }]} />
                    <Text style={[styles.statusPillText, { color: tone }]}>{result.label}</Text>
                  </View>
                  <Text style={styles.nextDue} numberOfLines={1}>
                    {schedule.enabled
                      ? schedule.nextDueMileage != null
                        ? `${schedule.nextDueMileage.toLocaleString()} km`
                        : schedule.nextDueDate ? formatDate(schedule.nextDueDate) : 'No due date'
                      : 'Paused'}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR RECORDS</Text>
            <Text style={styles.sectionTitle}>Service history</Text>
          </View>
          <Pressable style={styles.smallAdd} onPress={openNewService}>
            <Ionicons name="add" size={18} color={COLORS.navy} />
            <Text style={styles.smallAddText}>Add</Text>
          </Pressable>
        </View>

        {moneySummary ? (
          <View style={styles.spendingCard}>
            <View style={styles.spendingIcon}><Ionicons name="wallet-outline" size={22} color={COLORS.navy} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.spendingCaption}>TOTAL SERVICE SPENDING</Text>
              <Text style={styles.spendingAmount} numberOfLines={2}>{moneySummary}</Text>
            </View>
          </View>
        ) : null}

        {isLoadingServices ? (
          <View style={styles.emptyCard}><ActivityIndicator color={COLORS.blue} /></View>
        ) : isServicesError ? (
          <Pressable style={styles.emptyCard} onPress={() => void refetchServices()}>
            <Text style={styles.emptyText}>Unable to load services. Tap to retry.</Text>
          </Pressable>
        ) : sortedServices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Your service timeline starts here</Text>
            <Text style={styles.emptyText}>Keep every repair and maintenance record in one place.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {sortedServices.map((service, index) => (
              <View key={service.id} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                  {index !== sortedServices.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <Pressable style={styles.historyCard} onPress={() => openService(service.id)}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyDate}>{formatDate(service.date)}</Text>
                    <Ionicons name="chevron-forward" size={17} color={COLORS.muted} />
                  </View>
                  <Text style={styles.historyTitle}>{service.title}</Text>
                  {service.workshop ? <Text style={styles.historyWorkshop} numberOfLines={1}>{service.workshop}</Text> : null}
                  <View style={styles.historyFooter}>
                    <View style={styles.historyMileage}><Ionicons name="speedometer-outline" size={15} color={COLORS.blue} /><Text style={styles.historyMileageText}>{service.mileage.toLocaleString()} km</Text></View>
                    {service.cost != null ? <Text style={styles.historyCost}>{formatCost(service.cost)} {service.currency ?? ''}</Text> : null}
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>ABOUT THIS CAR</Text>
            <Text style={styles.sectionTitle}>Vehicle details</Text>
          </View>
        </View>
        <View style={styles.detailsCard}>
          <Pressable style={styles.detailsToggle} onPress={() => setShowVehicleInfo((prev) => !prev)}>
            <View style={styles.detailsToggleLeft}>
              <Ionicons name="document-text-outline" size={21} color={COLORS.blue} />
              <Text style={styles.detailsToggleText}>Specifications & registration</Text>
            </View>
            <Ionicons name={showVehicleInfo ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.muted} />
          </Pressable>
          {showVehicleInfo && (
            <View style={styles.detailsBody}>
              <InfoRow label="Make" value={car.make} />
              <InfoRow label="Model" value={car.model} />
              <InfoRow label="Year" value={String(car.year)} />
              <InfoRow label="Engine" value={car.engine || 'Not specified'} />
              <InfoRow label="VIN" value={car.vin || 'Not specified'} />
              <InfoRow label="License plate" value={car.licensePlate || 'Not specified'} isLast />
            </View>
          )}
        </View>

        <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={deleteCar.isPending}>
          <Ionicons name="trash-outline" size={17} color={COLORS.red} />
          <Text style={styles.deleteText}>{deleteCar.isPending ? 'Deleting...' : 'Delete vehicle'}</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.bottomBar}>
        <Pressable style={styles.addServiceButton} onPress={openNewService}>
          <Ionicons name="add-circle-outline" size={22} color={COLORS.navy} />
          <Text style={styles.addServiceText}>Add service record</Text>
          <Ionicons name="arrow-forward" size={19} color={COLORS.navy} />
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} selectable>{value}</Text>
    </View>
  );
}

function StatusCount({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statusCount}>
      <Text style={[styles.statusCountValue, { color }]}>{value}</Text>
      <Text style={styles.statusCountLabel}>{label}</Text>
    </View>
  );
}

const COLORS = {
  navy: '#102647',
  blue: '#41668B',
  sky: '#EAF6FF',
  white: '#FFFFFF',
  yellow: '#FFD33F',
  muted: '#8191A5',
  red: '#CE4650',
  orange: '#C58B26',
  green: '#26966E',
};

const shadow: ViewStyle = {
  shadowColor: '#23486E',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.sky },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 38 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  iconButton: { width: 42, height: 42, backgroundColor: COLORS.white, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 17, fontWeight: '800', color: COLORS.navy },
  hero: { minHeight: 270, borderRadius: 25, padding: 21, overflow: 'hidden', backgroundColor: '#BDE5FB', ...shadow },
  heroImage: { borderRadius: 25 },
  heroTop: { flexDirection: 'row', marginBottom: 13 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.yellow, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  heroTagText: { fontSize: 10, fontWeight: '900', color: COLORS.navy, letterSpacing: 0.7 },
  heroTitle: { color: COLORS.navy, fontSize: 28, fontWeight: '900' },
  heroSubtitle: { color: '#355A7C', fontSize: 14, fontWeight: '600', marginTop: 5 },
  heroSpacer: { flex: 1, minHeight: 60 },
  mileagePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: 'rgba(255,255,255,0.87)', borderRadius: 14 },
  mileageCaption: { fontSize: 9, fontWeight: '900', letterSpacing: 1, color: COLORS.blue },
  mileageText: { color: COLORS.navy, fontSize: 20, fontWeight: '900', marginTop: 2 },
  mileageUnit: { fontSize: 13, fontWeight: '700' },
  quickStats: { backgroundColor: COLORS.white, borderRadius: 20, marginTop: 13, marginBottom: 27, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', ...shadow },
  quickStat: { flex: 1, alignItems: 'center', gap: 5 },
  quickStatValue: { fontSize: 22, fontWeight: '900', color: COLORS.navy },
  quickStatLabel: { fontSize: 11, fontWeight: '600', color: COLORS.muted },
  statDivider: { width: 1, height: 44, backgroundColor: '#E8EDF2' },
  sectionHeading: { marginTop: 4, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { color: COLORS.blue, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  sectionTitle: { color: COLORS.navy, fontSize: 22, fontWeight: '900' },
  sectionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#D8ECFC', alignItems: 'center', justifyContent: 'center' },
  statusSummary: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statusCount: { flex: 1, alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 12, borderRadius: 14 },
  statusCountValue: { fontSize: 22, fontWeight: '900' },
  statusCountLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '600', marginTop: 3 },
  scheduleCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 15, marginBottom: 10, ...shadow },
  scheduleTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  scheduleIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EDF5FC', alignItems: 'center', justifyContent: 'center' },
  scheduleMain: { flex: 1 },
  scheduleName: { color: COLORS.navy, fontSize: 15, fontWeight: '800' },
  scheduleInterval: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  scheduleBottom: { borderTopWidth: 1, borderTopColor: '#EDF1F5', marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 9, borderRadius: 9, gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  nextDue: { color: COLORS.blue, fontSize: 12, fontWeight: '800', flexShrink: 1 },
  smallAdd: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.yellow, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 11 },
  smallAddText: { fontWeight: '800', fontSize: 13, color: COLORS.navy },
  spendingCard: { backgroundColor: COLORS.navy, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 },
  spendingIcon: { backgroundColor: COLORS.yellow, borderRadius: 12, padding: 11 },
  spendingCaption: { fontSize: 10, color: '#B8CCE1', fontWeight: '800', letterSpacing: 1 },
  spendingAmount: { fontSize: 19, color: COLORS.white, fontWeight: '900', marginTop: 4 },
  timeline: { marginBottom: 24 },
  timelineRow: { flexDirection: 'row', gap: 10 },
  timelineRail: { width: 17, alignItems: 'center', paddingTop: 22 },
  timelineDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#A9C6DB', borderWidth: 2, borderColor: COLORS.sky },
  timelineDotActive: { backgroundColor: COLORS.yellow, borderColor: COLORS.navy },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#C6DDEC', marginTop: 5, marginBottom: -10 },
  historyCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 17, padding: 15, marginBottom: 11, ...shadow },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { color: COLORS.blue, fontSize: 11, fontWeight: '800' },
  historyTitle: { color: COLORS.navy, fontSize: 16, fontWeight: '900', marginTop: 8 },
  historyWorkshop: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  historyFooter: { borderTopWidth: 1, borderTopColor: '#EDF1F5', paddingTop: 11, marginTop: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  historyMileage: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  historyMileageText: { color: COLORS.blue, fontSize: 12, fontWeight: '700' },
  historyCost: { color: COLORS.navy, fontSize: 13, fontWeight: '900', flexShrink: 1 },
  detailsCard: { backgroundColor: COLORS.white, borderRadius: 17, marginBottom: 15, overflow: 'hidden', ...shadow },
  detailsToggle: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  detailsToggleText: { color: COLORS.navy, fontWeight: '800', fontSize: 14 },
  detailsBody: { paddingHorizontal: 16, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#EDF1F5' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, gap: 12, borderBottomWidth: 1, borderBottomColor: '#EDF1F5' },
  infoLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  infoValue: { color: COLORS.navy, fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1.5 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, marginTop: 5 },
  deleteText: { color: COLORS.red, fontWeight: '700', fontSize: 13 },
  bottomBar: { backgroundColor: COLORS.sky, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#D8E9F5' },
  addServiceButton: { backgroundColor: COLORS.yellow, minHeight: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 15 },
  addServiceText: { color: COLORS.navy, fontWeight: '900', fontSize: 15, flex: 1, textAlign: 'center' },
  emptyCard: { backgroundColor: COLORS.white, padding: 20, borderRadius: 18, marginBottom: 20, alignItems: 'center', gap: 9 },
  emptyTitle: { color: COLORS.navy, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  inlineAction: { padding: 9 },
  inlineActionText: { color: COLORS.blue, fontWeight: '800', fontSize: 13 },
  emptyContainer: { flex: 1, backgroundColor: COLORS.sky, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyDescription: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginVertical: 8, textAlign: 'center' },
  emptyTitleLegacy: { color: COLORS.navy, fontSize: 22, fontWeight: '800' },
  primaryButton: { backgroundColor: COLORS.yellow, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryButtonText: { color: COLORS.navy, fontWeight: '800', fontSize: 14 },
});
