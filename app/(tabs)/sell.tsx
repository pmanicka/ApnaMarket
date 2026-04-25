// Sell Screen — Phase 4 placeholder
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function SellScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏪</Text>
        <Text style={styles.title}>Create a Listing</Text>
        <Text style={styles.subtitle}>
          Listing creation is coming in Phase 4.{'\n'}
          Food, Clothes, Services and more.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 24 },
});
