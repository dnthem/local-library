import Book from "../models/book.js";
import Author from "../models/author.js";
import Genre from "../models/genre.js";
import BookInstance from "../models/bookInstance.js";
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import debug from "debug";

const bookController = {
  index: asyncHandler(async (req, res, next) => {
    const [
      bookCount,
      bookInstanceCount,
      bookInstanceAvailableCount,
      authorCount,
      genreCount
    ] = await Promise.all([
      Book.countDocuments({}).exec(),
      BookInstance.countDocuments({}).exec(),
      BookInstance.countDocuments({ status: "Available" }).exec(),
      Author.countDocuments({}).exec(),
      Genre.countDocuments({}).exec()
    ]);

    res.render("pages/index", {
      title: "Local Library Home",
      data: {
        bookCount,
        bookInstanceCount,
        bookInstanceAvailableCount,
        authorCount,
        genreCount
      }
    });

  }),

  // Display list of all books.
  book_list: asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title author").populate("author").exec();
    console.log(allBooks)
    res.render("pages/book_list", { title: "Book List", bookList: allBooks });
  }),

  // Display detail page for a specific book.
  book_detail: asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id).populate("author genre").exec(),
      BookInstance.find({ book: req.params.id }).exec()
    ]);

    if (book === null) {
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }

    console.log(bookInstances);
    res.render("pages/book_detail", { title: 'Book detail', book, book_instances: bookInstances });
  }),

  // Display book create form on GET.
  book_create_get: asyncHandler(async (req, res, next) => {
    const [authors, genres] = await Promise.all([
      Author.find({}).sort( { family_name: 1 }).exec(),
      Genre.find({}).sort( { name: 1 }).exec(),
    ]);

    res.render("pages/book_form", { 
      title: "Create Book", 
      authors: authors,
      genres: genres,
      book: undefined,
      errors: undefined
    });
  }),

  // Handle book create on POST.
  book_create_post: [
      // Convert the genre to an array.
      (req, res, next) => {
        if (!Array.isArray(req.body.genre)) {
          req.body.genre =
            typeof req.body.genre === "undefined" ? [] : [req.body.genre];
        }
        next();
      },
    
      // Validate and sanitize fields.
      body("title", "Title must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
      body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
      body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
      body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
      body("genre.*").escape(),
      // Process request after validation and sanitization.
    
      asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
    
        // Create a Book object with escaped and trimmed data.
        const book = new Book({
          title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: req.body.genre,
        });
    
        if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.
    
          // Get all authors and genres for form.
          const [allAuthors, allGenres] = await Promise.all([
            Author.find().sort({ family_name: 1 }).exec(),
            Genre.find().sort({ name: 1 }).exec(),
          ]);
    
          // Mark our selected genres as checked.
          for (const genre of allGenres) {
            if (book.genre.includes(genre._id)) {
              genre.checked = "true";
            }
          }
          res.render("pages/book_form", {
            title: "Create Book",
            authors: allAuthors,
            genres: allGenres,
            book: book,
            errors: errors.array(),
          });
        } else {
          // Data from form is valid. Save book.
          await book.save();
          res.redirect(book.url);
        }
      })

  ],

  // Display book delete form on GET.
  book_delete_get: asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id).exec(),
      BookInstance.find({ book: req.params.id }).exec()
    ]);

    if (book === null) {
      res.redirect("/catalog/books");
    }

    res.render("pages/book_delete", {
      title: "Delete Book",
      book: book,
      book_instances: bookInstances
    });
  }),

  // Handle book delete on POST.
  book_delete_post: asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
      Book
        .findById(req.body.bookid)
        .exec(),
      BookInstance.find({ book: req.body.bookid })
        .exec()
    ]);

    if (bookInstances.length > 0) {
      res.render("pages/book_delete", {
        title: "Delete Book",
        book: book,
        book_instances: bookInstances
      });
      return;
    } else {
      await Book.findByIdAndDelete(req.body.bookid);
      res.redirect("/catalog/books");
    }
  }),

  // Display book update form on GET.
  book_update_get: asyncHandler(async (req, res, next) => {
    const [book, authors, genres] = await Promise.all([
      Book.findById(req.params.id).populate("author genre").exec(),
      Author.find({}).exec(),
      Genre.find({}).exec()
    ]);

    if (book === null) {
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }

    // Mark our selected genres as checked.
    for (let genre of genres) {
      if (book.genre.includes(genre._id)) {
        genre.checked = "true";
      }
    }

    const checkedGenres = genres.map(genre => {
      if (book.genre.find(bookGenre => bookGenre.equals(genre._id))) {
        return { ...genre.toObject(), checked: "true" };
      }
      return genre;
    });

    res.render("pages/book_form", {
      title: "Update Book",
      authors: authors,
      genres: checkedGenres,
      book: book,
      errors: undefined
    });
  }),

  // Handle book update on POST.
  book_update_post: [
    // Convert the genre to an array.
    (req, res, next) => {
      if (!(req.body.genre instanceof Array)) {
        req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
      }
      next();
    },

    // Validate and sanitize fields.
    body("title", "Title must not be empty.").trim().isLength({ min: 1 }).escape(),
    body("author", "Author must not be empty.").trim().isLength({ min: 1 }).escape(),
    body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }).escape(),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
    body("genre.*").escape(),

    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped and trimmed data.
      const book = new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
        _id: req.params.id
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.

        // Get all authors and genres for form.
        const [allAuthors, allGenres] = await Promise.all([
          Author.find().exec(),
          Genre.find().exec()
        ]);

        // Mark our selected genres as checked.
        for (let genre of allGenres) {
          if (book.genre.includes(genre._id)) {
            genre.checked = "true";
          }
        }

        res.render("pages/book_form", {
          title: "Update Book",
          authors: allAuthors,
          genres: allGenres,
          book: book,
          errors: errors.array()
        });
      } else {
        // Data from form is valid. Update the record.
        await Book.findByIdAndUpdate(req.params.id, book).exec();
        res.redirect(book.url);
      }
    })
  ],
};

export default bookController;
