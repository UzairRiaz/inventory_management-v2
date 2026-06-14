import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import {
  Badge,
  ErrorBanner,
  formatMoney,
  MoneyHero,
  MoneyRow,
  PageHeader,
  paymentTypeBadge,
  RecordDetailModal,
  RecordList,
  Screen,
  Section,
  SkeletonList,
  Tabs,
} from '../../components/ui';

export default function CustomerAccount() {
  const { token, user } = useAuth();
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAccount = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCustomerAccount(token, customerId);
      setAccount(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, customerId]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const summary = account?.summary;
  const customer = account?.customer;
  const totalOutstanding = Number(summary?.totalOutstanding || 0);

  const recentTimeline = useMemo(
    () => (account?.timeline || []).slice(0, 8),
    [account]
  );

  const canDeletePayments = ['admin', 'manager'].includes(user?.role);

  const getPaymentDeleteMeta = (payment) => {
    if (!canDeletePayments || !payment?.paymentId) return null;

    if (payment.type === 'opening_balance_payment') {
      return { kind: 'customer', customerId, paymentId: payment.paymentId };
    }

    if (payment.saleId) {
      return { kind: 'sale', saleId: payment.saleId, paymentId: payment.paymentId };
    }

    return null;
  };

  const handleDeletePayment = async (deleteMeta) => {
    if (deleteMeta.kind === 'sale') {
      await api.deleteSalePayment(token, deleteMeta.saleId, deleteMeta.paymentId);
    } else {
      await api.deleteCustomerPayment(token, deleteMeta.customerId, deleteMeta.paymentId);
    }
    await loadAccount();
  };

  const openPaymentDetail = (payment) => {
    setDetailModal({
      title:
        payment.type === 'opening_balance_payment'
          ? 'Opening Balance Payment'
          : 'Sale Payment',
      details: payment,
      deleteMeta: getPaymentDeleteMeta(payment),
    });
  };

  const openSaleDetail = (sale) =>
    setDetailModal({
      title: 'Sale Details',
      details: {
        id: sale._id,
        customerName: sale.customer?.name || sale.customerName,
        paymentType: sale.paymentType,
        soldAt: sale.soldAt,
        sellingTotal: sale.sellingTotal,
        amountPaid: sale.amountPaid,
        remainingAmount: sale.remainingAmount,
        manufacturingTotal: sale.manufacturingTotal,
        profit: sale.profit,
        items: sale.items,
        payments: sale.payments,
      },
    });

  const openTimelineItem = (item) => {
    if (item.kind === 'sale') {
      openSaleDetail(item.record);
      return;
    }
    setDetailModal({
      title: item.record.type === 'opening_balance_payment' ? 'Opening Balance Payment' : 'Sale Payment',
      details: item.record,
      deleteMeta: getPaymentDeleteMeta(item.record),
    });
  };

  const receivePayment = () =>
    navigate(`/org/setup/payments/new?customerId=${customerId}`, {
      state: { customerId, customerName: customer?.name },
    });

  const newSale = () =>
    navigate(`/org/setup/sales/new?customerId=${customerId}`, {
      state: { customerId, customerName: customer?.name },
    });

  if (loading && !account) {
    return (
      <Screen>
        <PageHeader title="Customer Account" backTo="/org/customers" />
        <Section title="Loading" icon="CST">
          <SkeletonList rows={4} />
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title={customer?.name || 'Customer Account'} backTo="/org/customers" />

      <Section title="Account" icon="CST">
        {customer ? (
          <div className="customer-meta">
            {customer.phone ? <span className="customer-meta-item">{customer.phone}</span> : null}
            {customer.email ? <span className="customer-meta-item">{customer.email}</span> : null}
            {customer.address ? <span className="customer-meta-item">{customer.address}</span> : null}
          </div>
        ) : null}

        {summary ? (
          <>
            <MoneyHero
              label="Total Outstanding"
              amount={totalOutstanding}
              variant="outstanding"
              sublabel={totalOutstanding <= 0 ? 'This customer is fully paid' : 'Opening balance + pending credit sales'}
            />
            <div className="money-breakdown">
              <MoneyRow label="Opening Balance" amount={summary.openingBalance} />
              <MoneyRow label="Pending from Sales" amount={summary.creditSalesOutstanding} />
              <MoneyRow label="Total Outstanding" amount={totalOutstanding} highlight />
            </div>
          </>
        ) : null}

        <ErrorBanner message={error} onRetry={loadAccount} />

        <div className="secondary-actions-menu">
          <button type="button" className="btn" onClick={newSale}>New Sale</button>
          {['admin', 'manager'].includes(user?.role) ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate('/org/setup/customers', { state: { editCustomerId: customerId } })}
            >
              Edit Customer
            </button>
          ) : null}
        </div>
      </Section>

      <Section title="History" icon="ACT">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'sales', label: 'Sales' },
            { id: 'payments', label: 'Payments' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'overview' && (
          <RecordList
            title="Recent Activity"
            data={recentTimeline}
            loading={loading}
            mobileLayout="cards"
            emptyTitle="No activity yet"
            emptyMessage="Sales and payments will appear here."
            columns={[
              {
                key: 'date',
                title: 'Date',
                render: (row) => (row.date ? new Date(row.date).toLocaleDateString() : '-'),
              },
              {
                key: 'label',
                title: 'Type',
                render: (row) =>
                  row.kind === 'sale' ? (
                    <span>{row.label} {paymentTypeBadge(row.record?.paymentType)}</span>
                  ) : (
                    row.label
                  ),
              },
              {
                key: 'amount',
                title: 'Amount',
                render: (row) => <span className="amount-cell">{formatMoney(row.amount)}</span>,
              },
            ]}
            onRowPress={openTimelineItem}
          />
        )}

        {activeTab === 'sales' && (
          <RecordList
            title="All Sales"
            data={account?.sales || []}
            loading={loading}
            mobileLayout="cards"
            cardVariant="sale"
            emptyTitle="No sales yet"
            emptyActionLabel="New Sale"
            onEmptyAction={newSale}
            columns={[
              { key: 'soldAt', title: 'Date' },
              {
                key: 'paymentType',
                title: 'Type',
                render: (sale) => paymentTypeBadge(sale.paymentType),
              },
              {
                key: 'sellingTotal',
                title: 'Total',
                render: (sale) => <span className="amount-cell">{formatMoney(sale.sellingTotal)}</span>,
              },
              {
                key: 'remainingAmount',
                title: 'Remaining',
                render: (sale) => <span className="amount-cell">{formatMoney(sale.remainingAmount)}</span>,
              },
            ]}
            onRowPress={openSaleDetail}
          />
        )}

        {activeTab === 'payments' && (
          <RecordList
            title="All Payments"
            data={account?.payments || []}
            loading={loading}
            mobileLayout="cards"
            cardVariant="payment"
            emptyTitle="No payments yet"
            emptyMessage="Payments against opening balance and credit sales appear here."
            emptyActionLabel="Receive Payment"
            onEmptyAction={receivePayment}
            columns={[
              { key: 'paymentDate', title: 'Date' },
              {
                key: 'type',
                title: 'Type',
                render: (row) =>
                  row.type === 'opening_balance_payment' ? (
                    <Badge variant="warning">Opening Balance</Badge>
                  ) : (
                    <Badge variant="success">Credit Sale</Badge>
                  ),
              },
              {
                key: 'paymentAmount',
                title: 'Amount',
                render: (row) => <span className="amount-cell">{formatMoney(row.paymentAmount)}</span>,
              },
              { key: 'note', title: 'Note' },
            ]}
            onRowPress={openPaymentDetail}
          />
        )}
      </Section>

      <div className="sticky-action-bar">
        <button type="button" className="btn success" onClick={receivePayment}>
          Receive Payment
        </button>
      </div>

      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
          onDelete={
            detailModal.deleteMeta
              ? async () => handleDeletePayment(detailModal.deleteMeta)
              : undefined
          }
          deleteLabel="Delete Payment"
        />
      )}
    </Screen>
  );
}
