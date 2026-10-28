import { useEffect, useState } from "react";

const blankBook = {
  title: "",
  author: "",
  isbn: "",
  available: true,
};

export default function BookForm({ book, onSubmit, onCancel }) {
  const [values, setValues] = useState(blankBook);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(book ? {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      available: book.available,
    } : blankBook);
    setFieldErrors({});
    setFormError("");
  }, [book]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: name === "available" ? value === "true" : value,
    }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError("");

    try {
      await onSubmit(values);
    } catch (error) {
      const response = error.response?.data;
      if (response?.errors && Object.keys(response.errors).length > 0) {
        setFieldErrors(response.errors);
      }
      if (error.response?.status === 409 && response?.message === "ISBN already exist") {
        setFormError("ISBN already exist");
      } else if (error.response?.status !== 400) {
        setFormError(response?.message || "Unable to save this book. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="dialog form-dialog" role="dialog" aria-modal="true" aria-labelledby="book-form-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{book ? "UPDATE THE CATALOG" : "GROW THE COLLECTION"}</p>
            <h2 id="book-form-title">{book ? "Edit book" : "Add a book"}</h2>
          </div>
          <button className="icon-button" onClick={onCancel} type="button" aria-label="Close form">×</button>
        </div>
        {formError && <div className="form-alert" role="alert">{formError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={values.title} onChange={updateField} autoFocus aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "title-error" : undefined} />
          {fieldErrors.title && <span className="field-error" id="title-error">{fieldErrors.title}</span>}

          <label htmlFor="author">Author</label>
          <input id="author" name="author" value={values.author} onChange={updateField} aria-invalid={Boolean(fieldErrors.author)} aria-describedby={fieldErrors.author ? "author-error" : undefined} />
          {fieldErrors.author && <span className="field-error" id="author-error">{fieldErrors.author}</span>}

          <label htmlFor="isbn">ISBN</label>
          <input id="isbn" name="isbn" value={values.isbn} onChange={updateField} aria-invalid={Boolean(fieldErrors.isbn) || formError === "ISBN already exist"} aria-describedby={fieldErrors.isbn ? "isbn-error" : undefined} />
          {fieldErrors.isbn && <span className="field-error" id="isbn-error">{fieldErrors.isbn}</span>}

          <label htmlFor="available">Availability</label>
          <select id="available" name="available" value={String(values.available)} onChange={updateField}>
            <option value="true">Available</option>
            <option value="false">Not Available</option>
          </select>

          <div className="form-actions">
            <button className="button button-secondary" onClick={onCancel} type="button">Cancel</button>
            <button className="button button-primary" disabled={saving} type="submit">
              {saving ? "Saving..." : book ? "Save changes" : "Add book"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
