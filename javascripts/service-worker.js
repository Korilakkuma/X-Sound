(function() {
    'use strict';

    var CACHE_VERSION = '1.0.4';
    var CACHE_NAME    = 'x-sound-cache-v' + CACHE_VERSION;

    var cacheFiles = [
        'lib/css/jquery-ui/jquery-ui-1.10.3.custom.min.css',
        'lib/css/colorbox/colorbox.css',
        'lib/js/select2/select2.css',
        'lib/js/angularjs/angular.min.js',
        'lib/js/jquery/jquery-2.1.1.min.js',
        'lib/js/jquery-ui/jquery-ui-1.9.2.custom.min.js',
        'lib/js/colorbox/jquery.colorbox-min.js',
        'lib/js/select2/select2.min.js',
        'lib/js/jquery-socialbutton/jquery.socialbutton-1.9.1.min.js',
        'stylesheets/css/mac.css',
        'stylesheets/css/noscript.css',
        'stylesheets/css/ie.css',
        'javascripts/xsound.min.js'
    ];

    self.addEventListener('install', function(event) {
        event.waitUntil(
          caches.open(CACHE_NAME)
                .then(function(cache) {
                    return cache.addAll(cacheFiles);
                })
        );
    }, false);

    self.addEventListener('fetch', function(event) {
        if (!event.request.url.endsWith('.wav') &&
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
