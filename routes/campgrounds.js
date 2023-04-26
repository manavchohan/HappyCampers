const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Campground = require('../models/campground');
const Review = require('../models/review');
const campgrounds = require('../controllers/campgrounds');
const { isLoggedIn, validateCampground, checkCampground, isAuthor } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground));
// .post(upload.array('image'), (req, res) => {
//     console.log(req.body);
//     res.send(req.files);
// });
router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(checkCampground, catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, checkCampground, catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn, isAuthor, checkCampground, catchAsync(campgrounds.renderEditForm));



module.exports = router;