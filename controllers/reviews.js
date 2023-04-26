const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    campground.rating.push(review.rating);
    await review.save();
    await campground.save();
    req.flash('success', 'Created new review');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteReview = async(req, res) => {
    const { id, reviewId } = req.params;
    const campGround = await Campground.findById(id);
    const r = await Review.findById(reviewId);
    const d = campGround.rating.indexOf(r.rating);
    campGround.rating.splice(d, 1);
    await campGround.save();
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Review Deleted');
    res.redirect(`/campgrounds/${id}`);
}