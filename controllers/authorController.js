import Author from "../models/author.js";
import Book from "../models/book.js";
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
const AuthorController = {
  // Display list of all Authors.
  author_list: asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find({}).sort([["family_name", "ascending"]]);
    res.render("pages/author_list", { title: "Author List", authorList: allAuthors });
  }),
  // Display detail page for a specific Author.
  author_detail: asyncHandler(async (req, res, next) => {
    const [author, authorBooks] = await Promise.all([
      Author.findById(req.params.id),
      Book.find({ author: req.params.id }, "title summary"),
    ]);

    if (author === null) {
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }

    res.render("pages/author_detail", {
      title: "Author Detail",
      author,
      authorBooks,
    });
  }),

  // Display Author create form on GET.
  author_create_get: asyncHandler(async (req, res, next) => {
    res.render("pages/author_form", { 
      title: "Create Author", 
      author: undefined, 
      errors: undefined
    });
  }),

  // Handle Author create on POST.
  author_create_post: [
    body("first_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("First name must be specified.")
      .isAlphanumeric()
      .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Family name must be specified.")
      .isAlphanumeric()
      .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
      .optional({ values: "falsy" })
      .isISO8601()
      .toDate(),
    body("date_of_death", "Invalid date of death")
      .optional({ values: "falsy" })
      .isISO8601()
      .toDate(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.render("pages/author_form", {
          title: "Create Author",
          errors: errors.array(),
        });

      } else {
        const author = new Author({
          first_name: req.body.first_name,
          family_name: req.body.family_name,
          date_of_birth: req.body.date_of_birth,
          date_of_death: req.body.date_of_death,
        });

        await author.save();
        res.redirect(author.url);
      }
    }),
  ],

  // Display Author delete form on GET.
  author_delete_get: asyncHandler(async (req, res, next) => {
    const [author, authorBooks] = await Promise.all([
      Author.findById(req.params.id),
      Book.find({ author: req.params.id }).exec(),
    ]);

    if (author === null) {
      res.redirect("/catalog/authors");
    }

    res.render("pages/author_delete", {
      title: "Delete Author",
      author,
      author_books: authorBooks,
    });
  }),

  // Handle Author delete on POST.
  author_delete_post: asyncHandler(async (req, res, next) => {
    const [author, authorBooks] = await Promise.all([
      Author.findById(req.body.authorid),
      Book.find({ author: req.body.authorid }).exec(),
    ]);

    if (authorBooks.length > 0) {
      res.render("pages/author_delete", {
        title: "Delete Author",
        author,
        author_books: authorBooks,
      });
      return;
    } else {
      await Author.findByIdAndDelete(req.body.authorid);
      res.redirect("/catalog/authors");
    }
  }),

  // Display Author update form on GET.
  author_update_get: asyncHandler(async (req, res, next) => {
    const author = await Author.findById(req.params.id);
    if (author === null) {
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }

    res.render("pages/author_form", {
      title: "Update Author",
      author,
      errors: undefined,
    });
  }),

  // Handle Author update on POST.
  author_update_post: [
    body("first_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("First name must be specified.")
      .isAlphanumeric()
      .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Family name must be specified.")
      .isAlphanumeric()
      .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
      .optional({ values: "falsy" })
      .isISO8601()
      .toDate(),
    body("date_of_death", "Invalid date of death")
      .optional({ values: "falsy" })
      .isISO8601()
      .toDate(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.render("pages/author_form", {
          title: "Update Author",
          errors: errors.array(),
        });
        return;
      }

      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id,
      });

      await Author.findByIdAndUpdate(req.params.id, author, {});
      res.redirect(author.url);
    }),
  ]

};

export default AuthorController;