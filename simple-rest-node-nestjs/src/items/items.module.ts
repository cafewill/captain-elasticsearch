import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService }    from './items.service';
import { ElasticsearchWebAppender } from '../elasticsearch.web-appender';

@Module({
  controllers: [ItemsController],
  providers:   [ItemsService, ElasticsearchWebAppender],
})
export class ItemsModule {}
