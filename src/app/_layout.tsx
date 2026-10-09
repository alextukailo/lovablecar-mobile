import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="service/new"
        options={{
          title: 'Add service',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="scanner"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />

      <Stack.Screen
        name="scanner/preview"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="car/new"
        options={{
          title: 'Add car',
        }}
      />

      <Stack.Screen
        name="car/[id]"
        options={{
          title: 'Car',
        }}
      />

      <Stack.Screen
        name="car/edit"
        options={{ title: 'Edit car' }}
      />
    </Stack>
  );
}
