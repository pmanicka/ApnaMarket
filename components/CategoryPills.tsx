import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export type FilterCategory = 'all' | 'food' | 'clothes' | 'tuition' | 'services' | 'groceries' | 'handmade';

interface CategoryPillsProps {
  selected: FilterCategory;
  onSelect: (category: FilterCategory) => void;
}

const CATEGORIES: { id: FilterCategory; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '🌟' },
  { id: 'food', label: 'Food', emoji: '🍱' },
  { id: 'clothes', label: 'Clothes', emoji: '👗' },
  { id: 'tuition', label: 'Tuition', emoji: '📚' },
  { id: 'services', label: 'Services', emoji: '🔧' },
  { id: 'groceries', label: 'Groceries', emoji: '🥦' },
  { id: 'handmade', label: 'Handmade', emoji: '🎨' },
];

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const ORANGE = '#FF6B35';
const BG = '#12121F';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 6,
  },
  pillSelected: {
    borderColor: ORANGE,
    backgroundColor: '#1E1428',
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: ORANGE,
  },
});
