package com.upv.examcalendar.service;

import com.upv.examcalendar.dto.ExamDto;
import com.upv.examcalendar.dto.ExamProjection;
import com.upv.examcalendar.dto.ExamSummaryDto;
import com.upv.examcalendar.model.Exam;
import com.upv.examcalendar.repository.ExamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ExamService Tests")
class ExamServiceTest {

    @Mock
    private ExamRepository examRepository;

    @InjectMocks
    private ExamService examService;

    private Exam sampleExam;
    private ExamDto sampleExamDto;

    @BeforeEach
    void setUp() {
        sampleExam = new Exam();
        sampleExam.setId(1L);
        sampleExam.setSubject("Algorithms and Data Structures");
        sampleExam.setDegree("Computer Science");
        sampleExam.setYear("2");
        sampleExam.setSemester("A");
        sampleExam.setDate(LocalDateTime.of(2024, 6, 15, 9, 0));
        sampleExam.setRoom("A-101");
        sampleExam.setSchool("ETSINF");

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
    }

    @Test
    @DisplayName("Should retrieve all exams successfully")
    void getAllExams() {
        // Given
        List<Exam> exams = Arrays.asList(sampleExam);
        when(examRepository.findAll()).thenReturn(exams);

        // When
        List<ExamDto> result = examService.getAllExams();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSubject()).isEqualTo("Algorithms and Data Structures");
        assertThat(result.get(0).getDegree()).isEqualTo("Computer Science");
        verify(examRepository).findAll();
    }

    @Test
    @DisplayName("Should retrieve paginated exams successfully")
    void getAllExamsPaginated() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Exam> examPage = new PageImpl<>(Arrays.asList(sampleExam), pageable, 1);
        when(examRepository.findAll(pageable)).thenReturn(examPage);

        // When
        Page<ExamDto> result = examService.getAllExams(pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getSubject()).isEqualTo("Algorithms and Data Structures");
        verify(examRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Should retrieve exam summaries with pagination")
    void getAllExamsSummary() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Exam> examPage = new PageImpl<>(Arrays.asList(sampleExam), pageable, 1);
        when(examRepository.findAll(pageable)).thenReturn(examPage);

        // When
        Page<ExamSummaryDto> result = examService.getAllExamsSummary(pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        ExamSummaryDto summary = result.getContent().get(0);
        assertThat(summary.getSubject()).isEqualTo("Algorithms and Data Structures");
        assertThat(summary.getDegree()).isEqualTo("Computer Science");
        assertThat(summary.getRoom()).isEqualTo("A-101");
        verify(examRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Should retrieve exam by ID successfully")
    void getExamById() {
        // Given
        when(examRepository.findById(1L)).thenReturn(Optional.of(sampleExam));

        // When
        Optional<ExamDto> result = examService.getExamById(1L);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getSubject()).isEqualTo("Algorithms and Data Structures");
        assertThat(result.get().getDegree()).isEqualTo("Computer Science");
        verify(examRepository).findById(1L);
    }

    @Test
    @DisplayName("Should return empty when exam not found by ID")
    void getExamByIdNotFound() {
        // Given
        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Optional<ExamDto> result = examService.getExamById(999L);

        // Then
        assertThat(result).isEmpty();
        verify(examRepository).findById(999L);
    }

    @Test
    @DisplayName("Should retrieve exams by degree with pagination")
    void getExamsByDegree() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        ExamProjection projection = mock(ExamProjection.class);
        when(projection.getId()).thenReturn(1L);
        when(projection.getSubject()).thenReturn("Algorithms and Data Structures");
        when(projection.getDegree()).thenReturn("Computer Science");
        when(projection.getDate()).thenReturn(LocalDateTime.of(2024, 6, 15, 9, 0));
        when(projection.getRoom()).thenReturn("A-101");

        Page<ExamProjection> projectionPage = new PageImpl<>(Arrays.asList(projection), pageable, 1);
        when(examRepository.findByDegreeOrderByDateAsc("Computer Science", pageable)).thenReturn(projectionPage);

        // When
        Page<ExamSummaryDto> result = examService.getExamsByDegree("Computer Science", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        ExamSummaryDto summary = result.getContent().get(0);
        assertThat(summary.getSubject()).isEqualTo("Algorithms and Data Structures");
        assertThat(summary.getDegree()).isEqualTo("Computer Science");
        verify(examRepository).findByDegreeOrderByDateAsc("Computer Science", pageable);
    }

    @Test
    @DisplayName("Should retrieve exams by subject with pagination")
    void getExamsBySubject() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        ExamProjection projection = mock(ExamProjection.class);
        when(projection.getId()).thenReturn(1L);
        when(projection.getSubject()).thenReturn("Algorithms and Data Structures");
        when(projection.getDegree()).thenReturn("Computer Science");
        when(projection.getDate()).thenReturn(LocalDateTime.of(2024, 6, 15, 9, 0));
        when(projection.getRoom()).thenReturn("A-101");

        Page<ExamProjection> projectionPage = new PageImpl<>(Arrays.asList(projection), pageable, 1);
        when(examRepository.findBySubjectContainingIgnoreCaseOrderByDateAsc("Algorithms", pageable)).thenReturn(projectionPage);

        // When
        Page<ExamSummaryDto> result = examService.getExamsBySubject("Algorithms", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        ExamSummaryDto summary = result.getContent().get(0);
        assertThat(summary.getSubject()).isEqualTo("Algorithms and Data Structures");
        verify(examRepository).findBySubjectContainingIgnoreCaseOrderByDateAsc("Algorithms", pageable);
    }

    @Test
    @DisplayName("Should retrieve exams by year and semester with pagination")
    void getExamsByYearAndSemester() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        ExamProjection projection = mock(ExamProjection.class);
        when(projection.getId()).thenReturn(1L);
        when(projection.getSubject()).thenReturn("Algorithms and Data Structures");
        when(projection.getDegree()).thenReturn("Computer Science");
        when(projection.getDate()).thenReturn(LocalDateTime.of(2024, 6, 15, 9, 0));
        when(projection.getRoom()).thenReturn("A-101");

        Page<ExamProjection> projectionPage = new PageImpl<>(Arrays.asList(projection), pageable, 1);
        when(examRepository.findByYearAndSemesterOrderByDateAsc("2", "A", pageable)).thenReturn(projectionPage);

        // When
        Page<ExamSummaryDto> result = examService.getExamsByYearAndSemester("2", "A", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        ExamSummaryDto summary = result.getContent().get(0);
        assertThat(summary.getSubject()).isEqualTo("Algorithms and Data Structures");
        verify(examRepository).findByYearAndSemesterOrderByDateAsc("2", "A", pageable);
    }

    @Test
    @DisplayName("Should search exams by multiple criteria")
    void searchExamsByMultipleCriteria() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        ExamProjection projection = mock(ExamProjection.class);
        when(projection.getId()).thenReturn(1L);
        when(projection.getSubject()).thenReturn("Algorithms and Data Structures");
        when(projection.getDegree()).thenReturn("Computer Science");
        when(projection.getDate()).thenReturn(LocalDateTime.of(2024, 6, 15, 9, 0));
        when(projection.getRoom()).thenReturn("A-101");

        Page<ExamProjection> projectionPage = new PageImpl<>(Arrays.asList(projection), pageable, 1);
        when(examRepository.findByMultipleCriteria("Computer Science", "2", "A", pageable)).thenReturn(projectionPage);

        // When
        Page<ExamSummaryDto> result = examService.searchExamsByMultipleCriteria("Computer Science", "2", "A", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        ExamSummaryDto summary = result.getContent().get(0);
        assertThat(summary.getSubject()).isEqualTo("Algorithms and Data Structures");
        verify(examRepository).findByMultipleCriteria("Computer Science", "2", "A", pageable);
    }

    @Test
    @DisplayName("Should perform full-text search successfully")
    void searchExams() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        ExamProjection projection = mock(ExamProjection.class);
        when(projection.getId()).thenReturn(1L);
        when(projection.getSubject()).thenReturn("Algorithms and Data Structures");
        when(projection.getDegree()).thenReturn("Computer Science");
        when(projection.getDate()).thenReturn(LocalDateTime.of(2024, 6, 15, 9, 0));
        when(projection.getRoom()).thenReturn("A-101");

        Page<ExamProjection> projectionPage = new PageImpl<>(Arrays.asList(projection), pageable, 1);
        when(examRepository.searchExamsOptimized("algorithms", pageable)).thenReturn(projectionPage);

        // When
        Page<ExamSummaryDto> result = examService.searchExams("algorithms", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        ExamSummaryDto summary = result.getContent().get(0);
        assertThat(summary.getSubject()).isEqualTo("Algorithms and Data Structures");
        verify(examRepository).searchExamsOptimized("algorithms", pageable);
    }

    @Test
    @DisplayName("Should fallback to LIKE search when full-text search fails")
    void searchExamsFallback() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        ExamProjection projection = mock(ExamProjection.class);
        when(projection.getId()).thenReturn(1L);
        when(projection.getSubject()).thenReturn("Algorithms and Data Structures");
        when(projection.getDegree()).thenReturn("Computer Science");
        when(projection.getDate()).thenReturn(LocalDateTime.of(2024, 6, 15, 9, 0));
        when(projection.getRoom()).thenReturn("A-101");

        Page<ExamProjection> projectionPage = new PageImpl<>(Arrays.asList(projection), pageable, 1);
        when(examRepository.searchExamsOptimized("algorithms", pageable)).thenThrow(new RuntimeException("Full-text search failed"));
        when(examRepository.searchExams("algorithms", pageable)).thenReturn(projectionPage);

        // When
        Page<ExamSummaryDto> result = examService.searchExams("algorithms", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(examRepository).searchExamsOptimized("algorithms", pageable);
        verify(examRepository).searchExams("algorithms", pageable);
    }

    @Test
    @DisplayName("Should retrieve exams by date range")
    void getExamsByDateRange() {
        // Given
        LocalDateTime startDate = LocalDateTime.of(2024, 6, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 6, 30, 23, 59);
        List<Exam> exams = Arrays.asList(sampleExam);
        when(examRepository.findByDateBetweenOrderByDateAsc(startDate, endDate)).thenReturn(exams);

        // When
        List<ExamDto> result = examService.getExamsByDateRange(startDate, endDate);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSubject()).isEqualTo("Algorithms and Data Structures");
        verify(examRepository).findByDateBetweenOrderByDateAsc(startDate, endDate);
    }

    @Test
    @DisplayName("Should retrieve upcoming exams")
    void getUpcomingExams() {
        // Given
        List<Exam> exams = Arrays.asList(sampleExam);
        when(examRepository.findByDateGreaterThanEqualOrderByDateAsc(any(LocalDateTime.class))).thenReturn(exams);

        // When
        List<ExamDto> result = examService.getUpcomingExams();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSubject()).isEqualTo("Algorithms and Data Structures");
        verify(examRepository).findByDateGreaterThanEqualOrderByDateAsc(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Should retrieve distinct degrees")
    void getDistinctDegrees() {
        // Given
        List<String> degrees = Arrays.asList("Computer Science", "Mathematics");
        when(examRepository.findDistinctDegrees()).thenReturn(degrees);

        // When
        List<String> result = examService.getDistinctDegrees();

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).contains("Computer Science", "Mathematics");
        verify(examRepository).findDistinctDegrees();
    }

    @Test
    @DisplayName("Should retrieve distinct years")
    void getDistinctYears() {
        // Given
        List<String> years = Arrays.asList("1", "2", "3", "4");
        when(examRepository.findDistinctYears()).thenReturn(years);

        // When
        List<String> result = examService.getDistinctYears();

        // Then
        assertThat(result).hasSize(4);
        assertThat(result).contains("1", "2", "3", "4");
        verify(examRepository).findDistinctYears();
    }

    @Test
    @DisplayName("Should retrieve distinct semesters")
    void getDistinctSemesters() {
        // Given
        List<String> semesters = Arrays.asList("A", "B");
        when(examRepository.findDistinctSemesters()).thenReturn(semesters);

        // When
        List<String> result = examService.getDistinctSemesters();

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).contains("A", "B");
        verify(examRepository).findDistinctSemesters();
    }

    @Test
    @DisplayName("Should create exam successfully")
    void createExam() {
        // Given
        when(examRepository.save(any(Exam.class))).thenReturn(sampleExam);

        // When
        ExamDto result = examService.createExam(sampleExamDto);

        // Then
        assertThat(result.getSubject()).isEqualTo("Algorithms and Data Structures");
        assertThat(result.getDegree()).isEqualTo("Computer Science");
        verify(examRepository).save(any(Exam.class));
    }

    @Test
    @DisplayName("Should update exam successfully")
    void updateExam() {
        // Given
        when(examRepository.findById(1L)).thenReturn(Optional.of(sampleExam));
        when(examRepository.save(any(Exam.class))).thenReturn(sampleExam);

        ExamDto updatedDto = ExamDto.builder()
                .id(1L)
                .subject("Updated Algorithms")
                .degree("Computer Science")
                .year("2")
                .semester("A")
                .date(LocalDateTime.of(2024, 6, 15, 9, 0))
                .room("B-101")
                .school("ETSINF")
                .build();

        // When
        ExamDto result = examService.updateExam(1L, updatedDto);

        // Then
        assertThat(result.getSubject()).isEqualTo("Updated Algorithms");
        assertThat(result.getRoom()).isEqualTo("B-101");
        verify(examRepository).findById(1L);
        verify(examRepository).save(any(Exam.class));
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent exam")
    void updateExamNotFound() {
        // Given
        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> examService.updateExam(999L, sampleExamDto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Exam not found with ID: 999");
        verify(examRepository).findById(999L);
        verify(examRepository, never()).save(any(Exam.class));
    }

    @Test
    @DisplayName("Should delete exam successfully")
    void deleteExam() {
        // Given
        when(examRepository.existsById(1L)).thenReturn(true);

        // When
        examService.deleteExam(1L);

        // Then
        verify(examRepository).existsById(1L);
        verify(examRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent exam")
    void deleteExamNotFound() {
        // Given
        when(examRepository.existsById(999L)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> examService.deleteExam(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Exam not found with ID: 999");
        verify(examRepository).existsById(999L);
        verify(examRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Should check if exam exists")
    void examExists() {
        // Given
        when(examRepository.existsById(1L)).thenReturn(true);
        when(examRepository.existsById(999L)).thenReturn(false);

        // When
        boolean exists = examService.examExists(1L);
        boolean notExists = examService.examExists(999L);

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
        verify(examRepository).existsById(1L);
        verify(examRepository).existsById(999L);
    }

    @Test
    @DisplayName("Should convert entity to DTO correctly")
    void convertToDto() {
        // Given
        Exam exam = new Exam();
        exam.setId(1L);
        exam.setSubject("Test Subject");
        exam.setDegree("Test Degree");
        exam.setYear("3");
        exam.setSemester("B");
        exam.setDate(LocalDateTime.of(2024, 7, 15, 10, 0));
        exam.setRoom("C-201");
        exam.setSchool("Test School");

        // When
        ExamDto result = examService.getAllExams().get(0); // This will trigger conversion

        // Then
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSubject()).isEqualTo("Test Subject");
        assertThat(result.getDegree()).isEqualTo("Test Degree");
        assertThat(result.getYear()).isEqualTo("3");
        assertThat(result.getSemester()).isEqualTo("B");
        assertThat(result.getDate()).isEqualTo(LocalDateTime.of(2024, 7, 15, 10, 0));
        assertThat(result.getRoom()).isEqualTo("C-201");
        assertThat(result.getSchool()).isEqualTo("Test School");
    }

    @Test
    @DisplayName("Should convert DTO to entity correctly")
    void convertToEntity() {
        // Given
        ExamDto dto = ExamDto.builder()
                .id(1L)
                .subject("Test Subject")
                .degree("Test Degree")
                .year("3")
                .semester("B")
                .date(LocalDateTime.of(2024, 7, 15, 10, 0))
                .room("C-201")
                .school("Test School")
                .build();

        when(examRepository.save(any(Exam.class))).thenReturn(sampleExam);

        // When
        examService.createExam(dto);

        // Then
        verify(examRepository).save(argThat(exam -> 
            exam.getSubject().equals("Test Subject") &&
            exam.getDegree().equals("Test Degree") &&
            exam.getYear().equals("3") &&
            exam.getSemester().equals("B") &&
            exam.getDate().equals(LocalDateTime.of(2024, 7, 15, 10, 0)) &&
            exam.getRoom().equals("C-201") &&
            exam.getSchool().equals("Test School")
        ));
    }
} 