import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import {
  ErrorBanner,
  FormGroup,
  FormSteps,
  PageHeader,
  Screen,
  Section,
  Select,
} from '../../components/ui';

export default function PaymentsCreate() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const presetCustomerId = searchParams.get('customerId') || location.state?.customerId || '';
  const returnTo = presetCustomerId ? `/org/customers/${presetCustomerId}` : '/org/setup/payments';

  const [step, setStep] = useState(1);
  const [outstanding, setOutstanding] = useState([]);
  const [saleId, setSaleId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(presetCustomerId);
  const [paymentMode, setPaymentMode] = useState(presetCustomerId ? 'customer' : 'sale');
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

      if (presetCustomerId) {
        const customerSales = outstandingData.filter(
          (sale) => String(sale.customer?._id || sale.customer) === String(presetCustomerId)
        );
        if (customerSales[0]?._id) {
          setSaleId(customerSales[0]._id);
          setPaymentMode('sale');
        }
      } else {
        if (!saleId && outstandingData[0]?._id) setSaleId(outstandingData[0]._id);
        if (!customerId && customerData[0]?._id) setCustomerId(customerData[0]._id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const receivePayment = async () => {
    try {
      const amount = Number(paymentAmount || 0);
      if (!amount || amount <= 0) {
        setError('Enter a valid payment amount');
        setStep(2);
        return;
      }

      if (paymentMode === 'sale') {
        if (!saleId) {
          setError('Select a credit sale first');
          setStep(1);
          return;
        }
        await api.receiveSalePayment(token, saleId, { amount, note: paymentNote });
      } else {
        if (!customerId) {
          setError('Select a customer first');
          setStep(1);
          return;
        }
        await api.receiveCustomerPayment(token, customerId, { amount, note: paymentNote });
      }

      navigate(returnTo);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadOutstanding();
  }, []);

  const saleOptions = presetCustomerId
    ? outstanding.filter((sale) => String(sale.customer?._id || sale.customer) === String(presetCustomerId))
    : outstanding;

  const goNext = () => {
    if (step === 1) {
      if (paymentMode === 'sale' && !saleId) {
        setError('Select a credit sale');
        return;
      }
      if (paymentMode === 'customer' && !customerId) {
        setError('Select a customer');
        return;
      }
    }
    setError('');
    setStep(2);
  };

  return (
    <Screen>
      <PageHeader title="Receive Payment" backTo={returnTo} />
      <Section title="Payment" icon="NEW">
        <FormSteps steps={['Target', 'Amount']} current={step} />
        <ErrorBanner message={error} />

        {step === 1 && (
          <FormGroup title="What are you collecting?">
            <div className="field-label">Payment Type</div>
            <Select
              value={paymentMode}
              onChange={setPaymentMode}
              placeholder="Select payment type"
              items={[
                { label: 'Credit Sale Payment', value: 'sale' },
                { label: 'Opening Balance Payment', value: 'customer' },
              ]}
            />

            {paymentMode === 'sale' ? (
              <>
                <div className="field-label">Credit Sale</div>
                <Select
                  value={saleId}
                  onChange={setSaleId}
                  placeholder="Select credit sale"
                  items={saleOptions.map((sale) => ({
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
          </FormGroup>
        )}

        {step === 2 && (
          <FormGroup title="Payment details">
            <label className="field-label">Payment Amount</label>
            <input
              className="input"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount received"
              type="number"
            />
            <label className="field-label">Note (optional)</label>
            <input className="input" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Payment note" />
          </FormGroup>
        )}

        <div className="form-footer-sticky">
          <div className="actions-row">
            {step > 1 ? (
              <button type="button" className="btn ghost" onClick={() => setStep(1)}>Back</button>
            ) : (
              <button type="button" className="btn ghost" onClick={() => navigate(returnTo)}>Cancel</button>
            )}
            {step < 2 ? (
              <button type="button" className="btn" onClick={goNext}>Next</button>
            ) : (
              <button type="button" className="btn success" onClick={receivePayment}>Receive Payment</button>
            )}
          </div>
        </div>
      </Section>
    </Screen>
  );
}
