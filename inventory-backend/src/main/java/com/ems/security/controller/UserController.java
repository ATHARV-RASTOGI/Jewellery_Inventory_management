package com.ems.security.controller;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ems.security.dto.CreateUserRequest;
import com.ems.security.dto.ResetPasswordRequest;
import com.ems.security.dto.UserSummaryResponse;
import com.ems.security.model.Users;
import com.ems.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor 
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping 
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        List<UserSummaryResponse> users = userRepository.findAll().stream()
            .map(u -> new UserSummaryResponse(u.getId(), u.getUsername(), u.getRole(), u.isEnabled()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping 
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        if(request.getUsername() == null || request.getUsername().trim().isEmpty()){
            return ResponseEntity.badRequest().body(Map.of("error","username is required"));
        }
         if (request.getPassword() == null || request.getPassword().trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }
         if (userRepository.existsByUsername(request.getUsername().trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists"));
        }
        Users user = new Users();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        // Default to ROLE_STAFF if role not specified
        String role = (request.getRole() != null && !request.getRole().trim().isEmpty())
            ? request.getRole().trim()
            : "ROLE_STAFF";
        user.setRole(role);
        user.setEnabled(true);
        Users saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new UserSummaryResponse(saved.getId(), saved.getUsername(), saved.getRole(), saved.isEnabled()));
    }


    @PutMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        }
        Users user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully for user: " + user.getUsername()));
    }

     @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        Users user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        user.setEnabled(!user.isEnabled());
        Users updated = userRepository.save(user);
        return ResponseEntity.ok(new UserSummaryResponse(
            updated.getId(),
            updated.getUsername(),
            updated.getRole(),
            updated.isEnabled()
        ));
    }
}
