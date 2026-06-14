import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader, RecordDetailModal, RecordList, Screen, Section } from '../../components/ui';

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
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const loadPaymentData = useCallback(async () => {
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
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/org/setup/payments/new')}>Receive Payment</button>
        </div>
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="All Received Payments"
          data={allPayments}
          mobileLayout="cards"
          columns={[
            { key: 'paymentDate', title: 'Date' },
            { key: 'customerName', title: 'Customer' },
            { key: 'paymentKind', title: 'Type' },
            { key: 'paymentAmount', title: 'Amount' },
          ]}
          onRowPress={openPaymentDetail}
        />
      </Section>

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
