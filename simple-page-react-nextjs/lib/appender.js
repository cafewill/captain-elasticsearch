'use strict';
require('dotenv').config();
const ElasticsearchWebAppender = require('./elasticsearch-web-appender');

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

function createAppender() {
  return new ElasticsearchWebAppender({
    url:      process.env.ELASTICSEARCH_URL      || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
    app:                  process.env.ELASTICSEARCH_NAME                || 'simple-page-react-nextjs',
    env:                  process.env.ELASTICSEARCH_ENV                || 'local',
    maxBatchBytes:        parseInt(process.env.ELASTICSEARCH_BATCH_MAX_BYTES      || '1000000'),
    flushIntervalSeconds: parseInt(process.env.ELASTICSEARCH_BATCH_FLUSH_INTERVAL || '1'),
    queueSize:            parseInt(process.env.ELASTICSEARCH_BATCH_QUEUE_SIZE     || '8192'),
    operation:            process.env.ELASTICSEARCH_BULK_OPERATION || 'index',
    trustAllSsl:          envBool('ELASTICSEARCH_TRUST_ALL_SSL', true),
    timeout:              parseInt(process.env.ELASTICSEARCH_TIMEOUT || '10'),
    maxRetries:           parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3'),
    headers:              envHeaders(),
    persistentWriterThread: envBool('ELASTICSEARCH_PERSISTENT_WRITER_THREAD', true),
    requeueOnFailure:      envBool('ELASTICSEARCH_REQUEUE_ON_FAILURE', true),
  });
}

// Next.js dev 모드 hot-reload 시 중복 인스턴스 방지 — global 싱글톤 사용
let appender;
if (process.env.NODE_ENV === 'production') {
  appender = createAppender();
} else {
  if (!global._elasticsearchAppender) {
    global._elasticsearchAppender = createAppender();
  }
  appender = global._elasticsearchAppender;
}

module.exports = appender;
