import { router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useServiceStore } from '@/store/service.store';
import {
    useCarStore,
} from '../../store/car.store';

export default function CarsScreen() {
  const cars = useCarStore(
    (state) => state.cars,
    );

    const selectedCarId = useCarStore(
        (state) => state.selectedCarId,
    );

    const selectedCar = cars.find(
        (car) => car.id === selectedCarId,
    );

    const services = useServiceStore(
        (state) => state.services,
    );

    const carServices = services.filter(
    (service) =>
        service.vehicleId === selectedCarId,
    );
    
  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const handleSelectCar = (id: string) => {
    selectCar(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My cars</Text>

            <Text style={styles.subtitle}>
              Manage your vehicles
            </Text>
          </View>

          <Pressable
            style={styles.addSmallButton}
            onPress={() => {
              router.push('/car/new');
            }}
          >
            <Text style={styles.addSmallButtonText}>
              +
            </Text>
          </Pressable>
        </View>

        {cars.map((car) => {
          const isSelected =
            car.id === selectedCarId;

          return (
            <Pressable
              key={car.id}
              style={styles.carCard}
              onPress={() => {
                selectCar(car.id);

                router.push({
                  pathname: '/car/[id]',
                  params: {
                    id: car.id,
                  },
                });
              }}
            >
              <View style={styles.carIcon}>
                <Text style={styles.carEmoji}>
                  🚗
                </Text>
              </View>

              <View style={styles.carInfo}>
                <View style={styles.carTitleRow}>
                  <Text style={styles.carTitle}>
                    {car.make} {car.model}
                  </Text>

                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text
                        style={
                          styles.selectedBadgeText
                        }
                      >
                        Selected
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.carDetails}>
                  {car.year}
                  {car.engine
                    ? ` · ${car.engine}`
                    : ''}
                </Text>

                <Text style={styles.carMileage}>
                  {car.mileage.toLocaleString()} km
                </Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable
          style={styles.addCarButton}
          onPress={() => {
            router.push('/car/new');
          }}
        >
          <Text style={styles.addCarButtonText}>
            + Add another car
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#171717',
  },

  subtitle: {
    fontSize: 15,
    color: '#737373',
    marginTop: 5,
  },

  addSmallButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addSmallButtonText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#171717',
  },

  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  selectedCarCard: {
    borderColor: '#F5C400',
  },

  carIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  carEmoji: {
    fontSize: 28,
  },

  carInfo: {
    flex: 1,
    marginLeft: 14,
  },

  carTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  carTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },

  selectedBadge: {
    marginLeft: 8,
    backgroundColor: '#FFF4B8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A5E00',
  },

  carDetails: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },

  carMileage: {
    fontSize: 13,
    color: '#A3A3A3',
    marginTop: 5,
  },

  addCarButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  addCarButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
});
