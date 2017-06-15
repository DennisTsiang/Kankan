/**
 * Created by yianni on 06/06/17.
 */

let app = angular.module('Kankan', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable', 'ui.select', "ngRoute"]);

app.config(function($routeProvider) {
  $routeProvider
    .when('/login', {
      templateUrl: 'login.html',
      controller: 'LoginController'
    })
    .when('/kanban', {
      templateUrl: 'kanban.html',
    })
    .when('/home', {
      templateUrl: 'home.html',
      controller: 'HomeController'
    })
    .otherwise({
      redirectTo: '/login'
    });
});

app.factory('socket', function ($rootScope) {
  let socket = io();

  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    },
    connected: function () {
      return socket.connected;
    }
  };
});

app.factory('currentProject', function () {
  let project = null;
  return {
    set: function (new_project) {
      project = new_project;
    },
    get: function () {
      return project;
    }
  };
});

app.factory('user', function () {
  let user = null;
  return {
    set: function (new_user) {
      user = new_user;
    },
    get: function () {
      return user;
    }
  };
});
