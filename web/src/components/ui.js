import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, sectionIconMap } from './icons';

const HIDDEN_FIELD_KEYS = new Set(['id', '_id', '__v']);

export function formatMoney(value, { showCurrency = true } = {}) {
  const num = Number(value || 0);
  const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return showCurrency ? `Rs ${formatted}` : formatted;
}

function looksLikeDateTime(value) {
  if (typeof value !== 'string') return false;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  return false;
}

export function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || '-';

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLocalDateTime(value) {
  return formatDateTime(value);
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

export function PageHeader({ title, backTo }) {
  const navigate = useNavigate();

  return (
    <div className="page-header">
      <button type="button" className="btn ghost page-header-back" onClick={() => (backTo ? navigate(backTo) : navigate(-1))}>
        ← Back
      </button>
      <h1 className="page-header-title">{title}</h1>
    </div>
  );
}

export function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function paymentTypeBadge(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'cash') return <Badge variant="success">Cash</Badge>;
  if (t === 'credit') return <Badge variant="warning">Credit</Badge>;
  return <Badge variant="neutral">{type || '-'}</Badge>;
}

export function outstandingBadge(amount) {
  const n = Number(amount || 0);
  if (n <= 0) return <Badge variant="success">Clear</Badge>;
  return <Badge variant="danger">Outstanding</Badge>;
}

export function Skeleton({ height = 16, width = '100%' }) {
  return <div className="skeleton" style={{ height, width }} />;
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <Skeleton height={18} width="60%" />
          <Skeleton height={14} width="40%" />
          <Skeleton height={14} width="80%" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      {message ? <div className="empty-state-message">{message}</div> : null}
      {actionLabel && onAction ? (
        <button type="button" className="btn" onClick={onAction}>{actionLabel}</button>
      ) : null}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-banner">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="btn ghost error-banner-btn" onClick={onRetry}>Retry</button>
      ) : null}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="segment-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`segment-tab${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, sticky }) {
  return (
    <div className={`search-input-wrap${sticky ? ' search-input-sticky' : ''}`}>
      <Icon name="search" size={18} className="search-input-icon" />
      <input
        className="input search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
      />
    </div>
  );
}

export function MoneyHero({ label, amount, variant = 'outstanding', sublabel }) {
  const variantClass = Number(amount || 0) <= 0 && variant === 'outstanding' ? 'clear' : variant;
  return (
    <div className={`money-hero money-hero-${variantClass}`}>
      <div className="money-hero-label">{label}</div>
      <div className="money-hero-amount">{formatMoney(amount)}</div>
      {sublabel ? <div className="money-hero-sub">{sublabel}</div> : null}
    </div>
  );
}

export function MoneyRow({ label, amount, highlight }) {
  return (
    <div className={`money-row${highlight ? ' money-row-highlight' : ''}`}>
      <span className="money-row-label">{label}</span>
      <span className="money-row-value">{formatMoney(amount)}</span>
    </div>
  );
}

export function FormSteps({ steps, current }) {
  return (
    <div className="form-steps">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={step} className={`form-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
            <div className="form-step-dot">{stepNum}</div>
            <div className="form-step-label">{step}</div>
          </div>
        );
      })}
    </div>
  );
}

export function FormGroup({ title, children }) {
  return (
    <div className="form-group">
      {title ? <div className="form-group-title">{title}</div> : null}
      {children}
    </div>
  );
}

export function SetupMenuGroup({ title, items }) {
  const navigate = useNavigate();
  return (
    <div className="setup-menu-group">
      <div className="setup-menu-group-title">{title}</div>
      <div className="setup-menu-grid">
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`setup-menu-tile${item.variant ? ` setup-menu-tile-${item.variant}` : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="setup-menu-tile-icon"><Icon name={item.icon} size={22} /></span>
            <span className="setup-menu-tile-label">{item.label}</span>
            {item.sub ? <span className="setup-menu-tile-sub">{item.sub}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ActionCard({ icon, label, sub, onClick, variant }) {
  return (
    <button
      type="button"
      className={`action-card${variant ? ` action-card-${variant}` : ''}`}
      onClick={onClick}
    >
      <span className="action-card-icon"><Icon name={icon} size={24} /></span>
      <span className="action-card-label">{label}</span>
      {sub ? <span className="action-card-sub">{sub}</span> : null}
    </button>
  );
}

function SectionIcon({ icon }) {
  const iconName = sectionIconMap[icon] || icon;
  if (iconName && typeof iconName === 'string') {
    return (
      <div className="section-icon section-icon-svg">
        <Icon name={iconName} size={18} />
      </div>
    );
  }
  return <div className="section-icon">{icon || 'S'}</div>;
}

export function Section({ title, icon, children }) {
  return (
    <section className="section">
      <div className="section-header">
        <SectionIcon icon={icon} />
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function paymentKindBadge(item) {
  if (item.type === 'opening_balance_payment' || item.paymentKind === 'Opening Balance') {
    return <Badge variant="warning">Opening Balance</Badge>;
  }
  return <Badge variant="success">Credit Sale</Badge>;
}

function renderPaymentCard(item, index, onRowPress) {
  const rowKey = item._id || item.paymentId || item.saleId || item.id || index;
  return (
    <button
      type="button"
      key={rowKey}
      className={`record-card record-card-payment${onRowPress ? ' record-card-tappable' : ''}`}
      onClick={onRowPress ? () => onRowPress(item) : undefined}
    >
      <div className="record-card-header">
        <div className="record-card-header-main">
          <div className="record-card-amount">{formatMoney(item.paymentAmount)}</div>
          {paymentKindBadge(item)}
        </div>
        {onRowPress ? <span className="record-card-chevron">›</span> : null}
      </div>
      <div className="record-card-footer">
        {item.customerName ? <span className="record-card-meta">{item.customerName}</span> : null}
        <span className="record-card-meta">{formatDateTime(item.paymentDate)}</span>
        {item.note ? <span className="record-card-note">{item.note}</span> : null}
      </div>
    </button>
  );
}

function renderSaleCard(item, index, onRowPress) {
  const rowKey = item._id || item.saleId || item.id || index;
  const remaining = Number(item.remainingAmount || 0);
  return (
    <button
      type="button"
      key={rowKey}
      className={`record-card record-card-sale${onRowPress ? ' record-card-tappable' : ''}`}
      onClick={onRowPress ? () => onRowPress(item) : undefined}
    >
      <div className="record-card-header">
        <div className="record-card-header-main">
          <div className="record-card-amount">{formatMoney(item.sellingTotal)}</div>
          {paymentTypeBadge(item.paymentType)}
        </div>
        {onRowPress ? <span className="record-card-chevron">›</span> : null}
      </div>
      <div className="record-card-footer">
        <span className="record-card-meta">{formatDateTime(item.soldAt)}</span>
        {remaining > 0 ? (
          <span className="record-card-meta record-card-meta-highlight">
            Remaining {formatMoney(remaining)}
          </span>
        ) : (
          <span className="record-card-meta record-card-meta-paid">Paid in full</span>
        )}
      </div>
    </button>
  );
}

export function RecordList({
  title,
  data,
  columns,
  renderItem,
  onRowPress,
  itemsPerPage = 20,
  mobileLayout,
  cardVariant,
  loading,
  emptyTitle,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
}) {
  const [page, setPage] = useState(1);
  const useCards = mobileLayout === 'cards';

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

  const cardPrimaryColumn = normalizedColumns[0];
  const cardSecondaryColumns = normalizedColumns.slice(1);

  return (
    <div className="list-wrapper">
      <div className="list-title">{title}</div>
      {loading ? (
        <SkeletonList rows={3} />
      ) : data.length === 0 ? (
        <EmptyState
          title={emptyTitle || 'No records'}
          message={emptyMessage}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      ) : (
        <>
          {useCards ? (
            <div className="card-list record-card-list">
              {pagedData.map((item, index) => {
                if (cardVariant === 'payment') {
                  return renderPaymentCard(item, index, onRowPress);
                }
                if (cardVariant === 'sale') {
                  return renderSaleCard(item, index, onRowPress);
                }

                const rowKey = item._id || item.saleId || item.itemId || item.id || index;
                const primaryValue = cardPrimaryColumn.render
                  ? cardPrimaryColumn.render(item)
                  : item?.[cardPrimaryColumn.key];
                return (
                  <button
                    type="button"
                    key={rowKey}
                    className={`record-card${onRowPress ? ' record-card-tappable' : ''}`}
                    onClick={onRowPress ? () => onRowPress(item) : undefined}
                  >
                    <div className="record-card-header">
                      <div className="record-card-title">
                        {React.isValidElement(primaryValue) ? primaryValue : formatComplexValue(primaryValue)}
                      </div>
                      {onRowPress ? <span className="record-card-chevron">›</span> : null}
                    </div>
                    {cardSecondaryColumns.map((column) => {
                      const value = column.render ? column.render(item) : item?.[column.key];
                      return (
                        <div key={`${column.key}-${rowKey}`} className="record-card-row">
                          <span className="record-card-label">{column.title}</span>
                          <span className="record-card-value">
                            {React.isValidElement(value) ? value : formatComplexValue(value)}
                          </span>
                        </div>
                      );
                    })}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {normalizedColumns.map((column) => (
                      <th key={`head-${column.key}`}>{column.title}</th>
                    ))}
                    {onRowPress ? <th className="table-chevron-col" aria-hidden /> : null}
                  </tr>
                </thead>
                <tbody>
                  {pagedData.map((item, index) => {
                    const rowKey = item._id || item.saleId || item.itemId || item.id || index;
                    return (
                      <tr
                        key={rowKey}
                        className={onRowPress ? 'table-row-tappable' : undefined}
                        onClick={onRowPress ? () => onRowPress(item) : undefined}
                      >
                        {normalizedColumns.map((column) => {
                          const value = column.render ? column.render(item) : item?.[column.key];
                          if (React.isValidElement(value)) {
                            return <td key={`${column.key}-${rowKey}`}>{value}</td>;
                          }
                          return <td key={`${column.key}-${rowKey}`}>{formatComplexValue(value)}</td>;
                        })}
                        {onRowPress ? <td className="table-chevron-col">›</td> : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 ? (
            <div className="pagination">
              <button className="btn ghost" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
                Prev
              </button>
              <div className="meta-text">Page {page} of {totalPages}</div>
              <button className="btn ghost" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          ) : null}
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

export function RecordDetailModal({ title, details, onClose, onEdit, editLabel, onDelete, deleteLabel }) {
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

      {(onEdit || onDelete) && (
        <div className="actions-row">
          {onEdit && (
            <button className="btn secondary" onClick={onEdit}>
              {editLabel || 'Edit'}
            </button>
          )}
          {onDelete && (
            <button className="btn danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : (deleteLabel || 'Delete')}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
