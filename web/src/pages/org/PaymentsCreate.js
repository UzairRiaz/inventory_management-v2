import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Screen, Section, Select } from '../../components/ui';

export default function PaymentsCreate() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [outstanding, setOutstanding] = useState([]);
  const [saleId, setSaleId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState('sale');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [error, setError] = useState('');

  const loadOutstanding = async () => {
    try {
      const [outstandingData, customerData] = await Promise.all([
        api.getOutstandingCreditSales(token),
        api.getCustomers(token),
      ]);
      setOutstanding(outstandingData);
      setCustomers(customerData || []);
      if (!saleId && outstandingData[0]?._id) setSaleId(outstandingData[0]._id);
      if (!customerId && customerData[0]?._id) setCustomerId(customerData[0]._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const receivePayment = async () => {
    try {
      const amount = Number(paymentAmount || 0);
      if (!amount || amount <= 0) {
        setError('Enter a valid payment amount');
        return;
      }

      if (paymentMode === 'sale') {
        if (!saleId) {
          setError('Select a credit sale first');
          return;
        }

        await api.receiveSalePayment(token, saleId, {
          amount,
          note: paymentNote,
        });
      } else {
        if (!customerId) {
          setError('Select a customer first');
          return;
        }

        await api.receiveCustomerPayment(token, customerId, {
          amount,
          note: paymentNote,
        });
      }

      navigate('/org/payments');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadOutstanding();
  }, []);

  return (
    <Screen>
      <Section title="Receive Payment" icon="NEW">
        <div className="field-label">Payment Type</div>
        <Select
          value={paymentMode}
          onChange={setPaymentMode}
          placeholder="Select payment type"
          items={[
            { label: 'Credit Sale Payment', value: 'sale' },
            { label: 'Customer Opening Outstanding', value: 'customer' },
          ]}
        />

        {paymentMode === 'sale' ? (
          <>
            <div className="field-label">Credit Sale</div>
            <Select
              value={saleId}
              onChange={setSaleId}
              placeholder="Select credit sale"
              items={outstanding.map((sale) => ({
                label: `${sale.customerName} | Remaining ${sale.remainingAmount}`,
                value: sale._id,
              }))}
            />
          </>
        ) : (
          <>
            <div className="field-label">Customer</div>
            <Select
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select customer"
              items={customers.map((customer) => ({
                label: `${customer.name} | Opening ${customer.openingBalance || 0}`,
                value: customer._id,
              }))}
            />
          </>
        )}

        <label className="field-label">Incoming Payment Amount</label>
        <input
          className="input"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder="Incoming payment amount"
        />

        <label className="field-label">Payment Note</label>
        <input className="input" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Payment note" />

        {error ? <div className="meta-text">{error}</div> : null}
        <div className="actions-row">
          <button className="btn success" onClick={receivePayment}>Receive Payment</button>
        </div>
      </Section>
    </Screen>
  );
}
