/* Author: Eric Goodman */


/* Imports */
let express = require('express');
let request = require('request');
let rp = require('request-promise');
let querystring = require('querystring');
let cors = require('cors');
let bluebird = require('bluebird');
let babel = require("babel-core");
let dotenv = require('dotenv').config();

/* Spotify Credentials */
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

/* Application setup */
let app = express();
app.use(cors());

/**
 * Make get request from Spotify API
 * @param url - Endpoint API url
 * @param accessToken - Spotify access token
 * @returns {Promise} - JSON
 */
function getFromSpotify(url, accessToken) {
    // Set request parameters
    return new Promise((resolve, reject) => {
        let options = {
            url: url,
            headers: {'Authorization': 'Bearer ' + accessToken},
            json: true
        };

        request.get(options, function (error, response, body) {
            clientResponse = {};
            if (!error) {
                clientResponse[name] = body;
                resolve(clientResponse);
            }
            else {
                clientResponse['Error'] = error;
                reject(clientResponse);
            }
        });
    });
}
/**
 * Our API endpoint
 */
app.get('/', function (req, res) {

    // Validate
    validSources = ['ericgoodman.me', 'localhost'];
    if (!validSources.includes(req.hostname)) {
        res.status(400).send('Bad request');
    }

    // Refresh token
    let authOptions = {
        method: 'POST',
        uri: 'https://accounts.spotify.com/api/token',
        headers: {'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))},
        form: {
            grant_type: 'refresh_token',
            refresh_token: REFRESH_TOKEN
        },
        json: true
    };

    let spotifyReqests = {
        'followed_artists': 'https://api.spotify.com/v1/me/following?type=artist',
        'recently_played': 'https://api.spotify.com/v1/me/player/recently-played',
        'playlists': 'https://api.spotify.com/v1/me/playlists',
        'tracks': 'https://api.spotify.com/v1/me/tracks'
    };

    rp(authOptions)
        .then(body => {

            // Obtain access token necessary for requests
            let accessToken = body.access_token;

            /* [ Promise ] */
            let requests = [];

            for (let name in spotifyReqests) {
                let url = spotifyReqests[name];
                requests.push(getFromSpotify(url, accessToken));
            }
            // Asynchronously request all -> join after
            return Promise.all(requests)
        })
        .then(response => {
            let clientResponse = {};

            /* Parse array and place each nested dictionary into larger one */
            response.forEach(function(item) {
                let keys = Object.keys(item);

                // Only one key per nested dictionary
                console.assert(keys.length === 1);
                let key = keys[0];

                clientResponse[key] = item[key];
            });
            res.send(clientResponse);
        })
        .catch(function (err) {
            res.status(500).send({'Error:': err.message});
        });

});

/* Listen */
let listener = app.listen(process.env.PORT || 5000, function () {
    console.log('Listening on port ' + listener.address().port);
});
