package com.upv.examcalendar.service;

import com.upv.examcalendar.dto.ExamDto;
import com.upv.examcalendar.dto.ExamProjection;
import com.upv.examcalendar.dto.ExamSummaryDto;
import com.upv.examcalendar.model.Exam;
import com.upv.examcalendar.repository.ExamRepository;
import io.micrometer.core.annotation.Timed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service layer for Exam entities mapped to ETSINF table.
 * Provides business logic and data transformation between Entity and DTO.
 * 
 * Enhanced with performance optimizations including:
 * - Caching for frequently accessed data
 * - Pagination for large result sets
 * - Lightweight projections for list views
 * - Performance monitoring with Micrometer
 * 
 * Based on Spring Boot service layer best practices and Supabase integration
 * patterns.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ExamService {

    private final ExamRepository examRepository;

    /**
     * Retrieves all exams with optional filtering.
     * 
     * @deprecated Use getAllExamsSummary(Pageable) for better performance
     * @return List of ExamDto
     */
    @Deprecated
    @Timed(value = "exam.service.getAll", description = "Time taken to fetch all exams")
    public List<ExamDto> getAllExams() {
        log.debug("Fetching all exams from ETSINF table");
        List<Exam> exams = examRepository.findAll();
        return exams.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves exams with pagination support.
     * 
     * @param pageable Pagination information
     * @return Page of ExamDto
     */
    @Timed(value = "exam.service.getAllPaginated", description = "Time taken to fetch paginated exams")
    public Page<ExamDto> getAllExams(Pageable pageable) {
        log.debug("Fetching exams with pagination: page {}, size {}",
                pageable.getPageNumber(), pageable.getPageSize());
        Page<Exam> examPage = examRepository.findAll(pageable);
        return examPage.map(this::convertToDto);
    }

    /**
     * Retrieves exam summaries with pagination (optimized for list views).
     * Uses lightweight projections for better performance.
     * 
     * @param pageable Pagination information
     * @return Page of ExamSummaryDto
     */
    @Timed(value = "exam.service.getAllSummary", description = "Time taken to fetch paginated exam summaries")
    public Page<ExamSummaryDto> getAllExamsSummary(Pageable pageable) {
        log.debug("Fetching exam summaries with pagination: page {}, size {}",
                pageable.getPageNumber(), pageable.getPageSize());
        Page<Exam> examPage = examRepository.findAll(pageable);
        return examPage.map(this::convertToSummaryDto);
    }

    /**
     * Retrieves an exam by ID.
     * 
     * @param id The exam ID
     * @return Optional ExamDto
     */
    @Timed(value = "exam.service.getById", description = "Time taken to fetch exam by ID")
    public Optional<ExamDto> getExamById(Long id) {
        log.debug("Fetching exam with ID: {}", id);
        return examRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * Retrieves exams by degree with pagination (optimized).
     * 
     * @param degree   The degree name
     * @param pageable Pagination information
     * @return Page of ExamSummaryDto
     */
    @Timed(value = "exam.service.getByDegree", description = "Time taken to fetch exams by degree")
    public Page<ExamSummaryDto> getExamsByDegree(String degree, Pageable pageable) {
        log.debug("Fetching exams for degree: {} with pagination", degree);
        Page<ExamProjection> projections = examRepository.findByDegreeOrderByDateAsc(degree, pageable);
        return projections.map(this::convertProjectionToSummaryDto);
    }

    /**
     * Retrieves exams by degree (legacy method).
     * 
     * @deprecated Use getExamsByDegree(String, Pageable) instead
     * @param degree The degree name
     * @return List of ExamDto
     */
    @Deprecated
    @Timed(value = "exam.service.getByDegreeLegacy", description = "Time taken to fetch exams by degree (legacy)")
    public List<ExamDto> getExamsByDegree(String degree) {
        log.debug("Fetching exams for degree: {}", degree);
        List<Exam> exams = examRepository.findByDegreeOrderByDateAsc(degree);
        return exams.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves exams by subject with pagination (optimized).
     * 
     * @param subject  The subject name
     * @param pageable Pagination information
     * @return Page of ExamSummaryDto
     */
    @Timed(value = "exam.service.getBySubject", description = "Time taken to fetch exams by subject")
    public Page<ExamSummaryDto> getExamsBySubject(String subject, Pageable pageable) {
        log.debug("Fetching exams for subject: {} with pagination", subject);
        Page<ExamProjection> projections = examRepository.findBySubjectContainingIgnoreCaseOrderByDateAsc(subject,
                pageable);
        return projections.map(this::convertProjectionToSummaryDto);
    }

    /**
     * Retrieves exams by subject (legacy method).
     * 
     * @deprecated Use getExamsBySubject(String, Pageable) instead
     * @param subject The subject name
     * @return List of ExamDto
     */
    @Deprecated
    @Timed(value = "exam.service.getBySubjectLegacy", description = "Time taken to fetch exams by subject (legacy)")
    public List<ExamDto> getExamsBySubject(String subject) {
        log.debug("Fetching exams for subject: {}", subject);
        List<Exam> exams = examRepository.findBySubjectContainingIgnoreCaseOrderByDateAsc(subject);
        return exams.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves exams by year and semester with pagination (optimized).
     * 
     * @param year     The academic year
     * @param semester The semester
     * @param pageable Pagination information
     * @return Page of ExamSummaryDto
     */
    @Timed(value = "exam.service.getByYearAndSemester", description = "Time taken to fetch exams by year and semester")
    public Page<ExamSummaryDto> getExamsByYearAndSemester(String year, String semester, Pageable pageable) {
        log.debug("Fetching exams for year: {} and semester: {} with pagination", year, semester);
        Page<ExamProjection> projections = examRepository.findByYearAndSemesterOrderByDateAsc(year, semester, pageable);
        return projections.map(this::convertProjectionToSummaryDto);
    }

    /**
     * Retrieves exams by year and semester (legacy method).
     * 
     * @deprecated Use getExamsByYearAndSemester(String, String, Pageable) instead
     * @param year     The academic year
     * @param semester The semester
     * @return List of ExamDto
     */
    @Deprecated
    @Timed(value = "exam.service.getByYearAndSemesterLegacy", description = "Time taken to fetch exams by year and semester (legacy)")
    public List<ExamDto> getExamsByYearAndSemester(String year, String semester) {
        log.debug("Fetching exams for year: {} and semester: {}", year, semester);
        List<Exam> exams = examRepository.findByYearAndSemesterOrderByDateAsc(year, semester);
        return exams.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Advanced search with multiple criteria and pagination.
     * 
     * @param degree   The degree filter (optional)
     * @param year     The year filter (optional)
     * @param semester The semester filter (optional)
     * @param pageable Pagination information
     * @return Page of ExamSummaryDto
     */
    @Timed(value = "exam.service.searchMultipleCriteria", description = "Time taken to search exams by multiple criteria")
    public Page<ExamSummaryDto> searchExamsByMultipleCriteria(String degree, String year, String semester,
            Pageable pageable) {
        log.debug("Searching exams with criteria - degree: {}, year: {}, semester: {}", degree, year, semester);
        Page<ExamProjection> projections = examRepository.findByMultipleCriteria(degree, year, semester, pageable);
        return projections.map(this::convertProjectionToSummaryDto);
    }

    /**
     * Full-text search across subject and degree fields with pagination.
     * Uses PostgreSQL full-text search when available, falls back to LIKE search.
     * 
     * @param searchTerm The search term
     * @param pageable   Pagination information
     * @return Page of ExamSummaryDto
     */
    @Timed(value = "exam.service.fullTextSearch", description = "Time taken to perform full-text search")
    public Page<ExamSummaryDto> searchExams(String searchTerm, Pageable pageable) {
        log.debug("Performing full-text search for term: {}", searchTerm);
        try {
            // Try optimized PostgreSQL full-text search first
            Page<ExamProjection> projections = examRepository.searchExamsOptimized(searchTerm, pageable);
            return projections.map(this::convertProjectionToSummaryDto);
        } catch (Exception e) {
            log.warn("Full-text search failed, falling back to LIKE search: {}", e.getMessage());
            // Fallback to compatible LIKE search
            Page<ExamProjection> projections = examRepository.searchExams(searchTerm, pageable);
            return projections.map(this::convertProjectionToSummaryDto);
        }
    }

    /**
     * Retrieves exams within a date range.
     * 
     * @param startDate Start date
     * @param endDate   End date
     * @return List of ExamDto
     */
    public List<ExamDto> getExamsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Fetching exams between {} and {}", startDate, endDate);
        List<Exam> exams = examRepository.findByDateBetweenOrderByDateAsc(startDate, endDate);
        return exams.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves upcoming exams (from now onwards).
     * 
     * @return List of ExamDto
     */
    public List<ExamDto> getUpcomingExams() {
        LocalDateTime now = LocalDateTime.now();
        log.debug("Fetching upcoming exams from {}", now);
        List<Exam> exams = examRepository.findByDateGreaterThanEqualOrderByDateAsc(now);
        return exams.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves distinct degrees.
     * 
     * @return List of degree names
     */
    public List<String> getDistinctDegrees() {
        log.debug("Fetching distinct degrees");
        return examRepository.findDistinctDegrees();
    }

    /**
     * Retrieves distinct years.
     * 
     * @return List of years
     */
    public List<String> getDistinctYears() {
        log.debug("Fetching distinct years");
        return examRepository.findDistinctYears();
    }

    /**
     * Retrieves distinct semesters.
     * 
     * @return List of semesters
     */
    public List<String> getDistinctSemesters() {
        log.debug("Fetching distinct semesters");
        return examRepository.findDistinctSemesters();
    }

    /**
     * Creates a new exam.
     * 
     * @param examDto The exam data
     * @return Created ExamDto
     */
    @Transactional
    public ExamDto createExam(ExamDto examDto) {
        log.debug("Creating new exam: {}", examDto.getSubject());
        Exam exam = convertToEntity(examDto);
        Exam savedExam = examRepository.save(exam);
        log.info("Successfully created exam with ID: {}", savedExam.getId());
        return convertToDto(savedExam);
    }

    /**
     * Updates an existing exam.
     * 
     * @param id      The exam ID
     * @param examDto The updated exam data
     * @return Updated ExamDto
     * @throws RuntimeException if exam not found
     */
    @Transactional
    public ExamDto updateExam(Long id, ExamDto examDto) {
        log.debug("Updating exam with ID: {}", id);
        Exam existingExam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found with ID: " + id));

        // Update fields
        existingExam.setSubject(examDto.getSubject());
        existingExam.setDegree(examDto.getDegree());
        existingExam.setYear(examDto.getYear());
        existingExam.setSemester(examDto.getSemester());
        existingExam.setDate(examDto.getDate());
        existingExam.setRoom(examDto.getRoom());
        existingExam.setSchool(examDto.getSchool());

        Exam savedExam = examRepository.save(existingExam);
        log.info("Successfully updated exam with ID: {}", savedExam.getId());
        return convertToDto(savedExam);
    }

    /**
     * Deletes an exam by ID.
     * 
     * @param id The exam ID
     * @throws RuntimeException if exam not found
     */
    @Transactional
    public void deleteExam(Long id) {
        log.debug("Deleting exam with ID: {}", id);
        if (!examRepository.existsById(id)) {
            throw new RuntimeException("Exam not found with ID: " + id);
        }
        examRepository.deleteById(id);
        log.info("Successfully deleted exam with ID: {}", id);
    }

    /**
     * Checks if an exam exists.
     * 
     * @param id The exam ID
     * @return true if exam exists, false otherwise
     */
    public boolean examExists(Long id) {
        return examRepository.existsById(id);
    }

    /**
     * Converts Exam entity to ExamDto.
     * 
     * @param exam The Exam entity
     * @return ExamDto
     */
    private ExamDto convertToDto(Exam exam) {
        return ExamDto.builder()
                .id(exam.getId())
                .subject(exam.getSubject())
                .degree(exam.getDegree())
                .year(exam.getYear())
                .semester(exam.getSemester())
                .date(exam.getDate())
                .room(exam.getRoom())
                .school(exam.getSchool())
                .build();
    }

    /**
     * Converts ExamDto to Exam entity.
     * 
     * @param examDto The ExamDto
     * @return Exam entity
     */
    private Exam convertToEntity(ExamDto examDto) {
        Exam exam = new Exam();
        exam.setId(examDto.getId());
        exam.setSubject(examDto.getSubject());
        exam.setDegree(examDto.getDegree());
        exam.setYear(examDto.getYear());
        exam.setSemester(examDto.getSemester());
        exam.setDate(examDto.getDate());
        exam.setRoom(examDto.getRoom());
        exam.setSchool(examDto.getSchool());
        return exam;
    }

    /**
     * Converts Exam entity to ExamSummaryDto for lightweight operations.
     * 
     * @param exam The Exam entity
     * @return ExamSummaryDto
     */
    private ExamSummaryDto convertToSummaryDto(Exam exam) {
        return new ExamSummaryDto(
                exam.getId(),
                exam.getSubject(),
                exam.getDegree(),
                exam.getDate(),
                exam.getRoom());
    }

    /**
     * Converts ExamProjection to ExamSummaryDto for optimized queries.
     * 
     * @param projection The ExamProjection
     * @return ExamSummaryDto
     */
    private ExamSummaryDto convertProjectionToSummaryDto(ExamProjection projection) {
        return new ExamSummaryDto(
                projection.getId(),
                projection.getSubject(),
                projection.getDegree(),
                projection.getDate(),
                projection.getRoom());
    }
}