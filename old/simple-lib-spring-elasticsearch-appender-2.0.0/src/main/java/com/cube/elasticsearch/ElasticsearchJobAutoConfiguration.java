package com.cube.elasticsearch;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.TaskScheduler;

@AutoConfiguration
@ConditionalOnClass({TaskScheduler.class, ElasticsearchJobAppender.class})
@ConditionalOnProperty(prefix = "cube.elasticsearch.job", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ElasticsearchJobAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public ElasticsearchJobAppender.MdcJobFilter cubeElasticsearchMdcJobFilter(
            @Value("${spring.application.name:app}") String appName,
            @Value("${spring.profiles.active:default}") String env) {
        return new ElasticsearchJobAppender.MdcJobFilter(appName, env);
    }

    @Bean(name = "taskScheduler")
    @ConditionalOnMissingBean(name = "taskScheduler")
    public TaskScheduler cubeElasticsearchTaskScheduler(ElasticsearchJobAppender.MdcJobFilter mdcJobFilter) {
        return mdcJobFilter.taskScheduler();
    }
}
