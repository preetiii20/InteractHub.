package com.interacthub.chat.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

@RestController
@RequestMapping("/api/zego")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ZegoController {

    @Value("${zego.app-id:0}")
    private long zegoAppId;

    @Value("${zego.server-secret:}")
    private String zegoServerSecret;

    private static final long TOKEN_EXPIRE_TIME = 3600; // 1 hour in seconds

    /**
     * Generate ZegoCloud token for a user
     * 
     * Request body:
     * {
     *   "userID": "user123",
     *   "userName": "John Doe",
     *   "roomID": "room456"
     * }
     * 
     * Response:
     * {
     *   "token": "generated_token_here",
     *   "appID": 123456,
     *   "userID": "user123",
     *   "roomID": "room456",
     *   "expiresIn": 3600
     * }
     */
    @PostMapping("/token")
    public ResponseEntity<?> generateToken(@RequestBody Map<String, String> request) {
        try {
            String userID = request.get("userID");
            String userName = request.get("userName");
            String roomID = request.get("roomID");

            // Validate inputs
            if (userID == null || userID.isEmpty() || 
                roomID == null || roomID.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing required fields: userID, roomID"
                ));
            }

            // Validate configuration
            if (zegoAppId == 0 || zegoServerSecret == null || zegoServerSecret.isEmpty()) {
                System.err.println("❌ ZegoCloud not configured. Set ZEGO_APP_ID and ZEGO_SERVER_SECRET environment variables.");
                return ResponseEntity.status(500).body(Map.of(
                    "error", "ZegoCloud not configured on server"
                ));
            }

            // Generate token
            String token = generateZegoToken(zegoAppId, userID, roomID, zegoServerSecret);

            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("appID", zegoAppId);
            response.put("userID", userID);
            response.put("roomID", roomID);
            response.put("expiresIn", TOKEN_EXPIRE_TIME);

            System.out.println("✅ Generated ZegoCloud token for user: " + userID + " in room: " + roomID);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error generating ZegoCloud token: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to generate token: " + e.getMessage()
            ));
        }
    }

    /**
     * Generate ZegoCloud token using HMAC-SHA256
     * 
     * Token format: base64(payload) + "." + base64(signature)
     */
    private String generateZegoToken(long appId, String userID, String roomID, String serverSecret) throws Exception {
        // Create payload
        long currentTime = System.currentTimeMillis() / 1000;
        long expireTime = currentTime + TOKEN_EXPIRE_TIME;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("app_id", appId);
        payload.put("user_id", userID);
        payload.put("room_id", roomID);
        payload.put("iat", currentTime);
        payload.put("exp", expireTime);

        // Serialize payload to JSON
        ObjectMapper mapper = new ObjectMapper();
        String payloadJson = mapper.writeValueAsString(payload);

        // Encode payload to base64
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes());

        // Create signature
        String signatureInput = encodedPayload;
        String signature = hmacSha256(signatureInput, serverSecret);
        String encodedSignature = Base64.getUrlEncoder().withoutPadding().encodeToString(signature.getBytes());

        // Combine to create token
        return encodedPayload + "." + encodedSignature;
    }

    /**
     * Generate HMAC-SHA256 signature
     */
    private String hmacSha256(String data, String secret) throws Exception {
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(
            secret.getBytes(), 0, secret.getBytes().length, "HmacSHA256"
        );
        mac.init(secretKeySpec);
        byte[] digest = mac.doFinal(data.getBytes());
        return new String(digest);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("zegoConfigured", zegoAppId != 0 && zegoServerSecret != null && !zegoServerSecret.isEmpty());
        response.put("appId", zegoAppId);
        return ResponseEntity.ok(response);
    }
}
