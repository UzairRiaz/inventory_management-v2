import React, { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Screen, Section } from '../../components/ui';

export default function Profit() {
  const { token } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const loadProfit = async () => {
    try {
      const data = await api.getSalesProfit(token, from || undefined, to || undefined);
      setSummary(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Screen>
      <Section title="Profit Calculation (Date Range)" icon="PRO">
        <label className="field-label">From Date</label>
        <input className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From (YYYY-MM-DD)" />
        <label className="field-label">To Date</label>
        <input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To (YYYY-MM-DD)" />
        {error ? <div className="meta-text">{error}</div> : null}
        <div className="actions-row">
          <button className="btn warning" onClick={loadProfit}>Calculate Profit</button>
        </div>
        {summary ? (
          <div className="summary-box">
            <div className="summary-text">Manufacturing Total: {summary.manufacturingTotal}</div>
            <div className="summary-text">Selling Total: {summary.sellingTotal}</div>
            <div className="summary-text">Profit: {summary.profit}</div>
            <div className="summary-text">Total Sales: {summary.totalSales}</div>
          </div>
        ) : null}
      </Section>
    </Screen>
  );
}
