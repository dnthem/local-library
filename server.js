import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import debug from 'debug';
import createError from 'http-errors';
import expressEjsLayouts from 'express-ejs-layouts';
import indexRouter from './routes/index.js';
import userRouter from './routes/userRoute.js';
import catalogRouter from './routes/catalogRoute.js';
import db from './db/db.js';
const debugLog = debug('app:log');
const app = express();

const __dirname = path.resolve();

app.use(expressEjsLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Connect to MongoDB
db().catch((err) => console.log(err));

// Routes
app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/catalog', catalogRouter);

// Error handler
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  
  res.status(err.status || 500);
  res.render('error', {
    layout: 'layouts/error',
    title: 'Error',
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  },
);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});