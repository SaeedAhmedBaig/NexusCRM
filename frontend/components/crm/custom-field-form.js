'use client';

export const CUSTOM_FIELD_OBJECT_TYPES = {
  leads: 'Lead',
  contacts: 'Contact',
  companies: 'Company',
  deals: 'Deal',
  requests: 'Request',
  quotations: 'Quotation',
  orders: 'Order',
  invoices: 'Invoice',
  products: 'Product',
  tickets: 'Ticket',
  'ticket-queues': 'TicketQueue',
  'ticket-macros': 'TicketMacro',
  sms: 'SmsCampaign',
  knowledge: 'KnowledgeArticle',
  automation: 'AutomationRule',
  'live-chat': 'LiveChatSession',
};

const EMPTY_VALUES = new Set([undefined, null, '']);

export function getCustomFieldObjectType(entity) {
  return CUSTOM_FIELD_OBJECT_TYPES[entity] || null;
}

export function normalizeCustomField(field) {
  return {
    key: `customFields.${field.key}`,
    customKey: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    helpText: field.helpText || field.description,
    defaultValue: field.defaultValue,
    options: (field.options || []).map((option) => ({
      value: option.value,
      label: option.label,
    })),
  };
}

export function buildInitialForm(baseDefaults = {}, customFields = []) {
  const customDefaults = {};
  customFields.forEach((field) => {
    if (!EMPTY_VALUES.has(field.defaultValue)) customDefaults[field.customKey] = field.defaultValue;
  });
  return {
    ...baseDefaults,
    customFields: {
      ...customDefaults,
      ...(baseDefaults.customFields || {}),
    },
  };
}

export function getFieldValue(values = {}, field) {
  if (field.customKey) return values.customFields?.[field.customKey] ?? '';
  return values[field.key] ?? '';
}

export function setFieldValue(values = {}, field, value) {
  if (!field.customKey) return { ...values, [field.key]: value };
  return {
    ...values,
    customFields: {
      ...(values.customFields || {}),
      [field.customKey]: value,
    },
  };
}

function normalizeValue(field, value) {
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'number' || field.type === 'currency') {
    return value === '' || value === null || value === undefined ? null : Number(value);
  }
  if (field.type === 'multiselect') {
    return Array.isArray(value) ? value : [];
  }
  return value;
}

export function buildPayload(values = {}, baseFields = [], customFields = []) {
  const payload = Object.fromEntries(baseFields.map((field) => [field.key, values[field.key]]));
  if (customFields.length > 0) {
    payload.customFields = {};
    customFields.forEach((field) => {
      const value = normalizeValue(field, values.customFields?.[field.customKey]);
      if (field.required || !EMPTY_VALUES.has(value) || value === false) {
        payload.customFields[field.customKey] = value;
      }
    });
  }
  return payload;
}

export function formatCustomFieldValue(field, value) {
  if (value === undefined || value === null || value === '') return '—';
  if (field.type === 'checkbox') return value ? 'Yes' : 'No';
  if (field.type === 'date' || field.type === 'datetime') return new Date(value).toLocaleString();
  if (field.type === 'currency') return `$${Number(value || 0).toLocaleString()}`;
  if (field.type === 'multiselect' && Array.isArray(value)) {
    return value
      .map((item) => field.options?.find((option) => option.value === item)?.label || item)
      .join(', ') || '—';
  }
  if (field.type === 'select') {
    return field.options?.find((option) => option.value === value)?.label || value;
  }
  return String(value);
}
