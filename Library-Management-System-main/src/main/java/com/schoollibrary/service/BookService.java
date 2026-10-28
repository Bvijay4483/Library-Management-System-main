package com.schoollibrary.service;

import com.schoollibrary.dto.BookRequest;
import com.schoollibrary.entity.Book;
import com.schoollibrary.exception.BookNotFoundException;
import com.schoollibrary.exception.DuplicateIsbnException;
import com.schoollibrary.repository.BookRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;

@Service
public class BookService {

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public List<Book> findAll() {
        return bookRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Book findById(Long id) {
        return bookRepository.findById(id).orElseThrow(() -> new BookNotFoundException(id));
    }

    @Transactional
    public Book create(BookRequest request) {
        String isbn = clean(request.isbn());
        if (bookRepository.existsByIsbn(isbn)) {
            throw new DuplicateIsbnException();
        }

        Book book = new Book(clean(request.title()), clean(request.author()), isbn,
                Boolean.TRUE.equals(request.available()));
        return save(book);
    }

    @Transactional
    public Book update(Long id, BookRequest request) {
        Book book = findById(id);
        String isbn = clean(request.isbn());
        if (bookRepository.existsByIsbnAndIdNot(isbn, id)) {
            throw new DuplicateIsbnException();
        }

        book.setTitle(clean(request.title()));
        book.setAuthor(clean(request.author()));
        book.setIsbn(isbn);
        book.setAvailable(Boolean.TRUE.equals(request.available()));
        return save(book);
    }

    @Transactional
    public void delete(Long id) {
        Book book = findById(id);
        bookRepository.delete(book);
    }

    private Book save(Book book) {
        try {
            return bookRepository.saveAndFlush(book);
        } catch (DataIntegrityViolationException exception) {
            if (isUniqueConstraintViolation(exception)) {
                throw new DuplicateIsbnException();
            }
            throw exception;
        }
    }

    private boolean isUniqueConstraintViolation(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof org.hibernate.exception.ConstraintViolationException violation
                    && "uk_books_isbn".equalsIgnoreCase(violation.getConstraintName())) {
                return true;
            }
            if (cause instanceof SQLException sqlException
                    && (sqlException.getErrorCode() == 1062 || "23505".equals(sqlException.getSQLState()))) {
                return true;
            }
        }
        return false;
    }

    private String clean(String value) {
        return value.trim();
    }
}
