import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import {
  ActionCard,
  ErrorBanner,
  formatMoney,
  RecordDetailModal,
  RecordList,
  Screen,
  Section,
  SkeletonList,
  paymentTypeBadge,
} from '../../components/ui';

export default function Home() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ users: 0, items: 0, stock: 0, ledger: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [showAdminStats, setShowAdminStats] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [users, items, stock, ledger, sales, payments, outstandingByCustomer, purchaseSummary, customerData] =
        await Promise.all([
          api.getUsers(token),
          api.getItems(token),
          api.getStock(token),
          api.getLedger(token),
          api.getSales(token),
          api.getIncomingPayments(token),
          api.getOutstandingByCustomer(token),
          api.getPurchaseSummary(token),
          api.getCustomers(token),
        ]);

      setSummary({ users: users.length, items: items.length, stock: stock.length, ledger: ledger.length });
      setRecentSales(sales.slice(0, 5));
      setRecentPayments(payments.slice(0, 5));
      setCustomers(customerData);

      const receive = outstandingByCustomer.reduce(
        (sum, row) => sum + Number(row.totalOutstanding || 0),
        0,
      );
      setTotalToReceive(receive);
      setTotalToPay(Number(purchaseSummary.totalToPay || 0));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const findCustomerId = (name) => {
    const match = customers.find((c) => c.name?.toLowerCase() === String(name || '').toLowerCase());
    return match?._id;
  };

  const openSale = (sale) => {
    const customerId = sale.customer?._id || sale.customer || findCustomerId(sale.customerName);
    if (customerId) {
      navigate(`/org/customers/${customerId}`);
      return;
    }
    setDetailModal({
      title: 'Sale Details',
      details: {
        customerName: sale.customerName,
        paymentType: sale.paymentType,
        soldAt: sale.soldAt,
        sellingTotal: sale.sellingTotal,
        amountPaid: sale.amountPaid,
        remainingAmount: sale.remainingAmount,
      },
    });
  };

  const openPayment = (payment) => {
    const customerId = findCustomerId(payment.customerName);
    if (customerId) {
      navigate(`/org/customers/${customerId}`);
      return;
    }
    setDetailModal({ title: 'Payment Details', details: payment });
  };

  return (
    <Screen>
      <Section title="Dashboard" icon="H">
        <div className="meta-text">Welcome, {user?.name}</div>

        <div className="finance-cards">
          <button
            type="button"
            className="finance-card receive finance-card-button"
            onClick={() => navigate('/org/customers?outstanding=1')}
          >
            <div className="finance-card-label">Amount to Receive</div>
            <div className="finance-card-amount">{formatMoney(totalToReceive, { showCurrency: false })}</div>
            <div className="finance-card-sub">Tap to view customers with dues</div>
          </button>
          <button
            type="button"
            className="finance-card pay finance-card-button"
            onClick={() => navigate('/org/purchase')}
          >
            <div className="finance-card-label">Amount to Pay</div>
            <div className="finance-card-amount">{formatMoney(totalToPay, { showCurrency: false })}</div>
            <div className="finance-card-sub">Unpaid supplier purchases</div>
          </button>
        </div>

        <div className="action-cards">
          <ActionCard
            icon="users"
            label="Customers"
            sub="View accounts & balances"
            onClick={() => navigate('/org/customers')}
          />
          <ActionCard
            icon="cart"
            label="New Sale"
            sub="Record a sale"
            onClick={() => navigate('/org/setup/sales/new')}
          />
          <ActionCard
            icon="dollar"
            label="Receive Payment"
            sub="Collect from customer"
            variant="receive"
            onClick={() => navigate('/org/setup/payments/new')}
          />
          <ActionCard
            icon="truck"
            label="Purchases"
            sub="Supplier orders"
            variant="pay"
            onClick={() => navigate('/org/purchase')}
          />
        </div>

        <ErrorBanner message={error} onRetry={loadSummary} />

        <button
          type="button"
          className="btn ghost admin-stats-toggle"
          onClick={() => setShowAdminStats((v) => !v)}
        >
          {showAdminStats ? 'Hide' : 'Show'} admin stats
        </button>
        {showAdminStats ? (
          <div className="admin-stats-panel">
            <div className="meta-text">Users: {summary.users}</div>
            <div className="meta-text">Items: {summary.items}</div>
            <div className="meta-text">Stock records: {summary.stock}</div>
            <div className="meta-text">Ledger entries: {summary.ledger}</div>
          </div>
        ) : null}

        {loading ? (
          <SkeletonList rows={3} />
        ) : (
          <>
            <RecordList
              title="Recent Sales"
              data={recentSales}
              mobileLayout="cards"
              columns={[
                { key: 'soldAt', title: 'Date' },
                { key: 'customerName', title: 'Customer' },
                {
                  key: 'sellingTotal',
                  title: 'Total',
                  render: (sale) => <span className="amount-cell">{formatMoney(sale.sellingTotal)}</span>,
                },
                {
                  key: 'paymentType',
                  title: 'Type',
                  render: (sale) => paymentTypeBadge(sale.paymentType),
                },
              ]}
              onRowPress={openSale}
            />
            <RecordList
              title="Recent Payments"
              data={recentPayments}
              mobileLayout="cards"
              cardVariant="payment"
              columns={[
                { key: 'paymentDate', title: 'Date' },
                { key: 'customerName', title: 'Customer' },
                {
                  key: 'paymentAmount',
                  title: 'Amount',
                  render: (p) => <span className="amount-cell">{formatMoney(p.paymentAmount)}</span>,
                },
              ]}
              onRowPress={openPayment}
            />
          </>
        )}
      </Section>

      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
        />
      )}
    </Screen>
  );
}
