const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const PDFDocument = require('pdfkit');
const { CrmListService } = require('../crm/crm-list.service');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const DOCUMENT_CONFIG = {
  quotations: {
    type: 'Quotation',
    modelProp: 'quotationModel',
    numberField: 'number',
    prefix: 'QT',
    hrefBase: '/sales/quotations',
    searchFields: ['title', 'number', 'status'],
  },
  orders: {
    type: 'Order',
    modelProp: 'orderModel',
    numberField: 'orderNumber',
    prefix: 'SO',
    hrefBase: '/sales/orders',
    searchFields: ['title', 'orderNumber', 'status'],
  },
  invoices: {
    type: 'Invoice',
    modelProp: 'invoiceModel',
    numberField: 'invoiceNumber',
    prefix: 'INV',
    hrefBase: '/sales/invoices',
    searchFields: ['title', 'invoiceNumber', 'status'],
  },
};

function generatedNumber(prefix) {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

function formatUser(user) {
  if (!user || typeof user !== 'object') return null;
  return { id: user._id?.toString() || user.id, name: user.name || user.email || 'User', email: user.email || '' };
}

function formatDocument(row, config) {
  const base = leanId(row);
  base.name = row.title;
  base.number = row[config.numberField];
  base.amount = row.grandTotal || row.amount || 0;
  if (row.assignedTo && typeof row.assignedTo === 'object') base.owner = formatUser(row.assignedTo);
  if (row.dealId && typeof row.dealId === 'object') base.deal = { id: row.dealId._id?.toString(), name: row.dealId.title };
  if (row.companyId && typeof row.companyId === 'object') base.company = { id: row.companyId._id?.toString(), name: row.companyId.name };
  if (row.contactId && typeof row.contactId === 'object') {
    base.contact = {
      id: row.contactId._id?.toString(),
      name: `${row.contactId.firstName || ''} ${row.contactId.lastName || ''}`.trim(),
      email: row.contactId.email || '',
    };
  }
  return base;
}

function calculateLineItem(input = {}) {
  const quantity = Number(input.quantity) || 0;
  const unitPrice = Number(input.unitPrice) || 0;
  const discount = Number(input.discount) || 0;
  const taxRate = Number(input.taxRate) || 0;
  const taxable = Math.max(quantity * unitPrice - discount, 0);
  const tax = taxable * (taxRate / 100);
  return {
    productId: input.productId || null,
    name: input.name || input.sku || 'Line item',
    sku: input.sku || '',
    quantity,
    unitPrice,
    discount,
    taxRate,
    total: Math.round((taxable + tax) * 100) / 100,
  };
}

function recalculateTotals(document) {
  const items = document.lineItems || [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const discountTotal = items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  const taxTotal = items.reduce((sum, item) => {
    const taxable = Math.max((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0), 0);
    return sum + taxable * ((Number(item.taxRate) || 0) / 100);
  }, 0);
  const grandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  document.subtotal = Math.round(subtotal * 100) / 100;
  document.discountTotal = Math.round(discountTotal * 100) / 100;
  document.taxTotal = Math.round(taxTotal * 100) / 100;
  document.grandTotal = Math.round(grandTotal * 100) / 100;
  document.amount = document.grandTotal;
}

function money(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));
}

@Injectable()
class SalesDocumentsService {
  quotationModel;
  orderModel;
  invoiceModel;
  productModel;
  tenantModel;
  dealModel;
  contactModel;
  companyModel;
  activityEventModel;

  getConfig(route) {
    const config = DOCUMENT_CONFIG[route];
    if (!config) throw new BadRequestException('Unsupported sales document type');
    return config;
  }

  getModel(route) {
    const config = this.getConfig(route);
    return this[config.modelProp];
  }

  getListService(route) {
    const config = this.getConfig(route);
    return new CrmListService(this.getModel(route), {
      entityType: config.type,
      hrefBase: config.hrefBase,
      searchFields: config.searchFields,
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'dealId', select: 'title' },
        { path: 'companyId', select: 'name' },
        { path: 'contactId', select: 'firstName lastName email' },
      ],
      formatRow: (row) => formatDocument(row, config),
    });
  }

  list(route, tenantId, query, user) {
    return this.getListService(route).list(tenantId, query, user);
  }

  async create(route, tenantId, userId, body = {}) {
    const config = this.getConfig(route);
    const payload = await this.preparePayload(route, tenantId, body);
    if (!payload[config.numberField]) payload[config.numberField] = generatedNumber(config.prefix);
    const doc = await this.getModel(route).create({
      tenantId,
      createdBy: userId,
      assignedTo: payload.assignedTo || userId,
      ...payload,
    });
    await this.recordActivity(route, tenantId, userId, 'created', doc, `${config.type} created: ${doc.title}`);
    return this.findOne(route, tenantId, doc._id);
  }

  bulk(route, tenantId, userId, body) {
    return this.getListService(route).bulk(tenantId, userId, body);
  }

  async findOne(route, tenantId, id) {
    const config = this.getConfig(route);
    const row = await this.getModel(route)
      .findOne({ _id: id, tenantId })
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'dealId', select: 'title value' },
        { path: 'companyId', select: 'name industry website phone' },
        { path: 'contactId', select: 'firstName lastName email phone' },
      ])
      .lean();
    if (!row) throw new NotFoundException(`${config.type} not found`);
    return formatDocument(row, config);
  }

  async update(route, tenantId, userId, id, body = {}) {
    const payload = await this.preparePayload(route, tenantId, body);
    const row = await this.getModel(route)
      .findOneAndUpdate(
        { _id: id, tenantId },
        { $set: payload },
        { new: true, runValidators: true },
      )
      .lean();
    if (!row) throw new NotFoundException('Sales document not found');
    await this.recordActivity(route, tenantId, userId, 'updated', row, `${this.getConfig(route).type} updated: ${row.title}`, { changes: payload });
    return this.findOne(route, tenantId, id);
  }

  remove(route, tenantId, userId, id) {
    return this.getListService(route).remove(tenantId, userId, id);
  }

  async preparePayload(route, tenantId, body = {}) {
    const payload = { ...body };
    if (Array.isArray(payload.lineItems)) {
      payload.lineItems = await Promise.all(payload.lineItems.map((item) => this.buildLineItem(tenantId, item)));
      const totals = { lineItems: payload.lineItems };
      recalculateTotals(totals);
      Object.assign(payload, {
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        amount: totals.amount,
      });
    }
    return payload;
  }

  async buildLineItem(tenantId, body = {}) {
    let product = null;
    if (body.productId) {
      product = await this.productModel.findOne({ _id: body.productId, tenantId }).lean();
      if (!product) throw new NotFoundException('Product not found');
    }
    return calculateLineItem({
      productId: product?._id || body.productId || null,
      name: body.name || product?.name || 'Line item',
      sku: body.sku ?? product?.sku ?? '',
      quantity: body.quantity ?? 1,
      unitPrice: body.unitPrice ?? product?.unitPrice ?? 0,
      discount: body.discount ?? 0,
      taxRate: body.taxRate ?? 0,
    });
  }

  async getLineItems(route, tenantId, id) {
    const document = await this.getModel(route).findOne({ _id: id, tenantId }).lean();
    if (!document) throw new NotFoundException('Sales document not found');
    return { items: (document.lineItems || []).map(leanId), totals: this.formatTotals(document) };
  }

  async addLineItem(route, tenantId, userId, id, body) {
    const document = await this.getModel(route).findOne({ _id: id, tenantId });
    if (!document) throw new NotFoundException('Sales document not found');
    const item = await this.buildLineItem(tenantId, body);
    document.lineItems.push(item);
    recalculateTotals(document);
    await document.save();
    await this.recordActivity(route, tenantId, userId, 'line_item_added', document, `Line item added: ${item.name}`, { item });
    return this.getLineItems(route, tenantId, id);
  }

  async updateLineItem(route, tenantId, userId, id, lineItemId, body) {
    const document = await this.getModel(route).findOne({ _id: id, tenantId });
    if (!document) throw new NotFoundException('Sales document not found');
    const item = document.lineItems.id(lineItemId);
    if (!item) throw new NotFoundException('Line item not found');
    const next = await this.buildLineItem(tenantId, { ...item.toObject(), ...body });
    Object.assign(item, next);
    recalculateTotals(document);
    await document.save();
    await this.recordActivity(route, tenantId, userId, 'line_item_updated', document, `Line item updated: ${item.name}`, { item: next });
    return this.getLineItems(route, tenantId, id);
  }

  async removeLineItem(route, tenantId, userId, id, lineItemId) {
    const document = await this.getModel(route).findOne({ _id: id, tenantId });
    if (!document) throw new NotFoundException('Sales document not found');
    const item = document.lineItems.id(lineItemId);
    if (!item) throw new NotFoundException('Line item not found');
    const name = item.name;
    item.deleteOne();
    recalculateTotals(document);
    await document.save();
    await this.recordActivity(route, tenantId, userId, 'line_item_removed', document, `Line item removed: ${name}`);
    return this.getLineItems(route, tenantId, id);
  }

  async convertQuotationToOrder(tenantId, userId, quotationId) {
    const quote = await this.quotationModel.findOne({ _id: quotationId, tenantId }).lean();
    if (!quote) throw new NotFoundException('Quotation not found');
    const order = await this.orderModel.create({
      tenantId,
      title: quote.title,
      orderNumber: generatedNumber('SO'),
      status: 'pending',
      amount: quote.amount,
      currency: quote.currency,
      lineItems: quote.lineItems,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      taxTotal: quote.taxTotal,
      grandTotal: quote.grandTotal,
      dealId: quote.dealId,
      contactId: quote.contactId,
      companyId: quote.companyId,
      assignedTo: quote.assignedTo || userId,
      createdBy: userId,
      terms: quote.terms,
      notes: quote.notes,
      billingAddress: quote.billingAddress,
      shippingAddress: quote.shippingAddress,
      sourceQuotationId: quote._id,
    });
    await this.quotationModel.updateOne({ _id: quote._id }, { $set: { status: 'accepted', convertedOrderId: order._id } });
    await this.recordActivity('quotations', tenantId, userId, 'converted_to_order', quote, `Quotation converted to order: ${quote.title}`, { orderId: order._id });
    await this.recordActivity('orders', tenantId, userId, 'created_from_quote', order, `Order created from quotation: ${order.title}`, { quotationId: quote._id });
    return leanId(order.toObject());
  }

  async convertToInvoice(sourceRoute, tenantId, userId, id) {
    const sourceModel = this.getModel(sourceRoute);
    const source = await sourceModel.findOne({ _id: id, tenantId }).lean();
    if (!source) throw new NotFoundException('Source document not found');
    const invoice = await this.invoiceModel.create({
      tenantId,
      title: source.title,
      invoiceNumber: generatedNumber('INV'),
      status: 'draft',
      amount: source.amount,
      currency: source.currency,
      lineItems: source.lineItems,
      subtotal: source.subtotal,
      discountTotal: source.discountTotal,
      taxTotal: source.taxTotal,
      grandTotal: source.grandTotal,
      dealId: source.dealId,
      contactId: source.contactId,
      companyId: source.companyId,
      assignedTo: source.assignedTo || userId,
      createdBy: userId,
      terms: source.terms,
      notes: source.notes,
      billingAddress: source.billingAddress,
      shippingAddress: source.shippingAddress,
      sourceQuotationId: sourceRoute === 'quotations' ? source._id : source.sourceQuotationId || null,
      sourceOrderId: sourceRoute === 'orders' ? source._id : null,
    });
    const update = sourceRoute === 'quotations' ? { convertedInvoiceId: invoice._id } : { convertedInvoiceId: invoice._id };
    await sourceModel.updateOne({ _id: source._id }, { $set: update });
    await this.recordActivity(sourceRoute, tenantId, userId, 'converted_to_invoice', source, `${this.getConfig(sourceRoute).type} converted to invoice: ${source.title}`, { invoiceId: invoice._id });
    await this.recordActivity('invoices', tenantId, userId, 'created_from_document', invoice, `Invoice created from ${this.getConfig(sourceRoute).type.toLowerCase()}: ${invoice.title}`, { sourceId: source._id, sourceType: this.getConfig(sourceRoute).type });
    return leanId(invoice.toObject());
  }

  async generatePdf(route, tenantId, userId, id) {
    const config = this.getConfig(route);
    const document = await this.getModel(route)
      .findOne({ _id: id, tenantId })
      .populate([
        { path: 'dealId', select: 'title' },
        { path: 'companyId', select: 'name website phone' },
        { path: 'contactId', select: 'firstName lastName email phone' },
      ])
      .lean();
    if (!document) throw new NotFoundException(`${config.type} not found`);
    const tenant = await this.tenantModel.findById(tenantId).lean().catch(() => null);
    const buffer = await this.renderPdf(config, document, tenant);
    await this.getModel(route).updateOne({ _id: id, tenantId }, { $set: { pdfGeneratedAt: new Date() } });
    await this.recordActivity(route, tenantId, userId, 'pdf_generated', document, `${config.type} PDF generated: ${document.title}`);
    return {
      fileName: `${(document[config.numberField] || document.title || config.type).replace(/[^a-z0-9-]+/gi, '-')}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    };
  }

  renderPdf(config, document, tenant) {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 48 });
      const chunks = [];
      pdf.on('data', (chunk) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      const currency = document.currency || 'USD';
      const tenantName = tenant?.name || tenant?.settings?.company?.name || 'NexusCRM';
      pdf.fontSize(20).text(tenantName, { align: 'left' });
      pdf.moveDown(0.4);
      pdf.fontSize(16).text(config.type, { align: 'right' });
      pdf.fontSize(10).text(document[config.numberField] || '', { align: 'right' });
      pdf.moveDown();
      pdf.fontSize(18).text(document.title || 'Untitled document');
      pdf.fontSize(10).fillColor('#666').text(`Status: ${document.status || 'draft'}`);
      pdf.fillColor('#000').moveDown();

      const customer = document.companyId?.name || `${document.contactId?.firstName || ''} ${document.contactId?.lastName || ''}`.trim() || 'Customer';
      pdf.fontSize(11).text(`Customer: ${customer}`);
      if (document.contactId?.email) pdf.text(`Email: ${document.contactId.email}`);
      if (document.billingAddress) pdf.text(`Billing: ${document.billingAddress}`);
      if (document.shippingAddress) pdf.text(`Shipping: ${document.shippingAddress}`);
      pdf.moveDown();

      pdf.fontSize(11).text('Items', { underline: true });
      pdf.moveDown(0.4);
      (document.lineItems || []).forEach((item) => {
        pdf.fontSize(9).text(`${item.name} (${item.quantity} x ${money(item.unitPrice, currency)})`, { continued: true });
        pdf.text(money(item.total, currency), { align: 'right' });
      });
      pdf.moveDown();
      pdf.fontSize(10).text(`Subtotal: ${money(document.subtotal, currency)}`, { align: 'right' });
      pdf.text(`Discount: ${money(document.discountTotal, currency)}`, { align: 'right' });
      pdf.text(`Tax: ${money(document.taxTotal, currency)}`, { align: 'right' });
      pdf.fontSize(13).text(`Total: ${money(document.grandTotal || document.amount, currency)}`, { align: 'right' });
      if (document.terms) {
        pdf.moveDown().fontSize(10).text('Terms', { underline: true }).text(document.terms);
      }
      if (document.notes) {
        pdf.moveDown().fontSize(10).text('Notes', { underline: true }).text(document.notes);
      }
      pdf.end();
    });
  }

  formatTotals(document) {
    return {
      subtotal: document.subtotal || 0,
      discountTotal: document.discountTotal || 0,
      taxTotal: document.taxTotal || 0,
      grandTotal: document.grandTotal || document.amount || 0,
      amount: document.amount || 0,
    };
  }

  recordActivity(route, tenantId, userId, action, record, summary, metadata = {}) {
    const config = this.getConfig(route);
    return recordActivityFromModel(this.getModel(route), tenantId, userId, {
      action,
      entityType: config.type,
      entityId: record._id,
      entityName: record.title,
      record,
      href: `${config.hrefBase}/${record._id}`,
      summary,
      metadata,
    });
  }
}

module.exports = { SalesDocumentsService, DOCUMENT_CONFIG };
