const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { RbacModule } = require('../rbac/rbac.module');
const { DataJobSchema, DataJobModelName } = require('../data-jobs/schemas/data-job.schema');
const { JobsService } = require('./jobs.service');
const { JobsController } = require('./jobs.controller');

@Module({
  imports: [
    RbacModule,
    MongooseModule.forFeature([
      { name: DataJobModelName, schema: DataJobSchema },
    ]),
  ],
  controllers: [JobsController],
  providers: [withModels(JobsService, { dataJobModel: DataJobModelName })],
  exports: [JobsService],
})
class JobsModule {}

module.exports = { JobsModule };
