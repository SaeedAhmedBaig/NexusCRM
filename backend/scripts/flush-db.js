/**
 * Clears all CRM auth/tenant data from MongoDB.
 * Usage: node scripts/flush-db.js
 */
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const COLLECTIONS = [
  'users',
  'tenants',
  'usertenants',
  'groups',
  'departments',
  'invitations',
  'leadsources',
  'deals',
  'tasks',
  'requests',
  'auditlogs',
  'activityevents',
  'customfields',
  'datajobs',
  'companies',
  'contacts',
  'leads',
  'payments',
  'crmemails',
  'attachments',
  'projects',
  'memos',
  'emailaccounts',
  'emailtemplates',
  'massmailcampaigns',
  'unsubscribes',
  'products',
  'quotations',
  'orders',
  'invoices',
  'tickets',
  'ticketqueues',
  'ticketmacros',
  'smscampaigns',
  'knowledgearticles',
  'automationrules',
  'automationruns',
  'reportexportjobs',
  'livechatsessions',
  'chatmessages',
  'notifications',
];

async function flush() {
  loadEnv();
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm_saas';

  console.log('Connecting to MongoDB…');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  for (const name of COLLECTIONS) {
    const collections = await db.listCollections({ name }).toArray();
    if (!collections.length) {
      console.log(`  skip ${name} (not found)`);
      continue;
    }
    const result = await db.collection(name).deleteMany({});
    console.log(`  cleared ${name}: ${result.deletedCount} documents`);
  }

  // Remove broken customDomain:null values that block unique index
  const tenantCollections = await db.listCollections({ name: 'tenants' }).toArray();
  if (tenantCollections.length) {
    const unset = await db.collection('tenants').updateMany(
      { customDomain: null },
      { $unset: { customDomain: '' } },
    );
    if (unset.modifiedCount) {
      console.log(`  unset customDomain:null on ${unset.modifiedCount} tenants`);
    }
  }

  await mongoose.disconnect();
  console.log('Database flush complete.');
}

flush().catch((err) => {
  console.error('Flush failed:', err.message);
  process.exit(1);
});
