import React, { useMemo, useState } from 'react';

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
