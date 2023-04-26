const Campground = require('../models/campground');
const User = require('../models/user');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const campground = require('../models/campground');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

const options = {
    auth: {
        api_key: process.env.API_KEY
    }
}

const mailer = nodemailer.createTransport(sgTransport(options));

const csc = async(campground, str) => {
    if (str.indexOf(",") !== str.lastIndexOf(",")) {
        campground.city = str.slice(0, str.indexOf(",")).trim();
        campground.state = str.slice(str.indexOf(",") + 1, str.lastIndexOf(",")).trim();
        campground.country = str.slice(str.lastIndexOf(",") + 1).trim();
    } else if (str.indexOf(",") === str.lastIndexOf(",") && str.indexOf(",") !== -1) {
        campground.state = str.slice(0, str.indexOf(",")).trim();
        campground.country = str.slice(str.lastIndexOf(",") + 1).trim();
    } else {
        campground.country = str.trim();
    }
}

module.exports.index = async(req, res) => {
    const campgrounds = await Campground.find({}).populate('author');
    const users = await User.find({});
    const check = 0;
    res.render('campgrounds/index', { campgrounds, check, users })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async(req, res, next) => {
    if (!req.files) {
        req.flash('error', 'Image is required');
        return res.redirect('/campgrounds/new');
    }
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    if (!geoData.body.features.length) {
        req.flash('error', `Please enter a valid location (format: City, State) <br> Error: Cannot find ${req.body.campground.location}`);
        return res.redirect('/campgrounds/new');
    }
    let str = geoData.body.features[0].place_name;
    const today = new Date().toLocaleDateString();
    const campground = new Campground(req.body.campground);
    const {email,username} = await User.findById(req.user._id);
    csc(campground, str);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    campground.views = 0;
    campground.date.createdOn = `${today}`;
    await campground.save();
    req.flash('success', 'Successfully made a new campground');
    var Email = {
        to: `${email}`,
        from: 'yelpcamp2022@gmail.com',
        subject: 'Campground Created!!',
        text: `Hi ${username}, you have successfully created a new campgound on ${new Date().toLocaleString()}`,
        html: `<b>Hi ${username}, you have successfully created a new campgound on ${new Date().toLocaleString()}. Click the link below to check your new campground <br> </b> <a href="https://desolate-journey-89417.herokuapp.com/campgrounds/${campground._id}">${req.body.campground.title}</a>`
    };
     
    mailer.sendMail(Email);
    res.redirect(`/campgrounds/${campground._id}`)

}

module.exports.showCampground = async(req, res) => {
    const campgrounds = await Campground.find({}).populate('author');
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!req.user || req.user.id != campground.author._id) {
        campground.views++;
        await campground.save();
    }
    res.render('campgrounds/show', { campground, campgrounds });
}

module.exports.renderEditForm = async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async(req, res) => {
    const { id } = req.params;
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    if (!geoData.body.features.length) {
        req.flash('error', `Please enter a valid location (format: City, State) <br> Error: Cannot find ${req.body.campground.location}`);
        return res.redirect(`/campgrounds/${id}/edit`);
    }
    let str = geoData.body.features[0].place_name;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    csc(campground, str);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages && campground.images.length - req.body.deleteImages.length < 1) {
        req.flash('error', 'Cannot delete all images');
        res.redirect(`/campgrounds/${campground._id}/edit`);
    } else {
        if (req.body.deleteImages) {
            for (let filename of req.body.deleteImages) {
                await cloudinary.uploader.destroy(filename);
            }
            await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
        }
        req.flash('success', 'Successfully updated campground');
        res.redirect(`/campgrounds/${campground._id}`)
    }
}

module.exports.deleteCampground = async(req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Campground Deleted');
    res.redirect('/campgrounds');
}