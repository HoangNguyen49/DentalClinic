import { Module } from '@nestjs/common';
import { LocaleController } from './locale.controller';

@Module({
  controllers: [LocaleController],
})
export class LocaleModule {}
