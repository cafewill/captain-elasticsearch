package com.cube.elasticsearch;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ElasticsearchProperties {
    private final List<ElasticsearchProperty> properties = new ArrayList<>();

    public List<ElasticsearchProperty> getProperties() {
        return Collections.unmodifiableList(properties);
    }

    public void addProperty(ElasticsearchProperty property) {
        if (property != null) {
            properties.add(property);
        }
    }

    public void addEsProperty(ElasticsearchProperty property) {
        addProperty(property);
    }

    public void addField(ElasticsearchProperty property) {
        addProperty(property);
    }
}
