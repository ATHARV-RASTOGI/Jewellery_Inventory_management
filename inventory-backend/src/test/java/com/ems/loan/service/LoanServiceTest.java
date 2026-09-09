package com.ems.loan.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

import com.ems.loan.dto.LoanRequestDTO;
import com.ems.loan.dto.LoanResponseDTO;
import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;
import com.ems.loan.repository.LoanRepository;



@ExtendWith(MockitoExtension.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;
    
    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private LoanService loanService;

    private LoanRequestDTO loanRequestDTO;
    private LoanResponseDTO loanResponseDTO;
    private Loan loan;

    @BeforeEach
    void setup(){
        loanRequestDTO = new LoanRequestDTO();
        loanRequestDTO.setName("Atharv");
        loanRequestDTO.setFatherName("AABBS");
        loanRequestDTO.setAddress("123 Main St");
        loanRequestDTO.setLoanAmount(new BigDecimal("90000"));
        loanRequestDTO.setWeight(new BigDecimal("9"));
        loanRequestDTO.setMetal("Gold");
        loanRequestDTO.setMobileNo("8904932823");
        
        loanResponseDTO = new LoanResponseDTO();
        loanResponseDTO.setId(1L);
        loanResponseDTO.setName("Atharv");
        loanResponseDTO.setStatus(LoanStatus.ACTIVE);
        loanResponseDTO.setFatherName("AABBS");
        loanResponseDTO.setAddress("123 Main St");
        

        loan = new Loan();
        loan.setId(1L);
        loan.setName("John");
        loan.setFatherName("Doe");
        loan.setAddress("123 Main St");
        loan.setMobileNo("1234567890");
        loan.setLoanAmount(new BigDecimal("1000"));
        loan.setStatus(LoanStatus.ACTIVE);


    }

    
    @Test
    void testCloseLoan() {
        
        //assign 
        LocalDate closeDate = LocalDate.now();
        BigDecimal set = new BigDecimal("90000");

        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
        when(loanRepository.save(loan)).thenReturn(loan);
        when(modelMapper.map(loan,LoanResponseDTO.class)).thenReturn(loanResponseDTO);


        //act 
        LoanResponseDTO result = loanService.closeLoan(1L, closeDate, set);
        
        //assert 
        assertNotNull(result);
        assertEquals(LoanStatus.CLOSED, loan.getStatus());
        assertEquals(closeDate, loan.getCloseDate());
        assertEquals(set, loan.getSettlementAmount());
        assertEquals(set, loan.getSettlementAmount());
        
        //verify
        verify(loanRepository).findById(1L);
        verify(loanRepository).save(loan);

    }

    @Test
    void testCountActiveLoans() {

        //assign
        when(loanRepository.countActiveLoans()).thenReturn(10L);

        //act
        long count = loanService.countActiveLoans();

        //assert
        assertEquals(10L, count);

        //verify
        verify(loanRepository).countActiveLoans();

    }

    @Test
    void testFindByNameAndFatherName() {

        //assign
        String name = "Atharv";
        String fatherName = "AABBS";
        when(loanRepository.findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc(name,fatherName)).thenReturn(Optional.of(loan));
        when(modelMapper.map(loan,LoanResponseDTO.class)).thenReturn(loanResponseDTO);


        //act 
        Optional<LoanResponseDTO> lo= loanService.findByNameAndFatherName(name,fatherName);

        //assert
        assertNotNull(lo);
        assertEquals(lo.get().getName(),name);
        assertEquals(lo.get().getFatherName(), fatherName);

        //verifym
        verify(loanRepository).findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc(name,fatherName);
        verify(modelMapper).map(loan, LoanResponseDTO.class);

    }

    @Test
    void testFindByNameAndFatherNameAndAddress() {

        //assign
        String name = "Atharv";
        String fathername = "AABBS";
        String address = "123 Main St";

        when(loanRepository.findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc(name, fathername, address)).thenReturn(Optional.of(loan));
        when(modelMapper.map(loan,LoanResponseDTO.class)) .thenReturn(loanResponseDTO);
        //act 
        Optional<LoanResponseDTO> res= loanService.findByNameAndFatherNameAndAddress(name,fathername,address);

        
        //assert 
        assertNotNull(res);
        assertEquals(res.get().getName(),name);
        assertEquals(res.get().getFatherName(),fathername);
        assertEquals(res.get().getAddress(),address);

        //verify
        verify(loanRepository).findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc(name,fathername,address);
        verify(modelMapper).map(loan, LoanResponseDTO.class);
    }

    @Test
    void testGetAll() {

        //assign 
        List<Loan> loans = List.of(loan);
        when(loanRepository.findAll()).thenReturn(loans);
        when(modelMapper.map(loan, LoanResponseDTO.class)).thenReturn(loanResponseDTO);

        //act 
        List<LoanResponseDTO> result = loanService.getAll();

        //assert
        assertNotNull(result);
        assertEquals(1, result.size());

        //verify 
        verify(loanRepository).findAll();
        verify(modelMapper, Mockito.times(1)).map(loan, LoanResponseDTO.class);

    }

    @Test
    void testGetTotalLoanAmount() {

        //arrange
        when(loanRepository.getTotalLoanAmount()).thenReturn(new BigDecimal("10000"));

        //act
        BigDecimal total = loanService.getTotalLoanAmount();

        //assert
        assertNotNull(total);
        assertEquals(new BigDecimal("10000"), total);

        //verify
        verify(loanRepository).getTotalLoanAmount();
    }

    @Test
    void testSaveLoan() {

    // Arrange
    LoanRequestDTO request = new LoanRequestDTO();
    Loan loan = new Loan(); 
    Loan savedLoan = new Loan();
    savedLoan.setStatus(LoanStatus.ACTIVE);
    LoanResponseDTO responseDTO = new LoanResponseDTO();

    when(modelMapper.map(request, Loan.class)).thenReturn(loan);
    when(loanRepository.save(loan)).thenReturn(savedLoan);
    when(modelMapper.map(savedLoan, LoanResponseDTO.class)).thenReturn(responseDTO);

    // Act
    LoanResponseDTO result = loanService.saveLoan(request);

    // Assert
    assertNotNull(result);
    assertEquals(LoanStatus.ACTIVE, loan.getStatus()); // Confirms business rule set ACTIVE!
    verify(loanRepository).save(loan);
    }
}