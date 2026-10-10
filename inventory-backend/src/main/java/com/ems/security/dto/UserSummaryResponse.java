package com.ems.security.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSummaryResponse {
    private Long id;
    private String username;
    private String role;
    private boolean enabled;
}
