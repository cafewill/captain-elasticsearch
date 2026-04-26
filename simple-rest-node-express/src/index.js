'use strict';
require('dotenv').config();
const express            = require('express');
const ElasticsearchWebAppender = require('./elasticsearch-web-appender');
const itemsRouter        = require('./routes/items');

const app      = express();
const PORT     = process.env.PORT ?? 3202;

function envBool(name, defaultValue) {
  return ['1', 'true', 'yes', 'y'].includes(String(process.env[name] ?? defaultValue).toLowerCase());
}

function envHeaders() {
  try {
    return JSON.parse(process.env.ELASTICSEARCH_HEADERS ?? '{}');
  } catch {
    return {};
  }
}

const appender = new ElasticsearchWebAppender({
  url:                  process.env.ELASTICSEARCH_URL                 ?? 'http://localhost:9200',
  username:             process.env.ELASTICSEARCH_USERNAME            ?? '',
  password:             process.env.ELASTICSEARCH_PASSWORD            ?? '',
  app:                  process.env.ELASTICSEARCH_NAME                ?? 'simple-rest-node-express',
  env:                  process.env.ELASTICSEARCH_ENV                 ?? 'local',
  maxBatchBytes:        parseInt(process.env.ELASTICSEARCH_BATCH_MAX_BYTES      ?? '1000000'),
  flushIntervalSeconds: parseInt(process.env.ELASTICSEARCH_BATCH_FLUSH_INTERVAL ?? '1'),
  queueSize:            parseInt(process.env.ELASTICSEARCH_BATCH_QUEUE_SIZE     ?? '8192'),
  operation:            process.env.ELASTICSEARCH_BULK_OPERATION ?? 'index',
  trustAllSsl:          envBool('ELASTICSEARCH_TRUST_ALL_SSL', true),
  timeout:              parseInt(process.env.ELASTICSEARCH_TIMEOUT ?? '10'),
  maxRetries:           parseInt(process.env.ELASTICSEARCH_MAX_RETRIES ?? '3'),
  headers:              envHeaders(),
  persistentWriterThread: envBool('ELASTICSEARCH_PERSISTENT_WRITER_THREAD', true),
  requeueOnFailure:      envBool('ELASTICSEARCH_REQUEUE_ON_FAILURE', true),
});

app.use(express.json());
app.use(appender.middleware());

// req.log 헬퍼 — 라우터에서 Elasticsearch 로그 전송용
app.use((req, _res, next) => {
  req.log = (level, message, extra = {}) =>
    appender.log(level, message, { trace_id: req.traceId, ...extra });
  next();
});

app.use('/api/items', itemsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

process.on('SIGTERM', () => { appender.stop(); process.exit(0); });
process.on('SIGINT',  () => { appender.stop(); process.exit(0); });

app.listen(PORT, () => console.log(`simple-rest-node-express running on port ${PORT}`));
