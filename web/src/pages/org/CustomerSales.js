import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../components/ui';

export default function CustomerSales() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId, customerName, openingBalance, totalOutstanding } = location.state || {};
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');

  const loadSales = useCallback(async () => {
    try {
      const data = await api.getSalesByCustomer(token, customerId, customerName);
      setSales(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token, customerId, customerName]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return (
    <Screen>
      <Section title="Customer Sales" icon="CST">
        <div className="meta-text">Customer: {customerName || '-'}</div>
        <div className="meta-text">Opening Outstanding: {openingBalance ?? 0}</div>
        <div className="meta-text">Total Outstanding: {totalOutstanding ?? '-'}</div>
        <div className="meta-text">
          Outstanding from Sales: {sales.reduce((sum, sale) => sum + Number(sale.remainingAmount || 0), 0)}
        </div>
        {error ? <div className="meta-text">{error}</div> : null}
        {sales.length === 0 ? (
          <div className="meta-text">No sales found for this customer.</div>
        ) : (
          <RecordList
            title="Sales"
            data={sales}
            columns={[
              { key: 'soldAt', title: 'Date' },
              { key: 'customerName', title: 'Customer', render: (sale) => sale.customer?.name || sale.customerName },
              { key: 'paymentType', title: 'Type', render: (sale) => String(sale.paymentType || '').toUpperCase() },
              { key: 'sellingTotal', title: 'Total' },
              { key: 'amountPaid', title: 'Paid' },
              { key: 'remainingAmount', title: 'Remaining' },
            ]}
            onRowPress={(sale) =>
              navigate('/org/detail', {
                state: {
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
                },
              })
            }
          />
        )}
      </Section>
    </Screen>
  );
}
