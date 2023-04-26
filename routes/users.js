const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user');
const Campground = require('../models/campground');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const { isLoggedIn, validateCampground, checkCampground, isAuthor, isUser } = require('../middleware');

router.route('/register')
    .get(users.renderRegister)
    .post(catchAsync(users.register));

router.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login);

router.get('/profile/:id/campgrounds', isLoggedIn, isUser, catchAsync(users.findProfile));
router.get('/search', catchAsync(users.searchCampgrounds))
router.get('/logout', users.logout);

module.exports = router;