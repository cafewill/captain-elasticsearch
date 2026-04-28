package com.cube.elasticsearch;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnClass(name = {
        "org.springframework.web.filter.OncePerRequestFilter",
        "jakarta.servlet.http.HttpServletRequest"
})
@ConditionalOnProperty(prefix = "cube.elasticsearch.web", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ElasticsearchWebAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public ElasticsearchWebAppender.MdcWebFilter cubeElasticsearchMdcWebFilter() {
        return new ElasticsearchWebAppender.MdcWebFilter();
    }
}
