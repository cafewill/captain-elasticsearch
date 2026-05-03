package com.github.cafewill.elasticsearch;

import java.io.IOException;

import com.github.cafewill.elasticsearch.config.Settings;

public class StructuredArgsElasticsearchAppender extends ElasticsearchAppender {

    public StructuredArgsElasticsearchAppender() {
    }

    public StructuredArgsElasticsearchAppender(Settings settings) {
        super(settings);
    }

    protected StructuredArgsElasticsearchPublisher buildElasticsearchPublisher() throws IOException {
        return new StructuredArgsElasticsearchPublisher(this.getContext(), this.errorReporter, this.settings,
                this.elasticsearchProperties, this.headers);
    }

}
