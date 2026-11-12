package com.medicare.backend.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RateLimiterServiceTest {

    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        rateLimiterService = new RateLimiterService();
    }

    @Test
    @DisplayName("Rate limiter permits up to 10 requests per minute per IP")
    void testPermitUpToTenRequests() {
        String testIp = "192.168.1.100";

        for (int i = 1; i <= 10; i++) {
            boolean allowed = rateLimiterService.tryAcquire(testIp);
            assertTrue(allowed, "Request #" + i + " should be allowed");
        }

        // 11th request must be rejected
        boolean rejected = rateLimiterService.tryAcquire(testIp);
        assertFalse(rejected, "11th request in same minute must be rate limited");
    }

    @Test
    @DisplayName("Different IPs maintain independent rate limits")
    void testDifferentIpsIndependentLimits() {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        for (int i = 0; i < 10; i++) {
            rateLimiterService.tryAcquire(ip1);
        }

        assertFalse(rateLimiterService.tryAcquire(ip1), "ip1 is exhausted");
        assertTrue(rateLimiterService.tryAcquire(ip2), "ip2 must still have available capacity");
    }

    @Test
    @DisplayName("Null or empty IP gracefully falls back to UNKNOWN bucket")
    void testNullOrEmptyIpHandling() {
        assertTrue(rateLimiterService.tryAcquire(null));
        assertTrue(rateLimiterService.tryAcquire(""));
        assertTrue(rateLimiterService.tryAcquire("   "));
    }
}
