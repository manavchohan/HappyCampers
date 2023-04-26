const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { places, descriptors, morePics, pics, users } = require('./seedHelpers');
const Campground = require('../models/campground');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];
const words = () => {
    let para = " ";
    for (let k = 0; k < 120; k++) {
        para = ((Math.random() + 1).toString(36).substring(Math.floor(Math.random() * 4) + 7)) + " " + para;
    }
    return para
}

let world;

const seedDB = async() => {
    await Campground.deleteMany({});
    await fetch('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/countries%2Bstates%2Bcities.json')
        .then(res => res.json())
        .then(json => {
            console.log("done");
            world = json;
        });
    for (let i = 0; i < 57; i++) {
        let random5 = Math.floor(Math.random() * 11);
        let country;
        let state;
        while (true) {
            country = sample(world);
            if (country.states.length === 0) {
                continue
            }
            state = sample(country.states);
            if (state.cities.length) {
                break
            } else {
                continue
            }
        }
        let city = sample(state.cities);
        const price = Math.floor(Math.random() * 55) + 20;
        const today = new Date().toLocaleDateString();
        const camp = new Campground({
            author: `${sample(users)}`,
            location: `${city.name}, ${state.name}`,
            country: country.name,
            state: state.name,
            city: city.name,
            geometry: {
                type: 'Point',
                coordinates: [city.longitude, city.latitude]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            // image: `https://source.unsplash.com/collection/${sample(morePics)}`,
            description: words(),
            price,
            views: 0,
            date: {
                createdOn: `${today}`
            },
            images: [{
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                },
                {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }, {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }, {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                },
                {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }, {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                },
                {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }, {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }, {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }, {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }, {
                    url: `${sample(morePics)}`,
                    filename: `${sample(pics)}`
                }
            ]
        })
        await camp.save();
    }
}


seedDB().then(() => {
    mongoose.connection.close();
})