import { COLORS, styles } from '@/pages/car/ui/[id].styles';
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
    Text,
    View,
} from 'react-native';

import { api } from '@/../lib/api';
import type { ApiMaintenanceSchedule } from '@/../lib/maintenance.api';
import { useCarMaintenanceSchedules } from '@/../lib/maintenance.queries';
import { useCar, useDeleteCar } from '@/features/cars/model/useCars';
import { calculateMaintenanceStatus } from '@/features/maintenance/lib/maintenance-status';
import { useCarStore } from '@/entities/car/model/car.store';

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
          source={require('../../../../assets/images/cars-hero.png')}
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



const shadow: ViewStyle = {
  shadowColor: '#23486E',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 2,
};
