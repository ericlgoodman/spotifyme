# SpotifyMe
Spotify's API uses OAuth 2.0 for all requests containing information about a specific user, which requires client side
authentication. This is a personal API built in Node.js that authenticates me using a (essentially) permanent refresh token
to obtain an access token, which is subsequently used for Spotify API requests. I'm hosting this on Heroku to use as for a page on my personal website to display my followed artists and saved tracks.

### Languages / Frameworks:
* Node.js (written in es6)
* Babel
* Express
