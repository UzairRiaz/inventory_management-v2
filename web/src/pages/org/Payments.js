import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import {
  ErrorBanner,
  PageHeader,
  RecordDetailModal,
  RecordList,
  Screen,
  Section,
  SkeletonList,
} from '../../components/ui';

function getPaymentDeleteMeta(payment, user) {
  if (!['admin', 'manager'].includes(user?.role) || !payment.paymentId) {
    return null;
  }

  if (payment.saleId) {
    return { kind: 'sale', saleId: payment.saleId, paymentId: payment.paymentId };
  }

  const customerId = payment.customerId || payment.customer?._id || payment.customer;
  if (payment.type === 'opening_balance_payment' && customerId) {
    return { kind: 'customer', customerId: String(customerId), paymentId: payment.paymentId };
  }

  return null;
}

export default function Payments() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [incomingPayments, setIncomingPayments] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const loadPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentData, customerPaymentData] = await Promise.all([
        api.getIncomingPayments(token),
        api.getCustomerPayments(token),
      ]);
      setIncomingPayments(paymentData);
      setCustomerPayments(customerPaymentData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const allPayments = useMemo(() => {
    const saleRows = incomingPayments.map((payment) => ({
      ...payment,
      paymentKind: 'Credit Sale',
    }));
    const openingRows = customerPayments.map((payment) => ({
      ...payment,
      paymentKind: 'Opening Balance',
      paymentId: payment._id || payment.paymentId,
      customerId: payment.customer?._id || payment.customer,
      customerName: payment.customer?.name || payment.customerName,
    }));
    return [...saleRows, ...openingRows].sort(
      (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
    );
  }, [incomingPayments, customerPayments]);

  const openPaymentDetail = (payment) => {
    const deleteMeta = getPaymentDeleteMeta(payment, user);
    setDetailModal({
      title: 'Payment Details',
      details: payment,
      deleteMeta,
    });
  };

  const handleDeletePayment = async (deleteMeta) => {
    if (deleteMeta.kind === 'sale') {
      await api.deleteSalePayment(token, deleteMeta.saleId, deleteMeta.paymentId);
    } else {
      await api.deleteCustomerPayment(token, deleteMeta.customerId, deleteMeta.paymentId);
    }
    await loadPaymentData();
  };

  return (
    <Screen>
      <PageHeader title="Payment History" backTo="/org/setup" />
      <Section title="Payments" icon="PAY">
        <ErrorBanner message={error} onRetry={loadPaymentData} />
        {loading ? (
          <SkeletonList rows={5} />
        ) : (
          <RecordList
            title="All Received Payments"
            data={allPayments}
            mobileLayout="cards"
            cardVariant="payment"
            emptyTitle="No payments yet"
            emptyMessage="Received payments from customers will appear here."
            emptyActionLabel="Receive Payment"
            onEmptyAction={() => navigate('/org/setup/payments/new')}
            columns={[
              { key: 'paymentDate', title: 'Date' },
              { key: 'customerName', title: 'Customer' },
              { key: 'paymentKind', title: 'Type' },
              { key: 'paymentAmount', title: 'Amount' },
              { key: 'note', title: 'Note' },
            ]}
            onRowPress={openPaymentDetail}
          />
        )}
      </Section>

      <div className="sticky-action-bar">
        <button type="button" className="btn success" onClick={() => navigate('/org/setup/payments/new')}>
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
