package com.cube.elasticsearch;

import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

public class ElasticsearchJobAppender extends AbstractElasticsearchAppender {
    @Override
    protected String getThreadName() {
        return "elasticsearch-job-log-sender";
    }

    public static class MdcJobFilter {
        @Value("${spring.application.name:app}")
        private String appName;

        @Value("${spring.profiles.active:local}")
        private String env;

        @Bean
        public TaskScheduler taskScheduler() {
            ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
            scheduler.setPoolSize(3);
            scheduler.setThreadNamePrefix("scheduled-");
            scheduler.setTaskDecorator(runnable -> () -> {
                MDC.put("app", appName);
                MDC.put("env", env);
                MDC.put("instance_id", ElasticsearchSender.resolveInstanceId());
                try {
                    runnable.run();
                } finally {
                    MDC.clear();
                }
            });
            return scheduler;
        }
    }
}
