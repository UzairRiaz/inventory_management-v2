import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../components/ui';

export default function Payments() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [outstanding, setOutstanding] = useState([]);
  const [outstandingByCustomer, setOutstandingByCustomer] = useState([]);
  const [incomingPayments, setIncomingPayments] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [error, setError] = useState('');

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
            navigate('/org/detail', {
              state: {
                title: 'Outstanding Sale Details',
                details: sale,
              },
            })
          }
        />
        <RecordList
          title="Outstanding By Customer"
          data={outstandingByCustomer}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'totalOutstanding', title: 'Outstanding' },
            { key: 'totalSales', title: 'Sales' },
            { key: 'lastSaleDate', title: 'Last Sale' },
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
            navigate('/org/detail', {
              state: {
                title: 'Payment Details',
                details: payment,
                deleteAction: payment.paymentId && ['admin', 'manager'].includes(user?.role)
                  ? {
                      type: 'payment',
                      saleId: payment.saleId,
                      paymentId: payment.paymentId,
                      label: 'Delete Payment',
                    }
                  : null,
              },
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
            navigate('/org/detail', {
              state: {
                title: 'Customer Payment Details',
                details: payment,
              },
            })
          }
        />
      </Section>
    </Screen>
  );
}
