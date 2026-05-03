package com.github.cafewill.elasticsearch;

import java.io.IOException;

import com.github.cafewill.elasticsearch.config.ElasticsearchProperties;
import com.github.cafewill.elasticsearch.config.HttpRequestHeaders;
import com.github.cafewill.elasticsearch.config.Property;
import com.github.cafewill.elasticsearch.config.Settings;
import com.github.cafewill.elasticsearch.util.AbstractPropertyAndEncoder;
import com.github.cafewill.elasticsearch.util.AccessPropertyAndEncoder;
import com.github.cafewill.elasticsearch.util.ErrorReporter;
import com.fasterxml.jackson.core.JsonGenerator;

import ch.qos.logback.access.spi.IAccessEvent;
import ch.qos.logback.core.Context;

public class AccessElasticsearchPublisher extends AbstractElasticsearchPublisher<IAccessEvent> {

    public AccessElasticsearchPublisher(Context context, ErrorReporter errorReporter, Settings settings, ElasticsearchProperties properties, HttpRequestHeaders httpRequestHeaders) throws IOException {
        super(context, errorReporter, settings, properties, httpRequestHeaders);
    }

    @Override
    protected AbstractPropertyAndEncoder<IAccessEvent> buildPropertyAndEncoder(Context context, Property property) {
        return new AccessPropertyAndEncoder(property, context);
    }

    @Override
    protected void serializeCommonFields(JsonGenerator gen, IAccessEvent event) throws IOException {
        gen.writeObjectField("@timestamp", getTimestamp(event.getTimeStamp()));
    }
}
