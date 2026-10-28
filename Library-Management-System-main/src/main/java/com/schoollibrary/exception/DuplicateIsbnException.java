package com.schoollibrary.exception;

public class DuplicateIsbnException extends RuntimeException {

    public DuplicateIsbnException() {
        super("ISBN already exist");
    }
}
