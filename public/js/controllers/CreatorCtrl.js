/**
 * Created by mbmarkus on 4/11/16.
 */
angular.module('GeoFinderApp').controller('CreatorCtrl',['$scope','$rootScope','$http','uiGmapGoogleMapApi',
    '$timeout','uiGmapIsReady', function($scope, $rootScope, $http, GoogleMapApi, $timeout, uiGmapIsReady){

    /**
     * Init zone
     *
     */
    $scope.NewAdventure = {};
    $scope.NewHint = {};
    var MapBox = [{"featureType":"water","stylers":[{"saturation":43},{"lightness":-11},{"hue":"#0088ff"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"hue":"#ff0000"},{"saturation":-100},{"lightness":99}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#808080"},{"lightness":54}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#ece2d9"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#ccdca1"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#767676"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#b8cb93"}]},{"featureType":"poi.park","stylers":[{"visibility":"on"}]},{"featureType":"poi.sports_complex","stylers":[{"visibility":"on"}]},{"featureType":"poi.medical","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","stylers":[{"visibility":"simplified"}]}];
    var BlackMap = [{"elementType":"geometry","stylers":[{"color":"#242f3e"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#746855"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#242f3e"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#263c3f"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#6b9a76"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#38414e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#212a37"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#746855"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#1f2835"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#f3d19c"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#2f3948"}]},{"featureType":"transit.station","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#17263c"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#515c6d"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#17263c"}]}];
    $scope.stylemap = "Diurno";
    $scope.options = {
        styles: MapBox,
        scrollwheel: false
    };
    $scope.windowOptions = {
        visible: false
    };
    $scope.SelectedAdv = {};
    var CheckBoxMarkersAventureStatus = false;

    uiGmapIsReady.promise(1).then(function(instances) {
        var mapInstance = instances[0].map;
        google.maps.event.addListener(mapInstance, 'click', function() {
        });
        google.maps.event.addListener(mapInstance, 'idle', function() {
        });
    });

    /**
     * Map zone
     */
    $scope.map = {
        show: true,
        control: {},
        version: "uknown",
        heatLayerCallback: function (layer) {
            //set the heat layers backend data
            var mockHeatLayer = new MockHeatLayer(layer);
        },
        center: {
            latitude: 45,
            longitude: -73
        },
        showTraffic: true,
        showBicycling: false,
        showWeather: false,
        showHeat: false,
        options: {
            streetViewControl: false,
            panControl: false,
            maxZoom: 20,
            minZoom: 3
        },
        zoom: 3,
        dragging: false,
        bounds: {},
        clickedMarker: {
            id: 0,
            options:{
            }
        },
        events: {
            //This turns of events and hits against scope from gMap events this does speed things up
            // adding a blacklist for watching your controller scope should even be better
            blacklist: ['drag', 'dragend','dragstart','zoom_changed', 'center_changed'],
            click: function (mapModel, eventName, originalEventArgs) {
                // 'this' is the directive's scope
                $log.info("user defined event: " + eventName, mapModel, originalEventArgs);

                var e = originalEventArgs[0];
                console.log(e);
                var lat = e.latLng.lat(),
                    lon = e.latLng.lng();
                $scope.map.clickedMarker = {
                    id: 0,
                    options: {
                        labelContent: 'You clicked here ' + 'lat: ' + lat + ' lon: ' + lon,
                        labelClass: "marker-labels",
                        labelAnchor: "50 0"
                    },
                    latitude: lat,
                    longitude: lon
                };
                //scope apply required because this event handler is outside of the angular domain
                //$scope.$evalAsync();
            }
        }
    };
    /**
     *need to do $scope.$apply to trigger the digest cycle when the geolocation arrives and to update all the watchers.
     */
    //Declaración del mapa
    $scope.map = { center: { latitude: 0.1, longitude: 0.1 }, zoom: 2 };

    //Función de golocalización y puesta del marker centrado en pantalla
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
            $scope.$apply(function(){
                $scope.map = { center: { latitude: position.coords.latitude, longitude: position.coords.longitude }, zoom: 16 };

                $scope.map.createMarker = {
                    id: 1,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    options: {
                        labelContent: '----Puntero----',
                        labelAnchor: "26 0",
                        labelClass: "marker-labels",
                        draggable: true
                    }
                };


                $scope.$watchCollection("map.createMarker", function(newVal, oldVal) {
                    $scope.map.center.latitude = position.coords.latitude;
                    $scope.map.center.longitude = position.coords.longitude;

                    $scope.NewAdventure.location_coordinates = [$scope.map.createMarker.longitude, $scope.map.createMarker.latitude];
                    $scope.NewHint.location_coordinates = [$scope.map.createMarker.longitude, $scope.map.createMarker.latitude];

                    console.log($scope.NewAdventure.location_coordinates);
                    if (_.isEqual(newVal, oldVal))
                        return;
                });

            });
        });
    }
    else if (!navigator.geolocation){
        $scope.ErrorMsg = ('No se ha permitido el acceso a la posición del usuario.');
    }

    $scope.ShowAdventuresonMap = function (){
        $scope.CleanMap();
        var markersAdventures = [];
        $http.get('/adventures/')
            .success(function (data) {
                angular.forEach(data, function (value, key) {
                    //For color icons
                    var dificon;
                    switch (value.difficulty){
                        case "Fácil":
                            dificon = '/images/MapIcons/extended-icons5_101.png';
                            break;
                        case "Mediana":
                            dificon = '/images/MapIcons/extended-icons5_102.png';
                            break;
                        case "Díficil":
                            dificon = '/images/MapIcons/extended-icons5_103.png';
                            break;
                        default:
                            dificon = '/images/MapIcons/extended-icons5_05.png';
                            break;
                    }

                    markersAdventures.push(
                        {
                            name: value.name,
                            description: value.description,
                            image: value.image,
                            difficulty: value.difficulty,
                            _id: value._id,
                            latitude: value.location.coordinates[1],
                            longitude: value.location.coordinates[0],
                            showWindow: false,
                            options: {
                                icon: dificon,
                                animation: 0,
                                title: value.name,
                                labelAnchor: "26 0",
                                labelClass: "marker-labels"
                            }
                        }
                    );
                });
                console.log(markersAdventures);
            })
            .error(function (data) {
                console.log(data);
            })

        $scope.map.markerAdventures = markersAdventures;
    };

    $scope.ShowHintofAdventureonMap = function (){
            $scope.CleanMap();
            var markersHints = [];
            $http.get('/adventures/id/'+ $scope.SelectedAdv._id)
                .success(function (data) {
                    angular.forEach(data.hints, function (value, key) {
                        markersHints.push(
                            {
                                index: value.index,
                                indication: {
                                    distance: value.indication.distance,
                                    sense: value.indication.sense
                                },
                                text: value.text,
                                image: value.image,
                                _id: value._id,
                                latitude: value.location.coordinates[1],
                                longitude: value.location.coordinates[0],
                                showWindow: false,
                                options: {
                                    icon: '/images/MapIcons/extended-icons5_77.png',
                                    animation: 0,
                                    title: value.text,
                                    labelAnchor: "26 0",
                                    labelClass: "marker-labels"
                                }
                            }
                        );
                    });
                    console.log(markersHints);
                })
                .error(function (data) {
                    console.log(data);
                })

            $scope.map.markersHints = markersHints;
        };

    $scope.CleanMap = function () {
        $scope.map.markersHints = [];
        $scope.map.markerAdventures = [];
    }

    $scope.CheckBoxMarkersAventure = function () {
        if (!CheckBoxMarkersAventureStatus){
            CheckBoxMarkersAventureStatus = true;
            $scope.ShowAdventuresonMap();
        }
        else {
            CheckBoxMarkersAventureStatus = false;
            $scope.CleanMap();
        }
    };

    $scope.SwitchStyleMap = function (style){
        switch(style){
            case "Diurno":
                $scope.options.styles = MapBox;
                break;
            case "Nocturno":
                $scope.options.styles = BlackMap;
                break;
            default:
                $scope.options.styles = MapBox;
                break;
        }
    };

    /**
     * Creator Adventure Zone
     * @constructor
     */


    $scope.CreateAdventure = function(){
        if ($rootScope.UserSessionId._id != null) {

            $scope.NewAdventure.location_type = 'Point';
            $scope.NewAdventure.hint = {
                direction : 'Test N',
                text: $scope.NewAdventure.hinttext,
                image: $scope.NewAdventure.hintimage
            };
            $http.post('/adventures/createadventure/', $scope.NewAdventure)
                .success(function (data) {
                    console.log(data);
                    //Reprint Coordinates
                    $scope.NewAdventure.location_coordinates = [$scope.map.createMarker.longitude, $scope.map.createMarker.latitude];
                    $scope.SuccessMsg = "Adventura creada";
                    $timeout(function () {
                        $scope.SuccessMsg = null;
                    }, 3000);

                    var Newassign = {};
                    Newassign.adventure_id = data._id;
                    Newassign.user_id = $rootScope.UserSessionId._id;

                    $http.post('/user/acreatedadv/', Newassign)
                        .success(function (data) {
                            $scope.SelectedAdv._id = data;
                            $scope.NewAdventure = {}; //clear the form
                        })
                        .error(function (data) {
                            console.log('Error:' + data);
                        });
                })
                .error(function (data) {
                    console.log('Error:' + data);
                });
        }
        else $scope.ErrorMsg = ('Es necesario estar registrado');
    };

    /**
     * Hints Zone
     * @constructor
     */

    $scope.CreateHint = function(advid){
        console.log(advid);

        if ($rootScope.UserSessionId._id != null) {

            $scope.NewHint.location_type = 'Point';
            $scope.NewHint._id = $scope.SelectedAdv._id;

            $http.post('/hints/createhint/', $scope.NewHint)
                .success(function (data) {
                    console.log(data);
                    //Reprint Coordinates
                    $scope.SuccessMsg = "Pista creada";
                    $timeout(function () {
                        $scope.SuccessMsg = null;
                    }, 3000);

                    var Newassign = {};
                    Newassign.hint_id = data._id;
                    Newassign.adventure_id = $scope.SelectedAdv._id;

                    console.log(Newassign);

                    $http.post('/adventures/ahintdadv/', Newassign)
                        .success(function (data) {
                            $scope.NewHint = {}; //clear the form
                            $scope.ShowHintofAdventureonMap();
                        })
                        .error(function (data) {
                            console.log('Error:' + data);
                        });
                })
                .error(function (data) {
                    console.log('Error:' + data);
                });
        }
        else $scope.ErrorMsg = ('Es necesario estar registrado');
    };

    $scope.ActivHintCreator = function (status) {
        if (status){
            $scope.StatusHint = false;
        }
        else {
            $scope.StatusHint = true;
        }
    };

    $scope.SelAdventureforHint = function (id) {
        console.log(id);
        $scope.SelectedAdv =
            {
                _id: id
            };
    };

}]);
