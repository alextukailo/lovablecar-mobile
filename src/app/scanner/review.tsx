import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useCarStore } from '../../store/car.store';
import { useServiceStore } from '../../store/service.store';


export default function ReviewScreen() {
  const params = useLocalSearchParams<{
    uri: string;
    date: string;
    mileage: string;
    serviceName: string;
    totalCost: string;
    currency: string;
    workshop?: string;
  }>();

  const [date, setDate] = useState(params.date || '');
  const [mileage, setMileage] = useState(params.mileage || '');
  const [serviceName, setServiceName] = useState(
    params.serviceName || '',
  );
  const [totalCost, setTotalCost] = useState(
    params.totalCost || '',
  );
  const [workshop, setWorkshop] = useState(
    params.workshop || '',
  );

  const addService = useServiceStore(
  (state) => state.addService,
);

  const handleConfirm = () => {
  const mileageValue = Number(
    mileage.replace(/\D/g, ''),
  );

  const costValue = Number(
    totalCost.replace(',', '.'),
  );

  if (
    !selectedCarId ||
    !date ||
    !mileageValue ||
    !serviceName
  ) {
    return;
  }

  addService({
    vehicleId: selectedCarId,

    date,
    mileage: mileageValue,
    serviceName,
    totalCost: costValue || 0,
    currency: params.currency || 'BYN',
    workshop,
    documentUri: params.uri,
  });

  router.replace('/(tabs)/services');
};

const selectedCarId = useCarStore(
  (state) => state.selectedCarId,
);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Review service</Text>

        <Text style={styles.subtitle}>
          Check the information extracted from your document and
          correct anything that looks wrong.
        </Text>

        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>
            ✨ AI extracted
          </Text>
        </View>

        <EditableField
          label="Service date"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <EditableField
          label="Mileage"
          value={mileage}
          onChangeText={setMileage}
          placeholder="Mileage"
          keyboardType="numeric"
          suffix="km"
        />

        <EditableField
          label="Service"
          value={serviceName}
          onChangeText={setServiceName}
          placeholder="e.g. Engine oil change"
        />

        <EditableField
          label="Total cost"
          value={totalCost}
          onChangeText={setTotalCost}
          placeholder="0"
          keyboardType="decimal-pad"
          suffix={params.currency || 'BYN'}
        />

        <EditableField
          label="Workshop"
          value={workshop}
          onChangeText={setWorkshop}
          placeholder="Workshop name"
        />

        <View style={styles.warning}>
          <Text style={styles.warningTitle}>
            Please verify the information
          </Text>

          <Text style={styles.warningText}>
            AI extraction can contain mistakes. You remain in control
            of what gets saved.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>
            Confirm & save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function EditableField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  suffix?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A3A3A3"
          keyboardType={keyboardType}
          style={styles.input}
        />

        {suffix && (
          <Text style={styles.suffix}>
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  content: {
    padding: 24,
    paddingBottom: 140,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#171717',
    marginTop: 20,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#737373',
    marginTop: 8,
    marginBottom: 20,
  },

  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4B8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 24,
  },

  aiBadgeText: {
    color: '#7A5E00',
    fontSize: 13,
    fontWeight: '600',
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#171717',
  },

  suffix: {
    paddingRight: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
  },

  warning: {
    backgroundColor: '#FFF9E5',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7A5E00',
  },

  warningText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#8A7400',
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: '#F7F7F5',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },

  confirmButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
});
