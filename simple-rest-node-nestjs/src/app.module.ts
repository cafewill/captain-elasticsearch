import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ItemsModule }           from './items/items.module';
import { ElasticsearchWebAppender } from './elasticsearch.web-appender';

@Module({
  imports:   [ItemsModule],
  providers: [ElasticsearchWebAppender],
})
export class AppModule implements NestModule {
  constructor(private readonly appender: ElasticsearchWebAppender) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(this.appender.use.bind(this.appender)).forRoutes('*');
  }
}
