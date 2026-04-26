package com.cube.elasticsearch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

final class Slf4jDeadLetterHandler implements DeadLetterHandler {
    private final Logger logger;

    Slf4jDeadLetterHandler(String loggerName) {
        this.logger = LoggerFactory.getLogger(
                loggerName == null || loggerName.isBlank() ? "com.cube.elasticsearch.deadletter" : loggerName
        );
    }

    @Override
    public void store(List<BulkPayloadBuilder.BulkItem> items, String message, Throwable cause) {
        int size = items == null ? 0 : items.size();
        if (cause == null) {
            logger.error("[Elasticsearch-DLQ] size={}, reason={}", size, message);
        } else {
            logger.error("[Elasticsearch-DLQ] size={}, reason={}", size, message, cause);
        }
    }
}
