// Imports
var express = require('express');
var request = require('request');
var querystring = require('querystring');
var SpotifyWebApi = require('spotify-web-api-node');
var cors = require('cors');
var config = require('./config.json');

// Spotify credentials
var CLIENT_ID = process.env.CLIENT_ID || config.CLIENT_ID;
var CLIENT_SECRET = process.env.CLIENT_SECRET || config.CLIENT_SECRET;
var REDIRECT_URI = process.env.REDIRECT_URI || config.REDIRECT_URI;
var REFRESH_TOKEN = process.env.REFRESH_TOKEN || config.REFRESH_TOKEN;

var app = express();
app.use(cors());

app.get('/artists/time_range/:time_range', function (req, res) {
    var time_range = req.params.time_range,
        acceptedTimeRanges = ['medium_term', 'long_term'];

    if (!acceptedTimeRanges.includes(time_range)) {
        res.status(400).send('Bad request');
    }

    // Refresh token
    var authCredentials = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))},
        form: {
            grant_type: 'refresh_token',
            refresh_token: REFRESH_TOKEN
        },
        json: true
    };

    request.post(authCredentials, function (error, response, body) {
        if (error) {
            res.status(500).send({'Error: ' : error})
        }
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

/* Listen */
var listener = app.listen(process.env.PORT || 5000, function () {
    console.log('Listening on port ' + listener.address().port);
});



