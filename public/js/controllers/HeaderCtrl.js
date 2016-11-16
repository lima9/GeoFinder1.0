/**
 * Created by Andrea on 06/11/2016.
 */
<!--TYPEAHEAD-->
angular.module('GeoFinderApp').controller('HeaderCtrl',['$scope','$rootScope','$http','$routeParams',function($scope, $rootScope, $http, $routeParams){

    $scope.flag = true;

    $scope.items = [{
        id: 1,
        name: 'Usuarios'
    },{
        id: 2,
        name: 'Aventuras'
    }];

    searcher();
    function  searcher() {
        if ($scope.flag){
            $http.get('/user')
                .success(function(data) {
                    $scope.users = data;
                    console.log(data);

                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });


            $scope.selected = undefined;


            $scope.onSelect = function ($item, $model, $label) {

                window.location.href = "#/userprofile/" + $model._id;
                $scope.$item = $item;
                $scope.$model = $model;
                $scope.$label = $label;
                console.log($model);
                $scope.userSelected = $model.username;
                
            };

            $scope.modelOptions = {
                debounce: {
                    default: 500,
                    blur: 250
                },
                getterSetter: true
            };
            $scope.flag = false;

        }


        else{
            $http.get('/adventures')
                .success(function(data) {
                    $scope.adventures = data;
                    console.log(data);

                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
            $scope.selected = undefined;


            $scope.onSelect = function ($item, $model, $label) {

                window.location.href = "#/adventureprofile/" + $model._id;
                $scope.$item = $item;
                $scope.$model = $model;
                $scope.$label = $label;
                console.log($model);
                $scope.userSelected = $model.name;

            };

            $scope.modelOptions = {
                debounce: {
                    default: 500,
                    blur: 250
                },
                getterSetter: true
            };
            $scope.flag =true;

        }
    }


    $scope.cambio = (function () {

        searcher();

    });

   
}]);

