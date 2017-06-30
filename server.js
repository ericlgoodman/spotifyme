/* Author: Eric Goodman */


/* Imports */
var express = require('express');
var request = require('request');
var rp = require('request-promise');
var querystring = require('querystring');
var cors = require('cors');
var bluebird = require('bluebird');

// For local development use config file
try {
    var config = require('./config.json');
}
catch (e) {
    if (!(e instanceof Error && e.code === "MODULE_NOT_FOUND")) {
        throw e;
    }
}

// Spotify credentials
var CLIENT_ID = process.env.CLIENT_ID || config.CLIENT_ID;
var CLIENT_SECRET = process.env.CLIENT_SECRET || config.CLIENT_SECRET;
var REDIRECT_URI = process.env.REDIRECT_URI || config.REDIRECT_URI;
var REFRESH_TOKEN = process.env.REFRESH_TOKEN || config.REFRESH_TOKEN;

var app = express();
app.use(cors());

/**
 * Make get request from Spotify API
 * @param url - Endpoint API url
 * @param accessToken - Spotify access token
 * @returns {Promise} - JSON
 */
function getFromSpotify(url, accessToken) {
    // Set request parameters
    return new Promise(function (resolve, reject) {
        var options = {
            url: url,
            headers: {'Authorization': 'Bearer ' + accessToken},
            json: true
        };

        request.get(options, function (error, response, body) {
            if (!error) {
                resolve(body);
            }
            else {
                console.error("Error retrieving data from Spotify: ", error);
                reject(error);
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
        res.status(400).send('Invalid request');
    }

    // Refresh token
    var authOptions = {
        method: 'POST',
        uri: 'https://accounts.spotify.com/api/token',
        headers: {'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))},
        form: {
            grant_type: 'refresh_token',
            refresh_token: REFRESH_TOKEN
        },
        json: true
    };

    var spotifyReqests = {
        followedArtistsUrl: 'https://api.spotify.com/v1/me/following',
        recentlyPlayedUrl: 'https://api.spotify.com/v1/me/player/recently-played',
        playlistsUrl: 'https://api.spotify.com/v1/me/playlists',
        tracksUrl: 'https://api.spotify.com/v1/me/tracks'
    };

    rp(authOptions)
        .then(function (body) {

            // Obtain access token necessary for requests
            var accessToken = body.access_token;

            /*[String]*/
            var requests = [];

            for (var name in spotifyReqests) {
                var url = spotifyReqests[name];
                requests.push(getFromSpotify(url, accessToken));
            }
            // Asynchronously request all -> join after
            return Promise.all(requests)
        })
        .then(function (data) {
            res.send(data);
        })
        .catch(function (err) {
            console.error('Error:', err);
            res.status(500).send({'Error:': err.message});
        });

});

/* Listen */
var listener = app.listen(process.env.PORT || 5000, function () {
    console.log('Listening on port ' + listener.address().port);
});



