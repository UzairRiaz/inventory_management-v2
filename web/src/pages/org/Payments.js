import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordDetailModal, RecordList, Screen, Section } from '../../components/ui';

export default function Payments() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [outstanding, setOutstanding] = useState([]);
  const [outstandingByCustomer, setOutstandingByCustomer] = useState([]);
  const [incomingPayments, setIncomingPayments] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const loadPaymentData = useCallback(async () => {
    try {
      const [outstandingData, paymentData, customerPaymentData] = await Promise.all([
        api.getOutstandingCreditSales(token),
        api.getIncomingPayments(token),
        api.getCustomerPayments(token),
      ]);
      setOutstanding(outstandingData);
      setIncomingPayments(paymentData);
      setCustomerPayments(customerPaymentData);
      const customerOutstanding = await api.getOutstandingByCustomer(token);
      setOutstandingByCustomer(customerOutstanding);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  return (
    <Screen>
      <Section title="Payments" icon="PAY">
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/org/payments/new')}>Receive Payment</button>
        </div>
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Outstanding Credit Sales"
          data={outstanding}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'sellingTotal', title: 'Total' },
            { key: 'amountPaid', title: 'Paid' },
            { key: 'remainingAmount', title: 'Remaining' },
          ]}
          onRowPress={(sale) =>
            setDetailModal({ title: 'Outstanding Sale Details', details: sale })
          }
        />
        <RecordList
          title="Outstanding By Customer"
          data={outstandingByCustomer}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'totalOutstanding', title: 'Outstanding' },
            { key: 'totalSales', title: 'Sales' },
            { key: 'totalRemaining', title: 'Remaining' },
          ]}
          onRowPress={(row) =>
            navigate('/org/customer-sales', {
              state: {
                customerId: row.customerId,
                customerName: row.customerName,
                openingBalance: row.openingBalance,
                totalOutstanding: row.totalOutstanding,
              },
            })
          }
        />
        <RecordList
          title="Incoming Payments"
          data={incomingPayments}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'paymentAmount', title: 'Payment' },
            { key: 'remainingAmount', title: 'Remaining' },
            { key: 'paymentDate', title: 'Date' },
          ]}
          onRowPress={(payment) =>
            setDetailModal({
              title: 'Payment Details',
              details: payment,
              canDelete: !!(payment.paymentId && ['admin', 'manager'].includes(user?.role)),
              saleId: payment.saleId,
              paymentId: payment.paymentId,
            })
          }
        />
        <RecordList
          title="Customer Outstanding Payments"
          data={customerPayments}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'paymentAmount', title: 'Payment' },
            { key: 'remainingOutstanding', title: 'Remaining' },
            { key: 'paymentDate', title: 'Date' },
          ]}
          onRowPress={(payment) =>
            setDetailModal({ title: 'Customer Payment Details', details: payment })
          }
        />
      </Section>

      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
          onDelete={
            detailModal.canDelete
              ? async () => {
                  await api.deleteSalePayment(token, detailModal.saleId, detailModal.paymentId);
                  await loadPaymentData();
                }
              : undefined
          }
          deleteLabel="Delete Payment"
        />
      )}
    </Screen>
  );
}
