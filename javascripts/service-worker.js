(function() {
    'use strict';

    var CACHE_VERSION = '1.0.7';
    var CACHE_NAME    = 'x-sound-cache-v' + CACHE_VERSION;

    var BASE_URL = '/X-Sound/';
    var cacheFiles = [
        BASE_URL,
        BASE_URL + 'index.html',
        BASE_URL + 'favicon.ico',
        BASE_URL + 'lib/css/jquery-ui/jquery-ui-1.10.3.custom.min.css',
        BASE_URL + 'lib/css/colorbox/colorbox.css',
        BASE_URL + 'lib/js/select2/select2.css',
        BASE_URL + 'lib/js/angularjs/angular.min.js',
        BASE_URL + 'lib/js/jquery/jquery-2.1.1.min.js',
        BASE_URL + 'lib/js/jquery-ui/jquery-ui-1.9.2.custom.min.js',
        BASE_URL + 'lib/js/colorbox/jquery.colorbox-min.js',
        BASE_URL + 'lib/js/select2/select2.min.js',
        BASE_URL + 'lib/js/jquery-socialbutton/jquery.socialbutton-1.9.1.min.js',
        BASE_URL + 'stylesheets/css/mac.css',
        BASE_URL + 'stylesheets/css/noscript.css',
        BASE_URL + 'stylesheets/css/ie.css',
        BASE_URL + 'javascripts/xsound.min.js',
        BASE_URL + 'javascripts/controller.min.js',
        BASE_URL + 'register-service-worker.js'
    ];

    self.addEventListener('install', function(event) {
        event.waitUntil(self.skipWaiting());
        // event.waitUntil(
        //   caches.open(CACHE_NAME)
        //         .then(function(cache) {
        //             return cache.addAll(cacheFiles);
        //         })
        // );
    }, false);

    self.addEventListener('fetch', function(event) {
        if (!cacheFiles.some(function(cacheFile) {
              return event.request.url.indexOf(cacheFile) !== -1;
            }) &&
            !event.request.url.endsWith('.wav') &&
            !event.request.url.endsWith('.mp3') &&
            !event.request.url.endsWith('.png')) {
            return;
        }

        event.respondWith(
            caches.match(event.request)
                  .then(function(response) {
                      if (response) {
                          return response;
                      }

                      var fetchRequest = event.request.clone();

                      return fetch(fetchRequest).then(function(response) {
                          var responseToCache = response.clone();

                          caches.open(CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(event.request, responseToCache);
                                });

                          return response;
                      });
                  })
        );
    }, false);

    self.addEventListener('activate', function(event) {
        event.waitUntil(
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.filter(function(cacheName) {
                        return cacheName !== CACHE_NAME;
                    }).map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    }, false);
})();
