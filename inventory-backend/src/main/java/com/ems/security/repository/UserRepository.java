package com.ems.security.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ems.security.model.Users;

@Repository 
public interface UserRepository extends JpaRepository<Users, Long>{
    
    Optional<Users> findUserByUsername(String username);
    boolean existsByUsername(String username);
}
    