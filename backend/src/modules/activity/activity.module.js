const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { ActivityController } = require('./activity.controller');
const { ActivityService } = require('./activity.service');
const { ActivityEventSchema, ActivityEventModelName } = require('./schemas/activity-event.schema');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityEventModelName, schema: ActivityEventSchema },
    ]),
  ],
  controllers: [ActivityController],
  providers: [
    withModels(ActivityService, { activityEventModel: ActivityEventModelName }),
  ],
  exports: [ActivityService],
})
class ActivityModule {}

module.exports = { ActivityModule };
