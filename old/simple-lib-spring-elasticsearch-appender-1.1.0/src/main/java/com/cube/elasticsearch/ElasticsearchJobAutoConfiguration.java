package com.cube.elasticsearch;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnClass(name = "org.springframework.scheduling.TaskScheduler")
@ConditionalOnProperty(prefix = "cube.elasticsearch.job", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ElasticsearchJobAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public ElasticsearchJobAppender.MdcJobFilter cubeElasticsearchMdcJobFilter() {
        return new ElasticsearchJobAppender.MdcJobFilter();
    }
}
