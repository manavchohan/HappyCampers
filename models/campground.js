const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/c_fill,w_150,h_120');
})

ImageSchema.virtual('allImg').get(function() {
    return this.url.replace('/upload', '/upload/c_fill,w_700,h_500');
})


const opts = { toJSON: { virtuals: true } };
const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    price: Number,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    description: String,
    location: String,
    rating: [Number],
    country: String,
    state: String,
    city: String,
    views: Number,
    date: {
        createdOn: {
            type: String,
            required: true
        },
        lastUpdated: {
            type: String
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }]
}, opts);

CampgroundSchema.virtual('properties.title').get(function() {
    return `<a href="/campgrounds/${this._id}">${this.title}</a>`
})

CampgroundSchema.post('findOneAndUpdate', async(doc) => {
    if (doc) {
        doc.date.lastUpdated = new Date().toLocaleDateString();
    }
})

CampgroundSchema.post('findOneAndDelete', async(doc) => {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);