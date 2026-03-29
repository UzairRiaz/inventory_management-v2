import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RecordList, Screen, Section, styles } from '../components/ui';

const HIDDEN_FIELD_KEYS = new Set(['id', '_id', '__v']);

function formatFieldLabel(path) {
  if (!path) return 'Value';

  const withIndices = path.replace(/\[(\d+)\]/g, ' $1 ');

  const humanize = (value) =>
    value
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();

  const titleCase = (value) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return titleCase(
    withIndices
      .split('.')
      .map((segment) => humanize(segment))
      .join(' ')
  );
}

function looksLikeDateTime(value) {
  if (typeof value !== 'string') return false;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  return false;
}

function formatPrimitiveValue(value) {
  if (value === null || value === undefined) return '-';
  if (looksLikeDateTime(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return String(value);
}

function flattenDetails(value, prefix = '') {
  if (value === null || value === undefined) {
    return [{ field: formatFieldLabel(prefix), value: '-' }];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [{ field: formatFieldLabel(prefix), value: '-' }];
    }

    return value.flatMap((entry, index) => {
      const nextPrefix = prefix ? `${prefix}[${index}]` : `[${index}]`;
      if (typeof entry === 'object' && entry !== null) {
        return flattenDetails(entry, nextPrefix);
      }

      return [{ field: formatFieldLabel(nextPrefix), value: formatPrimitiveValue(entry) }];
    });
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([key]) => !HIDDEN_FIELD_KEYS.has(key));
    if (entries.length === 0) {
      return [{ field: formatFieldLabel(prefix), value: '-' }];
    }

    return entries.flatMap(([key, entryValue]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (typeof entryValue === 'object' && entryValue !== null) {
        return flattenDetails(entryValue, nextPrefix);
      }

      return [{ field: formatFieldLabel(nextPrefix), value: formatPrimitiveValue(entryValue) }];
    });
  }

  return [{ field: formatFieldLabel(prefix), value: formatPrimitiveValue(value) }];
}

export default function RowDetailScreen({ navigation, route }) {
  const { title = 'Details', details = {}, deleteAction } = route.params || {};
  const { token } = useAuth();

  const hasItemsTable = Array.isArray(details?.items) && details.items.length > 0;
  const hasPaymentsTable = Array.isArray(details?.payments) && details.payments.length > 0;
  const detailRows = flattenDetails(
    hasItemsTable || hasPaymentsTable
      ? Object.fromEntries(Object.entries(details).filter(([key]) => key !== 'items' && key !== 'payments'))
      : details,
  );

  const itemRows = hasItemsTable
    ? details.items.map((entry, index) => ({
        id: entry?._id || `${index}`,
        item: entry?.item?.name || entry?.item?.sku || entry?.item || '-',
        quantity: entry?.quantity ?? '-',
        unitManufacturingPrice: entry?.unitManufacturingPrice ?? '-',
        unitSellingPrice: entry?.unitSellingPrice ?? '-',
        lineManufacturingTotal: entry?.lineManufacturingTotal ?? '-',
        lineSellingTotal: entry?.lineSellingTotal ?? '-',
        lineProfit: entry?.lineProfit ?? '-',
      }))
    : [];

  const paymentRows = hasPaymentsTable
    ? details.payments.map((entry, index) => ({
        id: entry?._id || `${index}`,
        amount: entry?.amount ?? '-',
        paidAt: entry?.paidAt ?? '-',
        receivedBy: entry?.receivedBy ?? '-',
        note: entry?.note ?? '-',
      }))
    : [];

  return (
    <Screen>
      <Section title={title} icon="information-circle-outline">
        {detailRows.length === 0 ? (
          <Text style={styles.metaText}>No details available</Text>
        ) : (
          <RecordList
            title="Row Details"
            data={detailRows}
            itemsPerPage={20}
            columns={[
              { key: 'field', title: 'Field' },
              { key: 'value', title: 'Value' },
            ]}
          />
        )}

        {hasItemsTable ? (
          <RecordList
            title="Items"
            data={itemRows}
            itemsPerPage={10}
            columns={[
              { key: 'item', title: 'Item' },
              { key: 'quantity', title: 'Qty' },
              { key: 'unitManufacturingPrice', title: 'Unit Cost' },
              { key: 'unitSellingPrice', title: 'Unit Price' },
              { key: 'lineManufacturingTotal', title: 'Line Cost' },
              { key: 'lineSellingTotal', title: 'Line Total' },
              { key: 'lineProfit', title: 'Profit' },
            ]}
          />
        ) : null}

        {hasPaymentsTable ? (
          <RecordList
            title="Payments"
            data={paymentRows}
            itemsPerPage={10}
            columns={[
              { key: 'amount', title: 'Amount' },
              { key: 'paidAt', title: 'Paid At' },
              { key: 'receivedBy', title: 'Received By' },
              { key: 'note', title: 'Note' },
            ]}
          />
        ) : null}

        {deleteAction ? (
          <View style={localStyles.deleteRow}>
            <Pressable
              style={localStyles.deleteButton}
              onPress={() => {
                Alert.alert('Confirm Delete', 'This action cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        if (deleteAction.type === 'sale') {
                          await api.deleteSale(token, deleteAction.id);
                        } else if (deleteAction.type === 'payment') {
                          await api.deleteSalePayment(token, deleteAction.saleId, deleteAction.paymentId);
                        } else if (deleteAction.type === 'stock') {
                          await api.deleteStock(token, deleteAction.id);
                        }

                        navigation.goBack();
                      } catch (error) {
                        Alert.alert('Delete failed', error.message);
                      }
                    },
                  },
                ]);
              }}
            >
              <Text style={localStyles.deleteText}>{deleteAction.label || 'Delete'}</Text>
            </Pressable>
          </View>
        ) : null}
      </Section>
    </Screen>
  );
}

const localStyles = StyleSheet.create({
  deleteRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 12,
  },
});
