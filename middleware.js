const mongoose = require('mongoose');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}


module.exports.checkCampground = async(req, res, next) => {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const campground = await Campground.findById(req.params.id);
        if (campground) return next();
    }
    req.flash('error', 'Cannot find Campground');
    res.redirect('/campgrounds');
}

module.exports.isAuthor = async(req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', "You donot have permission to edit campground");
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async(req, res, next) => {
    const { reviewId, id } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', "You donot have permission to edit review");
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.checkReview = async(req, res, next) => {
    const { id, reviewId } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
        const campground = await Campground.findById(id);
        if (campground) {
            if (mongoose.Types.ObjectId.isValid(reviewId)) {
                const review = await Review.findById(reviewId);
                if (review) return next();
            }
            req.flash('error', 'Cannot find review');
            res.redirect(`/campgrounds/${id}`);
        }
    }
    req.flash('error', 'Cannot find Campground');
    res.redirect('/campgrounds');
}

module.exports.isUser = (req, res, next) => {
    if (req.session.passport.user === req.params.id) {
        next();
    } else {
        req.flash('error', 'Access Denied');
        res.redirect('/campgrounds');
    }
}