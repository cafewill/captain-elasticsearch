require('dotenv').config();
const express               = require('express');
const { randomUUID }        = require('crypto');
const ElasticsearchJobAppender = require('./elasticsearch-job-appender');

const app          = express();
const PORT         = process.env.PORT ?? 3002;
const SYSTEM_DELAY  = parseInt(process.env.JOB_SYSTEM_DELAY   ?? '3000');
const MANAGER_DELAY = parseInt(process.env.JOB_MANAGER_DELAY  ?? '15000');
const OPERATOR_DELAY = parseInt(process.env.JOB_OPERATOR_DELAY ?? '20000');
const RISKY_DELAY = parseInt(process.env.JOB_RISKY_DELAY ?? '60000');

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

const appender = new ElasticsearchJobAppender({
  url:                  process.env.ELASTICSEARCH_URL                 ?? 'http://localhost:9200',
  username:             process.env.ELASTICSEARCH_USERNAME            ?? '',
  password:             process.env.ELASTICSEARCH_PASSWORD            ?? '',
  app:                  process.env.ELASTICSEARCH_NAME                ?? 'simple-jobs-node-express',
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

function withRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      fn();
      return;
    } catch (e) {
      if (attempt === maxAttempts) {
        console.error(`[RECOVER] job failed after ${maxAttempts} retries: ${e.message}`);
      }
    }
  }
}

function riskyLogDelay() {
  return 3000 + Math.floor(Math.random() * 7001);
}

setInterval(() => withRetry(() => {
  const msg = `ES : Just do system job by node express [${randomUUID()}]`;
  console.log(msg);
  appender.log('INFO', msg, { job: 'system-job' });
}), SYSTEM_DELAY);

setInterval(() => withRetry(() => {
  const msg = `ES : Just do manager job by node express [${randomUUID()}]`;
  console.log(msg);
  appender.log('INFO', msg, { job: 'manager-job' });
}), MANAGER_DELAY);

setInterval(() => withRetry(() => {
  const msg = `ES : Just do operator job by node express [${randomUUID()}]`;
  console.log(msg);
  appender.log('INFO', msg, { job: 'operator-job' });
}), OPERATOR_DELAY);

setInterval(() => {
  const runId = randomUUID();
  if (Math.random() < 0.8) {
    const msg = `ES : Risky job completed normally by node express [${runId}]`;
    console.log(msg);
    appender.log('INFO', msg, { job: 'risky-job' });
    return;
  }

  setTimeout(() => {
    const level = Math.random() < 0.5 ? 'WARN' : 'ERROR';
    const msg = `ES : Risky job found unstable condition by node express [${runId}]`;
    console[level === 'WARN' ? 'warn' : 'error'](msg);
    appender.log(level, msg, { job: 'risky-job' });
  }, riskyLogDelay());
}, RISKY_DELAY);

process.on('SIGTERM', () => { appender.stop(); process.exit(0); });
process.on('SIGINT',  () => { appender.stop(); process.exit(0); });

app.listen(PORT, () => console.log(`simple-jobs-node-express running on port ${PORT}`));
