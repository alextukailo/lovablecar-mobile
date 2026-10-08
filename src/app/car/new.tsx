import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { router } from 'expo-router';
import { useState } from 'react';

import {
    useCarStore,
} from '../../store/car.store';

export default function NewCarScreen() {
  const addCar = useCarStore(
    (state) => state.addCar,
  );

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [mileage, setMileage] = useState('');

  const handleSave = () => {
    const yearValue = Number(year);
    const mileageValue = Number(
      mileage.replace(/\D/g, ''),
    );

    if (
      !make.trim() ||
      !model.trim() ||
      !yearValue ||
      !mileageValue
    ) {
      return;
    }

    addCar({
      make: make.trim(),
      model: model.trim(),
      year: yearValue,
      engine: engine.trim() || undefined,
      mileage: mileageValue,
      isPrimary: false,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Add car
        </Text>

        <Text style={styles.subtitle}>
          Add your vehicle to keep its service history
          separate.
        </Text>

        <Field
          label="Make"
          value={make}
          onChangeText={setMake}
          placeholder="Volkswagen"
        />

        <Field
          label="Model"
          value={model}
          onChangeText={setModel}
          placeholder="Tiguan"
        />

        <Field
          label="Year"
          value={year}
          onChangeText={setYear}
          placeholder="2017"
          keyboardType="numeric"
        />

        <Field
          label="Engine"
          value={engine}
          onChangeText={setEngine}
          placeholder="2.0 TSI"
        />

        <Field
          label="Current mileage"
          value={mileage}
          onChangeText={setMileage}
          placeholder="128450"
          keyboardType="numeric"
        />

        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>
            Add car
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A3A3A3"
        keyboardType={keyboardType}
        style={styles.input}
      />
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
    paddingBottom: 50,
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
    marginBottom: 28,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 7,
  },

  input: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#171717',
  },

  saveButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
});
