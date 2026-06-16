const { Injectable } = require('@nestjs/common');

@Injectable()
class JobsService {
  dataJobModel;

  async health(tenantId) {
    const [queued, running, failed, recentFailures] = await Promise.all([
      this.dataJobModel.countDocuments({ tenantId, status: 'queued' }),
      this.dataJobModel.countDocuments({ tenantId, status: 'running' }),
      this.dataJobModel.countDocuments({ tenantId, status: 'failed' }),
      this.dataJobModel.find({ tenantId, status: 'failed' }).sort({ updatedAt: -1 }).limit(5).select('name type objectType errorRows logs updatedAt').lean(),
    ]);
    return {
      queued,
      running,
      failed,
      healthy: failed === 0,
      recentFailures,
    };
  }

  async leaseNext(tenantId, workerId = 'api-worker') {
    const leaseExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const job = await this.dataJobModel.findOneAndUpdate(
      {
        tenantId,
        status: 'queued',
        $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $lt: new Date() } }],
      },
      {
        $set: { leaseOwner: workerId, leaseExpiresAt },
        $push: { logs: { level: 'info', message: 'Job leased', data: { workerId, leaseExpiresAt } } },
      },
      { sort: { createdAt: 1 }, new: true },
    ).lean();
    return job ? { leased: true, job } : { leased: false };
  }
}

module.exports = { JobsService };
