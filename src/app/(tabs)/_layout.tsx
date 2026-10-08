import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name="cars"
        options={{
          title: 'Cars',
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: 'Service',
        }}
      />

      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
