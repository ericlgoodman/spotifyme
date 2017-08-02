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
const LIMIT = 50;

/* Application setup */
let app = express();

app.use(cors());

let spotifyAuthOptions = (url, accessToken) => {
    return {
        uri: url,
        headers: {'Authorization': 'Bearer ' + accessToken},
        json: true
    };
};

/**
 * Make recursive get requests from Spotify API
 * @param url - Endpoint API url
 * @param accessToken - Spotify access token
 * @param identifier - String name to refer to request in finalized JSON
 * @returns {Promise} - JSON
 */

let spotifyRecursiveRequest = (url, accessToken, identifier) => {
    let spotifyResponses = [];

    let recursiveQuery = (url, accessToken) => {
        // Set request parameters
        return new Promise((resolve, reject) => {
            rp(spotifyAuthOptions(url, accessToken)).then(response => {
                spotifyResponses.push(response.artists.items);

                if (response.artists.next !== null) {
                    let newUrl = response.artists.next;

                    // Recurse
                    resolve(recursiveQuery(newUrl, accessToken));
                }
                else {
                    // End of results, parse and return
                    let clientResponse = {};
                    clientResponse[identifier] = [];

                    for (let i = 0; i < spotifyResponses.length; i++) {
                        for (let j = 0; j < spotifyResponses[i].length; j++) {
                            clientResponse[identifier].push(spotifyResponses[i][j]);
                        }
                    }

                    resolve(clientResponse);
                }
            }).catch(err => {
                reject(console.error(err));
            });
        });
    };

    return recursiveQuery(url, accessToken, identifier);
};

let spotifyRequest = (url, accessToken, identifier) => {
    return new Promise((resolve, reject) => {
        rp(spotifyAuthOptions(url, accessToken))
            .then(response => {
                let clientResponse = {};
                clientResponse[identifier] = response;
                resolve(clientResponse);

            })
            .catch(err => {
                reject(err);
            });
    });
};

/**
 * Our API endpoint
 */
app.get('/', function (req, res) {

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

    let spotifyReqestUrls = {
        'followed_artists': 'https://api.spotify.com/v1/me/following?type=artist&limit=50',
        'recently_played': 'https://api.spotify.com/v1/me/player/recently-played?limit=50'
    };

    rp(authOptions)
        .then(response => {
            // Obtain access token necessary for requests
            let accessToken = response.access_token;

            let requests = [
                spotifyRecursiveRequest(spotifyReqestUrls['followed_artists'], accessToken, 'followed_artists'),
                spotifyRequest(spotifyReqestUrls['recently_played'], accessToken, 'recently_played')
            ];

            // Asynchronously request all -> join after
            return Promise.all(requests)
        })
        .then(response => {
            res.send(response);
        })
        .catch(function (err) {
            console.log('not ok');p
            console.error(err);
            res.send({'Error:': err.message});
        });

});

/* Listen */
let listener = app.listen(process.env.PORT || 5000, function () {
    console.log('Listening on port ' + listener.address().port);
});
