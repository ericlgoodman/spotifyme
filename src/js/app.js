/**
 * Created by Eric Goodman on 6/17/17.
 */

var app = angular.module('app', ['ngMaterial', 'ngAnimate', 'ngRoute']);

//configure our routes
app.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: '../followed.html',
            controller: 'followedArtists'
        })
        .when('/recent', {
            templateUrl: 'app',
            controller: 'contactController'
        });
});

app.controller('followed', function mainController($scope, $http) {

    //
    // $http.get('http://localhost:5000')
    //     .then(function (response) {
    //         var data = response.data;
    //         $scope.followedArtists = data['followed_artists'].artists.items;
    //         console.log($scope.artists);
    //         $scope.recentlyPlayed = data.recently_played;
    //         $scope.playlists = data.playlists;
    //         $scope.tracks = data.tracks;
    //     }).catch(function (err) {
    //     return console.error(err);
    // });

});
