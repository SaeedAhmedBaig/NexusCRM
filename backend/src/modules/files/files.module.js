const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { RbacModule } = require('../rbac/rbac.module');
const { FileAssetSchema, FileAssetModelName } = require('./schemas/file-asset.schema');
const { NotificationSchema, NotificationModelName } = require('../realtime/schemas/notification.schema');
const { FilesService } = require('./files.service');
const { FilesController } = require('./files.controller');

@Module({
  imports: [
    RbacModule,
    MongooseModule.forFeature([
      { name: FileAssetModelName, schema: FileAssetSchema },
      { name: NotificationModelName, schema: NotificationSchema },
    ]),
  ],
  controllers: [FilesController],
  providers: [withModels(FilesService, { fileAssetModel: FileAssetModelName, notificationModel: NotificationModelName })],
  exports: [FilesService],
})
class FilesModule {}

module.exports = { FilesModule };
