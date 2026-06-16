const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param, Res } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { SalesDocumentsService } = require('./sales-documents.service');

function createSalesDocumentController(route) {
  @Controller(route)
  class SalesDocumentController {
    service;

    constructor(service) {
      this.service = service;
    }

    @Get()
    @Bind(Req(), Query())
    list(req, query) {
      return this.service.list(route, req.tenantId, query, req.user);
    }

    @Post()
    @Bind(Body(), Req())
    create(body, req) {
      return this.service.create(route, req.tenantId, req.user.id, body);
    }

    @Post('bulk')
    @Bind(Body(), Req())
    bulk(body, req) {
      return this.service.bulk(route, req.tenantId, req.user.id, body);
    }

    @Get(':id/line-items')
    @Bind(Req(), Param('id'))
    lineItems(req, id) {
      return this.service.getLineItems(route, req.tenantId, id);
    }

    @Post(':id/line-items')
    @Bind(Body(), Req(), Param('id'))
    addLineItem(body, req, id) {
      return this.service.addLineItem(route, req.tenantId, req.user.id, id, body);
    }

    @Patch(':id/line-items/:lineItemId')
    @Bind(Body(), Req(), Param('id'), Param('lineItemId'))
    updateLineItem(body, req, id, lineItemId) {
      return this.service.updateLineItem(route, req.tenantId, req.user.id, id, lineItemId, body);
    }

    @Delete(':id/line-items/:lineItemId')
    @Bind(Req(), Param('id'), Param('lineItemId'))
    removeLineItem(req, id, lineItemId) {
      return this.service.removeLineItem(route, req.tenantId, req.user.id, id, lineItemId);
    }

    @Post(':id/convert-to-order')
    @Bind(Req(), Param('id'))
    convertToOrder(req, id) {
      return this.service.convertQuotationToOrder(req.tenantId, req.user.id, id);
    }

    @Post(':id/convert-to-invoice')
    @Bind(Req(), Param('id'))
    convertToInvoice(req, id) {
      return this.service.convertToInvoice(route, req.tenantId, req.user.id, id);
    }

    @Get(':id/pdf')
    @Bind(Req(), Param('id'), Res())
    async pdf(req, id, res) {
      const file = await this.service.generatePdf(route, req.tenantId, req.user.id, id);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      res.setHeader('Content-Length', file.buffer.length);
      res.send(file.buffer);
    }

    @Get(':id')
    @Bind(Req(), Param('id'))
    getOne(req, id) {
      return this.service.findOne(route, req.tenantId, id, req.user);
    }

    @Patch(':id')
    @Bind(Body(), Req(), Param('id'))
    update(body, req, id) {
      return this.service.update(route, req.tenantId, req.user.id, id, body);
    }

    @Delete(':id')
    @Bind(Req(), Param('id'))
    remove(req, id) {
      return this.service.remove(route, req.tenantId, req.user.id, id);
    }
  }

  defineParamTypes(SalesDocumentController, SalesDocumentsService);
  return SalesDocumentController;
}

const QuotationsController = createSalesDocumentController('quotations');
const OrdersController = createSalesDocumentController('orders');
const InvoicesController = createSalesDocumentController('invoices');

module.exports = { QuotationsController, OrdersController, InvoicesController };
