package com.upv.examcalendar.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * Cache configuration for performance optimization.
 * Uses Caffeine as the caching provider with different cache strategies
 * for different types of data.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Primary cache manager with default settings.
     * Used for general caching needs.
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(defaultCacheBuilder());
        return cacheManager;
    }

    /**
     * Cache manager specifically for distinct values (degrees, years, etc.)
     * These change rarely so we can cache them longer.
     */
    @Bean("distinctValuesCacheManager")
    public CacheManager distinctValuesCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(longLivedCacheBuilder());
        cacheManager.setCacheNames(Arrays.asList("distinctDegrees", "distinctYears", "distinctSemesters",
                "distinctSchools", "distinctRooms"));
        return cacheManager;
    }

    /**
     * Cache manager for search results and filtered data.
     * Medium-term caching since search patterns may repeat.
     */
    @Bean("searchCacheManager")
    public CacheManager searchCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(mediumTermCacheBuilder());
        cacheManager.setCacheNames(Arrays.asList("examSearch", "examsByMultipleCriteria", "currentAcademicPeriod"));
        return cacheManager;
    }

    /**
     * Default cache configuration: 5 minutes TTL, max 500 entries.
     */
    private Caffeine<Object, Object> defaultCacheBuilder() {
        return Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .recordStats();
    }

    /**
     * Long-lived cache for relatively static data: 30 minutes TTL, max 100 entries.
     */
    private Caffeine<Object, Object> longLivedCacheBuilder() {
        return Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats();
    }

    /**
     * Medium-term cache for search results: 10 minutes TTL, max 1000 entries.
     */
    private Caffeine<Object, Object> mediumTermCacheBuilder() {
        return Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats();
    }
}