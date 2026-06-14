import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import {
  Badge,
  ErrorBanner,
  formatMoney,
  outstandingBadge,
  RecordList,
  Screen,
  SearchInput,
  Section,
  SkeletonList,
} from '../../components/ui';

export default function Customers() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outstandingOnly = searchParams.get('outstanding') === '1';

  const [customers, setCustomers] = useState([]);
  const [outstandingMap, setOutstandingMap] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [customerData, outstandingData] = await Promise.all([
        api.getCustomers(token),
        api.getOutstandingByCustomer(token),
      ]);

      const map = {};
      for (const row of outstandingData) {
        const key = row.customerId ? String(row.customerId) : row.customerName;
        map[key] = row;
      }

      setCustomers(customerData);
      setOutstandingMap(map);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => {
    const merged = customers.map((customer) => {
      const outstanding = outstandingMap[String(customer._id)];
      return {
        ...customer,
        totalOutstanding: outstanding?.totalOutstanding ?? Number(customer.openingBalance || 0),
        totalSales: outstanding?.totalSales ?? 0,
        lastSaleDate: outstanding?.lastSaleDate ?? null,
      };
    });

    const filtered = merged.filter((row) => {
      if (outstandingOnly && Number(row.totalOutstanding || 0) <= 0) return false;
      if (!search.trim()) return true;
      return row.name?.toLowerCase().includes(search.trim().toLowerCase());
    });

    return filtered.sort(
      (a, b) => Number(b.totalOutstanding || 0) - Number(a.totalOutstanding || 0)
    );
  }, [customers, outstandingMap, search, outstandingOnly]);

  return (
    <Screen>
      <Section title="Customers" icon="CST">
        <SearchInput
          sticky
          value={search}
          onChange={setSearch}
          placeholder="Search by customer name"
        />
        {outstandingOnly ? (
          <div className="meta-text">Showing customers with outstanding balance only.</div>
        ) : null}
        <ErrorBanner message={error} onRetry={loadData} />
        {loading ? (
          <SkeletonList rows={5} />
        ) : (
          <RecordList
            title="Customer Accounts"
            data={rows}
            mobileLayout="cards"
            emptyTitle="No customers found"
            emptyMessage={outstandingOnly ? 'All customers are fully paid.' : 'Add customers from Setup → Manage Customers.'}
            emptyActionLabel={outstandingOnly ? undefined : 'Manage Customers'}
            onEmptyAction={outstandingOnly ? undefined : () => navigate('/org/setup/customers')}
            columns={[
              {
                key: 'name',
                title: 'Customer',
                render: (row) => (
                  <span>
                    {row.name}{' '}
                    {outstandingBadge(row.totalOutstanding)}
                  </span>
                ),
              },
              {
                key: 'totalOutstanding',
                title: 'Total Outstanding',
                render: (row) => <span className="amount-cell">{formatMoney(row.totalOutstanding)}</span>,
              },
              { key: 'phone', title: 'Phone' },
              {
                key: 'totalSales',
                title: 'Sales',
                render: (row) => row.totalSales || 0,
              },
            ]}
            onRowPress={(row) => navigate(`/org/customers/${row._id}`)}
          />
        )}
      </Section>
    </Screen>
  );
}
