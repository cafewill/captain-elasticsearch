package com.cube.elasticsearch;

import java.util.List;

interface DeadLetterHandler {
    void store(List<BulkPayloadBuilder.BulkItem> items, String reason, Throwable cause);
}
