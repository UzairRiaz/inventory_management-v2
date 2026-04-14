import React, { useMemo, useEffect, useState } from 'react';

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

export function Screen({ children }) {
  return <div className="content-wrap">{children}</div>;
}

export function Section({ title, icon, children }) {
  return (
    <section className="section">
      <div className="section-header">
        <div className="section-icon">{icon || 'S'}</div>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function RecordList({ title, data, columns, renderItem, onRowPress, itemsPerPage = 20 }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const pagedData = useMemo(() => data.slice(start, start + itemsPerPage), [data, start, itemsPerPage]);

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
    <div className="list-wrapper">
      <div className="list-title">{title}</div>
      {data.length === 0 ? (
        <div className="meta-text">No data</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {normalizedColumns.map((column) => (
                    <th key={`head-${column.key}`}>{column.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedData.map((item, index) => {
                  const rowKey = item._id || item.saleId || item.itemId || item.id || index;
                  return (
                    <tr key={rowKey} onClick={onRowPress ? () => onRowPress(item) : undefined}>
                      {normalizedColumns.map((column) => {
                        const value = column.render ? column.render(item) : item?.[column.key];
                        if (React.isValidElement(value)) {
                          return <td key={`${column.key}-${rowKey}`}>{value}</td>;
                        }
                        return <td key={`${column.key}-${rowKey}`}>{formatComplexValue(value)}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="btn ghost" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
              Prev
            </button>
            <div className="meta-text">Page {page} of {totalPages}</div>
            <button className="btn ghost" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Select({ value, onChange, items, placeholder }) {
  const options = items && items.length > 0 ? items : [{ label: 'No options available', value: '' }];

  return (
    <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder || 'Select option'}</option>
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ── Modal helpers ─────────────────────────────────────────

const DETAIL_HIDDEN = new Set(['id', '_id', '__v']);

function detailFieldLabel(path) {
  if (!path) return 'Value';
  const withIndices = path.replace(/\[(\d+)\]/g, ' $1 ');
  const humanize = (v) =>
    v.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').trim();
  const titleCase = (v) =>
    v.split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return titleCase(withIndices.split('.').map((seg) => humanize(seg)).join(' '));
}

function detailFormatValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime()))
        return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  }
  return String(value);
}

function flattenRecord(value, prefix = '') {
  if (value === null || value === undefined)
    return [{ field: detailFieldLabel(prefix), value: '-' }];
  if (Array.isArray(value)) {
    if (value.length === 0) return [{ field: detailFieldLabel(prefix), value: '-' }];
    return value.flatMap((entry, i) => {
      const next = prefix ? `${prefix}[${i}]` : `[${i}]`;
      if (typeof entry === 'object' && entry !== null) return flattenRecord(entry, next);
      return [{ field: detailFieldLabel(next), value: detailFormatValue(entry) }];
    });
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([k]) => !DETAIL_HIDDEN.has(k));
    if (entries.length === 0) return [{ field: detailFieldLabel(prefix), value: '-' }];
    return entries.flatMap(([k, v]) => {
      const next = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null) return flattenRecord(v, next);
      return [{ field: detailFieldLabel(next), value: detailFormatValue(v) }];
    });
  }
  return [{ field: detailFieldLabel(prefix), value: detailFormatValue(value) }];
}

// ── Modal base ────────────────────────────────────────────

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── RecordDetailModal ─────────────────────────────────────

export function RecordDetailModal({ title, details, onClose, onDelete, deleteLabel }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const hasItemsTable = Array.isArray(details?.items) && details.items.length > 0;
  const hasPaymentsTable = Array.isArray(details?.payments) && details.payments.length > 0;

  const detailRows = useMemo(() => {
    const filtered = hasItemsTable || hasPaymentsTable
      ? Object.fromEntries(Object.entries(details || {}).filter(([k]) => k !== 'items' && k !== 'payments'))
      : details || {};
    return flattenRecord(filtered);
  }, [details, hasItemsTable, hasPaymentsTable]);

  const itemRows = useMemo(() =>
    hasItemsTable
      ? details.items.map((e, i) => ({
          id: e?._id || String(i),
          item: e?.item?.name || e?.item?.sku || String(e?.item || '-'),
          quantity: e?.quantity ?? '-',
          unitSellingPrice: e?.unitSellingPrice ?? '-',
          lineSellingTotal: e?.lineSellingTotal ?? '-',
          lineProfit: e?.lineProfit ?? '-',
        }))
      : [],
  [details, hasItemsTable]);

  const paymentRows = useMemo(() =>
    hasPaymentsTable
      ? details.payments.map((e, i) => ({
          id: e?._id || String(i),
          amount: e?.amount ?? '-',
          paidAt: e?.paidAt ?? '-',
          note: e?.note ?? '-',
        }))
      : [],
  [details, hasPaymentsTable]);

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm('Delete this record? This cannot be undone.');
    if (!confirmed) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err.message || 'Delete failed');
      setDeleting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <table className="detail-table">
        <tbody>
          {detailRows.map((row, i) => (
            <tr key={i}>
              <td>{row.field}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasItemsTable && (
        <>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Items</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th><th>Qty</th><th>Unit Price</th><th>Line Total</th><th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {itemRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.item}</td><td>{r.quantity}</td>
                    <td>{r.unitSellingPrice}</td><td>{r.lineSellingTotal}</td><td>{r.lineProfit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hasPaymentsTable && (
        <>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Payments</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Amount</th><th>Paid At</th><th>Note</th></tr>
              </thead>
              <tbody>
                {paymentRows.map((r) => (
                  <tr key={r.id}><td>{r.amount}</td><td>{r.paidAt}</td><td>{r.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {error && <div className="meta-text" style={{ color: 'var(--danger)' }}>{error}</div>}

      {onDelete && (
        <div className="actions-row">
          <button className="btn danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : (deleteLabel || 'Delete')}
          </button>
        </div>
      )}
    </Modal>
  );
}
