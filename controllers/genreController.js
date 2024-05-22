import Genre from "../models/genre.js";
import Book from "../models/book.js";
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
const genreController = {
  // Display list of all Genre.
  genre_list: asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find({}).sort([["name", "ascending"]]).exec();
    console.log(allGenres);
    res.render("pages/genre_list", { title: "Genre List", genreList: allGenres });
  }),

  // Display detail page for a specific Genre.
  genre_detail: asyncHandler(async (req, res, next) => {
    const [genre, genreBooks] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec()
    ]);

    if (genre === null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }
    res.render("pages/genre_detail", { title: "Genre Detail", genre, genreBooks });
  }),

  // Display Genre create form on GET.
  genre_create_get: asyncHandler(async (req, res, next) => {
    res.render("pages/genre_form", { title: "Create Genre", genre: undefined, errors: undefined});
  }),

  // Handle Genre create on POST.
  genre_create_post: [
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const genre = new Genre({ name: req.body.name });

      if (!errors.isEmpty()) {
        res.render("pages/genre_form", { title: "Create Genre", genre, errors: errors.array() });
        return;
      } else {
        const genreExists = await Genre.findOne({ name: req.body.name }).exec();
        if (genreExists) {
          res.redirect(genreExists.url);
        } else {
          await genre.save();
          res.redirect(genre.url);
        }
      }
    })
  ],

  // Display Genre delete form on GET.
  genre_delete_get: asyncHandler(async (req, res, next) => {
    const [genre, genreBooks] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec()
    ]);

    if (genre === null) {
      res.redirect("/catalog/genres");
    }

    res.render("pages/genre_delete", { 
      title: "Delete Genre", 
      genre, 
      genreBooks 
    });
  }),

  // Handle Genre delete on POST.
  genre_delete_post: asyncHandler(async (req, res, next) => {
    const [genre, genreBooks] = await Promise.all([
      Genre
        .findById(req.body.genreid)
        .exec(),
      Book
        .find({ genre: req.body.genreid })
        .exec()
    ]);

    if (genreBooks.length > 0) {
      res.render("pages/genre_delete", {
        title: "Delete Genre",
        genre,
        genreBooks,
      });
      return;
    } else {
      console.log("Deleteing genre: ", genre);
      await Genre.findByIdAndDelete(req.body.genreid);
      res.redirect("/catalog/genres");
    }
  }),

  // Display Genre update form on GET.
  genre_update_get: asyncHandler(async (req, res, next) => {
    const genre = await Genre.findById(req.params.id).exec();
    if (genre === null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    res.render("pages/genre_form", {
      title: "Update Genre",
      genre,
      errors: undefined,
    });
  }),

  // Handle Genre update on POST.
  genre_update_post: [
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const genre = new Genre({ name: req.body.name, _id: req.params.id });

      if (!errors.isEmpty()) {
        res.render("pages/genre_form", { title: "Update Genre", genre, errors: errors.array() });
        return;
      } else {
        await Genre.findByIdAndUpdate(req.params.id, genre, {});
        res.redirect(genre.url);
      }
    })
  ]
};

export default genreController;
