import { SuperadminGate } from '../../components/superadmin/superadmin-gate';

export const metadata = {
  title: 'Superadmin · NexusCRM',
  description: 'Platform administration for NexusCRM',
};

export default function SuperadminLayout({ children }) {
  return <SuperadminGate>{children}</SuperadminGate>;
}
