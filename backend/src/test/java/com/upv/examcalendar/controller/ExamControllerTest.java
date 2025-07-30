package com.upv.examcalendar.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upv.examcalendar.dto.ApiResponse;
import com.upv.examcalendar.dto.ExamDto;
import com.upv.examcalendar.dto.ExamSummaryDto;
import com.upv.examcalendar.security.SupabaseUserDetails;
import com.upv.examcalendar.service.ExamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ExamController.class)
@ActiveProfiles("test")
@DisplayName("ExamController Integration Tests")
class ExamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExamService examService;

    @Autowired
    private ObjectMapper objectMapper;

    private ExamDto sampleExamDto;
    private ExamSummaryDto sampleExamSummaryDto;
    private SupabaseUserDetails mockUser;

    @BeforeEach
    void setUp() {
        sampleExamDto = ExamDto.builder()
                .id(1L)
                .subject("Algorithms and Data Structures")
                .degree("Computer Science")
                .year("2")
                .semester("A")
                .date(LocalDateTime.of(2024, 6, 15, 9, 0))
                .room("A-101")
                .school("ETSINF")
                .build();

        sampleExamSummaryDto = new ExamSummaryDto(
                1L,
                "Algorithms and Data Structures",
                "Computer Science",
                LocalDateTime.of(2024, 6, 15, 9, 0),
                "A-101"
        );

        mockUser = mock(SupabaseUserDetails.class);
        when(mockUser.getEmail()).thenReturn("test@example.com");
        when(mockUser.getUsername()).thenReturn("test@example.com");
    }

    @Test
    @DisplayName("Should get all exams summary with pagination")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getAllExamsSummary() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Page<ExamSummaryDto> examPage = new PageImpl<>(Arrays.asList(sampleExamSummaryDto), pageable, 1);
        when(examService.getAllExamsSummary(any(Pageable.class))).thenReturn(examPage);

        // When & Then
        mockMvc.perform(get("/api/exams")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sortBy", "date")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exams retrieved successfully"))
                .andExpect(jsonPath("$.data.content[0].subject").value("Algorithms and Data Structures"))
                .andExpect(jsonPath("$.data.content[0].degree").value("Computer Science"))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(examService).getAllExamsSummary(any(Pageable.class));
    }

    @Test
    @DisplayName("Should get exam by ID")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getExamById() throws Exception {
        // Given
        when(examService.getExamById(1L)).thenReturn(Optional.of(sampleExamDto));

        // When & Then
        mockMvc.perform(get("/api/exams/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exam found"))
                .andExpect(jsonPath("$.data.subject").value("Algorithms and Data Structures"))
                .andExpect(jsonPath("$.data.degree").value("Computer Science"));

        verify(examService).getExamById(1L);
    }

    @Test
    @DisplayName("Should return 404 when exam not found")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getExamByIdNotFound() throws Exception {
        // Given
        when(examService.getExamById(999L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/exams/999"))
                .andExpect(status().isNotFound());

        verify(examService).getExamById(999L);
    }

    @Test
    @DisplayName("Should get exams by degree")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getExamsByDegree() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Page<ExamSummaryDto> examPage = new PageImpl<>(Arrays.asList(sampleExamSummaryDto), pageable, 1);
        when(examService.getExamsByDegree("Computer Science", any(Pageable.class))).thenReturn(examPage);

        // When & Then
        mockMvc.perform(get("/api/exams/degree/Computer Science")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exams retrieved for degree: Computer Science"))
                .andExpect(jsonPath("$.data.content[0].subject").value("Algorithms and Data Structures"));

        verify(examService).getExamsByDegree("Computer Science", any(Pageable.class));
    }

    @Test
    @DisplayName("Should get exams by subject")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getExamsBySubject() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Page<ExamSummaryDto> examPage = new PageImpl<>(Arrays.asList(sampleExamSummaryDto), pageable, 1);
        when(examService.getExamsBySubject("Algorithms", any(Pageable.class))).thenReturn(examPage);

        // When & Then
        mockMvc.perform(get("/api/exams/subject/Algorithms")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exams retrieved for subject: Algorithms"))
                .andExpect(jsonPath("$.data.content[0].subject").value("Algorithms and Data Structures"));

        verify(examService).getExamsBySubject("Algorithms", any(Pageable.class));
    }

    @Test
    @DisplayName("Should search exams with full-text search")
    @WithMockUser(roles = {"ANONYMOUS"})
    void searchExams() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Page<ExamSummaryDto> examPage = new PageImpl<>(Arrays.asList(sampleExamSummaryDto), pageable, 1);
        when(examService.searchExams("algorithms", any(Pageable.class))).thenReturn(examPage);

        // When & Then
        mockMvc.perform(get("/api/exams/search")
                        .param("q", "algorithms")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Search completed successfully"))
                .andExpect(jsonPath("$.data.content[0].subject").value("Algorithms and Data Structures"));

        verify(examService).searchExams("algorithms", any(Pageable.class));
    }

    @Test
    @DisplayName("Should search exams with multiple criteria")
    @WithMockUser(roles = {"ANONYMOUS"})
    void searchExamsMultipleCriteria() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Page<ExamSummaryDto> examPage = new PageImpl<>(Arrays.asList(sampleExamSummaryDto), pageable, 1);
        when(examService.searchExamsByMultipleCriteria("Computer Science", "2", "A", any(Pageable.class))).thenReturn(examPage);

        // When & Then
        mockMvc.perform(get("/api/exams/search")
                        .param("degree", "Computer Science")
                        .param("year", "2")
                        .param("semester", "A")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Search completed successfully"));

        verify(examService).searchExamsByMultipleCriteria("Computer Science", "2", "A", any(Pageable.class));
    }

    @Test
    @DisplayName("Should get exams by year and semester")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getExamsByYearAndSemester() throws Exception {
        // Given
        List<ExamDto> exams = Arrays.asList(sampleExamDto);
        when(examService.getExamsByYearAndSemester("2", "A")).thenReturn(exams);

        // When & Then
        mockMvc.perform(get("/api/exams/year/2/semester/A"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exams retrieved for 2 semester A"))
                .andExpect(jsonPath("$.data[0].subject").value("Algorithms and Data Structures"));

        verify(examService).getExamsByYearAndSemester("2", "A");
    }

    @Test
    @DisplayName("Should get upcoming exams")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getUpcomingExams() throws Exception {
        // Given
        List<ExamDto> exams = Arrays.asList(sampleExamDto);
        when(examService.getUpcomingExams()).thenReturn(exams);

        // When & Then
        mockMvc.perform(get("/api/exams/upcoming"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Upcoming exams retrieved"))
                .andExpect(jsonPath("$.data[0].subject").value("Algorithms and Data Structures"));

        verify(examService).getUpcomingExams();
    }

    @Test
    @DisplayName("Should get exams by date range")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getExamsByDateRange() throws Exception {
        // Given
        LocalDateTime startDate = LocalDateTime.of(2024, 6, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 6, 30, 23, 59);
        List<ExamDto> exams = Arrays.asList(sampleExamDto);
        when(examService.getExamsByDateRange(startDate, endDate)).thenReturn(exams);

        // When & Then
        mockMvc.perform(get("/api/exams/date-range")
                        .param("startDate", "2024-06-01T00:00:00")
                        .param("endDate", "2024-06-30T23:59:00"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exams retrieved for date range"))
                .andExpect(jsonPath("$.data[0].subject").value("Algorithms and Data Structures"));

        verify(examService).getExamsByDateRange(startDate, endDate);
    }

    @Test
    @DisplayName("Should get distinct degrees")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getDistinctDegrees() throws Exception {
        // Given
        List<String> degrees = Arrays.asList("Computer Science", "Mathematics");
        when(examService.getDistinctDegrees()).thenReturn(degrees);

        // When & Then
        mockMvc.perform(get("/api/exams/degrees"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Degrees retrieved"))
                .andExpect(jsonPath("$.data[0]").value("Computer Science"))
                .andExpect(jsonPath("$.data[1]").value("Mathematics"));

        verify(examService).getDistinctDegrees();
    }

    @Test
    @DisplayName("Should get distinct years")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getDistinctYears() throws Exception {
        // Given
        List<String> years = Arrays.asList("1", "2", "3", "4");
        when(examService.getDistinctYears()).thenReturn(years);

        // When & Then
        mockMvc.perform(get("/api/exams/years"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Years retrieved"))
                .andExpect(jsonPath("$.data[0]").value("1"))
                .andExpect(jsonPath("$.data[1]").value("2"));

        verify(examService).getDistinctYears();
    }

    @Test
    @DisplayName("Should get distinct semesters")
    @WithMockUser(roles = {"ANONYMOUS"})
    void getDistinctSemesters() throws Exception {
        // Given
        List<String> semesters = Arrays.asList("A", "B");
        when(examService.getDistinctSemesters()).thenReturn(semesters);

        // When & Then
        mockMvc.perform(get("/api/exams/semesters"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Semesters retrieved"))
                .andExpect(jsonPath("$.data[0]").value("A"))
                .andExpect(jsonPath("$.data[1]").value("B"));

        verify(examService).getDistinctSemesters();
    }

    @Test
    @DisplayName("Should create exam successfully")
    @WithMockUser(roles = {"AUTHENTICATED"})
    void createExam() throws Exception {
        // Given
        when(examService.createExam(any(ExamDto.class))).thenReturn(sampleExamDto);

        // When & Then
        mockMvc.perform(post("/api/exams")
                        .with(user(mockUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleExamDto)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exam created successfully"))
                .andExpect(jsonPath("$.data.subject").value("Algorithms and Data Structures"));

        verify(examService).createExam(any(ExamDto.class));
    }

    @Test
    @DisplayName("Should reject exam creation with invalid data")
    @WithMockUser(roles = {"AUTHENTICATED"})
    void createExamInvalidData() throws Exception {
        // Given
        ExamDto invalidExam = ExamDto.builder()
                .subject("") // Invalid: empty subject
                .degree("Computer Science")
                .build();

        // When & Then
        mockMvc.perform(post("/api/exams")
                        .with(user(mockUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidExam)))
                .andExpect(status().isBadRequest());

        verify(examService, never()).createExam(any(ExamDto.class));
    }

    @Test
    @DisplayName("Should update exam successfully")
    @WithMockUser(roles = {"AUTHENTICATED"})
    void updateExam() throws Exception {
        // Given
        when(examService.updateExam(eq(1L), any(ExamDto.class))).thenReturn(sampleExamDto);

        // When & Then
        mockMvc.perform(put("/api/exams/1")
                        .with(user(mockUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleExamDto)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exam updated successfully"))
                .andExpect(jsonPath("$.data.subject").value("Algorithms and Data Structures"));

        verify(examService).updateExam(eq(1L), any(ExamDto.class));
    }

    @Test
    @DisplayName("Should return 404 when updating non-existent exam")
    @WithMockUser(roles = {"AUTHENTICATED"})
    void updateExamNotFound() throws Exception {
        // Given
        when(examService.updateExam(eq(999L), any(ExamDto.class)))
                .thenThrow(new RuntimeException("Exam not found with ID: 999"));

        // When & Then
        mockMvc.perform(put("/api/exams/999")
                        .with(user(mockUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleExamDto)))
                .andExpect(status().isNotFound());

        verify(examService).updateExam(eq(999L), any(ExamDto.class));
    }

    @Test
    @DisplayName("Should delete exam successfully")
    @WithMockUser(roles = {"SERVICE"})
    void deleteExam() throws Exception {
        // Given
        doNothing().when(examService).deleteExam(1L);

        // When & Then
        mockMvc.perform(delete("/api/exams/1")
                        .with(user(mockUser)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Exam deleted successfully"));

        verify(examService).deleteExam(1L);
    }

    @Test
    @DisplayName("Should return 404 when deleting non-existent exam")
    @WithMockUser(roles = {"SERVICE"})
    void deleteExamNotFound() throws Exception {
        // Given
        doThrow(new RuntimeException("Exam not found with ID: 999")).when(examService).deleteExam(999L);

        // When & Then
        mockMvc.perform(delete("/api/exams/999")
                        .with(user(mockUser)))
                .andExpect(status().isNotFound());

        verify(examService).deleteExam(999L);
    }

    @Test
    @DisplayName("Should handle pagination parameters correctly")
    @WithMockUser(roles = {"ANONYMOUS"})
    void handlePaginationParameters() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(1, 10);
        Page<ExamSummaryDto> examPage = new PageImpl<>(Arrays.asList(sampleExamSummaryDto), pageable, 1);
        when(examService.getAllExamsSummary(any(Pageable.class))).thenReturn(examPage);

        // When & Then
        mockMvc.perform(get("/api/exams")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(examService).getAllExamsSummary(argThat(p -> 
            p.getPageNumber() == 1 && p.getPageSize() == 10
        ));
    }

    @Test
    @DisplayName("Should limit page size to prevent resource exhaustion")
    @WithMockUser(roles = {"ANONYMOUS"})
    void limitPageSize() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(0, 100); // Should be limited to 100
        Page<ExamSummaryDto> examPage = new PageImpl<>(Arrays.asList(sampleExamSummaryDto), pageable, 1);
        when(examService.getAllExamsSummary(any(Pageable.class))).thenReturn(examPage);

        // When & Then
        mockMvc.perform(get("/api/exams")
                        .param("page", "0")
                        .param("size", "1000")) // Requesting 1000, should be limited to 100
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(examService).getAllExamsSummary(argThat(p -> p.getPageSize() == 100));
    }

    @Test
    @DisplayName("Should handle validation errors for invalid page parameters")
    @WithMockUser(roles = {"ANONYMOUS"})
    void handleInvalidPageParameters() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/exams")
                        .param("page", "-1") // Invalid: negative page
                        .param("size", "0")) // Invalid: zero size
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should require authentication for creating exams")
    void requireAuthenticationForCreate() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleExamDto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should require service role for deleting exams")
    @WithMockUser(roles = {"AUTHENTICATED"})
    void requireServiceRoleForDelete() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/exams/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should handle internal server errors gracefully")
    @WithMockUser(roles = {"ANONYMOUS"})
    void handleInternalServerError() throws Exception {
        // Given
        when(examService.getAllExamsSummary(any(Pageable.class)))
                .thenThrow(new RuntimeException("Database connection failed"));

        // When & Then
        mockMvc.perform(get("/api/exams"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Error retrieving exams: Database connection failed"));
    }
} 