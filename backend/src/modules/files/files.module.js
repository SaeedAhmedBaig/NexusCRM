const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { RbacModule } = require('../rbac/rbac.module');
const { FileAssetSchema, FileAssetModelName } = require('./schemas/file-asset.schema');
const { FilesService } = require('./files.service');
const { FilesController } = require('./files.controller');

@Module({
  imports: [
    RbacModule,
    MongooseModule.forFeature([
      { name: FileAssetModelName, schema: FileAssetSchema },
    ]),
  ],
  controllers: [FilesController],
  providers: [withModels(FilesService, { fileAssetModel: FileAssetModelName })],
  exports: [FilesService],
})
class FilesModule {}

module.exports = { FilesModule };
