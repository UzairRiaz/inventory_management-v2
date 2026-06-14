import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import {
  ErrorBanner,
  FormGroup,
  FormSteps,
  formatMoney,
  PageHeader,
  Screen,
  Section,
  Select,
} from '../../components/ui';

export default function SalesCreate() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const presetCustomerId = searchParams.get('customerId') || location.state?.customerId || '';
  const returnTo = presetCustomerId ? `/org/customers/${presetCustomerId}` : '/org/setup/sales';

  const [step, setStep] = useState(1);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(presetCustomerId);
  const [customerName, setCustomerName] = useState(location.state?.customerName || '');
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitSellingPrice, setUnitSellingPrice] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [paymentType, setPaymentType] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [error, setError] = useState('');

  const canCreateSales = ['admin', 'manager', 'staff'].includes(user.role);

  const loadOptions = async () => {
    try {
      const [warehouseData, itemData, stockData, customerData] = await Promise.all([
        api.getWarehouses(token),
        api.getItems(token),
        api.getStock(token),
        api.getCustomers(token),
      ]);
      setWarehouses(warehouseData);
      setItems(itemData);
      setStock(stockData);
      setCustomers(customerData);
      if (!warehouseId && warehouseData[0]?._id) setWarehouseId(warehouseData[0]._id);
      if (!itemId && itemData[0]?._id) setItemId(itemData[0]._id);
      if (!customerId && customerData[0]?._id && !presetCustomerId) setCustomerId(customerData[0]._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const saleTotal = useMemo(() => {
    return saleItems.reduce((sum, line) => {
      const price = line.unitSellingPrice != null && line.unitSellingPrice !== ''
        ? Number(line.unitSellingPrice)
        : Number(items.find((i) => i._id === line.itemId)?.sellingPrice || 0);
      return sum + price * Number(line.quantity || 0);
    }, 0);
  }, [saleItems, items]);

  const createSale = async () => {
    try {
      if (!canCreateSales) {
        setError('You do not have permission to create sales');
        return;
      }
      if (saleItems.length === 0) {
        setError('Add at least one item to the sale');
        setStep(2);
        return;
      }
      if (!customerId && !customerName) {
        setError('Select a customer or enter a customer name');
        setStep(1);
        return;
      }

      const payload = {
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        warehouseId,
        paymentType,
        items: saleItems.map((line) => {
          const saleLine = { itemId: line.itemId, quantity: Number(line.quantity || 0) };
          if (line.unitSellingPrice !== undefined && line.unitSellingPrice !== null && line.unitSellingPrice !== '') {
            saleLine.unitSellingPrice = Number(line.unitSellingPrice);
          }
          return saleLine;
        }),
      };

      if (paymentType === 'credit' && amountPaid !== '') {
        payload.amountPaid = Number(amountPaid || 0);
      }

      await api.createSale(token, payload);
      navigate(returnTo);
    } catch (err) {
      setError(err.message);
    }
  };

  const addItemLine = () => {
    const nextQuantity = Number(quantity || 0);
    const nextUnitSellingPrice = unitSellingPrice === '' ? null : Number(unitSellingPrice);
    const alreadySelectedQty = Number(saleItems.find((line) => line.itemId === itemId)?.quantity || 0);
    const requestedTotalQty = alreadySelectedQty + nextQuantity;
    const availableQty = getAvailableQuantity(itemId, warehouseId);

    if (!itemId) { setError('Select an item'); return; }
    if (nextQuantity <= 0) { setError('Quantity must be greater than 0'); return; }
    if (requestedTotalQty > availableQty) {
      setError(`Only ${availableQty} units available in selected warehouse`);
      return;
    }
    if (nextUnitSellingPrice !== null && nextUnitSellingPrice <= 0) {
      setError('Override price must be greater than 0');
      return;
    }

    setSaleItems((prev) => {
      const existingIndex = prev.findIndex((line) => line.itemId === itemId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Number(next[existingIndex].quantity || 0) + nextQuantity,
          unitSellingPrice: nextUnitSellingPrice !== null ? nextUnitSellingPrice : next[existingIndex].unitSellingPrice,
        };
        return next;
      }
      return [...prev, { itemId, quantity: nextQuantity, unitSellingPrice: nextUnitSellingPrice }];
    });

    setQuantity('1');
    setUnitSellingPrice('');
    setError('');
  };

  const removeItemLine = (lineItemId) => {
    setSaleItems((prev) => prev.filter((line) => line.itemId !== lineItemId));
  };

  const getItemLabel = (lineItemId) => {
    const item = items.find((entry) => entry._id === lineItemId);
    return item ? item.name : lineItemId;
  };

  const getItemDefaultSellingPrice = (lineItemId) => {
    const item = items.find((entry) => entry._id === lineItemId);
    return item ? item.sellingPrice : '-';
  };

  const getEntityId = (entity) => (typeof entity === 'object' && entity !== null ? entity._id : entity);

  const getAvailableQuantity = (selectedItemId, selectedWarehouseId) => {
    const matchingStock = stock.find((entry) => {
      const entryItemId = getEntityId(entry.item);
      const entryWarehouseId = getEntityId(entry.warehouse);
      return entryItemId === selectedItemId && entryWarehouseId === selectedWarehouseId;
    });
    return Number(matchingStock?.quantity || 0);
  };

  const availableQuantity = getAvailableQuantity(itemId, warehouseId);
  const selectedQuantity = Number(saleItems.find((line) => line.itemId === itemId)?.quantity || 0);
  const remainingAfterSelection = Math.max(0, availableQuantity - selectedQuantity);

  const goNext = () => {
    if (step === 1 && !customerId && !customerName) {
      setError('Select a customer or enter a customer name');
      return;
    }
    if (step === 2 && saleItems.length === 0) {
      setError('Add at least one item');
      return;
    }
    setError('');
    setStep((s) => Math.min(3, s + 1));
  };

  useEffect(() => {
    loadOptions();
  }, []);

  return (
    <Screen>
      <PageHeader title="New Sale" backTo={returnTo} />
      <Section title="New Sale" icon="NEW">
        <FormSteps steps={['Customer', 'Items', 'Payment']} current={step} />
        <ErrorBanner message={error} />

        {step === 1 && (
          <FormGroup title="Customer">
            <div className="field-label">Select Customer</div>
            <Select
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select customer"
              items={customers.map((customer) => ({ label: customer.name, value: customer._id }))}
            />
            <div className="meta-text">Or enter name for walk-in customer</div>
            <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
            <div className="field-label">Warehouse</div>
            <Select
              value={warehouseId}
              onChange={setWarehouseId}
              placeholder="Select warehouse"
              items={warehouses.map((warehouse) => ({ label: warehouse.name, value: warehouse._id }))}
            />
          </FormGroup>
        )}

        {step === 2 && (
          <FormGroup title="Items">
            <div className="field-label">Item</div>
            <Select
              value={itemId}
              onChange={setItemId}
              placeholder="Select item"
              items={items.map((item) => ({ label: `${item.name} (Sell ${item.sellingPrice})`, value: item._id }))}
            />
            <div className="meta-text">Available: {availableQuantity} · Remaining: {remainingAfterSelection}</div>
            <label className="field-label">Quantity</label>
            <input className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" />
            <label className="field-label">Price Override (optional)</label>
            <input className="input" value={unitSellingPrice} onChange={(e) => setUnitSellingPrice(e.target.value)} placeholder="Default item price used if blank" />
            <div className="actions-row">
              <button type="button" className="btn secondary" onClick={addItemLine}>Add Item</button>
            </div>

            {saleItems.length > 0 ? (
              <div className="card-list">
                {saleItems.map((line) => (
                  <div key={line.itemId} className="card">
                    <div className="card-text">
                      {getItemLabel(line.itemId)} · Qty {line.quantity} · {formatMoney(
                        (line.unitSellingPrice ?? getItemDefaultSellingPrice(line.itemId)) * line.quantity
                      )}
                    </div>
                    <button type="button" className="btn danger" onClick={() => removeItemLine(line.itemId)}>Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="meta-text">No items added yet</div>
            )}

            <div className="sale-total-bar">
              <span>Sale Total</span>
              <span>{formatMoney(saleTotal)}</span>
            </div>
          </FormGroup>
        )}

        {step === 3 && (
          <FormGroup title="Payment">
            <div className="sale-total-bar">
              <span>Total to Pay</span>
              <span>{formatMoney(saleTotal)}</span>
            </div>
            <div className="field-label">Payment Type</div>
            <Select
              value={paymentType}
              onChange={setPaymentType}
              placeholder="Select payment type"
              items={[
                { label: 'Cash', value: 'cash' },
                { label: 'Credit', value: 'credit' },
              ]}
            />
            {paymentType === 'credit' ? (
              <>
                <label className="field-label">Initial Amount Paid (optional)</label>
                <input className="input" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="Amount paid now" />
              </>
            ) : null}
          </FormGroup>
        )}

        <div className="form-footer-sticky">
          <div className="actions-row">
            {step > 1 ? (
              <button type="button" className="btn ghost" onClick={() => setStep((s) => s - 1)}>Back</button>
            ) : (
              <button type="button" className="btn ghost" onClick={() => navigate(returnTo)}>Cancel</button>
            )}
            {step < 3 ? (
              <button type="button" className="btn" onClick={goNext}>Next</button>
            ) : (
              <button type="button" className="btn success" onClick={createSale}>Create Sale</button>
            )}
          </div>
        </div>
      </Section>
    </Screen>
  );
}
