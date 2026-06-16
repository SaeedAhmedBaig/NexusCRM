const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { DataJobsController } = require('./data-jobs.controller');
const { DataJobsService } = require('./data-jobs.service');
const { DataJobSchema, DataJobModelName } = require('./schemas/data-job.schema');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DataJobModelName, schema: DataJobSchema },
    ]),
  ],
  controllers: [DataJobsController],
  providers: [
    withModels(DataJobsService, { dataJobModel: DataJobModelName }),
  ],
  exports: [DataJobsService],
})
class DataJobsModule {}

module.exports = { DataJobsModule };
