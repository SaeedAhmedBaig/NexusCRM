const { Module } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { VoipService } = require('./voip.service');
const { VoipController } = require('./voip.controller');

@Module({
  imports: [ConfigModule],
  controllers: [VoipController],
  providers: [VoipService],
  exports: [VoipService],
})
class VoipModule {}

module.exports = { VoipModule };
