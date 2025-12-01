package com.interacthub.hr.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr/sync")
@CrossOrigin(origins = "*")
public class SyncController {

    @PostMapping("/user")
    public ResponseEntity<?> syncUser(@RequestBody Map<String, Object> userData) {
        // For now, just acknowledge the sync. Extend to persist HR-side data if needed.
        System.out.println("HR Sync received for user: " + userData.get("email"));
        return ResponseEntity.ok(Map.of("message", "User synced to HR service"));
    }
}


