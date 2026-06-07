const { Injectable } = require('@nestjs/common');

@Injectable()
class CrmSeedService {
  tenantModel;
  companyModel;
  contactModel;
  leadModel;
  dealModel;
  requestModel;
  userModel;

  async ensureCrmData(tenantId, userId) {
    const seedEnabled =
      process.env.SEED_DEMO_DATA === 'true';
    if (!seedEnabled) return;

    const claimed = await this.tenantModel.findOneAndUpdate(
      { _id: tenantId, 'settings.crmSeeded': { $ne: true } },
      { $set: { 'settings.crmSeeded': true } },
      { new: true },
    );
    if (!claimed) return;

    const companies = await this.companyModel.insertMany([
      { tenantId, name: 'Acme Corporation', industry: 'Technology', status: 'active', assignedTo: userId },
      { tenantId, name: 'Globex Industries', industry: 'Manufacturing', status: 'active', assignedTo: userId },
      { tenantId, name: 'Initech LLC', industry: 'Software', status: 'prospect', assignedTo: userId },
      { tenantId, name: 'Umbrella Group', industry: 'Healthcare', status: 'active', assignedTo: userId },
    ]);

    const contacts = await this.contactModel.insertMany([
      { tenantId, firstName: 'Jane', lastName: 'Cooper', email: 'jane@acme.com', companyId: companies[0]._id, assignedTo: userId },
      { tenantId, firstName: 'Robert', lastName: 'Fox', email: 'robert@globex.com', companyId: companies[1]._id, assignedTo: userId },
      { tenantId, firstName: 'Esther', lastName: 'Howard', email: 'esther@initech.com', companyId: companies[2]._id, assignedTo: userId },
    ]);

    await this.leadModel.insertMany([
      { tenantId, title: 'Acme expansion lead', source: 'website', status: 'qualified', value: 15000, companyId: companies[0]._id, contactId: contacts[0]._id, assignedTo: userId },
      { tenantId, title: 'Globex pilot', source: 'referral', status: 'contacted', value: 8000, companyId: companies[1]._id, contactId: contacts[1]._id, assignedTo: userId },
      { tenantId, title: 'Initech trial', source: 'cold_call', status: 'new', value: 5000, companyId: companies[2]._id, assignedTo: userId },
    ]);

    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 30);

    await this.dealModel.insertMany([
      { tenantId, title: 'Acme annual renewal', stage: 'negotiation', status: 'open', value: 24000, companyId: companies[0]._id, contactId: contacts[0]._id, assignedTo: userId, closeDate },
      { tenantId, title: 'Globex enterprise', stage: 'proposal', status: 'open', value: 12000, companyId: companies[1]._id, contactId: contacts[1]._id, assignedTo: userId, closeDate },
      { tenantId, title: 'Umbrella Q1', stage: 'won', status: 'won', value: 18000, companyId: companies[3]._id, assignedTo: userId, closedAt: new Date() },
    ]);

    await this.requestModel.insertMany([
      { tenantId, title: 'Discount approval — Acme', status: 'pending', createdBy: userId, assignedTo: userId },
      { tenantId, title: 'Custom SLA request', status: 'pending', createdBy: userId, assignedTo: userId },
      { tenantId, title: 'Extra seats for Globex', status: 'approved', createdBy: userId, assignedTo: userId },
    ]);
  }
}

module.exports = { CrmSeedService };
