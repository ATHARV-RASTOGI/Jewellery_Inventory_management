/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.ems.inventory.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Embeddable;

 

    @Embeddable
    public class Rates{
        
    @JsonProperty("INR")
    private double inr;

    public double getInr() { return inr; }
    public void setInr(double inr) { this.inr = inr; }
    }

