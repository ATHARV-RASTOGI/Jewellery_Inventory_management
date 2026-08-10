package com.ems.custom_order.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name="custom_order")
@Data // equal to getter , setter and AllArgsConstructor 
@NoArgsConstructor
public class CustomOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;

    private String customerName;
    private String customerPhone;
    private String customerAddress;

    @Column(name = "item_name")
    private String itemName;
    
    @Column(name = "material")
    private String materialType;

    @Column(name = "gold_carat")
    private String goldCarat;

    @Column(name = "diamond_carat")
    private String diamondCarat;

    @Column(name = "Design")
    private String designRemark;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate orderDate;


    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate pickupDate;


    @Column(name = "Advance")
    private BigDecimal advanceAmount;

    @Column(name = "Total")
    private BigDecimal totalAmount;

    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    
    private String linkedSaleId;
    
}
