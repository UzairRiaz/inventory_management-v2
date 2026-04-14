import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordDetailModal, RecordList, Screen, Section } from '../../components/ui';

export default function Sales() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const loadSalesData = useCallback(async () => {
    try {
      const saleData = await api.getSales(token);
      setSales(saleData);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  return (
    <Screen>
      <Section title="Sales" icon="SAL">
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/org/sales/new')}>New Sale</button>
        </div>
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Sales"
          data={sales}
          columns={[
            { key: 'customerName', title: 'Customer', render: (sale) => sale.customer?.name || sale.customerName },
            { key: 'soldAt', title: 'Date' },
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
                customerName: sale.customerName,
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
              canDelete: ['admin', 'manager'].includes(user?.role),
              saleId: sale._id,
            })
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
                  await api.deleteSale(token, detailModal.saleId);
                  const saleData = await api.getSales(token);
                  setSales(saleData);
                }
              : undefined
          }
          deleteLabel="Delete Sale"
        />
      )}
    </Screen>
  );
}
