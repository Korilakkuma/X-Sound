!function(){"use strict";var n="x-sound-cache-v2.1.53",s="/",e=[s,"/index.html","/favicon.ico","/lib/css/jquery-ui/jquery-ui-1.10.3.custom.min.css","/lib/css/colorbox/colorbox.css","/lib/js/select2/select2.css","/lib/js/angularjs/angular.min.js","/lib/js/jquery/jquery-2.1.1.min.js","/lib/js/jquery-ui/jquery-ui-1.9.2.custom.min.js","/lib/js/colorbox/jquery.colorbox-min.js","/lib/js/select2/select2.min.js","/lib/js/jquery-socialbutton/jquery.socialbutton-1.9.1.min.js","/stylesheets/css/mac.css","/stylesheets/css/noscript.css","/stylesheets/css/ie.css","/javascripts/xsound.js","/javascripts/xsound.js.map","/javascripts/controller.min.js","/register-service-worker.js"];self.addEventListener("install",function(s){s.waitUntil(self.skipWaiting())},!1),self.addEventListener("fetch",function(t){(e.some(function(s){return-1!==t.request.url.indexOf(s)})||t.request.url.endsWith(".wav")||t.request.url.endsWith(".mp3")||t.request.url.endsWith(".png")||t.request.url.endsWith(".txt"))&&t.respondWith(caches.match(t.request).then(function(s){if(s)return s;var e=t.request.clone();return fetch(e).then(function(s){var e=s.clone();return caches.open(n).then(function(s){s.put(t.request,e)}),s})}))},!1),self.addEventListener("activate",function(s){s.waitUntil(caches.keys().then(function(s){return Promise.all(s.filter(function(s){return s!==n}).map(function(s){return caches.delete(s)}))}))},!1)}();