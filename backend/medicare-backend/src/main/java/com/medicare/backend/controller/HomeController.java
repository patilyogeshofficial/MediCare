package com.medicare.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {

        return Map.of(
                "project", "MediCare",
                "message", "Healthcare Administration Console is running!",
                "status", "UP"
        );
    }
}