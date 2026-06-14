import React from 'react';
import { Screen, Section, SetupMenuGroup } from '../../../components/ui';

export default function SetupHome() {
  return (
    <Screen>
      <Section title="Setup" icon="SET">
        <SetupMenuGroup
          title="Daily Operations"
          items={[
            { label: 'Sales', sub: 'View all sales', icon: 'cart', path: '/org/setup/sales' },
            { label: 'New Sale', sub: 'Create a sale', icon: 'plus', path: '/org/setup/sales/new' },
            { label: 'Receive Payment', sub: 'Collect from customer', icon: 'dollar', path: '/org/setup/payments/new' },
            { label: 'Payment History', sub: 'All received payments', icon: 'ledger', path: '/org/setup/payments' },
          ]}
        />
        <SetupMenuGroup
          title="Master Data"
          items={[
            { label: 'Items', sub: 'Products & raw materials', icon: 'box', path: '/org/setup/items' },
            { label: 'Vendors', sub: 'Raw material suppliers', icon: 'truck', path: '/org/setup/vendors' },
            { label: 'Warehouses', sub: 'Storage locations', icon: 'warehouse', path: '/org/setup/warehouses' },
            { label: 'Customers', sub: 'Add & edit customers', icon: 'users', path: '/org/setup/customers' },
            { label: 'Users', sub: 'Team access', icon: 'users', path: '/org/setup/users' },
          ]}
        />
        <SetupMenuGroup
          title="Finance & Reports"
          items={[
            { label: 'Ledger', sub: 'Manual entries', icon: 'ledger', path: '/org/ledger' },
            { label: 'Profit', sub: 'Sales profit report', icon: 'profit', path: '/org/setup/profit', variant: 'warning' },
            { label: 'Notes', sub: 'Credit & debit notes', icon: 'note', path: '/org/setup/notes' },
            { label: 'Activity Log', sub: 'Audit trail', icon: 'activity', path: '/org/setup/activity' },
          ]}
        />
      </Section>
    </Screen>
  );
}
