const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { MetadataController } = require('./metadata.controller');
const { MetadataService } = require('./metadata.service');
const { CustomFieldSchema, CustomFieldModelName } = require('./schemas/custom-field.schema');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomFieldModelName, schema: CustomFieldSchema },
    ]),
  ],
  controllers: [MetadataController],
  providers: [
    withModels(MetadataService, { customFieldModel: CustomFieldModelName }),
  ],
  exports: [MetadataService],
})
class MetadataModule {}

module.exports = { MetadataModule };
