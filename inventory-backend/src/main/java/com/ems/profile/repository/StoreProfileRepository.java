package com.ems.profile.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.profile.model.StoreProfile;

public interface StoreProfileRepository extends JpaRepository<StoreProfile, Long> {
}
