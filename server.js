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
function getFromSpotify(url, accessToken, name) {
    // Set request parameters
    return new Promise(function (resolve, reject) {
        var options = {
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

if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
        'use strict';
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(arguments[1]) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) {k = 0;}
        }
        var currentElement;
        while (k < len) {
            currentElement = O[k];
            if (searchElement === currentElement ||
                (searchElement !== searchElement && currentElement !== currentElement)) {
                return true;
            }
            k++;
        }
        return false;
    };
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
        'followed_artists': 'https://api.spotify.com/v1/me/following?type=artist',
        'recently_played': 'https://api.spotify.com/v1/me/player/recently-played',
        'playlists': 'https://api.spotify.com/v1/me/playlists',
        'tracks': 'https://api.spotify.com/v1/me/tracks'
    };

    rp(authOptions)
        .then(function (body) {

            // Obtain access token necessary for requests
            var accessToken = body.access_token;

            /*[String]*/
            var requests = [];

            for (var name in spotifyReqests) {
                var url = spotifyReqests[name];
                requests.push(getFromSpotify(url, accessToken, name));
            }
            // Asynchronously request all -> join after
            return Promise.all(requests)
        })
        .then(function (response) {
            var clientResponse = {};

            /* Parse array and place each nested dictionary into larger one */
            response.forEach(function(item) {
                var keys = Object.keys(item);

                // Only one key per nested dictionary
                console.assert(keys.length === 1);
                var key = keys[0];

                clientResponse[key] = item[key];
            });
            res.send(clientResponse);
        })
        .catch(function (err) {
            res.status(500).send({'Error:': err.message});
        });

});

/* Listen */
var listener = app.listen(process.env.PORT || 5000, function () {
    console.log('Listening on port ' + listener.address().port);
});



