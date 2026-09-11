package com.ems.loan.controller;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.model.PendingDisbursement;
import com.ems.loan.service.InterestService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(InterestPaymentController.class)
public class InterestPaymentControllerTest {

    @Autowired 
    private MockMvc mockMvc;

    @Autowired 
    private ObjectMapper objectMapper;

    @MockitoBean 
    private InterestService interestService;

    @Test
    void testAddDisbursement() throws Exception {
        Long id = 1L;
        BigDecimal amount = BigDecimal.valueOf(20000); 
        LocalDate date = LocalDate.now().minusDays(2);       

        Loan loan = Loan.builder().id(id).build();

        PendingDisbursement pending = new PendingDisbursement();
        pending.setId(10L);
        pending.setAmount(amount);
        pending.setLoan(loan);
        pending.setDisbursedDate(date);

        when(interestService.addDisbursement(id, amount, date)).thenReturn(pending);

        Map<String, Object> payload = Map.of(
            "amount", amount,
            "disbursedDate", date.toString()
        );

        mockMvc.perform(post("/api/loans/{id}/disbursements", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(10))
            .andExpect(jsonPath("$.amount").value(20000))
            .andExpect(jsonPath("$.loan.id").value(id));
    }

    @Test
    void testCalculateInterest() throws Exception {
        BigDecimal principal = BigDecimal.valueOf(2000);
        LocalDate fromDate = LocalDate.now().minusDays(30);
        LocalDate toDate = LocalDate.now();
        BigDecimal rate = BigDecimal.valueOf(2.0);

        Map<String, Object> result = Map.of(
            "principal", principal,
            "interestAmount", BigDecimal.valueOf(40),
            "totalAmount", BigDecimal.valueOf(2040),
            "rate", rate
        );

        when(interestService.calculateInterestPreviewOnly(principal, fromDate, toDate, rate)).thenReturn(result);

        mockMvc.perform(get("/api/loans/calculate-interest")
                .param("principal", principal.toString())
                .param("fromDate", fromDate.toString())
                .param("toDate", toDate.toString())
                .param("rate", rate.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.principal").value(2000))
            .andExpect(jsonPath("$.interestAmount").value(40))
            .andExpect(jsonPath("$.totalAmount").value(2040))
            .andExpect(jsonPath("$.rate").value(2.0));
    }

    @Test
    void testCalculateSettlement() throws Exception {
        Long loanId = 1L;
        LocalDate closeDate = LocalDate.now();
        BigDecimal rate = BigDecimal.valueOf(2.0);

        Map<String, Object> settlement = Map.of(
            "principal", BigDecimal.valueOf(50000),
            "interestAmount", BigDecimal.valueOf(1000),
            "totalAmount", BigDecimal.valueOf(51000),
            "months", 1L,
            "rate", rate
        );

        when(interestService.calculateSettlement(loanId, closeDate, rate)).thenReturn(settlement);

        mockMvc.perform(get("/api/loans/{id}/calculate-settlement", loanId)
                .param("closeDate", closeDate.toString())
                .param("rate", rate.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.principal").value(50000))
            .andExpect(jsonPath("$.interestAmount").value(1000))
            .andExpect(jsonPath("$.totalAmount").value(51000))
            .andExpect(jsonPath("$.months").value(1))
            .andExpect(jsonPath("$.rate").value(2.0));
    }

    @Test
    void testDeletePendingDisbursement() throws Exception {
        Long loanId = 1L;
        Long disbursementId = 21L;

        doNothing().when(interestService).deletePendingDisbursement(loanId, disbursementId);

        mockMvc.perform(delete("/api/loans/{id}/disbursements/{disbursementId}", loanId, disbursementId))
            .andExpect(status().isNoContent());

        verify(interestService).deletePendingDisbursement(loanId, disbursementId);
    }

    @Test
    void testGetInterestPayments() throws Exception {
        Long loanId = 1L;

        InterestPayment payment = new InterestPayment();
        payment.setId(101L);
        payment.setAmountPaid(BigDecimal.valueOf(1500));
        payment.setPaymentDate(LocalDate.now());
        payment.setCustomer_name("Suresh Verma");
        payment.setAddress("Civil Lines, Bareilly");
        payment.setBalanceAfter(BigDecimal.valueOf(48500));

        when(interestService.getInterestPayments(loanId)).thenReturn(List.of(payment));

        mockMvc.perform(get("/api/loans/{id}/interest-payments", loanId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size()").value(1))
            .andExpect(jsonPath("$[0].id").value(101))
            .andExpect(jsonPath("$[0].amountPaid").value(1500))
            .andExpect(jsonPath("$[0].customer_name").value("Suresh Verma"))
            .andExpect(jsonPath("$[0].address").value("Civil Lines, Bareilly"));
    }

    @Test
    void testGetPendingDisbursements() throws Exception {
        Long loanId = 1L;

        Loan loan = Loan.builder().id(loanId).build();
        PendingDisbursement pd = new PendingDisbursement();
        pd.setId(21L);
        pd.setLoan(loan);
        pd.setAmount(BigDecimal.valueOf(15000));
        pd.setDisbursedDate(LocalDate.now().minusDays(5));

        when(interestService.getPendingDisbursements(loanId)).thenReturn(List.of(pd));

        mockMvc.perform(get("/api/loans/{id}/pending-disbursements", loanId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size()").value(1))
            .andExpect(jsonPath("$[0].id").value(21))
            .andExpect(jsonPath("$[0].amount").value(15000))
            .andExpect(jsonPath("$[0].loan.id").value(loanId));
    }

    @Test
    void testPayInterest() throws Exception {
        Long loanId = 1L;
        BigDecimal amountPaid = BigDecimal.valueOf(1200);
        LocalDate fromDate = LocalDate.now().minusMonths(1);
        LocalDate toDate = LocalDate.now();
        BigDecimal rate = BigDecimal.valueOf(2.0);

        InterestPayment payment = new InterestPayment();
        payment.setId(101L);
        payment.setAmountPaid(amountPaid);
        payment.setPaymentDate(LocalDate.now());
        payment.setCustomer_name("Ramesh Kumar");
        payment.setAddress("Civil Lines, Bareilly");

        when(interestService.recordInterestPayment(loanId, amountPaid, fromDate, toDate, rate))
                .thenReturn(payment);

        Map<String, Object> payload = Map.of(
            "amountPaid", amountPaid,
            "fromDate", fromDate.toString(),
            "toDate", toDate.toString(),
            "interestRate", rate
        );

        mockMvc.perform(post("/api/loans/{id}/pay-interest", loanId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(101))
            .andExpect(jsonPath("$.amountPaid").value(1200))
            .andExpect(jsonPath("$.customer_name").value("Ramesh Kumar"))
            .andExpect(jsonPath("$.address").value("Civil Lines, Bareilly"));
    }

    @Test
    void testPreviewInterestForLoan() throws Exception {
        Long loanId = 1L;
        LocalDate fromDate = LocalDate.now().minusMonths(1);
        LocalDate toDate = LocalDate.now();
        BigDecimal interestRate = BigDecimal.valueOf(2.0);

        Map<String, Object> preview = Map.of(
            "principal", BigDecimal.valueOf(60000),
            "interestAmount", BigDecimal.valueOf(1200),
            "totalAmount", BigDecimal.valueOf(61200)
        );

        when(interestService.previewInterestForLoan(loanId, fromDate, toDate, interestRate))
                .thenReturn(preview);

        mockMvc.perform(get("/api/loans/{id}/preview-interest", loanId)
                .param("fromDate", fromDate.toString())
                .param("toDate", toDate.toString())
                .param("interestRate", interestRate.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.principal").value(60000))
            .andExpect(jsonPath("$.interestAmount").value(1200))
            .andExpect(jsonPath("$.totalAmount").value(61200));
    }
}

