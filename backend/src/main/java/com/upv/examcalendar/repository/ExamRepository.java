package com.upv.examcalendar.repository;

import com.upv.examcalendar.dto.ExamProjection;
import com.upv.examcalendar.dto.ExamSummaryDto;
import com.upv.examcalendar.model.Exam;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Exam entities mapped to ETSINF table.
 * Extends JpaRepository for basic CRUD operations and adds custom query
 * methods with performance optimizations including caching and pagination.
 * 
 * Based on Spring Data JPA patterns and Supabase database integration.
 */
@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

        /**
         * Legacy method for table name discovery.
         * Used for database introspection.
         */
        @Query(value = "SELECT table_name FROM public.public_tables", nativeQuery = true)
        List<String> findAllTableNames();

        // Paginated finder methods by individual fields with projections

        /**
         * Finds exams by degree with pagination, ordered by date ascending.
         * Uses lightweight projection for better performance.
         */
        @Query("SELECT e.id as id, e.subject as subject, e.degree as degree, e.date as date, e.room as room " +
                        "FROM Exam e WHERE e.degree = :degree ORDER BY e.date ASC")
        Page<ExamProjection> findByDegreeOrderByDateAsc(@Param("degree") String degree, Pageable pageable);

        /**
         * Finds exams by subject (case-insensitive partial match) with pagination.
         * Uses full-text search optimization for PostgreSQL.
         */
        @Query(value = "SELECT id, subject, degree, exam_date as date, place as room " +
                        "FROM \"ETSINF\" WHERE subject ILIKE CONCAT('%', :subject, '%') " +
                        "ORDER BY exam_date ASC", nativeQuery = true)
        Page<ExamProjection> findBySubjectContainingIgnoreCaseOrderByDateAsc(@Param("subject") String subject,
                        Pageable pageable);

        /**
         * Finds exams by year and semester with pagination, ordered by date ascending.
         */
        @Query("SELECT e.id as id, e.subject as subject, e.degree as degree, e.date as date, e.room as room " +
                        "FROM Exam e WHERE e.year = :year AND e.semester = :semester ORDER BY e.date ASC")
        Page<ExamProjection> findByYearAndSemesterOrderByDateAsc(@Param("year") String year,
                        @Param("semester") String semester, Pageable pageable);

        /**
         * Finds exams within a date range with pagination, ordered by date ascending.
         */
        @Query("SELECT e.id as id, e.subject as subject, e.degree as degree, e.date as date, e.room as room " +
                        "FROM Exam e WHERE e.date BETWEEN :startDate AND :endDate ORDER BY e.date ASC")
        Page<ExamProjection> findByDateBetweenOrderByDateAsc(@Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        Pageable pageable);

        /**
         * Finds exams from a specific date onwards with pagination, ordered by date
         * ascending.
         */
        @Query("SELECT e.id as id, e.subject as subject, e.degree as degree, e.date as date, e.room as room " +
                        "FROM Exam e WHERE e.date >= :date ORDER BY e.date ASC")
        Page<ExamProjection> findByDateGreaterThanEqualOrderByDateAsc(@Param("date") LocalDateTime date,
                        Pageable pageable);

        // Cached queries for distinct values - these rarely change

        /**
         * Finds all distinct degrees with caching.
         * Cached for 30 minutes since degree list changes rarely.
         */
        @Cacheable(value = "distinctDegrees", cacheManager = "distinctValuesCacheManager")
        @Query("SELECT DISTINCT e.degree FROM Exam e WHERE e.degree IS NOT NULL ORDER BY e.degree")
        List<String> findDistinctDegrees();

        /**
         * Finds all distinct years with caching.
         */
        @Cacheable(value = "distinctYears", cacheManager = "distinctValuesCacheManager")
        @Query("SELECT DISTINCT e.year FROM Exam e WHERE e.year IS NOT NULL ORDER BY e.year DESC")
        List<String> findDistinctYears();

        /**
         * Finds all distinct semesters with caching.
         */
        @Cacheable(value = "distinctSemesters", cacheManager = "distinctValuesCacheManager")
        @Query("SELECT DISTINCT e.semester FROM Exam e WHERE e.semester IS NOT NULL ORDER BY e.semester")
        List<String> findDistinctSemesters();

        /**
         * Finds all distinct schools with caching.
         */
        @Cacheable(value = "distinctSchools", cacheManager = "distinctValuesCacheManager")
        @Query("SELECT DISTINCT e.school FROM Exam e WHERE e.school IS NOT NULL ORDER BY e.school")
        List<String> findDistinctSchools();

        /**
         * Finds all distinct rooms with caching.
         */
        @Cacheable(value = "distinctRooms", cacheManager = "distinctValuesCacheManager")
        @Query("SELECT DISTINCT e.room FROM Exam e WHERE e.room IS NOT NULL ORDER BY e.room")
        List<String> findDistinctRooms();

        // Optimized complex queries with caching and pagination

        /**
         * Finds exams by multiple criteria with pagination and caching.
         * Uses composite index on (degree, year, semester, date) for optimal
         * performance.
         */
        @Cacheable(value = "examsByMultipleCriteria", cacheManager = "searchCacheManager", key = "#degree + '_' + #year + '_' + #semester + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
        @Query("SELECT e.id as id, e.subject as subject, e.degree as degree, e.date as date, e.room as room " +
                        "FROM Exam e WHERE " +
                        "(:degree IS NULL OR e.degree = :degree) AND " +
                        "(:year IS NULL OR e.year = :year) AND " +
                        "(:semester IS NULL OR e.semester = :semester) " +
                        "ORDER BY e.date ASC")
        Page<ExamProjection> findByMultipleCriteria(@Param("degree") String degree,
                        @Param("year") String year,
                        @Param("semester") String semester,
                        Pageable pageable);

        /**
         * Full-text search with PostgreSQL optimization and caching.
         * Uses GIN index on tsvector for fast text search.
         */
        @Cacheable(value = "examSearch", cacheManager = "searchCacheManager", key = "#searchTerm + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
        @Query(value = "SELECT id, subject, degree, exam_date as date, place as room " +
                        "FROM \"ETSINF\" WHERE " +
                        "to_tsvector('spanish', COALESCE(subject, '') || ' ' || COALESCE(degree, '')) " +
                        "@@ plainto_tsquery('spanish', :searchTerm) " +
                        "ORDER BY exam_date ASC", nativeQuery = true)
        Page<ExamProjection> searchExamsOptimized(@Param("searchTerm") String searchTerm, Pageable pageable);

        /**
         * Fallback search for compatibility (less optimized but works without full-text
         * index).
         */
        @Query("SELECT e.id as id, e.subject as subject, e.degree as degree, e.date as date, e.room as room " +
                        "FROM Exam e WHERE " +
                        "LOWER(e.subject) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
                        "LOWER(e.degree) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                        "ORDER BY e.date ASC")
        Page<ExamProjection> searchExams(@Param("searchTerm") String searchTerm, Pageable pageable);

        /**
         * Finds exams for current academic period with caching.
         * Cached for 10 minutes since this is frequently accessed.
         */
        @Cacheable(value = "currentAcademicPeriod", cacheManager = "searchCacheManager")
        @Query(value = "SELECT id, subject, degree, exam_date as date, place as room " +
                        "FROM \"ETSINF\" WHERE " +
                        "exam_date >= CURRENT_DATE AND exam_date <= CURRENT_DATE + INTERVAL '6 months' " +
                        "ORDER BY exam_date ASC", nativeQuery = true)
        List<ExamProjection> findCurrentAcademicPeriodExams();

        /**
         * Count exams by degree for statistics with caching.
         */
        @Cacheable(value = "examCountsByDegree", cacheManager = "distinctValuesCacheManager")
        @Query("SELECT e.degree, COUNT(e) FROM Exam e GROUP BY e.degree ORDER BY COUNT(e) DESC")
        List<Object[]> countExamsByDegree();

        /**
         * Count exams by year for statistics with caching.
         */
        @Cacheable(value = "examCountsByYear", cacheManager = "distinctValuesCacheManager")
        @Query("SELECT e.year, COUNT(e) FROM Exam e GROUP BY e.year ORDER BY e.year DESC")
        List<Object[]> countExamsByYear();

        // Legacy non-paginated methods (kept for backward compatibility but should be
        // migrated)

        /**
         * @deprecated Use findByDegreeOrderByDateAsc(String, Pageable) instead
         */
        @Deprecated
        List<Exam> findByDegreeOrderByDateAsc(String degree);

        /**
         * @deprecated Use findBySubjectContainingIgnoreCaseOrderByDateAsc(String,
         *             Pageable) instead
         */
        @Deprecated
        List<Exam> findBySubjectContainingIgnoreCaseOrderByDateAsc(String subject);

        /**
         * @deprecated Use findByYearAndSemesterOrderByDateAsc(String, String, Pageable)
         *             instead
         */
        @Deprecated
        List<Exam> findByYearAndSemesterOrderByDateAsc(String year, String semester);

        /**
         * @deprecated Use findByDateBetweenOrderByDateAsc(LocalDateTime, LocalDateTime,
         *             Pageable) instead
         */
        @Deprecated
        List<Exam> findByDateBetweenOrderByDateAsc(LocalDateTime startDate, LocalDateTime endDate);

        /**
         * @deprecated Use findByDateGreaterThanEqualOrderByDateAsc(LocalDateTime,
         *             Pageable) instead
         */
        @Deprecated
        List<Exam> findByDateGreaterThanEqualOrderByDateAsc(LocalDateTime date);
}