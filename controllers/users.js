const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const User = require('../models/user');
const Campground = require('../models/campground');

const options = {
    auth: {
        api_key: process.env.API_KEY
    }
}

const mailer = nodemailer.createTransport(sgTransport(options));

const capitalize = (s) => {
    if (typeof s !== 'string') return s
    return s.charAt(0).toUpperCase() + s.slice(1)
}

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.register = async(req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash("success", "Welcome to Yelp Camp");
            var Email = {
                to: `${email}`,
                from: 'yelpcamp2022@gmail.com',
                subject: 'Welcome to YelpCamp!',
                text: 'You have successfully created your yelpcamp account ',
                html: '<b>You have successfully created your yelpcamp account </b>'
            };
             
            mailer.sendMail(Email);
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash("success", "Welcome Back");
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.findProfile = async(req, res) => {
    const username = req.params.id;
    const userCamp = await Campground.find({}).populate('author');
    const campgrounds = userCamp.filter(({ author }) => author.username === username);
    const check = 1;
    res.render('campgrounds/index', { campgrounds, check })
}

module.exports.searchCampgrounds = async(req, res) => {
    const v = await Campground.find({}).populate('author');
    const search = capitalize(req.query.q.trim());
    const campgrounds = await v.filter((obj) => (Object.values((Object.values(obj))[5])).find(el => el == search));
    const check = 2;
    res.render('campgrounds/index', { campgrounds, check, search })
}

module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Logged Out!');
    res.redirect('/campgrounds');
}