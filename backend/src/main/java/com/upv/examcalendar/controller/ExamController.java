package com.upv.examcalendar.controller;

import com.upv.examcalendar.dto.ApiResponse;
import com.upv.examcalendar.dto.ExamDto;
import com.upv.examcalendar.dto.ExamSummaryDto;
import com.upv.examcalendar.service.ExamService;
import com.upv.examcalendar.security.SupabaseUserDetails;
import io.micrometer.core.annotation.Timed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * REST Controller for Exam entities mapped to ETSINF table.
 * Provides CRUD operations and various filtering endpoints.
 * 
 * Enhanced with performance optimizations including:
 * - HTTP caching headers for better client-side caching
 * - Lightweight DTOs for list operations
 * - Performance monitoring with Micrometer
 * - Optimized pagination and search endpoints
 * 
 * Based on Spring Boot REST best practices and Supabase authentication
 * integration.
 * Supports both authenticated and anonymous access patterns.
 */
@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@Slf4j
@Validated
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class ExamController {

        private final ExamService examService;

        /**
         * Get all exams with pagination (optimized with lightweight DTOs).
         * Accessible to authenticated users and anonymous users.
         * Uses HTTP caching for better performance.
         * 
         * @param page    Page number (0-based, default: 0)
         * @param size    Page size (default: 20, max: 100)
         * @param sortBy  Sort field (default: date)
         * @param sortDir Sort direction (default: asc)
         * @param user    Currently authenticated user (optional)
         * @return Page of exam summaries
         */
        @GetMapping
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.getAllExams", description = "Time taken to get all exams")
        public ResponseEntity<ApiResponse<Page<ExamSummaryDto>>> getAllExamsSummary(
                        @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                        @RequestParam(value = "size", defaultValue = "20") @Min(1) int size,
                        @RequestParam(value = "sortBy", defaultValue = "date") String sortBy,
                        @RequestParam(value = "sortDir", defaultValue = "asc") String sortDir,
                        @AuthenticationPrincipal SupabaseUserDetails user) {

                try {
                        // Limit page size to prevent resource exhaustion
                        size = Math.min(size, 100);

                        // Create sort direction
                        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC
                                        : Sort.Direction.ASC;
                        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

                        Page<ExamSummaryDto> examPage = examService.getAllExamsSummary(pageable);

                        log.debug("Retrieved {} exams (page {}, size {})",
                                        examPage.getTotalElements(), page, size);

                        // Add HTTP caching headers for better performance
                        CacheControl cacheControl = CacheControl.maxAge(5, TimeUnit.MINUTES)
                                        .cachePublic()
                                        .mustRevalidate();

                        return ResponseEntity.ok()
                                        .cacheControl(cacheControl)
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(true)
                                                        .message("Exams retrieved successfully")
                                                        .data(examPage)
                                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving exams: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(false)
                                                        .message("Error retrieving exams: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get exam by ID (full details).
         * Accessible to authenticated users and anonymous users.
         * 
         * @param id Exam ID
         * @return Exam details
         */
        @GetMapping("/{id}")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.getById", description = "Time taken to get exam by ID")
        public ResponseEntity<ApiResponse<ExamDto>> getExamById(@PathVariable Long id) {
                try {
                        Optional<ExamDto> exam = examService.getExamById(id);

                        if (exam.isPresent()) {
                                log.debug("Retrieved exam with ID: {}", id);

                                // Cache individual exams for longer since they change less frequently
                                CacheControl cacheControl = CacheControl.maxAge(30, TimeUnit.MINUTES)
                                                .cachePublic();

                                return ResponseEntity.ok()
                                                .cacheControl(cacheControl)
                                                .body(ApiResponse.<ExamDto>builder()
                                                                .success(true)
                                                                .message("Exam found")
                                                                .data(exam.get())
                                                                .build());
                        } else {
                                log.debug("Exam not found with ID: {}", id);
                                return ResponseEntity.notFound().build();
                        }

                } catch (Exception e) {
                        log.error("Error retrieving exam {}: {}", id, e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<ExamDto>builder()
                                                        .success(false)
                                                        .message("Error retrieving exam: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get exams by degree with pagination (optimized).
         * Accessible to all users.
         * 
         * @param degree Degree name
         * @param page   Page number (default: 0)
         * @param size   Page size (default: 20)
         * @return Page of exam summaries for the degree
         */
        @GetMapping("/degree/{degree}")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.getByDegree", description = "Time taken to get exams by degree")
        public ResponseEntity<ApiResponse<Page<ExamSummaryDto>>> getExamsByDegree(
                        @PathVariable String degree,
                        @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                        @RequestParam(value = "size", defaultValue = "20") @Min(1) int size) {

                try {
                        size = Math.min(size, 100);
                        Pageable pageable = PageRequest.of(page, size);
                        Page<ExamSummaryDto> exams = examService.getExamsByDegree(degree, pageable);

                        log.debug("Retrieved {} exams for degree: {} (page {}, size {})",
                                        exams.getTotalElements(), degree, page, size);

                        CacheControl cacheControl = CacheControl.maxAge(10, TimeUnit.MINUTES)
                                        .cachePublic()
                                        .mustRevalidate();

                        return ResponseEntity.ok()
                                        .cacheControl(cacheControl)
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(true)
                                                        .message("Exams retrieved for degree: " + degree)
                                                        .data(exams)
                                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving exams for degree {}: {}", degree, e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(false)
                                                        .message("Error retrieving exams: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Search exams by subject with pagination (optimized).
         * Accessible to all users.
         * 
         * @param subject Subject name (partial match)
         * @param page    Page number (default: 0)
         * @param size    Page size (default: 20)
         * @return Page of matching exam summaries
         */
        @GetMapping("/subject/{subject}")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.getBySubject", description = "Time taken to get exams by subject")
        public ResponseEntity<ApiResponse<Page<ExamSummaryDto>>> getExamsBySubject(
                        @PathVariable String subject,
                        @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                        @RequestParam(value = "size", defaultValue = "20") @Min(1) int size) {

                try {
                        size = Math.min(size, 100);
                        Pageable pageable = PageRequest.of(page, size);
                        Page<ExamSummaryDto> exams = examService.getExamsBySubject(subject, pageable);

                        log.debug("Retrieved {} exams for subject: {} (page {}, size {})",
                                        exams.getTotalElements(), subject, page, size);

                        CacheControl cacheControl = CacheControl.maxAge(10, TimeUnit.MINUTES)
                                        .cachePublic()
                                        .mustRevalidate();

                        return ResponseEntity.ok()
                                        .cacheControl(cacheControl)
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(true)
                                                        .message("Exams retrieved for subject: " + subject)
                                                        .data(exams)
                                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving exams for subject {}: {}", subject, e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(false)
                                                        .message("Error retrieving exams: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Advanced search with multiple criteria and full-text search.
         * Accessible to all users.
         * 
         * @param searchTerm Full-text search term (optional)
         * @param degree     Degree filter (optional)
         * @param year       Year filter (optional)
         * @param semester   Semester filter (optional)
         * @param page       Page number (default: 0)
         * @param size       Page size (default: 20)
         * @return Page of matching exam summaries
         */
        @GetMapping("/search")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.search", description = "Time taken to search exams")
        public ResponseEntity<ApiResponse<Page<ExamSummaryDto>>> searchExams(
                        @RequestParam(value = "q", required = false) String searchTerm,
                        @RequestParam(value = "degree", required = false) String degree,
                        @RequestParam(value = "year", required = false) String year,
                        @RequestParam(value = "semester", required = false) String semester,
                        @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                        @RequestParam(value = "size", defaultValue = "20") @Min(1) int size) {

                try {
                        size = Math.min(size, 100);
                        Pageable pageable = PageRequest.of(page, size);

                        Page<ExamSummaryDto> exams;
                        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                                // Full-text search
                                exams = examService.searchExams(searchTerm.trim(), pageable);
                                log.debug("Full-text search for '{}' returned {} results", searchTerm,
                                                exams.getTotalElements());
                        } else {
                                // Multi-criteria search
                                exams = examService.searchExamsByMultipleCriteria(degree, year, semester, pageable);
                                log.debug("Multi-criteria search returned {} results", exams.getTotalElements());
                        }

                        // Cache search results for a shorter time since they may be more dynamic
                        CacheControl cacheControl = CacheControl.maxAge(5, TimeUnit.MINUTES)
                                        .cachePublic()
                                        .mustRevalidate();

                        return ResponseEntity.ok()
                                        .cacheControl(cacheControl)
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(true)
                                                        .message("Search completed successfully")
                                                        .data(exams)
                                                        .build());

                } catch (Exception e) {
                        log.error("Error performing search: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<Page<ExamSummaryDto>>builder()
                                                        .success(false)
                                                        .message("Error performing search: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get exams by year and semester.
         * Accessible to all users.
         * 
         * @param year     Academic year
         * @param semester Semester
         * @return List of exams
         */
        @GetMapping("/year/{year}/semester/{semester}")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        public ResponseEntity<ApiResponse<List<ExamDto>>> getExamsByYearAndSemester(
                        @PathVariable String year,
                        @PathVariable String semester) {
                try {
                        List<ExamDto> exams = examService.getExamsByYearAndSemester(year, semester);

                        log.debug("Retrieved {} exams for year {} semester {}", exams.size(), year, semester);

                        return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                                        .success(true)
                                        .message("Exams retrieved for " + year + " semester " + semester)
                                        .data(exams)
                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving exams for year {} semester {}: {}", year, semester, e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<List<ExamDto>>builder()
                                                        .success(false)
                                                        .message("Error retrieving exams: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get upcoming exams.
         * Accessible to all users.
         * 
         * @return List of upcoming exams
         */
        @GetMapping("/upcoming")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        public ResponseEntity<ApiResponse<List<ExamDto>>> getUpcomingExams() {
                try {
                        List<ExamDto> exams = examService.getUpcomingExams();

                        log.debug("Retrieved {} upcoming exams", exams.size());

                        return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                                        .success(true)
                                        .message("Upcoming exams retrieved")
                                        .data(exams)
                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving upcoming exams: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<List<ExamDto>>builder()
                                                        .success(false)
                                                        .message("Error retrieving exams: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get exams within date range.
         * Accessible to all users.
         * 
         * @param startDate Start date (ISO format)
         * @param endDate   End date (ISO format)
         * @return List of exams in range
         */
        @GetMapping("/date-range")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        public ResponseEntity<ApiResponse<List<ExamDto>>> getExamsByDateRange(
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
                try {
                        List<ExamDto> exams = examService.getExamsByDateRange(startDate, endDate);

                        log.debug("Retrieved {} exams between {} and {}", exams.size(), startDate, endDate);

                        return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                                        .success(true)
                                        .message("Exams retrieved for date range")
                                        .data(exams)
                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving exams for date range: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<List<ExamDto>>builder()
                                                        .success(false)
                                                        .message("Error retrieving exams: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get distinct degrees.
         * Accessible to all users.
         * Uses aggressive caching since degree lists change rarely.
         * 
         * @return List of distinct degrees
         */
        @GetMapping("/degrees")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.getDistinctDegrees", description = "Time taken to get distinct degrees")
        public ResponseEntity<ApiResponse<List<String>>> getDistinctDegrees() {
                try {
                        List<String> degrees = examService.getDistinctDegrees();

                        log.debug("Retrieved {} distinct degrees", degrees.size());

                        // Cache for longer since degrees change rarely
                        CacheControl cacheControl = CacheControl.maxAge(30, TimeUnit.MINUTES)
                                        .cachePublic()
                                        .immutable();

                        return ResponseEntity.ok()
                                        .cacheControl(cacheControl)
                                        .body(ApiResponse.<List<String>>builder()
                                                        .success(true)
                                                        .message("Degrees retrieved")
                                                        .data(degrees)
                                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving degrees: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<List<String>>builder()
                                                        .success(false)
                                                        .message("Error retrieving degrees: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get distinct years.
         * Accessible to all users.
         * Uses aggressive caching since year lists change rarely.
         * 
         * @return List of distinct years
         */
        @GetMapping("/years")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.getDistinctYears", description = "Time taken to get distinct years")
        public ResponseEntity<ApiResponse<List<String>>> getDistinctYears() {
                try {
                        List<String> years = examService.getDistinctYears();

                        log.debug("Retrieved {} distinct years", years.size());

                        // Cache for longer since years change rarely
                        CacheControl cacheControl = CacheControl.maxAge(30, TimeUnit.MINUTES)
                                        .cachePublic()
                                        .immutable();

                        return ResponseEntity.ok()
                                        .cacheControl(cacheControl)
                                        .body(ApiResponse.<List<String>>builder()
                                                        .success(true)
                                                        .message("Years retrieved")
                                                        .data(years)
                                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving years: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<List<String>>builder()
                                                        .success(false)
                                                        .message("Error retrieving years: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Get distinct semesters.
         * Accessible to all users.
         * Uses aggressive caching since semester lists change rarely.
         * 
         * @return List of distinct semesters
         */
        @GetMapping("/semesters")
        @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
        @Timed(value = "exam.controller.getDistinctSemesters", description = "Time taken to get distinct semesters")
        public ResponseEntity<ApiResponse<List<String>>> getDistinctSemesters() {
                try {
                        List<String> semesters = examService.getDistinctSemesters();

                        log.debug("Retrieved {} distinct semesters", semesters.size());

                        // Cache for longer since semesters change rarely
                        CacheControl cacheControl = CacheControl.maxAge(30, TimeUnit.MINUTES)
                                        .cachePublic()
                                        .immutable();

                        return ResponseEntity.ok()
                                        .cacheControl(cacheControl)
                                        .body(ApiResponse.<List<String>>builder()
                                                        .success(true)
                                                        .message("Semesters retrieved")
                                                        .data(semesters)
                                                        .build());

                } catch (Exception e) {
                        log.error("Error retrieving semesters: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<List<String>>builder()
                                                        .success(false)
                                                        .message("Error retrieving semesters: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Create a new exam.
         * Requires authenticated user.
         * 
         * @param examDto Exam data
         * @param user    Currently authenticated user
         * @return Created exam
         */
        @PostMapping
        @PreAuthorize("hasAnyRole('AUTHENTICATED', 'SERVICE')")
        public ResponseEntity<ApiResponse<ExamDto>> createExam(
                        @Valid @RequestBody ExamDto examDto,
                        @AuthenticationPrincipal SupabaseUserDetails user) {
                try {
                        ExamDto createdExam = examService.createExam(examDto);

                        log.info("Created exam with ID: {} by user: {}", createdExam.getId(), user.getEmail());

                        return ResponseEntity.ok(ApiResponse.<ExamDto>builder()
                                        .success(true)
                                        .message("Exam created successfully")
                                        .data(createdExam)
                                        .build());

                } catch (Exception e) {
                        log.error("Error creating exam: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<ExamDto>builder()
                                                        .success(false)
                                                        .message("Error creating exam: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Update an existing exam.
         * Requires authenticated user.
         * 
         * @param id      Exam ID
         * @param examDto Updated exam data
         * @param user    Currently authenticated user
         * @return Updated exam
         */
        @PutMapping("/{id}")
        @PreAuthorize("hasAnyRole('AUTHENTICATED', 'SERVICE')")
        public ResponseEntity<ApiResponse<ExamDto>> updateExam(
                        @PathVariable Long id,
                        @Valid @RequestBody ExamDto examDto,
                        @AuthenticationPrincipal SupabaseUserDetails user) {
                try {
                        ExamDto updatedExam = examService.updateExam(id, examDto);

                        log.info("Updated exam with ID: {} by user: {}", id, user.getEmail());

                        return ResponseEntity.ok(ApiResponse.<ExamDto>builder()
                                        .success(true)
                                        .message("Exam updated successfully")
                                        .data(updatedExam)
                                        .build());

                } catch (RuntimeException e) {
                        log.warn("Exam not found for update: {}", id);
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error updating exam {}: {}", id, e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<ExamDto>builder()
                                                        .success(false)
                                                        .message("Error updating exam: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * Delete an exam.
         * Requires service role (admin access).
         * 
         * @param id   Exam ID
         * @param user Currently authenticated user
         * @return Success message
         */
        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole('SERVICE')")
        public ResponseEntity<ApiResponse<Void>> deleteExam(
                        @PathVariable Long id,
                        @AuthenticationPrincipal SupabaseUserDetails user) {
                try {
                        examService.deleteExam(id);

                        log.warn("Deleted exam with ID: {} by admin user: {}", id, user.getEmail());

                        return ResponseEntity.ok(ApiResponse.<Void>builder()
                                        .success(true)
                                        .message("Exam deleted successfully")
                                        .build());

                } catch (RuntimeException e) {
                        log.warn("Exam not found for deletion: {}", id);
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error deleting exam {}: {}", id, e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(ApiResponse.<Void>builder()
                                                        .success(false)
                                                        .message("Error deleting exam: " + e.getMessage())
                                                        .build());
                }
        }
}