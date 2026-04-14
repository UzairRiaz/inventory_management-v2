import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../components/ui';

export default function Home() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState({ users: 0, items: 0, stock: 0, ledger: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      const [users, items, stock, ledger, sales, payments, outstandingByCustomer, purchaseSummary] =
        await Promise.all([
          api.getUsers(token),
          api.getItems(token),
          api.getStock(token),
          api.getLedger(token),
          api.getSales(token),
          api.getIncomingPayments(token),
          api.getOutstandingByCustomer(token),
          api.getPurchaseSummary(token),
        ]);

      setSummary({ users: users.length, items: items.length, stock: stock.length, ledger: ledger.length });
      setRecentSales(sales.slice(0, 5));
      setRecentPayments(payments.slice(0, 5));

      // Total to receive = sum of (openingBalance + pending credit sales) per customer
      const receive = outstandingByCustomer.reduce(
        (sum, row) => sum + Number(row.totalOutstanding || 0),
        0,
      );
      setTotalToReceive(receive);

      // Total to pay = sum of remaining on credit purchases
      setTotalToPay(Number(purchaseSummary.totalToPay || 0));

      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <Screen>
      <Section title="Organization Dashboard" icon="H">
        <div className="meta-text">User: {user?.name}</div>
        <div className="meta-text">Role: {user?.role}</div>
        <div className="meta-text">Organization: {user?.organizationName || user?.organizationId}</div>

        {/* Finance summary cards */}
        <div className="finance-cards">
          <div className="finance-card receive">
            <div className="finance-card-label">💰 Amount to Receive</div>
            <div className="finance-card-amount">{totalToReceive.toLocaleString()}</div>
            <div className="finance-card-sub">Opening balance + pending credit sales</div>
          </div>
          <div className="finance-card pay">
            <div className="finance-card-label">🧾 Amount to Pay</div>
            <div className="finance-card-amount">{totalToPay.toLocaleString()}</div>
            <div className="finance-card-sub">Unpaid credit purchases to suppliers</div>
          </div>
        </div>

        <div className="meta-text">Users: {summary.users}</div>
        <div className="meta-text">Items: {summary.items}</div>
        <div className="meta-text">Stock records: {summary.stock}</div>
        <div className="meta-text">Ledger entries: {summary.ledger}</div>
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Recent Sales"
          data={recentSales}
          columns={[
            { key: 'soldAt', title: 'Date' },
            { key: 'customerName', title: 'Customer' },
            { key: 'sellingTotal', title: 'Total' },
          ]}
        />
        <RecordList
          title="Recent Payments"
          data={recentPayments}
          columns={[
            { key: 'paymentDate', title: 'Date' },
            { key: 'customerName', title: 'Customer' },
            { key: 'paymentAmount', title: 'Amount' },
          ]}
        />
      </Section>
    </Screen>
  );
}
