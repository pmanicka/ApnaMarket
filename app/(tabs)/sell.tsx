import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Category } from '../../types';

const CATEGORIES: { id: Category; label: string; emoji: string; desc: string }[] = [
  { id: 'food', label: 'Home Cooked Food', emoji: '🍱', desc: 'Meals, sweets, snacks, pickles' },
  { id: 'clothes', label: 'Clothes & Boutique', emoji: '👗', desc: 'Sarees, kurtis, tailored items' },
  { id: 'tuition', label: 'Classes & Tuition', emoji: '📚', desc: 'Academic, music, yoga, arts' },
  { id: 'services', label: 'Home Services', emoji: '🔧', desc: 'AC repair, plumbing, cleaning' },
  { id: 'groceries', label: 'Groceries & Produce', emoji: '🥦', desc: 'Fresh farm produce, dry fruits' },
  { id: 'handmade', label: 'Handmade Crafts', emoji: '🎨', desc: 'Art, jewelry, home decor' },
];

export default function SellScreen() {
  const router = useRouter();

  const handleSelectCategory = (categoryId: Category) => {
    // For Phase 4/5/6: We will route to the specific form based on the category.
    // Right now we will just log it or route to a placeholder.
    router.push(`/sell/form?category=${categoryId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>What are you selling?</Text>
        <Text style={styles.headerSub}>Choose a category for your listing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleSelectCategory(cat.id)}
          >
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{cat.emoji}</Text>
            </View>
            <Text style={styles.label}>{cat.label}</Text>
            <Text style={styles.desc}>{cat.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  card: {
    width: '48%',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#12121F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
});
