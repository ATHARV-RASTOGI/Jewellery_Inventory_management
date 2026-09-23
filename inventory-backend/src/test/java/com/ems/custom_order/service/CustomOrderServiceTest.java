package com.ems.custom_order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import com.ems.Exception.Custom_Exception.CustomOrderNotFoundException;
import com.ems.custom_order.dto.CustomOrderRequestDTO;
import com.ems.custom_order.dto.CustomOrderResponseDTO;
import com.ems.custom_order.model.CustomOrder;
import com.ems.custom_order.model.OrderStatus;
import com.ems.custom_order.repository.CustomOrderRepository;


@ExtendWith(MockitoExtension.class)
public class CustomOrderServiceTest {

    @Mock
    private CustomOrderRepository customOrderRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private CustomOrderService customOrderService;

    private CustomOrder order;
    private CustomOrderResponseDTO responseDTO;
    private CustomOrderRequestDTO requestDTO;

    @BeforeEach
    void setup(){
        order = CustomOrder.builder()
        .orderId(1L)
        .customerName("Atharv")
        .status(OrderStatus.PENDING)
        .build();

        responseDTO = CustomOrderResponseDTO.builder()
        .orderId(1L)
        .customerName("Atharv")
        .status(OrderStatus.PENDING)
        .build();
        
        requestDTO = CustomOrderRequestDTO.builder()

        .customerName("Atharv")
        .advanceAmount(new BigDecimal("1000"))
        .build();
    }
    @Test
    void testDeleteCustomOrder() {

        when(customOrderRepository.existsById(1L)).thenReturn(true);
        when(customOrderRepository.findById(1L)).thenReturn(Optional.of(order));

        customOrderService.deleteCustomOrder(1L);

        assertEquals(OrderStatus.PENDING, customOrderRepository.findById(1L).get().getStatus());
        assertThrows(CustomOrderNotFoundException.class, () -> {
        customOrderService.deleteCustomOrder(99L);
    });
    
        verify(customOrderRepository).existsById(1L);
        verify(customOrderRepository).deleteById(1L);
    }

    @Test
    void testGetAllCustomOrder() {

        when(customOrderRepository.findAll()).thenReturn(Collections.singletonList(order));
        when(modelMapper.map(order, CustomOrderResponseDTO.class)).thenReturn(responseDTO);

        List<CustomOrderResponseDTO> result = customOrderService.getAllCustomOrder();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(Long.valueOf(1), result.get(0).getOrderId());

        verify(customOrderRepository).findAll();

    }

    @Test
    void testGetCustomOrderById() {
        when (customOrderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(modelMapper.map(order, CustomOrderResponseDTO.class)).thenReturn(responseDTO);

        CustomOrderResponseDTO responseDTO = customOrderService.getCustomOrderById(1L);

        assertEquals(order.getOrderId(), responseDTO.getOrderId());
        assertEquals(order.getCustomerName(), responseDTO.getCustomerName());
        assertEquals(order.getStatus(), responseDTO.getStatus());

        verify(customOrderRepository).findById(1L);
        verify(modelMapper).map(order, CustomOrderResponseDTO.class);

    }

    @Test
    void testSaveCustomOrder() {
        CustomOrder newOrder = CustomOrder.builder()
                .customerName("Atharv")
                .advanceAmount(new BigDecimal("1000"))
                .status(OrderStatus.PENDING)
                .build();
        CustomOrder savedOrder = CustomOrder.builder()
                .orderId(1L)
                .customerName("Atharv")
                .advanceAmount(new BigDecimal("1000"))
                .status(OrderStatus.PENDING)
                .build();

        // Stub modelMapper: request DTO -> entity
        when(modelMapper.map(requestDTO, CustomOrder.class)).thenReturn(newOrder);
        
        // Stub repository: save entity -> entity
        when(customOrderRepository.save(newOrder)).thenReturn(savedOrder);
        
        // Stub modelMapper: entity -> response DTO
        when(modelMapper.map(savedOrder, CustomOrderResponseDTO.class)).thenReturn(responseDTO);

        // 2. Act
        CustomOrderResponseDTO result = customOrderService.saveCustomOrder(requestDTO);

        // 3. Assert
        assertNotNull(result);
        assertEquals(responseDTO.getOrderId(), result.getOrderId());
        assertEquals(responseDTO.getCustomerName(), result.getCustomerName());

        // 4. Verify
        verify(customOrderRepository).save(newOrder);
        verify(modelMapper).map(requestDTO, CustomOrder.class);
        verify(modelMapper).map(savedOrder, CustomOrderResponseDTO.class);
    }

    @Test
    void testSaveCustomOrder_EnforcesCreateOnly_NullsSuppliedId() {
        CustomOrder preExistingOrder = CustomOrder.builder()
                .orderId(999L)
                .customerName("Existing")
                .advanceAmount(new BigDecimal("500"))
                .status(OrderStatus.PENDING)
                .build();
        CustomOrder savedOrder = CustomOrder.builder()
                .orderId(100L)
                .customerName("Existing")
                .advanceAmount(new BigDecimal("500"))
                .status(OrderStatus.PENDING)
                .build();

        when(modelMapper.map(requestDTO, CustomOrder.class)).thenReturn(preExistingOrder);
        when(customOrderRepository.save(any(CustomOrder.class))).thenReturn(savedOrder);
        when(modelMapper.map(savedOrder, CustomOrderResponseDTO.class)).thenReturn(responseDTO);

        customOrderService.saveCustomOrder(requestDTO);

        ArgumentCaptor<CustomOrder> captor = ArgumentCaptor.forClass(CustomOrder.class);
        verify(customOrderRepository).save(captor.capture());
        assertNull(captor.getValue().getOrderId(), "saveCustomOrder must clear orderId to enforce create-only semantics");
    }

    @Test
    void testUpdateCustomOrder() {
    // 1. Arrange
    when(customOrderRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
    doNothing().when(modelMapper).map(requestDTO, order);
    when(modelMapper.map(order, CustomOrderResponseDTO.class)).thenReturn(responseDTO);

    // 2. Act
    CustomOrderResponseDTO updated = customOrderService.updateCustomOrder(1L, requestDTO);
 
    // 3. Assert
    assertNotNull(updated);
    assertEquals(responseDTO.getOrderId(), updated.getOrderId());
    assertEquals(responseDTO.getCustomerName(), updated.getCustomerName());

    // 4. Verify
    verify(customOrderRepository).findByIdForUpdate(1L);
    verify(modelMapper).map(requestDTO, order);
    verify(modelMapper).map(order, CustomOrderResponseDTO.class);
}

}
