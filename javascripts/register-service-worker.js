(function() {
    'use strict';

    if (navigator.serviceWorker) {
        navigator.serviceWorker.register('service-worker.js').then(function(registration) {

        }).catch(function(error) {

        });
    }

})();
