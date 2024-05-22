import Book from "../models/book.js";
import BookInstance from "../models/bookInstance.js";
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
const bookinstanceController = {
  // Display list of all BookInstances.
  bookinstance_list: asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find({}).populate("book").exec();
    res.render("pages/bookinstance_list", { title: "Book Instance List", bookInstanceList: allBookInstances });
  }),

  // Display detail page for a specific BookInstance.
  bookinstance_detail: asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();
    if (bookInstance === null) {
      const err = new Error("Book copy not found");
      err.status = 404;
      return next(err);
    }
    res.render("pages/bookinstance_detail", { title: "Copy: " + bookInstance.book.title, bookInstance });
  }),

  // Display BookInstance create form on GET.
  bookinstance_create_get: asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

    res.render("pages/bookinstance_form", {
      title: "Create Book Instance",
      book_list: allBooks,
      selected_book: undefined,
      bookinstance: undefined,
      errors: undefined,
    });
  }),

  // Handle BookInstance create on POST.
  bookinstance_create_post: [
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
      .optional({ values: "falsy" })
      .isISO8601()
      .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a BookInstance object with escaped and trimmed data.
      const bookInstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
      });

      if (!errors.isEmpty()) {
        // There are errors.
        // Render form again with sanitized values and error messages.
        const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

        res.render("pages/bookinstance_form", {
          title: "Create BookInstance",
          book_list: allBooks,
          selected_book: bookInstance.book._id,
          errors: errors.array(),
          bookinstance: bookInstance,
        });
        return;
      } else {
        // Data from form is valid
        await bookInstance.save();
        res.redirect(bookInstance.url);
      }
    }),
  ],

  // Display BookInstance delete form on GET.
  bookinstance_delete_get: asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();
    if (bookInstance === null) {
      res.redirect("/catalog/bookinstances");
    }

    res.render("pages/bookinstance_delete", { 
      title: "Delete Book Instance", 
      bookInstance });
  }),

  // Handle BookInstance delete on POST.
  bookinstance_delete_post: asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.body.bookinstanceid);
    if (bookInstance === null) {
      res.redirect("/catalog/bookinstances");
    }
    console.log("Deleting book instance: ", bookInstance);
    await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
    res.redirect("/catalog/bookinstances");
  }),

  // Display BookInstance update form on GET.
  bookinstance_update_get: asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();
    if (bookInstance === null) {
      const err = new Error("Book copy not found");
      err.status = 404;
      return next(err);
    }

    res.render("pages/bookinstance_form", {
      title: "Update Book Instance",
      book_list: [bookInstance.book],
      selected_book: bookInstance.book._id,
      bookinstance: bookInstance,
      errors: undefined,
    });
  }),

  // Handle bookinstance update on POST.
  bookinstance_update_post: [
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
      .optional({ values: "falsy" })
      .isISO8601()
      .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a BookInstance object with escaped and trimmed data.
      const bookInstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id,
      });

      if (!errors.isEmpty()) {
        // There are errors.
        // Render form again with sanitized values and error messages.

        res.render("pages/bookinstance_form", {
          title: "Update BookInstance",
          book_list: [bookInstance.book],
          selected_book: bookInstance.book._id,
          errors: errors.array(),
          bookinstance: bookInstance,
        });
        return;
      } else {
        // Data from form is valid
        await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
        res.redirect(bookInstance.url);
      }
    }),
  ]
};

export default bookinstanceController;
