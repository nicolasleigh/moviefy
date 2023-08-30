const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
require('dotenv').config();
require('./db');
const userRouter = require('./routes/user');
const { errorHandler } = require('./middlewares/error');
const cors = require('cors');
const { handleNotFound } = require('./utils/helper');

const app = express();
app.use(cors()); // for cross origin resource sharing
app.use(express.json()); // for parsing application/json
app.use(morgan('dev'));
app.use('/api/user', userRouter);

app.use('/*', handleNotFound);

app.use(errorHandler);

// app.post(
//   '/sign-in',
//   (req, res, next) => {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.json({ error: 'email/password missing!' });
//     next();
//   },
//   (req, res) => {
//     res.send('<h1>hello world about</h1>');
//   }
// );

app.listen(8000, () => {
  console.log('the port is listening on 8000');
});
