const { check, validationResult } = require('express-validator');
const genres = require('../utils/genres');
const { isValidObjectId } = require('mongoose');

exports.userValidator = [
  check('name').trim().not().isEmpty().withMessage('Name is missing!'),
  check('email').normalizeEmail().isEmail().withMessage('Email is invalid!'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is missing!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be between 8 to 20 characters long!'),
];

exports.validatePassword = [
  check('newPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is missing!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be between 8 to 20 characters long!'),
];

exports.signInValidator = [
  check('email').normalizeEmail().isEmail().withMessage('Email is invalid!!!'),
  check('password').trim().not().isEmpty().withMessage('Password is missing!'),
];

exports.actorInfoValidator = [
  check('name').trim().not().isEmpty().withMessage('Actor name is missing!'),
  check('about')
    .trim()
    .not()
    .isEmpty()
    .withMessage('About is a required field!'),
  check('gender')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Gender is a required field!'),
];

exports.validateMovie = [
  check('title').trim().not().isEmpty().withMessage('Title is missing!'),
  check('storyLine')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Storyline is missing!'),
  check('language').trim().not().isEmpty().withMessage('language is missing!'),
  check('releseDate').isDate().withMessage('Relese date is missing!'),
  check('status')
    .isIn(['public', 'private'])
    .withMessage('Movie status must be public or private!'),
  check('type').trim().not().isEmpty().withMessage('Movie type is missing!'),
  check('genres')
    .isArray()
    .withMessage('Genres must be an array!')
    .custom((value) => {
      for (let g of value) {
        if (!genres.includes(g)) throw Error('Invalid genre!');
      }
      return true;
    }),
  check('tags')
    .isArray({ min: 1 })
    .withMessage('Tags must be an array of strings!')
    .custom((tags) => {
      for (let tag of tags) {
        if (typeof tag !== 'string')
          throw Error('Tags must be an array of strings!');
      }
      return true;
    }),
  check('cast')
    .isArray()
    .withMessage('Cast must be an array of objects!')
    .custom((cast) => {
      for (let c of cast) {
        if (!isValidObjectId(c.actor))
          throw Error('Invalid cast id inside cast');
        if (!c.roleAs?.trim()) throw Error('Role as is missing!');
        if (typeof c.leadActor !== 'boolean')
          throw Error('Only accept boolean value for leadActor');
      }
      return true;
    }),

  // check('poster').custom((_, { req }) => {
  //   if (!req.file) throw Error('Poster file is missing!');
  //   return true;
  // }),
];

exports.validateTrailer = check('trailer')
  .isObject()
  .withMessage('Trailer must be an object with url and public_id!')
  .custom(({ url, public_id }) => {
    try {
      const result = new URL(url);
      if (!result.protocol.includes('http')) throw Error('Invalid url!');

      const arr = url.split('/');
      const publicId = arr[arr.length - 1].split('.')[0];

      if (public_id !== publicId) throw Error('Trailer public_id is invalid');
      return true;
    } catch (error) {
      throw Error('Invalid url!!!!!!!!');
    }
  });

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  console.log('validate error', error);
  if (error.length) {
    return res.json({ error: error[0].msg });
  }
  next();
};
