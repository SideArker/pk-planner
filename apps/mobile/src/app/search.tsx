import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  type BlockOverride,
  type ScheduleBlock,
  teacherDisplay,
} from '@pk-planner/core';

import { BlockCard } from '@/components/BlockCard';
import { BlockDetailModal } from '@/components/BlockDetailModal';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useUserSchedule } from '@/hooks/useUserSchedule';

type FilterType = 'all' | 'teachers' | 'rooms' | 'subjects';

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Wszystko' },
  { id: 'teachers', label: 'Prowadzący' },
  { id: 'rooms', label: 'Sale' },
  { id: 'subjects', label: 'Przedmioty' },
];

export default function SearchScreen() {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const { state } = useScheduleData();
  const { setSubjectGroup, setBlockOverride, removeCustomBlock } = useUserSchedule();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);

  const filteredBlocks = useMemo(() => {
    if (!state || !query.trim()) return [];

    const q = query.toLowerCase().trim();
    const blocks = state.blocks;

    return blocks
      .filter((b) => {
        const teacher = teacherDisplay(b)?.toLowerCase() || '';
        const room = (b.room || '').toLowerCase();
        const subject = (b.subject || '').toLowerCase();
        const cohort = (b.cohort || '').toLowerCase();

        switch (filterType) {
          case 'teachers':
            return teacher.includes(q);
          case 'rooms':
            return room.includes(q);
          case 'subjects':
            return subject.includes(q);
          case 'all':
          default:
            return (
              teacher.includes(q) ||
              room.includes(q) ||
              subject.includes(q) ||
              cohort.includes(q)
            );
        }
      })
      .slice(0, 60);
  }, [state, query, filterType]);

  const handleSaveOverride = (blockId: string, override: BlockOverride) => {
    setBlockOverride(blockId, override);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#09090b' : '#f8fafc' },
      ]}>
      {/* Search Header */}
      <View
        style={[
          styles.searchHeader,
          {
            backgroundColor: isDark ? '#09090b' : '#ffffff',
            borderBottomColor: theme.border,
          },
        ]}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#18181b' : '#f1f5f9',
              borderColor: theme.border,
            },
          ]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textSecondary}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Szukaj wykładowcy, sali, przedmiotu..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {Boolean(query) && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((f) => {
            const isSelected = filterType === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilterType(f.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? '#fafafa'
                        : '#18181b'
                      : isDark
                        ? '#18181b'
                        : '#ffffff',
                    borderColor: isSelected
                      ? isDark
                        ? '#fafafa'
                        : '#18181b'
                      : theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected
                        ? isDark
                          ? '#09090b'
                          : '#ffffff'
                        : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Results Banner */}
      {Boolean(query.trim()) && (
        <View style={styles.countBanner}>
          <Text style={[styles.countText, { color: theme.textSecondary }]}>
            Znaleziono {filteredBlocks.length} zajęć
          </Text>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={filteredBlocks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <BlockCard
            block={item}
            onPress={setSelectedBlock}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={query.trim() ? 'search-outline' : 'school-outline'}
              size={48}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {query.trim()
                ? 'Brak wyników'
                : 'Wyszukiwarka zajęć PK'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {query.trim()
                ? 'Nie znaleziono zajęć spełniających podane kryteria.'
                : 'Wpisz nazwisko wykładowcy, numer sali (np. D21) lub nazwę przedmiotu.'}
            </Text>
          </View>
        }
      />

      {/* Block Details Modal */}
      <BlockDetailModal
        block={selectedBlock}
        state={state}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        onSwitchGroup={setSubjectGroup}
        onSaveOverride={handleSaveOverride}
        onRemoveCustomBlock={removeCustomBlock}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  countBanner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: 6,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
