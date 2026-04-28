package com.cube.elasticsearch;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ElasticsearchHeaders {
    private final List<ElasticsearchHeader> headers = new ArrayList<>();

    public List<ElasticsearchHeader> getHeaders() {
        return Collections.unmodifiableList(headers);
    }

    public void addHeader(ElasticsearchHeader header) {
        if (header != null) {
            headers.add(header);
        }
    }
}
