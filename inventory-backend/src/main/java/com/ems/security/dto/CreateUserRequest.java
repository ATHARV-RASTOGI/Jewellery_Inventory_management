package com.ems.security.dto;



import lombok.Data;

@Data
public class CreateUserRequest {
    private String username;
    private String password;
    private String role; // e.g. "ROLE_STAFF" or "ROLE_ADMIN"
}
