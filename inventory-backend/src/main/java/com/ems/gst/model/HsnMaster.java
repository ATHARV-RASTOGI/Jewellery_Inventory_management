package com.ems.gst.model;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Entity 
@Builder 
@AllArgsConstructor
@NoArgsConstructor
public class HsnMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String materialKey; // "Gold", "Silver"
    private String hsnCode;     // "7113", "7114"
    private String description;
    private BigDecimal gstRate; // 3.00

}
