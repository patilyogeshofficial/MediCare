package com.medicare.backend.security;

import java.util.Iterator;
import java.util.LinkedList;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class RateLimiterService {

    private static final int DEFAULT_MAX_REQUESTS_PER_MINUTE = 10;
    private static final long ONE_MINUTE_MILLIS = 60_000L;

    // Map of IP -> List of request timestamps
    private final ConcurrentHashMap<String, LinkedList<Long>> requestBuckets = new ConcurrentHashMap<>();

    /**
     * Checks if the client IP is allowed to proceed under the default 10 req/min limit.
     * @param clientIp the IP address of the caller
     * @return true if permitted, false if rate limit exceeded
     */
    public boolean tryAcquire(String clientIp) {
        return tryAcquire(clientIp, DEFAULT_MAX_REQUESTS_PER_MINUTE);
    }

    /**
     * Checks if the client IP is allowed to proceed under a custom max-per-minute limit.
     */
    public synchronized boolean tryAcquire(String clientIp, int maxRequestsPerMinute) {
        if (clientIp == null || clientIp.trim().isEmpty()) {
            clientIp = "UNKNOWN";
        }

        long now = System.currentTimeMillis();
        long windowStart = now - ONE_MINUTE_MILLIS;

        LinkedList<Long> timestamps = requestBuckets.computeIfAbsent(clientIp, k -> new LinkedList<>());

        // Purge timestamps outside the 1-minute sliding window
        Iterator<Long> iterator = timestamps.iterator();
        while (iterator.hasNext()) {
            if (iterator.next() < windowStart) {
                iterator.remove();
            } else {
                break; // timestamps are in ascending order
            }
        }

        // Periodic map cleanup if it grows too large (> 5000 tracked IPs)
        if (requestBuckets.size() > 5000) {
            requestBuckets.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        }

        if (timestamps.size() >= maxRequestsPerMinute) {
            return false;
        }

        timestamps.add(now);
        return true;
    }
}
