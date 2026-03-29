import React, { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Button, FlatList, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';

const HIDDEN_FIELD_KEYS = new Set(['id', '_id', '__v']);

function looksLikeDateTime(value) {
  if (typeof value !== 'string') return false;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  return false;
}

function formatLocalDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrimitiveValue(value) {
  if (value === null || value === undefined) return '-';
  if (looksLikeDateTime(value)) return formatLocalDateTime(value);
  return String(value);
}

export function Screen({ children }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

function formatComplexValue(value, prefix = '') {
  if (value === null || value === undefined) {
    return '-';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
    return value
      .map((entry, index) => {
        if (typeof entry === 'object' && entry !== null) {
          return formatComplexValue(entry, `${prefix}[${index}]`);
        }

        return `${prefix}[${index}]: ${formatPrimitiveValue(entry)}`;
      })
      .join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([key]) => !HIDDEN_FIELD_KEYS.has(key));
    if (entries.length === 0) return '-';

    return entries
      .map(([key, entryValue]) => {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        if (typeof entryValue === 'object' && entryValue !== null) {
          return formatComplexValue(entryValue, fieldPath);
        }

        return `${fieldPath}: ${formatPrimitiveValue(entryValue)}`;
      })
      .join('\n');
  }

  return formatPrimitiveValue(value);
}

export function Section({ title, icon = 'sparkles-outline', children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={18} color="#4338ca" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function RecordList({
  title,
  data,
  columns,
  renderItem,
  onRowPress,
  itemsPerPage = 20,
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, page, itemsPerPage]);

  const normalizedColumns = useMemo(() => {
    if (Array.isArray(columns) && columns.length > 0) {
      return columns;
    }

    if (renderItem) {
      return [{ key: 'details', title: 'Details', render: renderItem }];
    }

    return [{ key: 'details', title: 'Details', render: (item) => JSON.stringify(item) }];
  }, [columns, renderItem]);

  return (
    <View style={styles.listWrapper}>
      <Text style={styles.listTitle}>{title}</Text>
      {data.length === 0 ? (
        <Text style={styles.metaText}>No data</Text>
      ) : (
        <>
          <ScrollView horizontal style={styles.tableWrap}>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                {normalizedColumns.map((column) => (
                  <Text key={`head-${column.key}`} style={[styles.tableCell, styles.tableHeaderCell]}>{column.title}</Text>
                ))}
              </View>

              <FlatList
                scrollEnabled={false}
                data={pagedData}
                keyExtractor={(item, index) => {
                  const baseKey = item._id || item.saleId || item.itemId || item.id || JSON.stringify(item);
                  return `${baseKey}-${index}`;
                }}
                renderItem={({ item }) => (
                  <Pressable style={styles.tableDataRow} onPress={onRowPress ? () => onRowPress(item) : undefined}>
                    {normalizedColumns.map((column) => {
                      const value = column.render ? column.render(item) : item?.[column.key];

                      if (React.isValidElement(value)) {
                        return (
                          <View
                            key={`${column.key}-${item._id || item.id || column.title}`}
                            style={[styles.tableCell, styles.tableCellCenter]}
                          >
                            {value}
                          </View>
                        );
                      }

                      const displayValue = formatComplexValue(value);

                      return (
                        <Text key={`${column.key}-${item._id || item.id || displayValue}`} style={styles.tableCell}>
                          {displayValue}
                        </Text>
                      );
                    })}
                  </Pressable>
                )}
              />
            </View>
          </ScrollView>
          <View style={styles.paginationRow}>
            <Button title="Prev" onPress={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1} />
            <Text style={styles.paginationText}>Page {page} of {totalPages}</Text>
            <Button title="Next" onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages} />
          </View>
        </>
      )}
    </View>
  );
}

export function NativeSelect({ value, onChange, items, placeholder = 'Select option' }) {
  const options = items.length > 0 ? items : [{ label: 'No options available', value: '' }];
  const selected = options.find((option) => option.value === value);

  if (Platform.OS === 'ios') {
    const iosLabel = selected ? selected.label : placeholder;
    const iosLabelStyle = selected ? styles.nativeSelectText : [styles.nativeSelectText, styles.nativeSelectPlaceholder];

    const openActionSheet = () => {
      if (options.length === 0) return;

      const labels = options.map((option) => option.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, 'Cancel'],
          cancelButtonIndex: labels.length,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex < labels.length) {
            onChange(options[buttonIndex].value);
          }
        },
      );
    };

    return (
      <Pressable style={styles.nativeSelectPressable} onPress={openActionSheet}>
        <Text style={iosLabelStyle}>{iosLabel}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.nativeSelectWrap}>
      <RNPickerSelect
        value={value}
        onValueChange={onChange}
        items={options}
        placeholder={{ label: placeholder, value: '' }}
        useNativeAndroidPickerStyle={false}
        style={{
          inputIOS: styles.nativeSelectInputIOS,
          inputAndroid: styles.nativeSelectInputAndroid,
          inputWeb: styles.nativeSelectInputWeb,
          placeholder: styles.nativeSelectPlaceholder,
        }}
      />
    </View>
  );
}

export function HeaderAddButton({ onPress }) {
  return (
    <Pressable style={styles.headerAddButton} onPress={onPress} hitSlop={8}>
      <Ionicons name="add" size={20} color="#ffffff" />
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  content: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    padding: 16,
    gap: 12,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8fbff',
  },
  fieldLabel: {
    color: '#334155',
    fontWeight: '600',
    marginBottom: -2,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#f8fbff',
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
    color: '#1e293b',
  },
  pickerItem: {
    color: '#1e293b',
  },
  nativeSelectWrap: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#f8fbff',
  },
  nativeSelectPressable: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#f8fbff',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  nativeSelectText: {
    color: '#1e293b',
    fontSize: 16,
  },
  nativeSelectInputIOS: {
    color: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 44,
  },
  nativeSelectInputAndroid: {
    color: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 44,
  },
  nativeSelectInputWeb: {
    color: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 44,
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
  },
  nativeSelectPlaceholder: {
    color: '#64748b',
  },
  headerAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4338ca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    height: 8,
  },
  listWrapper: {
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
  },
  listTitle: {
    fontWeight: '700',
    color: '#1e293b',
  },
  listCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  tableWrap: {
    marginTop: 6,
  },
  tableContainer: {
    minWidth: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
  },
  tableDataRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  tableCell: {
    flex: 1,
    minWidth: 130,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
  },
  tableCellCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderCell: {
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  paginationRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  paginationText: {
    color: '#475569',
    fontWeight: '600',
  },
  metaText: {
    color: '#475569',
  },
  summaryBox: {
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 6,
    backgroundColor: '#fff7ed',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9a3412',
  },
  cardRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    gap: 6,
  },
  cardText: {
    fontSize: 13,
    color: '#334155',
  },
});
