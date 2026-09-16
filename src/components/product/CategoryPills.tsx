import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface CategoryPillsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryPills({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryPillsProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {categories.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

        return (
          <Pressable
            key={cat}
            onPress={() => onSelectCategory(cat)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? '#2563EB' : theme.backgroundElement,
              },
            ]}>
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? '#FFFFFF' : theme.text,
                  fontWeight: isSelected ? '700' : '600',
                },
              ]}>
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
});
