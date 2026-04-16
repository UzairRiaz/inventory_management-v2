import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordDetailModal, RecordList, Screen, Section } from '../../components/ui';

export default function CustomerSales() {
  const { token } = useAuth();
  const location = useLocation();
  const { customerId, customerName, openingBalance, totalOutstanding } = location.state || {};
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

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
        <div className="meta-text">Customer: <strong>{customerName || '-'}</strong></div>

        {/* Outstanding breakdown */}
        <div className="summary-box" style={{ marginBottom: 8 }}>
          <div className="summary-text">
            Opening Balance: {Number(openingBalance ?? 0).toLocaleString()}
          </div>
          <div className="summary-text">
            Pending from Sales: {sales.reduce((sum, sale) => sum + Number(sale.remainingAmount || 0), 0).toLocaleString()}
          </div>
          <div className="summary-text" style={{ borderTop: '1px solid #fed7aa', paddingTop: 6, marginTop: 2 }}>
            Total Outstanding (Opening + Pending) = {Number((openingBalance ?? 0) + sales.reduce((sum, sale) => sum + Number(sale.remainingAmount || 0), 0)).toLocaleString()}
          </div>
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
              })
            }
          />
        )}
      </Section>

      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
        />
      )}
    </Screen>
  );
}
