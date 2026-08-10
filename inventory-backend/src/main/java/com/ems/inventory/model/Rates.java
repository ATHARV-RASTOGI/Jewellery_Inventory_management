package com.ems.inventory.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Embeddable;

@Embeddable
public class Rates {

    @JsonProperty("INR")
    private BigDecimal inr;

    public BigDecimal getInr() {
        return inr;
    }

    public void setInr(BigDecimal inr) {
        this.inr = inr;
    }
}
