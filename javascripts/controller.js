/**
 * controller.js
 * @fileoverview AngularJS controller for X Sound Application
 *
 * JavaScript Libraries :
 *     XSound.js (https://github.com/Korilakkuma/XSound)
 *     jQuery / jQuery UI
 *     select2.js
 *     jquery.socialbutton
 *
 * Copyright (c) 2012, 2013, 2014 Tomohiro IKEDA (Korilakkuma)
 * Released under the MIT license
 */
 
 
 
(function() {
    'use strict';

    var xsound = angular.module('xsound', ['ngSanitize']);

    /**
     * This configuration for set Data URL and Object URL  (except "unsafe:").
     * @param {$compileProvider} $compileProvider This argument is service of DI (Dependency Injection).
     */
    xsound.config(['$compileProvider', function($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data|blob):/);
    }]);

    /**
     * for loading resources (one-shot audios, RIRs, MML texts).
     * @param {$location} $location This argument is service that wraps location object.
     */
    xsound.factory('BASE_URL', ['$location', function($location) {
        var baseURL = '';

        if ($location.host() === 'localhost') {
            baseURL = $location.protocol() + '://' + $location.host() + '/~rilakkuma3xjapan/GitHub/X-Sound/resources/';
        } else {
            baseURL = $location.protocol() + '://' + $location.host() + '/resources/';
        }

        return baseURL;
    }]);

    /**
     * This is the sound sources that this application uses.
     */
    xsound.value('sources', ['mixer', 'oscillator', 'oneshot', 'audio', 'stream', 'noise']);

    /**
     * This is the array of number in order to identify oscillator.
     */
    xsound.value('oscillatorNumbers', [0, 1, 2, 3]);

    /**
     * This service sets parameter each oscillator.
     * @param {Arrya.<number>} oscillatorNumbers This is the array of number in order to identify oscillator.
     * @param {number} number This argument is either 0 or 1 in this application.
     * @param {string} module This argument is module name this is defined by XSound.js.
     * @param {string} param This argument is parameter name that is defined by XSound.js.
     * @param {number|string} value This argument is parameter value.
     */
    xsound.value('updateParamEachOscillator', function(oscillatorNumbers, number, module, param, value) {
        switch (number) {
            case 0 :
                if (module) {
                    angular.forEach(oscillatorNumbers, function(oscillatorNumber) {
                        X('oscillator', oscillatorNumber).module(module).param(param, value);
                    });
                } else {
                    angular.forEach(oscillatorNumbers, function(oscillatorNumber) {
                        X('oscillator', oscillatorNumber).param(param, value);
                    });
                }
                break;
            case 1 :
                if (module)  {
                    angular.forEach(oscillatorNumbers, function(oscillatorNumber) {
                        C('oscillator', oscillatorNumber).module(module).param(param, value);
                    });
                } else {
                    angular.forEach(oscillatorNumbers, function(oscillatorNumber) {
                        C('oscillator', oscillatorNumber).param(param, value);
                    });
                }

                break;
            default :
                break;
        }
    });

    /**
     * This service sets parameter for module.
     * @param {string} source This argument is sound source name that is defined by XSound.js.
     * @param {string} module This argument is module name this is defined by XSound.js.
     * @param {string} param This argument is parameter name that is defined by XSound.js.
     * @param {number|string} value This argument is parameter value.
     */
    xsound.value('updateParamOfModule', function(source, module, param, value) {
        if ((source === 'oscillator') && (module === 'envelopegenerator')) {
            X('oscillator').module('envelopegenerator').param(param, value);
            C('oscillator').module('envelopegenerator').param(param, value);
        } else if ((module === 'analyser') && (param === 'interval')) {
            if (value > 0) {
                X(source).module('analyser').domain('time').param('interval', value);
                X(source).module('analyser').domain('fft').param('interval', value);
            } else {
                X(source).module('analyser').domain('time').param('interval', 'auto');
                X(source).module('analyser').domain('fft').param('interval', 'auto');
            }
        } else {
            X(source).module(module).param(param, value);

            if (source === 'oscillator') {
                C('oscillator').module(module).param(param, value);
            }
        }
    });

    /**
     * This service sets parameter for sound source.
     * @param {string} source This argument is sound source name that is defined by XSound.js.
     * @param {string} param This argument is parameter name that is defined by XSound.js.
     * @param {number|string} value This argument is parameter value.
     */
    xsound.value('updateParamOfSource', function(source, param, value) {
        if ((source === 'oneshot') && (param === 'playbackRate')) {
            X('oneshot').param('transpose', value);
        } else {
            X(source).param(param, value);
            C('oscillator').param(param, value);
        }
    });

    xsound.factory('updateParam', ['oscillatorNumbers', 'updateParamEachOscillator', 'updateParamOfModule', 'updateParamOfSource', function(oscillatorNumbers, updateParamEachOscillator, updateParamOfModule, updateParamOfSource) {
        /*
         * This service sets parameter.
         * @param {string} source This argument is sound source name that is defined by XSound.js.
         * @param {string} module This argument is module name this is defined by XSound.js.
         * @param {string} param This argument is parameter name that is defined by XSound.js.
         * @param {number|string} value This argument is parameter value.
         */
        return function(source, module, param, value) {
            var sources = [];

            if (source) {
                sources = source.split(' ');
            } else {
                sources = ['mixer', 'oscillator', 'oneshot', 'audio', 'stream', 'noise'];
            }

            angular.forEach(sources, function(source) {
                var matches = source.match(/oscillator(0|1)/);

                if (matches !== null) {
                    updateParamEachOscillator(oscillatorNumbers, parseInt(matches[1]), module, param, value);
                } else {
                    if (module) {
                        updateParamOfModule(source, module, param, value);
                    } else {
                        updateParamOfSource(source, param, value);
                    }
                }
            });
        };
    }]);

    /**
     * This service opens jQuery UI Dialog.
     * @param {string} title This argument is dialog title.
     * @param {number|string} width This argument is dialog width.
     * @param {number|string} height This argument is dialog height.
     * @param {boolean} modal This argument is to determine whether using modal window.
     * @param {string} html This argument is dialog message.
     */
    xsound.value('openDialog', function(title, width, height, modal, html) {
        $('<div />').html(html).dialog({
            title     : title,
            autoOpen  : true,
            show      : 'explode',
            hide      : 'explode',
            width     : width,
            height    : height,
            modal     : modal,
            draggable : true,
            resizable : false,
            zIndex    : 9999,
            buttons   : {
                'OK' : function() {
                    $(this).dialog('close')
                           .dialog('destroy')
                           .remove();
                }
            }
        });
    });

    xsound.factory('readFile', ['openDialog', function(openDialog) {
        /**
         * This service reads file.
         * @param {object} options This argument is associative array that is defined by XSound.js.
         */
        return function(options) {
            var file = null;

            try {
                file = X.file(options);
            } catch (error) {
                openDialog('Error', 500, 'auto', true, ('<p><b>' + error.message + '</b></p>'));
            }

            return file;
        };
    }]);

    xsound.factory('readFileByDragAndDrop', ['readFile', function(readFile) {
        /**
         * This service reads file by Drag & Drop.
         * @param {HTMLElement} dropArea This argument is the instance of HTMLElement for drop area.
         * @param {object} options This argument is associative array that is defined by XSound.js.
         */
        return function(dropArea, options) {
            dropArea.addEventListener('dragenter', function(event) {
                event.preventDefault();

                $(this).removeClass('drag-off').addClass('drag-on');
            });

            dropArea.addEventListener('dragover', function(event) {
                event.preventDefault();
            });

            dropArea.addEventListener('dragleave', function(event) {
                $(this).removeClass('drag-on').addClass('drag-off');
            });

            dropArea.addEventListener('drop', function(event) {
                $(this).removeClass('drag-on').addClass('drag-off');

                options.event = event;

                var file = readFile(options);

                if (file instanceof Blob) {
                    this.value = file.name;
                }
            });
        };
    }]);

    xsound.factory('readFileErrorCallback', ['openDialog', function(openDialog) {
        /**
         * This service is invoked when reading file failed.
         * @param {string} error This arguemnt is error message.
         */
        return function(error) {
            var message = '';

            switch (error) {
                case 'FILE_IS_NOT_BLOB' : message = 'The designated file is not Blob';            break;
                case 'NOT_FOUND_ERR'    : message = 'There is not file';                          break;
                case 'SECURITY_ERR'     : message = 'Security error occurred';                    break;
                case 'ABORT_ERR'        : message = 'Abort';                                      break;
                case 'NOT_READABLE_ERR' : message = 'The authority to read file does not exists'; break;
                case 'ENCODING_ERR'     : message = 'FIle size exceeds limit';                    break;
                case 'ERR'              : message = 'Error. Please try again.';                   break;
            }

            openDialog('Error', 500, 'auto', true, ('<p><b>' + message + '</b></p>'));
        };
    }]);

    /**
     * This service is invoked while file is read.
     * @param {$scope} scope This argument is scope object of each controller.
     * @param {$timeout} timeout This argument is in order to update view.
     * @param {Event} event This argument is event object that the instance of FileReader creates.
     */
    xsound.value('readFileProgressCallback', function(scope, timeout, event) {
        var rate     = 0;
        var progress = '';

        if (event.lengthComputable && (event.total > 0)) {
            rate     = Math.floor((event.loaded / event.total) * 100);
            progress = event.loaded + ' Bytes load (' + rate + ' %)';// +  event.total + ' Bytes';

            timeout(function() {
                scope.readFileProgress = progress;

                if (!scope.isModalProgressReadFile) {
                    scope.isModalProgressReadFile = true;
                }
            });
        }
    });

    xsound.factory('drawNodeCallback', ['$rootScope', function($rootScope) {
        /**
         * This service redraws Canvas or SVG according to audio position.
         * @param {$timeout} timeout This argument is in order to update view.
         * @param {number} currentTime This argument is current time of audio.
         */
        return function(timeout, currentTime) {
            if ((currentTime >= 0) && (currentTime <= X('audio').param('duration'))) {
                X('audio').param('currentTime', currentTime);
                X('audio').module('analyser').domain('time-overview-L').update(currentTime);
                X('audio').module('analyser').domain('time-overview-R').update(currentTime);

                timeout(function() {
                    $rootScope.currentTime = currentTime;
                });
            }
        };
    }]);

    /**
     * This service creates formatted time string.
     * @param {number} time This argument is time (seconds).
     */
    xsound.value('createTimeString', function(time) {
        var times = X.convertTime(time);

        if (times.milliseconds === 0) {
            return ('0' + times.minutes).slice(-2) + ' : ' + ('0' + times.seconds).slice(-2) + '.00';
        } else {
            return ('0' + times.minutes).slice(-2) + ' : ' + ('0' + times.seconds).slice(-2) + '.' + String(times.milliseconds).slice(2, 4);
        }
    });

    /**
     * This service creates string that represents datetime.
     * The created string is used to filename.
     */
    xsound.value('createDateTimeString', function() {
        var format = function(number) {
            return ('0' + number).slice(-2);
        };

        var date = new Date();

        var y = date.getFullYear();
        var m = format(date.getMonth() + 1);
        var d = format(date.getDate());
        var h = format(date.getHours());
        var i = format(date.getMinutes());
        var s = format(date.getSeconds());

        var datetime = y + m + d + h + i + s;

        return datetime;
    });

    /**
     * This service gets current parameters.
     */
    xsound.value('getCurrentPatches', function() {
        return {
            'mastervolume'      : X('oscillator').params().mastervolume,
            'glide'             : {
                'type' : X('oscillator').params().oscillator.glide.type,
                'time' : X('oscillator').params().oscillator.glide.time
            },
            'oscillator0'       : X('oscillator').params().oscillator.oscillator0,
            'oscillator1'       : C('oscillator').params().oscillator.oscillator0,
            'envelopegenerator' : {
                'attack'  : X('oscillator').params().envelopegenerator.attack,
                'decay'   : X('oscillator').params().envelopegenerator.decay,
                'sustain' : X('oscillator').params().envelopegenerator.sustain,
                'release' : X('oscillator').params().envelopegenerator.release
            },
            'compressor'        : {
                'state'     : X('oscillator').params().compressor.state,
                'threshold' : X('oscillator').params().compressor.threshold,
                'knee'      : X('oscillator').params().compressor.knee,
                'ratio'     : X('oscillator').params().compressor.ratio,
                'attack'    : X('oscillator').params().compressor.attack,
                'release'   : X('oscillator').params().compressor.release
            },
            'distortion'        : {
                'state'   : X('oscillator').params().distortion.state,
                'curve'   : X('oscillator').params().distortion.curve,
                'samples' : X('oscillator').params().distortion.samples,
                'drive'   : X('oscillator').params().distortion.drive,
                'color'   : X('oscillator').params().distortion.color,
                'tone'    : X('oscillator').params().distortion.tone
            },
            'wah'               : {
                'state'     : X('oscillator').params().wah.state,
                'cutoff'    : X('oscillator').params().wah.cutoff,
                'depth'     : X('oscillator').params().wah.depth,
                'rate'      : X('oscillator').params().wah.rate,
                'resonance' : X('oscillator').params().wah.resonance
            },
            'equalizer'         : {
                'state'    : X('oscillator').params().equalizer.state,
                'bass'     : X('oscillator').params().equalizer.bass,
                'middle'   : X('oscillator').params().equalizer.middle,
                'treble'   : X('oscillator').params().equalizer.treble,
                'presence' : X('oscillator').params().equalizer.presence
            },
            'filter'            : {
                'state'     : X('oscillator').params().filter.state,
                'type'      : X('oscillator').params().filter.type,
                'frequency' : X('oscillator').params().filter.frequency,
                'Q'         : X('oscillator').params().filter.Q,
                'gain'      : X('oscillator').params().filter.gain,
                'attack'    : X('oscillator').params().filter.attack,
                'decay'     : X('oscillator').params().filter.decay,
                'sustain'   : X('oscillator').params().filter.sustain,
                'release'   : X('oscillator').params().filter.release
            },
            'autopanner'        : {
                'state' : X('oscillator').params().autopanner.state,
                'depth' : X('oscillator').params().autopanner.depth,
                'rate'  : X('oscillator').params().autopanner.rate
            },
            'tremolo'           : {
                'state' : X('oscillator').params().tremolo.state,
                'depth' : X('oscillator').params().tremolo.depth,
                'rate'  : X('oscillator').params().tremolo.rate
            },
            'ringmodulator'     : {
                'state' : X('oscillator').params().ringmodulator.state,
                'depth' : X('oscillator').params().ringmodulator.depth,
                'rate'  : X('oscillator').params().ringmodulator.rate
            },
            'phaser'            : {
                'state'     : X('oscillator').params().phaser.state,
                'stage'     : X('oscillator').params().phaser.stage,
                'frequency' : X('oscillator').params().phaser.frequency,
                'depth'     : X('oscillator').params().phaser.depth,
                'rate'      : X('oscillator').params().phaser.rate,
                'mix'       : X('oscillator').params().phaser.mix,
                'feedback'  : X('oscillator').params().phaser.feedback
            },
            'chorus'            : {
                'state' : X('oscillator').params().chorus.state,
                'time'  : X('oscillator').params().chorus.time * 1000,
                'depth' : X('oscillator').params().chorus.depth,
                'rate'  : X('oscillator').params().chorus.rate,
                'mix'   : X('oscillator').params().chorus.mix,
                'tone'  : X('oscillator').params().chorus.tone
            },
            'flanger'           : {
                'state'    : X('oscillator').params().flanger.state,
                'time'     : X('oscillator').params().flanger.time * 1000,
                'depth'    : X('oscillator').params().flanger.depth,
                'rate'     : X('oscillator').params().flanger.rate,
                'mix'      : X('oscillator').params().flanger.mix,
                'tone'     : X('oscillator').params().flanger.tone,
                'feedback' : X('oscillator').params().flanger.feedback
            },
            'delay'             : {
                'state'    : X('oscillator').params().delay.state,
                'time'     : X('oscillator').params().delay.time * 1000,
                'dry'      : X('oscillator').params().delay.dry,
                'wet'      : X('oscillator').params().delay.wet,
                'tone'     : X('oscillator').params().delay.tone,
                'feedback' : X('oscillator').params().delay.feedback
            },
            'reverb'            : {
                'state'    : X('oscillator').params().reverb.state,
                'dry'      : X('oscillator').params().reverb.dry,
                'wet'      : X('oscillator').params().reverb.wet,
                'tone'     : X('oscillator').params().reverb.tone
            }
        };
    });

    /**
     * Initialization
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$window} $window This argument is service of DI (Dependency Injection).
     * @param {Array.<string>} sources This argument is service of DI (Dependency Injection).
     * @param {function} openDialog This argument is service of DI (Dependency Injection).
     */
    xsound.run(['$rootScope', '$window', 'sources' ,'openDialog', function($rootScope, $window, sources, openDialog) {
        if (!X.IS_XSOUND) {
            openDialog('Error', 600, 'auto', true, '<p><b>Your Browser does not support Web Audio API. Please use Chrome, Opera, Firefox (Mac / Windows) or Safari (Mac).</b></p>');
            return;
        }

        $rootScope.isActives = {
            visualization : false,
            mml           : false,
            patch         : false
        };

        // for Audio
        $rootScope.currentTime = 0;

        // Initialization for using XSound.js

        // Clone X object as global object
        $window.C = X.clone();  // for MML of OscillatorModule

        // Not used
        X.free([
            X('media')
        ]);

        C.free([
            C('oneshot'),
            C('noise'),
            C('audio'),
            C('media'),
            C('stream'),
            C('mixer'),
            C('midi')
        ]);

        // Resize buffer of ScriptProcessorNode
        X('mixer').resize(1024);
        X('oscillator').resize(1024);
        C('oscillator').resize(1024);
        X('oneshot').resize(1024);
        X('audio').resize(8192);
        X('stream').resize(512);

        X('oscillator').setup([true, true, true, true]);
        C('oscillator').setup([false, false, false, false]);

        var constraints = {
            audio : {
                echoCancellation : false
            },
            video : false
        };

        X('stream').setup(constraints, function(stream) {
        }, function(error) {
            openDialog('Confirmation', 400, 'auto', true, '<p><b>Cancel Microphone.</b></p>');
        });

        angular.forEach(sources, function(source) {
            X(source).module('distortion').param('color', 2000);
            X(source).module('distortion').param('tone',  4000);
            X(source).module('chorus').param('tone', 4000);
            X(source).module('flanger').param('tone', 4000);
            X(source).module('delay').param('tone', 4000);
            X(source).module('reverb').param('tone', 4000);
            X(source).module('filter').param('frequency', 8000);
        });

        C('oscillator').module('distortion').param('color', 2000);
        C('oscillator').module('distortion').param('tone',  4000);
        C('oscillator').module('chorus').param('tone', 4000);
        C('oscillator').module('flanger').param('tone', 4000);
        C('oscillator').module('delay').param('tone', 4000);
        C('oscillator').module('reverb').param('tone', 4000);
        C('oscillator').module('filter').param('frequency', 8000);

        for (var i = 0, len = X('oscillator').length(); i < len; i++) {
            X('oscillator', i).param('type', 'sawtooth');
            C('oscillator', i).param('type', 'sawtooth');
        }

        $('#twitter').socialbutton('twitter', {lang : 'en_US'});
        $('#facebook').socialbutton('facebook_like', {button : 'button_count', locale : 'en_US'});
        $('#hatena').socialbutton('hatena');
        $('#google').socialbutton('google_plusone', {size : 'medium'}).width(72);
    }]);

    /**
     * Directive for wrapping jQuery UI Slider.
     * @param {function} updateParam This argument is service of DI (Dependency Injection).
     */
    xsound.directive('uiSlider', ['updateParam', function(updateParam) {
        return {
            restrict : 'E',
            template : '<div></div>',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var value   = iAttrs.value;
                var min     = iAttrs.min;
                var max     = iAttrs.max;
                var step    = iAttrs.step;
                var range   = iAttrs.range   || 'min';
                var animate = iAttrs.animate || 'slow';
                var source  = iAttrs.source;
                var module  = iAttrs.module;
                var param   = iAttrs.param;

                var classSuffix = module ? (module + '-' + param) : param;

                var update = function(value) {
                    updateParam(source, module, param, value);

                    $('.spinner-' + classSuffix).each(function(index, element) {
                        var uiSpinner = $(element).parents('ui-spinner');

                        if ((uiSpinner.attr('source') === source) && (uiSpinner.attr('module') === module)) {
                            if ((module !== 'glide') && (param === 'time')) {
                                value *= Math.pow(10, 3);  // sec -> msec
                            }

                            $(element).spinner('value', value);
                        }
                    });
                };

                $(iElement).children('div').addClass('slider-' + classSuffix).slider({
                    value   : parseFloat(value),
                    min     : parseFloat(min),
                    max     : parseFloat(max),
                    step    : parseFloat(step),
                    range   : range,
                    animate : animate,
                    change  : function(event, ui) {
                        // Triggered when the value is changed

                        var value = parseFloat(ui.value);

                        if ((module !== 'glide') && (param === 'time')) {
                            value /= Math.pow(10, 3);  // msec -> sec
                        }

                        update(value);
                    },
                    slide   : function(event, ui) {
                        var value = parseFloat(ui.value);

                        if ((module !== 'glide') && (param === 'time')) {
                            value /= Math.pow(10, 3);  //msec -> sec
                        }

                        update(value);
                    }
                });
            }
        };
    }]);

    /*
     * Directive for wrapping jQuery UI Spinner.
     * @param {function} updateParam This argument is service of DI (Dependency Injection).
     */
    xsound.directive('uiSpinner', ['updateParam', function(updateParam) {
        return {
            restrict : 'E',
            template : '<input />',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var value   = iAttrs.value;
                var min     = iAttrs.min;
                var max     = iAttrs.max;
                var step    = iAttrs.step;
                var source  = iAttrs.source;
                var module  = iAttrs.module;
                var param   = iAttrs.param;

                var classSuffix = module ? (module + '-' + param) : param;

                var update = function(value) {
                    updateParam(source, module, param, value);

                    $('.slider-' + classSuffix).each(function(index, element) {
                        var uiSlider = $(element).parent('ui-slider');

                        if ((uiSlider.attr('source') === source) && (uiSlider.attr('module') === module)) {
                            if ((module !== 'glide') && (param === 'time')) {
                                value *= Math.pow(10, 3);  // sec -> msec
                            }

                            $(element).slider('value', value);
                        }
                    });
                };

                $(iElement).children('input').addClass('spinner-' + classSuffix).spinner({
                    min  : parseFloat(min),
                    max  : parseFloat(max),
                    step : parseFloat(step),
                    spin : function(event, ui) {
                        var value = parseFloat(ui.value);

                        if ((module !== 'glide') && (param === 'time')) {
                            value /= Math.pow(10, 3);  // msec -> sec
                        }

                        update(value);
                    }
                }).spinner('value', parseFloat(value));
            }
        };
    }]);

    /**
     * Directive for current time of audio (Slider).
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is in order to update view.
     * @param {function} createTimeString This argument is service of DI (Dependency Injection).
     */
    xsound.directive('uiSliderTime', ['$rootScope', '$timeout', 'createTimeString', function($rootScope, $timeout, createTimeString) {
        return {
            restrict : 'E',
            template : '<div></div>',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var value   = iAttrs.value;
                var max     = iAttrs.max;
                var step    = iAttrs.step;
                var range   = iAttrs.range   || 'min';
                var animate = iAttrs.animate || 'slow';

                $(iElement).children('div').attr('id', 'slider-audio-current-time').slider({
                    value   : parseFloat(value),
                    min     : 0,
                    max     : parseFloat(max),
                    step    : parseFloat(step),
                    range   : range,
                    animate : animate,
                    change  : function(event, ui) {
                        //X('audio').param('currentTime', parseFloat(ui.value));
                    },
                    slide   : function(event, ui) {
                        X('audio').param('currentTime', parseFloat(ui.value));
                        X('audio').module('analyser').domain('time-overview-L').update(X('audio').param('currentTime'));
                        X('audio').module('analyser').domain('time-overview-R').update(X('audio').param('currentTime'));

                        $timeout(function() {
                            $rootScope.currentTime = X('audio').param('currentTime');
                        });
                    }
                });

                scope.$watch(function() {
                    return scope.duration;
                }, function(newVal) {
                    $('#slider-audio-current-time').slider('option', 'max', newVal);
                    $('#spinner-audio-current-time').spinner('option', 'max', newVal);
                });

                var setCurrentTime = function(currentTime) {
                    $('#slider-audio-current-time').slider('value', currentTime);
                    $('#spinner-audio-current-time').spinner('value', currentTime);

                    scope.currentTimeText = createTimeString(currentTime);
                };

                scope.$watch(function() {
                    return $rootScope.currentTime;
                }, function(newVal) {
                    setCurrentTime(newVal);
                });
            }
        };
    }]);

   /**
     * Directive for current time of audio (Spinner).
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is in order to update view.
     */
    xsound.directive('uiSpinnerTime', ['$rootScope', '$timeout', function($rootScope, $timeout) {
        return {
            restrict : 'E',
            template : '<input />',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var value   = iAttrs.value;
                var max     = iAttrs.max;
                var step    = iAttrs.step;

                $(iElement).children('input').attr('id', 'spinner-audio-current-time').spinner({
                    min  : 0,
                    max  : parseFloat(max),
                    step : parseFloat(step),
                    spin : function(event, ui) {
                        X('audio').param('currentTime', parseFloat(ui.value));
                        X('audio').module('analyser').domain('time-overview-L').update(X('audio').param('currentTime'));
                        X('audio').module('analyser').domain('time-overview-R').update(X('audio').param('currentTime'));

                        $timeout(function() {
                            $rootScope.currentTime = X('audio').param('currentTime');
                        });
                    }
                }).spinner('value', parseFloat(value));
            }
        };
    }]);

    /*
     * Directive for toggle effector state.
     * @param {Array.<string>} sources This argument is service of DI (Dependency Injection).
     */
    xsound.directive('uiToggleEffector', ['sources', function(sources) {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var effector = iAttrs.effector;
                var state    = parseInt(iAttrs.state);

                // Set initial state
                if ((state === 0) || (state === 1)) {
                    angular.forEach(sources, function(source) {
                        X(source).module(effector).state(Boolean(state));
                        C('oscillator').module(effector).state(Boolean(state));

                        if (X(source).module(effector).state()) {
                            $(iElement).addClass('check-on');
                        } else {
                            $(iElement).removeClass('check-on');
                        }
                    });
                }

                $(iElement).on('click', function() {
                    angular.forEach(sources, function(source) {
                        if (X(source).module(effector).state()) {
                            X(source).module(effector).state(false);
                            C('oscillator').module(effector).state(false);

                            $(iElement).removeClass('check-on');
                        } else {
                            X(source).module(effector).state(true);
                            C('oscillator').module(effector).state(true);

                            $(iElement).addClass('check-on');
                        }
                    });
                });
            }
        };
    }]);

    /**
     * Directive for progress.
     * @param {$window} $window This argument is service of DI (Dependency Injection).
     */
    xsound.directive('uiModalProgress', ['$window', function($window) {
        return {
            restrict : 'E',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                $(iElement).children('section').css('margin-top', ((($window.innerHeight / 2) - 80) + 'px'));
            }
        };
    }]);

    /**
     * Directive for wrapping jQuery UI Tooltip.
     */
    xsound.directive('uiTooltip', function() {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                // jQuery UI tooltip
                $(iElement).tooltip({
                    tooltipClass : 'ui-tooltip-custom'
                });
            }
        };
    });

    /**
     * Directive for wrapping jQuery UI Sortable.
     */
    xsound.directive('uiSortable', function() {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                $(iElement).sortable({
                    axis        : 'x',
                    cancel      : 'fieldset, :input, button, label, a, #piano',
                    // containment : 'parent',
                    cursor      : 'move',
                    opacity     : 0.6
                    // revert      : true
                });
            }
        };
    });

    /**
     * Directive for wrapping select2.js.
     * @param {$timeout} $timeout This argument is to update view.
     * @param {Array.<string>} sources This argument is service of DI (Dependency Injection).
     * @param {function} openDialog This argument is service of DI (Dependency Injection).
     */
    xsound.directive('uiSelect', ['$timeout', 'sources', 'openDialog', function($timeout, sources, openDialog) {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                // Initialization
                $(iElement).select2();

                switch ($(iElement).attr('id')) {
                    case 'select-sound-source' :
                        $(iElement).on('change', function() {
                            var value = this.value;

                            switch (value) {
                                case 'oscillator' :
                                    X('stream').stop();

                                    $timeout(function() {
                                        // This is scope of XSoundController
                                        scope.currentSoundSource  = value;
                                        scope.selectedSoundSource = value;
                                    });

                                    break;
                                case 'piano' :
                                case 'guitar':
                                    if (scope.isEnableOneshot) {
                                        $timeout(function() {
                                            // This is scope of XSoundController
                                            scope.currentSoundSource = value;
                                            scope.selectedSoundSource = value;
                                        });
                                    }

                                    X('stream').stop();

                                    break;
                                case 'whitenoise'   :
                                case 'pinknoise'    :
                                case 'browniannoise':
                                    X('stream').stop();

                                    $timeout(function() {
                                        // This is scope of XSoundController
                                        scope.currentSoundSource  = value;
                                        scope.selectedSoundSource = value;
                                    });

                                    break;
                                case 'stream' :
                                    try {
                                        X('stream').start();
                                        X('stream').module('session').start();

                                        $timeout(function() {
                                            // This is scope of XSoundController
                                            scope.selectedSoundSource = value;
                                        });
                                    } catch (error) {
                                        openDialog('Error', 400, 'auto', true, ('<p><b>' + error.message + '</b></p>'));
                                    }

                                    break;
                                case 'midi' :
                                    X('stream').stop();

                                    var successCallback = function(midiAccess, inputs, outputs) {
                                        var MIN_NOTE_NUMBER = 21;
                                        var MAX_NOTE_NUMBER = 108;
                                        var MAX_VELOCITY    = 127;

                                        var indexes = [];
                                        var volumes = [];

                                        var noteOn = function(noteNumber, velocity) {
                                            if ((noteNumber < MIN_NOTE_NUMBER) || (noteNumber > MAX_NOTE_NUMBER)) {
                                                return;
                                            }

                                            if ((velocity < 0) || (velocity > MAX_VELOCITY)) {
                                                return;
                                            }

                                            var targetIndex = noteNumber - MIN_NOTE_NUMBER;
                                            var volume      = velocity / MAX_VELOCITY;

                                            if (scope.currentSoundSource === 'oscillator') {
                                                indexes.push(targetIndex);

                                                volumes[0] = X('oscillator', 0).param('volume');
                                                volumes[1] = C('oscillator', 0).param('volume');

                                                for (var i = 0, len = X('oscillator').length(); i < len; i++) {
                                                    if (i !== 0) {
                                                        X('oscillator', i).state(true);
                                                        C('oscillator', i).state(true);
                                                    }

                                                    X('oscillator', i).param('volume', volume);
                                                    C('oscillator', i).param('volume', volume);
                                                }

                                                X('oscillator').ready(0, 0).start(X.toFrequencies(indexes));
                                                C('oscillator').ready(0, 0).start(X.toFrequencies(indexes));

                                                X('mixer').mix([X('oscillator'), C('oscillator')]);

                                                X('mixer').module('recorder').start();
                                                X('mixer').module('session').start();
                                            } else {
                                                X('oneshot').reset(targetIndex, 'volume', volume).ready(0, 0).start(targetIndex);

                                                X('oneshot').module('recorder').start();
                                                X('oneshot').module('session').start();
                                            }

                                            $timeout(function() {
                                                scope.isSoundStops[targetIndex] = false;
                                            });
                                        };

                                        var noteOff = function(noteNumber, velocity) {
                                            if ((noteNumber < MIN_NOTE_NUMBER) || (noteNumber > MAX_NOTE_NUMBER)) {
                                                return;
                                            }

                                            if ((velocity < 0) || (velocity > MAX_VELOCITY)) {
                                                return;
                                            }

                                            var targetIndex = noteNumber - MIN_NOTE_NUMBER;

                                            if (scope.currentSoundSource === 'oscillator') {
                                                var index = indexes.indexOf(targetIndex);

                                                if (index !== -1) {
                                                    indexes.splice(index, 1);
                                                }

                                                X('oscillator').stop();
                                                C('oscillator').stop();

                                                for (var i = 0, len = X('oscillator').length(); i < len; i++) {
                                                    if (i !== 0) {
                                                        X('oscillator', i).state(false);
                                                        C('oscillator', i).state(false);
                                                    }

                                                    X('oscillator', i).param('volume', volumes[0]);
                                                    C('oscillator', i).param('volume', volumes[1]);
                                                }
                                            } else {
                                                X('oneshot').stop(targetIndex).reset(targetIndex, 'volume', 1);
                                            }

                                            $timeout(function() {
                                                scope.isSoundStops[targetIndex] = true;
                                            });
                                        };

                                        if (inputs.length > 0) {
                                            inputs[0].onmidimessage = function(event) {
                                                switch (event.data[0] & 0xf0) {
                                                    case 0x90 :
                                                        noteOn(event.data[1], event.data[2]);
                                                        break;
                                                    case 0x80 :
                                                        noteOff(event.data[1], event.data[2]);
                                                        break;
                                                    default :
                                                        break;
                                                }
                                            };
                                        }
                                    };

                                    var errorCallback = function(error) {
                                        openDialog('Error', 400, 'auto', true, '<p><b>Cannot use Web MIDI API.</b></p>');
                                    };

                                    try {
                                        X('midi').setup(true, successCallback, errorCallback);
                                    } catch (error) {
                                        openDialog('Error', 400, 'auto', true, ('<p><b>' + error.message + '</b></p>'));
                                    }

                                    break;
                                default :
                                    break;
                            }
                        });

                        break;
                    case 'select-rec-track' :
                        $(iElement).on('change', function() {
                            if (scope.isActive) {
                                // In the case of recording
                                return;
                            }

                            var value = parseInt(this.value);

                            $timeout(function() {
                                // This is scope of RecordController
                                scope.activeTrack = value;
                            });

                            angular.forEach(sources, function(source) {
                                if (source !== 'oscillator') {
                                    X(source).module('recorder').ready(value);

                                    if (source === 'stream') {
                                        X('stream').module('recorder').start();
                                    }
                                }
                            });
                        });

                        break;
                    case 'select-visualization-api' :
                        $(iElement).on('change', function() {
                            // This is scope of VisualizationController
                            scope.selectAPI(this.value);
                        });

                        break;
                    case 'select-distortion-type' :
                        $(iElement).on('change', function() {
                            var value = this.value;

                            angular.forEach(sources, function(source) {
                                X(source).module('distortion').param('curve', value);
                            });
                        });

                        break;
                    case 'select-distortion-sample' :
                        $(iElement).on('change', function() {
                            var value = this.value;

                            angular.forEach(sources, function(source) {
                                X(source).module('distortion').param('samples', value);
                            });
                        });

                        break;
                    case 'select-filter-type' :
                        $(iElement).on('change', function() {
                            var value = this.value;

                            angular.forEach(sources, function(source) {
                                X(source).module('filter').param('type', value);
                            });
                        });

                        break;
                    case 'select-phaser-stage' :
                        $(iElement).on('change', function() {
                            var value = this.value;

                            angular.forEach(sources, function(source) {
                                X(source).module('phaser').param('stage', value);
                            });
                        });

                        break;
                    case 'select-reverb-type' :
                        $(iElement).on('change', function() {
                            var value = parseInt(this.value) - 1;

                            if (value === -1) {
                                value = null;
                            }

                            angular.forEach(sources, function(source) {
                                X(source).module('reverb').param('type', value);
                            });
                        });

                        break;
                    default :
                        break;
                }
            }
        };
    }]);

    /**
     * Directive for slide block.
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     */
    xsound.directive('slideBlock', ['$rootScope', function($rootScope) {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var DURATION = 1000;
                var EASING   = 'easeOutQuint';

                var model = iAttrs.model;

                $(iElement).hide();

                scope.$watch(function() {
                    return $rootScope.isActives;
                }, function(newVal) {
                    if (newVal[model]) {
                        $(iElement).slideDown(DURATION, EASING);
                    } else {
                        $(iElement).slideUp(DURATION, EASING);
                    }
                }, true);
            }
        };
    }]);

    /**
     * Directive for upload audio file.
     * @param {$timeout} $timeout This argument is to update view.
     * @param {function} readFile This argument is service of DI (Dependency Injection).
     * @param {function} readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} readFileProgressCallback This argument is service of DI (Dependency Injection).
     * @param {function} readFileErrorCallback This argument is service of DI (Dependency Injection).
     */
    xsound.directive('audioUploader', ['$timeout', 'readFile', 'readFileByDragAndDrop', 'readFileProgressCallback', 'readFileErrorCallback', function($timeout, readFile, readFileByDragAndDrop, readFileProgressCallback, readFileErrorCallback) {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var uploader = iElement[0];

                var options = {
                    event   : null,
                    type    : 'ArrayBuffer',
                    success : function(event, arrayBuffer) {
                        X('audio').ready.call(X('audio'), arrayBuffer);

                        $timeout(function() {
                            scope.$parent.isModalProgressReadFile = false;
                        });
                    },
                    error   : function(event, error) {
                        readFileErrorCallback(error);
                    },
                    progress : function(event) {
                        readFileProgressCallback(scope.$parent, $timeout, event);
                    }
                };

                // <input type="file">
                uploader.addEventListener('change', function(event) {
                    options.event = event;

                    var file = readFile(options);

                    this.value = '';  //Clear

                    if (file instanceof Blob) {
                        $(iElement).next('[type="text"]').val(file.name);
                    }
                }, false);

                // Drag & Drop
                var dropArea = $(iElement).next('[type="text"]')[0];

                readFileByDragAndDrop(dropArea, options);
            }
        };
    }]);

    /**
     * Directive for upload RIR file.
     * @param {$timeout} $timeout This argument is to update view.
     * @param {Array.<string>} sources This argument is service of DI (Dependency Injection).
     * @param {function} readFile This argument is service of DI (Dependency Injection).
     * @param {function} readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} readFileProgressCallback This argument is service of DI (Dependency Injection).
     * @param {function} readFileErrorCallback This argument is service of DI (Dependency Injection).
     */
    xsound.directive('rirUploader', ['$timeout', 'sources', 'readFile', 'readFileByDragAndDrop', 'readFileProgressCallback', 'readFileErrorCallback', function($timeout, sources, readFile, readFileByDragAndDrop, readFileProgressCallback, readFileErrorCallback) {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var uploader = iElement[0];

                var options = {
                    event   : null,
                    type    : 'ArrayBuffer',
                    success : function(event, arrayBuffer) {
                        angular.forEach(sources, function(source) {
                            X(source).module('reverb').start.call(X(source).module('reverb'), arrayBuffer);
                        });

                        $timeout(function() {
                            scope.isModalProgressReadFile = false;
                        });
                    },
                    error   : function(event, error) {
                        readFileErrorCallback(error);
                    },
                    progress : function(event) {
                        readFileProgressCallback(scope, $timeout, event);
                    }
                };

                // <input type="file">
                uploader.addEventListener('change', function(event) {
                    options.event = event;

                    var file = readFile(options);

                    this.value = '';  //Clear

                    if (file instanceof Blob) {
                        $(iElement).next('[type="text"]').val(file.name);
                    }
                }, false);

                // Drag & Drop
                var dropArea = $(iElement).next('[type="text"]')[0];

                readFileByDragAndDrop(dropArea, options);
            }
        };
    }]);

    /**
     * Directive for upload MML text file.
     * @param {$timeout} $timeout This argument is to update view.
     * @param {function} readFile This argument is service of DI (Dependency Injection).
     * @param {function} readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} readFileProgressCallback This argument is service of DI (Dependency Injection).
     * @param {function} readFileErrorCallback This argument is service of DI (Dependency Injection).
     */
    xsound.directive('mmlUploader', ['$timeout', 'readFile', 'readFileByDragAndDrop', 'readFileProgressCallback', 'readFileErrorCallback', function($timeout, readFile, readFileByDragAndDrop, readFileProgressCallback, readFileErrorCallback) {
        return {
            restrict : 'A',
            link     : function(scope, iElement, iAttrs, controller, iTransclude) {
                var uploader = iElement[0];

                var options = {
                    event   : null,
                    type    : 'Text',
                    success : function(event, mml) {
                        var writeMML = function() {
                            $timeout(function() {
                                scope.mml    = mml;
                                scope.paused = true;

                                scope.readyMML();
                            });
                        };

                        if (scope.mml === '') {
                            writeMML();
                        } else {
                            // Overwrite ?
                            $('<div />').html('<p><b>MML already exists. Overwrite ?</b></p>').dialog({
                                title     : 'Confirmation',
                                autoOpen  : true,
                                show      : 'explode',
                                hide      : 'explode',
                                modal     : true,
                                width     : 500,
                                height    : 'auto',
                                draggable : true,
                                resizable : false,
                                zIndex    : 9999,
                                buttons   : {
                                    'OK'    : function() {
                                        // Overwrite
                                        writeMML();

                                        $(this).dialog('close')
                                               .dialog('destroy')
                                               .remove();
                                    },
                                    'CANCEL' : function() {
                                        $(this).dialog('close')
                                               .dialog('destroy')
                                               .remove();
                                    }
                                }
                            });
                        }

                        $timeout(function() {
                            scope.$parent.isModalProgressReadFile = false;
                        });
                    },
                    error   : function(event, error) {
                        readFileErrorCallback(error);
                    },
                    progress : function(event) {
                        readFileProgressCallback(scope.$parent, $timeout, event);
                    }
                };

                // <input type="file">
                uploader.addEventListener('change', function(event) {
                    options.event = event;

                    var file = readFile(options);

                    this.value = '';  //Clear

                    if (file instanceof Blob) {
                        $(iElement).next('[type="text"]').val(file.name);
                    }
                }, false);

                // Drag & Drop
                var dropArea = $(iElement).next('[type="text"]')[0];

                readFileByDragAndDrop(dropArea, options);
            }
        };
    }]);

    /**
     * This controller is super class in X Sound Application
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$window} $window This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is to update view.
     * @param {string} BASE_URL This argument is service of DI (Dependency Injection).
     * @param {Array.<string>} sources readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {Arrya.<number>} oscillatorNumbers This is the array of number in order to identify oscillator.
     * @param {function} openDialog This argument is service of DI (Dependency Injection).
     * @param {function} getCurrentPatches This argument is service of DI (Dependency Injection).
     */
    xsound.controller('XSoundController', ['$rootScope', '$scope', '$window', '$timeout', 'BASE_URL', 'sources', 'oscillatorNumbers', 'openDialog', 'getCurrentPatches', function($rootScope, $scope, $window, $timeout, BASE_URL, sources, oscillatorNumbers, openDialog, getCurrentPatches) {
        var NUMBER_OF_ONESHOTS = 88;
        var AJAX_TIMEOUT       = 60000;

        var _isDown = false;

        var _oneshots = [
            (BASE_URL + 'one-shot/piano-2/C.wav'),
            (BASE_URL + 'one-shot/piano-2/D.wav'),
            (BASE_URL + 'one-shot/piano-2/E.wav'),
            (BASE_URL + 'one-shot/piano-2/F.wav'),
            (BASE_URL + 'one-shot/piano-2/G.wav'),
            (BASE_URL + 'one-shot/piano-2/A.wav'),
            (BASE_URL + 'one-shot/piano-2/B.wav'),
            (BASE_URL + 'one-shot/guitar/C.mp3')
        ];

        var _getBufferIndex = function(pianoIndex) {
            switch (parseInt((pianoIndex + 9) % 12)) {
                case  0 :
                case  1 :
                    return 0;
                case  2 :
                case  3 :
                    return 1;
                case  4 :
                    return 2;
                case  5 :
                case  6 :
                    return 3;
                case  7 :
                case  8 :
                    return 4;
                case  9 :
                case 10 :
                    return 5;
                case 11 :
                    return 6;
                default :
                    break;
            }
        };

        var _calculatePianoRate = function(pianoIndex) {
            var sharps  = [1, 4, 6, 9, 11, 13, 16, 18, 21, 23, 25, 28, 30, 33, 35, 37, 40, 42, 45, 47, 49, 52, 54, 57, 59, 61, 64, 66, 69, 71, 73, 76, 78, 81, 83, 85];
            var isSharp = (sharps.indexOf(pianoIndex) !== -1) ? true : false;

            var rate = 0;

            if ((pianoIndex >= 0) && (pianoIndex <= 2)) {
                rate = 0.0625;
            } else if ((pianoIndex >= 3) && (pianoIndex <= 14)) {
                rate = 0.125;
            } else if ((pianoIndex >= 15) && (pianoIndex <= 26)) {
                rate = 0.25;
            } else if ((pianoIndex >= 27) && (pianoIndex <= 38)) {
                rate = 0.5;
            } else if ((pianoIndex >= 39) && (pianoIndex <= 50)) {
                rate = 1;
            } else if ((pianoIndex >= 51) && (pianoIndex <= 62)) {
                rate = 2;
            } else if ((pianoIndex >= 63) && (pianoIndex <= 74)) {
                rate = 4;
            } else if ((pianoIndex >= 75) && (pianoIndex <= 86)) {
                rate = 8;
            } else if ((pianoIndex >= 87) && (pianoIndex <= 98)) {
                rate = 16;
            }

            if (isSharp) {
                rate *= Math.pow(2, (1 / 12));
            }

            return rate;
        };

        var _calculateGuitarRate = function(guitarIndex) {
            var rate = 0;

            switch (guitarIndex - NUMBER_OF_ONESHOTS) {
                case 0:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -39);
                  break;
                case 1:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -38);
                  break;
                case 2:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -37);
                  break;
                case 3:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -36);
                  break;
                case 4:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -35);
                  break;
                case 5:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -34);
                  break;
                case 6:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -33);
                  break;
                case 7:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -32);
                  break;
                case 8:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -31);
                  break;
                case 9:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -30)
                  break;
                case 10:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -29);
                  break;
                case 11:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -28);
                  break;
                case 12:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -27);
                  break;
                case 13:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -26);
                  break;
                case 14:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -25);
                  break;
                case 15:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -24);
                  break;
                case 16:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -23);
                  break;
                case 17:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -22);
                  break;
                case 18:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -21);
                  break;
                case 19:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -20);
                  break;
                case 20:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -19)
                  break;
                case 21:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -18);
                  break;
                case 22:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -17);
                  break;
                case 23:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -16);
                  break;
                case 24:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -15);
                  break;
                case 25:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -14);
                  break;
                case 26:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -13);
                  break;
                case 27:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -12);
                  break;
                case 28:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -11);
                  break;
                case 29:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -10);
                  break;
                case 30:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -9);
                  break;
                case 31:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -8);
                  break;
                case 32:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -7);
                  break;
                case 33:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -6)
                  break;
                case 34:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -5);
                  break;
                case 35:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -4);
                  break;
                case 36:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -3);
                  break;
                case 37:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -2);
                  break;
                case 38:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), -1);
                  break;
                case 39:
                  rate = 1;
                  break;
                case 40:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 1);
                  break;
                case 41:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 2);
                  break;
                case 42:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 3);
                  break;
                case 43:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 4);
                  break;
                case 44:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 5);
                  break;
                case 45:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 6);
                  break;
                case 46:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 7);
                  break;
                case 47:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 8);
                  break;
                case 48:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 9);
                  break;
                case 49:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 10);
                  break;
                case 50:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 11);
                  break;
                case 51:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 12);
                  break;
                case 52:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 13);
                  break;
                case 53:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 14);
                  break;
                case 54:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 15);
                  break;
                case 55:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 16);
                  break;
                case 56:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 17);
                  break;
                case 57:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 18);
                  break;
                case 58:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 19);
                  break;
                case 59:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 20);
                  break;
                case 60:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 21);
                  break;
                case 61:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 22);
                  break;
                case 62:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 23);
                  break;
                case 63:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 24);
                  break;
                case 64:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 25);
                  break;
                case 65:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 26);
                  break;
                case 66:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 27);
                  break;
                case 67:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 28);
                  break;
                case 68:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 29);
                  break;
                case 69:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 30);
                  break;
                case 70:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 31);
                  break;
                case 71:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 33);
                  break;
                case 77:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 34);
                  break;
                case 78:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 35);
                  break;
                case 79:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 36);
                  break;
                case 80:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 37);
                  break;
                case 81:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 38);
                  break;
                case 82:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 39);
                  break;
                case 83:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 40);
                  break;
                case 84:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 41);
                  break;
                case 85:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 42);
                  break;
                case 86:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 43);
                  break;
                case 87:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 44);
                  break;
                case 88:
                  rate = 1 * Math.pow(Math.pow(2, (1 / 12)), 45);
                  break;
            }

            return rate;
        };

        var _createOneshotSettings = function() {
            var settings = new Array(NUMBER_OF_ONESHOTS);

            for (var i = 0; i < NUMBER_OF_ONESHOTS; i++) {
                var setting = {
                    buffer : 0,
                    rate   : 1,
                    loop   : false,
                    start  : 0,
                    end    : 0,
                    volume : 1
                };

                setting.buffer = _getBufferIndex(i);
                setting.rate   = _calculatePianoRate(i);

                settings[i] = setting;
            }

            for (var i = NUMBER_OF_ONESHOTS; i < (NUMBER_OF_ONESHOTS + NUMBER_OF_ONESHOTS); i++) {
                var setting = {
                    buffer : 7,
                    rate   : 1,
                    loop   : false,
                    start  : 0,
                    end    : 0,
                    volume : 1
                };

                setting.rate = _calculateGuitarRate(i);

                settings[i] = setting;
            }

            return settings;
        };

        var _loadUI = function() {
            $timeout(function() {
                $scope.isReady = true;
            });
        };

        var _loadRIRs = function() {
            // Load impulse responses
            var reverbs = [];

            angular.forEach($scope.rirs, function(rir, index) {
                X.ajax(rir.url, AJAX_TIMEOUT, function(event, arrayBuffer) {
                    X.decode(X.get(), arrayBuffer, function(audioBuffer) {
                        reverbs.push(audioBuffer);

                        $scope.$apply(function() {
                            $scope.progress = Math.floor((reverbs.length / $scope.rirs.length) * 100);
                            $scope.progressStyle.width = $scope.progress + '%';
                        });

                        if (reverbs.length === $scope.rirs.length) {
                            angular.forEach(sources, function(source) {
                                X(source).module('reverb').preset(reverbs);
                            });

                            C('oscillator').module('reverb').preset(reverbs);

                            _loadUI();
                        }
                    }, function(error) {
                        // Decode error
                        _loadUI();
                    });
                }, function(event, textStatus) {
                    openDialog('Error', 400, 'auto', true, '<p><b>The loading of RIRs failed.</b></p>');
                });
            });
        };

        // Load one-shot audio files
        try {
            X('oneshot').setup({
                resources : _oneshots,
                settings  : _createOneshotSettings(),
                timeout   : AJAX_TIMEOUT,
                success   : function(event, buffers) {
                    // Can select one-shot audio (Piano)
                    $scope.isEnableOneshot = true;

                    // Next, Load RIRs
                    if ($scope.rirs.length === 0) {
                        _loadUI();
                    } else {
                        _loadRIRs();
                    }
                },
                error : function(object, textStatus) {
                    openDialog('Error', 400, 'auto', true, '<p><b>The loading of audio files failed.</b></p>');
                },
                progress : function(event) {
                }
            });
        } catch (error) {
            openDialog('Error', 400, 'auto', true, ('<p><b>' + error.message + '</b></p>'));
        }

        // This model is refered by other controllers.
        $scope.currentSoundSource  = 'oscillator';
        $scope.selectedSoundSource = 'oscillator';

        $scope.isReady       = false;
        $scope.progress      = 0;
        $scope.progressStyle = {'width' : ($scope.progress + '%')};

        $scope.isSafari = (function() {
            var userAgent = navigator.userAgent.toLowerCase();

            if ((userAgent.indexOf('chrome') === -1) && (userAgent.indexOf('safari') !== -1)) {
                return true;
            } else {
                return false;
            }
        })();

        $scope.isEnableOneshot = false;
        $scope.isEndOpeing     = false;
        $scope.isStart         = false;

        $scope.progressWrapperStyle = {'padding' : (((Math.floor($window.innerHeight / 2) - 60) + 'px') + ' 0px')};
        $scope.headerStyle          = {'top' : (parseInt(($window.innerHeight) / 4) + 'px')};

        // Models for modal window directive
        $scope.isModalProgressDecodeAudio   = false;
        $scope.isModalProgressReadFile      = false;
        $scope.isModalProgressSessionWait   = false;

        // Models for Oscillator
        $scope.oscillators                      = {};
        $scope.oscillators.oscillator0          = {};
        $scope.oscillators.oscillator0.isActive = true;
        $scope.oscillators.oscillator0.type     = 'sawtooth';
        $scope.oscillators.oscillator1          = {};
        $scope.oscillators.oscillator1.isActive = false;
        $scope.oscillators.oscillator1.type     = 'sawtooth';

        $scope.readFileProgress = '';

        // for Revreb
        $scope.rirs = [
            {url : (BASE_URL + 'impulse-responses/s1_r1_c.wav'), value :  1, label : '1 - 1', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r2_c.wav'), value :  2, label : '1 - 2', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r3_c.wav'), value :  3, label : '1 - 3', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r4_c.wav'), value :  4, label : '1 - 4', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r1_c.wav'), value :  5, label : '2 - 1', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r2_c.wav'), value :  6, label : '2 - 2', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r3_c.wav'), value :  7, label : '2 - 3', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r4_c.wav'), value :  8, label : '2 - 4', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r1_c.wav'), value :  9, label : '3 - 1', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r2_c.wav'), value : 10, label : '3 - 2', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r3_c.wav'), value : 11, label : '3 - 3', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r4_c.wav'), value : 12, label : '3 - 4', group : 'Sideways pointed cardioid measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r1_o.wav'), value : 13, label : '1 - 1', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r2_o.wav'), value : 14, label : '1 - 2', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r3_o.wav'), value : 15, label : '1 - 3', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r4_o.wav'), value : 16, label : '1 - 4', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r1_o.wav'), value : 17, label : '2 - 1', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r2_o.wav'), value : 18, label : '2 - 2', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r3_o.wav'), value : 19, label : '2 - 3', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r4_o.wav'), value : 20, label : '2 - 4', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r1_o.wav'), value : 21, label : '3 - 1', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r2_o.wav'), value : 22, label : '3 - 2', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r3_o.wav'), value : 23, label : '3 - 3', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r4_o.wav'), value : 24, label : '3 - 4', group : 'Omnidirectional measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_p1_o.wav'), value : 25, label : '1 - 1', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s1_p2_o.wav'), value : 26, label : '1 - 2', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s1_p3_o.wav'), value : 27, label : '1 - 3', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s2_p1_o.wav'), value : 28, label : '2 - 1', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s2_p2_o.wav'), value : 29, label : '2 - 2', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s2_p3_o.wav'), value : 30, label : '2 - 3', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s3_p1_o.wav'), value : 31, label : '3 - 1', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s3_p2_o.wav'), value : 32, label : '3 - 2', group : 'Omnidirectional measurements on the stage'},
            {url : (BASE_URL + 'impulse-responses/s3_p3_o.wav'), value : 33, label : '3 - 3', group : 'Omnidirectional measurements on the stage'}
            /*
            {url : (BASE_URL + 'impulse-responses/s1_r1_b.wav'), value : 34, label : '1 - 1', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r2_b.wav'), value : 35, label : '1 - 2', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r3_b.wav'), value : 36, label : '1 - 3', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r4_b.wav'), value : 37, label : '1 - 4', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r1_b.wav'), value : 38, label : '2 - 1', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r2_b.wav'), value : 39, label : '2 - 2', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r3_b.wav'), value : 40, label : '2 - 3', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r4_b.wav'), value : 41, label : '2 - 4', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r1_b.wav'), value : 42, label : '3 - 1', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r2_b.wav'), value : 43, label : '3 - 2', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r3_b.wav'), value : 44, label : '3 - 3', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r4_b.wav'), value : 45, label : '3 - 4', group : 'Binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r1_bd.wav'), value : 46, label : '1 - 1', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r2_bd.wav'), value : 47, label : '1 - 2', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r3_bd.wav'), value : 48, label : '1 - 3', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s1_r4_bd.wav'), value : 49, label : '1 - 4', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r1_bd.wav'), value : 50, label : '2 - 1', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r2_bd.wav'), value : 51, label : '2 - 2', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r3_bd.wav'), value : 52, label : '2 - 3', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s2_r4_bd.wav'), value : 53, label : '2 - 4', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r1_bd.wav'), value : 54, label : '3 - 1', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r2_bd.wav'), value : 55, label : '3 - 2', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r3_bd.wav'), value : 56, label : '3 - 3', group : 'Diffuse field compensated binaural measurements in the audience area'},
            {url : (BASE_URL + 'impulse-responses/s3_r4_bd.wav'), value : 57, label : '3 - 4', group : 'Diffuse field compensated binaural measurements in the audience area'}
            */
        ];

        $scope.pianoKeyboards = {};
        $scope.pianoKeyboards.keyboards = {
                                                                                                                            'A-4' :  0, 'A-4h' :  1, 'B-4' :  2,
            'C-3' :  3, 'C-3h' :  4, 'D-3' :  5, 'D-3h' :  6, 'E-3' :  7, 'F-3' :  8, 'F-3h' :  9, 'G-3' : 10, 'G-3h' : 11, 'A-3' : 12, 'A-3h' : 13, 'B-3' : 14,
            'C-2' : 15, 'C-2h' : 16, 'D-2' : 17, 'D-2h' : 18, 'E-2' : 19, 'F-2' : 20, 'F-2h' : 21, 'G-2' : 22, 'G-2h' : 23, 'A-2' : 24, 'A-2h' : 25, 'B-2' : 26,
            'C-1' : 27, 'C-1h' : 28, 'D-1' : 29, 'D-1h' : 30, 'E-1' : 31, 'F-1' : 32, 'F-1h' : 33, 'G-1' : 34, 'G-1h' : 35, 'A-1' : 36, 'A-1h' : 37, 'B-1' : 38,
            'C'   : 39,   'Ch' : 40,   'D' : 41,   'Dh' : 42,   'E' : 43,   'F' : 44,   'Fh' : 45,   'G' : 46,   'Gh' : 47,   'A' : 48,   'Ah' : 49,   'B' : 50,
            'C1'  : 51,  'C1h' : 52,  'D1' : 53,  'D1h' : 54,  'E1' : 55,  'F1' : 56,  'F1h' : 57,  'G1' : 58,  'G1h' : 59,  'A1' : 60,  'A1h' : 61,  'B1' : 62,
            'C2'  : 63,  'C2h' : 64,  'D2' : 65,  'D2h' : 66,  'E2' : 67,  'F2' : 68,  'F2h' : 69,  'G2' : 70,  'G2h' : 71,  'A2' : 72,  'A2h' : 73,  'B2' : 74,
            'C3'  : 75,  'C3h' : 76,  'D3' : 77,  'D3h' : 78,  'E3' : 79,  'F3' : 80,  'F3h' : 81,  'G3' : 82,  'G3h' : 83,  'A3' : 84,  'A3h' : 85,  'B3' : 86,
            'C4'  : 87
        };

        $scope.pianoKeyboards.whites = [
                                               'A-4', 'B-4',
            'C-3', 'D-3', 'E-3', 'F-3', 'G-3', 'A-3', 'B-3',
            'C-2', 'D-2', 'E-2', 'F-2', 'G-2', 'A-2', 'B-2',
            'C-1', 'D-1', 'E-1', 'F-1', 'G-1', 'A-1', 'B-1',
            'C',   'D',   'E',   'F',   'G',   'A',   'B',
            'C1',  'D1',  'E1',  'F1',  'G1',  'A1',  'B1',
            'C2',  'D2',  'E2',  'F2',  'G2',  'A2',  'B2',
            'C3',  'D3',  'E3',  'F3',  'G3',  'A3',  'B3',
            'C4'
        ];

        $scope.pianoKeyboards.blacks = [
                                                    'A-4h', 'skip',
            'C-3h', 'D-3h', 'skip', 'F-3h', 'G-3h', 'A-3h', 'skip',
            'C-2h', 'D-2h', 'skip', 'F-2h', 'G-2h', 'A-2h', 'skip',
            'C-1h', 'D-1h', 'skip', 'F-1h', 'G-1h', 'A-1h', 'skip',
            'Ch',   'Dh',   'skip', 'Fh',   'Gh',   'Ah',   'skip',
            'C1h',  'D1h',  'skip', 'F1h',  'G1h',  'A1h',  'skip',
            'C2h',  'D2h',  'skip', 'F2h',  'G2h',  'A2h',  'skip',
            'C3h',  'D3h',  'skip', 'F3h',  'G3h',  'A3h'
        ];

        $scope.isSoundStops = [];

        angular.forEach($scope.pianoKeyboards.keyboards, function() {
            $scope.isSoundStops.push(true);
        });

        /**
         * This event handler is to start application.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.startApplication = function(event) {
            event.preventDefault();

            // X.setup();

            $scope.isStart = true;

            // This timeout is for animation.
            $timeout(function() {
                $scope.isEndOpening = true;
            }, 2000);
        };

        /**
         * This event handler is to start sound.
         * @param {Event} event This argument is event object from ng-mousedown directive
         * @param {number} index This argument is number between 0 and 87.
         */
        $scope.startSound = function(event, index) {
            if (!X.IS_XSOUND || $(event.currentTarget).hasClass('skip')) {
                return;  // .skip
            }

            if ((event.type === 'mouseover') && !_isDown) {
                return;
            }

            if ($scope.currentSoundSource === 'oscillator') {
                X('oscillator').ready(0, 0).start(X.toFrequencies(index));
                C('oscillator').ready(0, 0).start(X.toFrequencies(index));

                X('mixer').mix([X('oscillator'), C('oscillator')]);

                X('mixer').module('recorder').start();
                X('mixer').module('session').start();
            } else if ($scope.currentSoundSource === 'piano') {
                X('oneshot').ready(0, 0).start(index);

                X('oneshot').module('recorder').start();
                X('oneshot').module('session').start();
            } else if ($scope.currentSoundSource === 'guitar') {
                X('oneshot').ready(0, 0).start(index + 88);

                X('oneshot').module('recorder').start();
                X('oneshot').module('session').start();
            } else if ($scope.currentSoundSource === 'whitenoise') {
                X('noise').param('type', 'whitenoise').start();

                X('noise').module('recorder').start();
                X('noise').module('session').start();
            } else if ($scope.currentSoundSource === 'pinknoise') {
                X('noise').param('type', 'pinknoise').start();

                X('noise').module('recorder').start();
                X('noise').module('session').start();
            } else if ($scope.currentSoundSource === 'browniannoise') {
                X('noise').param('type', 'browniannoise').start();

                X('noise').module('recorder').start();
                X('noise').module('session').start();
            }

            $scope.isSoundStops[index] = false;

            _isDown = true;
        };

        /**
         * This event handler is to stop sound.
         * @param {Event} event This argument is event object from ng-mouseup directive
         * @param {number} index This argument is number between 0 and 87.
         */
        $scope.stopSound = function(event, index) {
            if (!X.IS_XSOUND || $(event.currentTarget).hasClass('skip')) {
                return;  // .skip
            }

            event.stopPropagation();

            if ($scope.currentSoundSource === 'oscillator') {
                X('oscillator').stop();
                C('oscillator').stop();

                // X('mixer').stop();
            } else if ($scope.currentSoundSource === 'piano') {
                X('oneshot').stop(index);
            } else if ($scope.currentSoundSource === 'guitar') {
                X('oneshot').stop(index + 88);
            } else {
                X('noise').stop();
            }

            $scope.isSoundStops[index] = true;

           if (event.type === 'mouseup') {
               _isDown = false;
           }
        };

        /**
         * This function clears class attribute for piano keyboards.
         */
        $scope.clearKeyboards = function() {
            angular.forEach($scope.isSoundStops, function(isSoundStop, index) {
                $scope.isSoundStops[index] = true;
            });
        };

        /**
         * This event handler is to change oscillator state.
         * @param {Event} event This argument is event object from ng-click directive.
         * @param {number} number This argument is either 0 or 1.
         */
        $scope.toggleOscillatorState = function(event, number) {
            var state = !$scope.oscillators['oscillator' + number].isActive;

            switch (number) {
                case 0 :
                    angular.forEach([0, 1, 2, 3], function(index) {
                        X('oscillator').get(index).state(state);
                    });

                    break;
                case 1 :
                    angular.forEach([0, 1, 2, 3], function(index) {
                        C('oscillator').get(index).state(state);
                    });

                    break;
                default :
                    break;
            }

            $scope.oscillators['oscillator' + number].isActive = state;
        };

        /**
         * This event handler is to change analyser state.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.toggleAnalyserState = function(event) {
            $rootScope.isActives.visualization = !$scope.isActives.visualization;

            angular.forEach(sources, function(source) {
                if (source !== 'oscillator') {
                    X(source).module('analyser').domain('time').state($rootScope.isActives.visualization);
                    X(source).module('analyser').domain('fft').state($rootScope.isActives.visualization);
                }
            });
        };

        /**
         * This event handler is to toggle displaying of MML controllers.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.toggleMMLState = function(event) {
            $rootScope.isActives.mml = !$rootScope.isActives.mml;
        };

        /**
         * This event handler is to open or close window for patch system.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.togglePatchState = function(event) {
            $rootScope.isActives.patch = !$rootScope.isActives.patch;

            if ($rootScope.isActives.patch) {
                $('#patch-container').colorbox({
                    open        : true,
                    inline      : true,
                    href        : '#patch-container',
                    width       : '600px',
                    height      : '480px',
                    transition  : 'fade',
                    speed       : 600,
                    opacity     : 0.6,
                    fadeOut     : 600,
                    returnFocus : false,
                    onOpen      : function() {
                        // to PatchController
                        $scope.$broadcast('onOpenPatchDialog');
                    },
                    onCleanup  : function() {
                        $timeout(function() {
                            $rootScope.isActives.patch = false;
                        });
                    }
                });
            }
        };

        /**
         * This event handler is to change oscillator's wave type.
         * @param {Event} event This argument is event object from ng-click directive.
         * @param {number} number This argument is either 0 or 1.
         * @param {string} type This argument is one of 'sine', 'square', 'sawtooth', 'triangle'.
         */
        $scope.changeWaveType = function(event, number, type) {
            switch (number) {
                case 0 :
                    angular.forEach(oscillatorNumbers, function(number) {
                        X('oscillator', number).param('type', type);
                    });

                    break;
                case 1 :
                    angular.forEach(oscillatorNumbers, function(number) {
                        C('oscillator', number).param('type', type);
                    });

                    break;
                default :
                    break;
            }

            $scope.oscillators['oscillator' + number].type = type;
        };

        /**
         * This event handler is to open file dialog.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.triggerFileUploader = function(event) {
            $(event.currentTarget).prev('[type="file"]').trigger('click');
        };
    }]);

    /**
     * Controller for Audio
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$timeout} $timeout This argument is to update view.
     * @param {function} createTimeString This argument is service of DI (Dependency Injection).
     * @extends {XSoundController}
     */
    xsound.controller('AudioController', ['$rootScope', '$scope', '$timeout', 'createTimeString', function($rootScope, $scope, $timeout, createTimeString) {
        var _decodeCallback = function(arrayBuffer) {
            $timeout(function() {
                $scope.$parent.isModalProgressDecodeAudio = true;
            });
        };

        var _readyCallback = function(buffer) {
            var duration = buffer.duration;

            $timeout(function() {
                // Close Modal Window
                $scope.$parent.isModalProgressDecodeAudio = false;

                // Change UI
                $scope.isActive = false;

                // Set audio duration time
                $scope.duration = duration;

                $scope.durationText    = createTimeString(duration);
                $scope.currentTimeText = '00 : 00.00';
            });
        };

        var _startCallback = function(source, currentTime) {
            X('audio').module('recorder').start();
            X('audio').module('session').start();

            $timeout(function() {
                $scope.isActive = true;
            });
        };

        var _stopCallback = function(source, currentTime) {
            $timeout(function() {
                $scope.isActive = false;
            });
        };

        var _updateCallback = function(source, currentTime) {
            var index = Math.floor(currentTime * source.buffer.sampleRate);
            var n100msec = 0.100 * source.buffer.sampleRate;

            if ((index % n100msec) !== 0) {
                return;
            }

            $timeout(function() {
                $rootScope.currentTime = currentTime;
                $scope.currentTimeText = createTimeString(currentTime);
            });
        };

        var _endedCallback = function(source, currentTime) {
            X('audio').module('analyser').domain('time-overview-L').update(0);
            X('audio').module('analyser').domain('time-overview-R').update(0);

            $timeout(function() {
                $scope.isActive        = false;
                $rootScope.currentTime = 0;
                $scope.currentTimeText = '00 : 00.00';
            });
        };

        X('audio').setup({
            decode : _decodeCallback,
            ready  : _readyCallback,
            start  : _startCallback,
            stop   : _stopCallback,
            update : _updateCallback,
            ended  : _endedCallback
        });

        $scope.currentTime     = 0;
        $scope.currentTimeText = '00 : 00.00';
        $scope.duration        = 0;
        $scope.durationText    = '00 : 00.00';
        $scope.isActive        = false;

        /**
         * Start or Pause audio
         * @param {Event} event event object from ng-click directive
         */
        $scope.controlAudio = function(event) {
            X('audio').toggle(X('audio').param('currentTime'));
        };
    }]);

    /**
     * Controller for Recorder
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$timeout} $timeout This argument is to update view.
     * @param {Array.<string>} sources This argument is scope of this controller.
     * @param {function} openDialog This argument is scope of this controller.
     * @param {function} createDateTimeString This argument is scope of this controller.
     * @extends {XSoundController}
     */
    xsound.controller('RecordController', ['$scope', '$timeout', 'sources', 'openDialog', 'createDateTimeString', function($scope, $timeout, sources, openDialog, createDateTimeString) {
        var _start = function() {
            $('<div />').html('<p><b>Start recording in the TRACK ' + ($scope.activeTrack + 1) + ' . OK ?</b></p>').dialog({
                title     : 'Confirmation',
                autoOpen  : true,
                show      : 'explode',
                hide      : 'explode',
                modal     : true,
                width     : 400,
                height    : 'auto',
                draggable : true,
                resizable : false,
                zIndex    : 9999,
                buttons   : {
                    'START' : function() {
                        angular.forEach(sources, function(source) {
                            if (source !== 'oscillator') {
                                X(source).module('recorder').ready($scope.activeTrack);

                                if (source === 'stream') {
                                    X('stream').module('recorder').start();
                                }
                            }
                        });

                        $timeout(function() {
                            $scope.isActive = true;
                        });

                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    },
                    'CANCEL' : function() {
                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    }
                }
            });
        };

        var _stop = function() {
            $('<div />').html('<p><b>Stop the recording. OK ?</b></p>').dialog({
                title     : 'Confirmation',
                autoOpen  : true,
                show      : 'explode',
                hide      : 'explode',
                modal     : true,
                width     : 400,
                height    : 'auto',
                draggable : true,
                resizable : false,
                zIndex    : 9999,
                buttons   : {
                    'STOP'  : function() {
                        angular.forEach(sources, function(source) {
                            if (source !== 'oscillator') {
                                X(source).module('recorder').stop();
                            }
                        });

                        $timeout(function() {
                            $scope.isActive = false;
                        });

                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    },
                    'CANCEL' : function() {
                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    }
                }
            });
        };

        $scope.isActive    = false;
        $scope.tracks      = [1, 2, 3, 4];
        $scope.activeTrack = 0;
        $scope.objectURL   = '';
        $scope.finename    = '';

        angular.forEach(sources, function(source) {
            if (source !== 'oscillator') {
                X(source).module('recorder').setup($scope.tracks.length);
            }
        });

        /**
         * Start or Stop recording
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.controlRecord = function(event) {
            event.preventDefault();

            if ($scope.isActive) {
                _stop();
            } else {
                _start();
            }
        };

        /**
         * This function creates WAVE file.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.createWAVE = function(event) {
            event.preventDefault();

            if ($scope.isActive) {
                // In the case of recording
                return;
            }

            var CHANNEL = 2;
            var BIT     = 16;  // 16 bit
            var TYPE    = 'objectURL';

            angular.forEach(sources, function(source) {
                if (source !== 'oscillator') {
                    var objectURL = X(source).module('recorder').create('all', BIT, CHANNEL, TYPE);

                    if (objectURL) {
                        $scope.objectURL = objectURL;

                        var audio = new Audio($scope.objectURL);

                        audio.setAttribute('controls', false);
                        audio.play();
                    }
                }
            });
        };

        /**
         * This function opens download dialog.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.downloadWAVE = function(event) {
            if ($scope.isActive) {
                // In the case of recording
                event.preventDefault();
                return;
            }

            if ($scope.objectURL) {
                $scope.filename = 'recorded-' + createDateTimeString() + '.wav';

                //
                // Canceling event is not necessary for downloading file
                //
                // event.preventDefault();
            } else {
                event.preventDefault();
                openDialog('Error', 450, 'auto', true, '<p><b>The recorded sound data does not exists.</b></p>');
            }
        };

        /**
         * This function clears record track.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.clearTrack = function(event) {
            event.preventDefault();

            if ($scope.isActive) {
                // In the case of recording
                return;
            }

            $('<div />').html('<p><b>Clear the TRACK ' + ($scope.activeTrack + 1) + ' . OK ?</b></p>').dialog({
                title     : 'Confirmation',
                autoOpen  : true,
                show      : 'explode',
                hide      : 'explode',
                modal     : true,
                width     : 400,
                height    : 'auto',
                draggable : true,
                resizable : false,
                zIndex    : 9999,
                buttons   : {
                    'CLEAR' : function() {
                        angular.forEach(sources, function(source) {
                            if (source !== 'oscillator') {
                                X(source).module('recorder').clear($scope.activeTrack);
                            }
                        });

                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    },
                    'CANCEL' : function() {
                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    }
                }
            });
        };
    }]);

    /*
     * Controller for Visualization
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$document} $document This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is to update view.
     * @param {Array.<string>} sources readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} drawNodeCallback This argument is service of DI (Dependency Injection).
     * @extends {XSoundController}
     */
    xsound.controller('VisualizationController', ['$rootScope', '$scope', '$document', '$timeout', 'sources', 'drawNodeCallback', function($rootScope, $scope, $document, $timeout, sources, drawNodeCallback) {
        $scope.api     = 'canvas';
        $scope.channel = 'left';

        /**
         * This function initializes analyser each domain ("time" and "fft").
         * @param {string} source This argument is sound source name that is defined by XSound.js
         * @param {string} api This argument is either 'canvas' or 'svg'.
         */
        $scope.setRealTimeAnalyser = function(source, api) {
            X(source).module('analyser').param({
                fftSize               : 2048,
                minDecibels           : -100,
                maxDecibels           : -30,
                smoothingTimeConstant : 0.1
            });

            X(source).module('analyser').domain('time').setup($document[0].getElementById(api + '-time')).param({
                interval : 0,
                shape    : 'line',
                wave     : 'rgba(0, 0, 255, 1.0)',
                font     : {
                    family : 'Arial',
                    size   : '12px',
                    style  : 'normal',
                    weight : 'normal'
                },
                width    : 2,
                right    : 15,
                type     : 'uint'
            });

            X(source).module('analyser').domain('fft').setup($document[0].getElementById(api + '-spectrum')).param({
                interval : 0,
                shape    : 'rect',
                wave     : 'gradient',
                grad     : [
                    {offset : 0, color : 'rgba(0, 128, 255, 1.0)'},
                    {offset : 1, color : 'rgba(0,   0, 255, 1.0)'}
                ],
                font     : {
                    family : 'Arial',
                    size   : '12px',
                    style  : 'normal',
                    weight : 'normal'
                },
                width    : 1,
                right    : 15,
                type     : 'uint',
                size     : 256
            });
        };

        /**
         * This function initializes analyser each domain ("time-overview-L" and "time-overview-R").
         * @param {string} api This argument is either 'canvas' or 'svg'.
         */
       $scope.setAnalyser = function(api) {
            X('audio').module('analyser').domain('time-overview-L').setup($document[0].getElementById(api + '-time-overview-L')).state(true).param({
                shape : 'rect',
                wave  : (api === 'canvas') ? 'gradient' : 'rgba(0, 0, 255, 1)',
                grad  : [
                    {offset : 0, color : 'rgba(0, 128, 255, 1.0)'},
                    {offset : 1, color : 'rgba(0,   0, 255, 1.0)'}
                ],
                font  : {
                    family : 'Arial',
                    size   : '12px',
                    style  : 'normal',
                    weight : 'normal'
                },
                width : 0.5,
                right : 15
            });

            X('audio').module('analyser').domain('time-overview-R').setup($document[0].getElementById(api + '-time-overview-R')).state(true).param({
                shape : 'rect',
                wave  : (api === 'canvas') ? 'gradient' : 'rgba(0, 0, 255, 1)',
                grad  : [
                    {offset : 0, color : 'rgba(0, 128, 255, 1.0)'},
                    {offset : 1, color : 'rgba(0,   0, 255, 1.0)'}
                ],
                font  : {
                    family : 'Arial',
                    size   : '12px',
                    style  : 'normal',
                    weight : 'normal'
                },
                width : 0.5,
                right : 15
            });
        };

        /**
         * This function sets API for drawing.
         * @param {string} api This argument is either 'canvas' or 'svg'.
         */
        $scope.selectAPI = function(api) {
            $scope.api = api;

            angular.forEach(sources, function(source) {
                if (source !== 'oscillator') {
                    $scope.setRealTimeAnalyser(source, api);
                }
            });

            $scope.setAnalyser(api);

            // Set current time
            X('audio').module('analyser').domain('time-overview-L').drag(function(currentTime) {drawNodeCallback($timeout, currentTime);});
            X('audio').module('analyser').domain('time-overview-R').drag(function(currentTime) {drawNodeCallback($timeout, currentTime);});
        };

        /**
         * This event handler is to change channel (Left or Right) for displaying audio wave.
         * @param {Event} event This argument is event object from ng-click directive.
         * @param {string} channel This argument is either 'left' or 'right'
         */
        $scope.toggleAnalyserChannel = function(event, channel) {
            event.preventDefault();
            $scope.channel = channel;
        };

        // Initialization
        $scope.selectAPI('canvas');
    }]);

    /**
     * Controller for MML
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$http} $http This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is to update view.
     * @param {$sce} $timeout This argument is to render HTML.
     * @param {string} BASE_URL This argument is service of DI (Dependency Injection).
     * @param {Array.<string>} oscillatorNumbers This is the array of number in order to identify oscillator.
     * @param {function} createDateTimeString This argument is service of DI (Dependency Injection).
     * @extends {XSoundController}
     */
    xsound.controller('MMLController', ['$rootScope', '$scope', '$http', '$timeout', '$sce', 'BASE_URL', 'oscillatorNumbers', 'createDateTimeString', function($rootScope, $scope, $http, $timeout, $sce, BASE_URL, oscillatorNumbers, createDateTimeString) {
        var _startCallbackMelody =  function(sequence) {
            if ($scope.$parent.currentSoundSource === 'oscillator') {
                X('mixer').mix([X('oscillator'), C('oscillator')]);
            }

            var mmls = $scope.mml.split(/\|+/);

            if (mmls.length === 2) {
                var mml1 = mmls[0].replace(' ' + sequence.note,  ' <span class="highlight">' + sequence.note + '</span>');

                $scope.mml = mml1 + '|||||' + mmls[1];
            } else if (mmls.length === 1) {
                var mml1 = mmls[0].replace(' ' + sequence.note,  ' <span class="highlight">' + sequence.note + '</span>');

                $scope.mml = mml1;
            }

            angular.forEach(sequence.indexes, function(index) {
                if (index === 'R') {
                    return;
                }

                $timeout(function() {
                    $scope.$parent.isSoundStops[index] = false;
                });
            });
        };

        var _startCallbackBass =  function(sequence) {
            var mmls = $scope.mml.split(/\|+/);

            if (mmls.length === 2) {
                var mml2 = mmls[1].replace(' ' + sequence.note,  ' <span class="highlight">' + sequence.note + '</span>');

                $scope.mml = mmls[0] + '|||||' + mml2;
            }

            angular.forEach(sequence.indexes, function(index) {
                if (index === 'R') {
                    return;
                }

                $timeout(function() {
                    $scope.$parent.isSoundStops[index] = false;
                });
            });
        };

        var _stopCallback = function(sequence) {
            sequence.indexes.forEach(function(index) {
                if (index === 'R') {
                    return;
                }

                $timeout(function() {
                    $scope.$parent.isSoundStops[index] = true;
                });
            });
        };

        var _endedCallback = function() {
            angular.forEach(oscillatorNumbers, function(number) {
                if (number !== 0) {
                    X('oscillator', number).state(false);
                    C('oscillator', number).state(false);
                }
            });

            $scope.readyMML();

            $scope.paused = true;
            $scope.$parent.clearKeyboards();
        };

        var _errorCallback = function(error, note) {
            switch (error) {
                case 'TEMPO'  :
                case 'OCTAVE' :
                case 'NOTE'   :
                    //$scope.error = 'Maybe, ' + note + ' is invalid.';
                    break;
                case 'MML' :
                    break;
                default    :
                    //$scope.error = 'The designated MML is invalid.';
                    break;
            }
        };

        X('mml').setup({
            start : _startCallbackMelody,
            stop  : _stopCallback,
            ended : _endedCallback,
            error : _errorCallback
        });

        C('mml').setup({
            start : _startCallbackBass,
            stop  : _stopCallback,
            ended : _endedCallback,
            error : _errorCallback
        });

        $scope.paused   = true;
        $scope.mml      = '';
        $scope.dataURL  = '';
        $scope.filename = '';
        $scope.error    = '';

        $scope.trustAsHtml = function(string) {
            return $sce.trustAsHtml(string);
        };

        // Chnage sound source -> parse MML text
        $scope.$watch(function() {
            return $scope.$parent.currentSoundSource;
        }, function() {
            $scope.readyMML();
        });

        // Get MML tex for placeholder
        $http.get(Math.floor(Math.random() * 2) ? (BASE_URL + 'mml/mml-foreverlove.txt') : (BASE_URL + 'mml/mml-tears.txt'))
             .then(function(response) {
                 $scope.mml = response.data;
                 $scope.readyMML();
                 $scope.paused = true;
             })
             .catch(function(response) {
             });

        /**
         * This event hander is to update MML text.
         * @param {Event} event This argument is event object from ng-keyup directive.
         */
        $scope.typeMML = function(event) {
            $scope.mml = event.currentTarget.textContent;
            $scope.readyMML();
            $scope.paused = true;
        };

        /**
         * This function parses MML text and sets performance information.
         */
        $scope.readyMML = function() {
            var mmls = $scope.mml.split(/\|+/);

            if ($scope.$parent.currentSoundSource === 'oscillator') {
                if (mmls.length > 1) {
                    X('mml').ready(X('oscillator'), mmls[0]);
                    C('mml').ready(C('oscillator'), mmls[1]);
                } else if (mmls.length > 0) {
                    X('mml').ready(X('oscillator'), mmls[0]);
                    C('mml').ready(C('oscillator'), []);
                }
            } else if ($scope.$parent.currentSoundSource === 'piano') {
                if (mmls.length > 1) {
                    X('mml').ready(X('oneshot'), mmls[0], 0);
                    C('mml').ready(X('oneshot'), mmls[1], 0);
                } else if (mmls.length > 0) {
                    X('mml').ready(X('oneshot'), mmls[0], 0);
                    C('mml').ready(X('oneshot'), [], 0);
                }
            } else if ($scope.$parent.currentSoundSource === 'guitar') {
                if (mmls.length > 1) {
                    X('mml').ready(X('oneshot'), mmls[0], 88);
                    C('mml').ready(X('oneshot'), mmls[1], 88);
                } else if (mmls.length > 0) {
                    X('mml').ready(X('oneshot'), mmls[0], 88);
                    C('mml').ready(X('oneshot'), [], 88);
                }
            }
        };

        /**
         * Start or Pause MML
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.controlMML = function(event) {
            event.preventDefault();

            if (!X('mml').isSequences()) {
                return;
            }

            var parts = X('mml').get();

            if ($scope.paused) {
                // Start MML
                if ($scope.$parent.currentSoundSource === 'oscillator') {
                    angular.forEach(oscillatorNumbers, function(number) {
                        X('oscillator', number).state(true);
                        C('oscillator', number).state(true);
                    });

                    $scope.$parent.oscillators.oscillator0.isActive = true;
                    $scope.$parent.oscillators.oscillator1.isActive = true;

                    if (X('mml').get().length > 0) {
                        X('mml').start(0);
                    }

                    if (C('mml').get().length > 0) {
                        C('mml').start(0);
                    }

                    X('mixer').module('recorder').start();
                    X('mixer').module('session').start();
                } else {
                    if (X('mml').get().length > 0) {
                        X('mml').start(0);
                    }

                    if (C('mml').get().length > 0) {
                        C('mml').start(0);
                    }

                    X('oneshot').module('recorder').start();
                    X('oneshot').module('session').start();
                }

                $scope.paused = false;
            } else {
                // Stop MML
                X('mml').stop();
                C('mml').stop();

                angular.forEach(oscillatorNumbers, function(number) {
                    X('oscillator', number).state(true);
                    C('oscillator', number).state(true);
                });

                $scope.paused = true;
            }
        };

        /**
         * Stop and Rewind MML
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.stopMML = function(event) {
            // Stop MML
            X('mml').stop();
            C('mml').stop();

            // Rewind
            $scope.readyMML();

            $scope.paused = true;
            $scope.$parent.clearKeyboards();
        };

        /**
         * This function opens download dialog.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.downloadMML = function(event) {
            if ($scope.mml.trim().length === 0) {
                event.preventDefault();
                return;
            }

            $scope.dataURL  = X.toTextFile($scope.mml);
            $scope.filename = 'mml-' + createDateTimeString() + '.txt';

            //
            // Canceling event is not necessary for downloading file
            //
            // event.preventDefault();
        };
    }]);

    /**
     * Controller for Session
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$location} $location This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is to update view.
     * @param {Array.<string>} sources readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} openDialog This argument is service of DI (Dependency Injection).
     * @extends {XSoundController}
     */
    xsound.controller('SessionController', ['$scope', '$location', '$timeout', 'sources', 'openDialog', function($scope, $location, $timeout, sources, openDialog) {
        // for WebSocket
        var IS_TLS = false;
        var HOST   = '';
        var PATH   = '';

        if ($location.host().indexOf('localhost') !== -1) {
            IS_TLS = false;
            HOST   = 'localhost';
            PATH   = '';
        } else {
            IS_TLS = true;
            HOST   = 'x-sound-server.herokuapp.com/';
            PATH   = '/app/websocket/';
        }

        var _openCallback = function(event) {
            openDialog('Confirmation', 800, 'auto', false, ('<p><b>Connection to (' + event.currentTarget.url + ') succeeded.</b></p>'));

            $timeout(function() {
                $scope.isActive = true;
            });
        };

        var _closeCallback = function(event) {
            openDialog('Confirmation', 400, 'auto', true, '<p><b>Connection closed.</b></p>');

            $timeout(function() {
                $scope.isActive = false;
            });
        };

        var _errorCallback = function(event) {
            openDialog('Error', 400, 'auto', true, '<p><b>Server Error.</b></p>');

            $timeout(function() {
                $scope.isActive = false;
            });
        };

        var _stateCallback = function() {
            $timeout(function() {
                $scope.$parent.isModalProgressSessionWait = false;

                if (X('mixer').module('session').state()) {
                    $scope.isActive = true;
                } else {
                    $scope.isActive = false;
                }
            });
        };

        var _waitCallback = function(arrayBuffer) {
            $scope.$parent.isModalProgressSessionWait = true;
        };

        $scope.isActive = false;
        $scope.url      = '';

        /**
         * This event handler is to change session state.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.toggleSessionState = function(event) {
            $scope.isActive = !$scope.isActive;

            if ($scope.isActive) {
                if (X('mixer').module('session').isConnected() &&
                    X('oneshot').module('session').isConnected() &&
                    X('audio').module('session').isConnected() &&
                    X('stream').module('session').isConnected()) {
                    // Connection to server has existed already
                    angular.forEach(sources, function(source) {
                        if (source !== 'oscillator') {
                            X(source).module('session').state(true, _stateCallback, _waitCallback);
                        }
                    });
                } else {
                    var _sessionSetups = {
                        tls   : IS_TLS,
                        host  : HOST,
                        port  : 8000,
                        path  : PATH,
                        open  : _openCallback,
                        close : _closeCallback,
                        error : _errorCallback
                    };

                    // The 1st
                    try {
                        angular.forEach(sources, function(source) {
                            if (source !== 'oscillator') {
                                X(source).module('session')
                                          .setup(_sessionSetups)
                                          .state(true, _stateCallback, _waitCallback);

                                _sessionSetups.port++;
                            }
                        });
                    } catch (error) {
                        $scope.isActive = false;
                        openDialog('Error', 400, 'auto', true, '<p><b>' + error.message + '</b></p>');
                    }
                }
            } else {
                angular.forEach(sources, function(source) {
                    if (source !== 'oscillator') {
                        X(source).module('session').state(false, _stateCallback, _waitCallback);
                    }
                });
            }
        };
    }]);

    /**
     * Controller for  Account and Patch system
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$http} $http This argument is service of DI (Dependency Injection).
     * @param {$window} $window This argument is service of DI (Dependency Injection).
     * @param {$location} $location This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is to update view.
     * @param {Array.<string>} sources readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} openDialog This argument is service of DI (Dependency Injection).
     * @param {function} getCurrentPatches This argument is service of DI (Dependency Injection).
     * @extends {XSoundController}
     */
    xsound.controller('PatchController', ['$rootScope', '$scope', '$http', '$window', '$location', '$timeout', 'sources', 'openDialog', 'getCurrentPatches', function($rootScope, $scope, $http, $window, $location, $timeout, sources, openDialog, getCurrentPatches) {
        var TIMEOUT = 10000;

        var POST_ORIGIN = (function() {
            if ($location.host().indexOf('localhost') !== -1) {
                // return 'http://localhost:3000';                                                       // Node.js + MongoDB
                return 'http://localhost/~rilakkuma3xjapan/portfolio-x-sound-server/php/bootstrap.php';  // PHP + MySQL
            } else {
                // return 'http://curtaincall.c.node-ninja.com:3000';                                            // Node.js + MongoDB
                return 'https://weblike-curtaincall.ssl-lolipop.jp/portfolio-x-sound-server/php/bootstrap.php';  // PHP + MySQL
            }
        })();

        var _defaultPatches = getCurrentPatches();

        var _deleteAccount = function() {
            $scope.isDisabled = true;

            $http({
                method           : 'POST',
                url              : (POST_ORIGIN + '/account/delete'),
                timeout          : TIMEOUT,
                withCredentials  : true,
                params           : '',  // Query Parameters (GET)
                data             : {
                    'username' : $scope.deleteAccounts.username,
                    'password' : $scope.deleteAccounts.password,
                    '_csrf'    : $scope.csrf
                },
                headers         : {
                    //'X-Requested-With' : 'XMLHttpRequest',  // Unnecessary for CORS
                    'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                transformRequest : function(data) {
                    // JSON -> serialize (key1=value1&key2=value2 ...)
                    return $.param(data);
                }
            }).then(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf           = data.csrf;
                    $scope.isAuth         = data.isAuth;
                    $scope.authedUsername = data.username;

                    if (!$scope.isAuth) {
                        angular.forEach(data.message, function(message) {
                            openDialog('Confirmation', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                        });
                    }
                }

                $scope.isDisabled = false;
            }).catch(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf = data.csrf;

                    angular.forEach(data.message, function(message) {
                        openDialog('Error', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                } else {
                    _ajaxErrorHandler();
                }

                $scope.isDisabled = false;
            });
        };

        var _loadPatch = function(patches, isPushState) {
            if (!angular.isObject(patches)) {
                return;
            }

            var setState = function(module, state) {
                angular.forEach(sources, function(source) {
                    X(source).module(module).state(state);
                });

                C('oscillator').module(module).state(state);

                if (state) {
                    $('[effector="' + module + '"]').addClass('check-on');
                } else {
                    $('[effector="' + module + '"]').removeClass('check-on');
                }
            };

            if ('mastervolume' in patches) {
                $('.slider-mastervolume:not(:first)').slider('value', patches.mastervolume);
            }

            if ('glide' in patches) {
                var glide = patches.glide;

                if ('time' in glide) {
                    $('.slider-glide-time').slider('value', glide.time);
                }
            }

            if ('envelopegenerator' in patches) {
                var envelopegenerator = patches.envelopegenerator;

                if ('attack'  in envelopegenerator) {$('.slider-envelopegenerator-attack').slider('value', envelopegenerator.attack);}
                if ('decay'   in envelopegenerator) {$('.slider-envelopegenerator-decay').slider('value', envelopegenerator.decay);}
                if ('sustain' in envelopegenerator) {$('.slider-envelopegenerator-sustain').slider('value', envelopegenerator.sustain);}
                if ('release' in envelopegenerator) {$('.slider-envelopegenerator-release').slider('value', envelopegenerator.release);}
            }

            if ('oscillator0' in patches) {
                var oscillator0 = patches.oscillator0;

                if ('state' in oscillator0) {
                    $timeout(function() {
                        $scope.$parent.oscillators.oscillator0.isActive = !oscillator0;
                        $scope.$parent.toggleOscillatorState(null, 0);
                    });
                }

                if ('type' in oscillator0) {
                    $timeout(function() {
                        $scope.$parent.changeWaveType(null, 0, oscillator0.type);
                    });
                }

                if ('gain'   in oscillator0) {$('.slider-volume:first').slider('value', oscillator0.gain);}
                if ('octave' in oscillator0) {$('.slider-octave:first').slider('value', oscillator0.octave);}
                if ('fine'   in oscillator0) {$('.slider-fine:first').slider('value', oscillator0.fine);}
            }

            if ('oscillator1' in patches) {
                var oscillator1 = patches.oscillator1;

                if ('state' in oscillator1) {
                    $timeout(function() {
                        $scope.$parent.oscillators.oscillator1.isActive = !oscillator1;
                        $scope.$parent.toggleOscillatorState(null, 1);
                    });
                }

                if ('type'in oscillator1) {
                    $timeout(function() {
                        $scope.$parent.changeWaveType(null, 1, oscillator1.type);
                    });
                }

                if ('gain'   in oscillator1) {$('.slider-volume:last').slider('value', oscillator1.gain);}
                if ('octave' in oscillator1) {$('.slider-octave:last').slider('value', oscillator1.octave);}
                if ('fine'   in oscillator1) {$('.slider-fine:last').slider('value', oscillator1.fine);}
            }

            if ('compressor' in patches) {
                var compressor = patches.compressor;

                if ('state'     in compressor) {setState('compressor', compressor.state);}
                if ('threshold' in compressor) {$('.slider-threshold').slider('value', compressor.threshold);}
                if ('knee'      in compressor) {$('.slider-knee').slider('value', compressor.knee);}
                if ('ratio'     in compressor) {$('.slider-ratio').slider('value', compressor.ratio);}
                if ('attack'    in compressor) {$('.slider-compressor-attack').slider('value', compressor.attack);}
                if ('release'   in compressor) {$('.slider-compressor-release').slider('value', compressor.release);}
            }

            if ('distortion' in patches) {
                var distortion = patches.distortion;

                if ('state'   in distortion) {setState('distortion', distortion.state);}
                if ('curve'   in distortion) {$('#select-distortion-type').val(distortion.curve).trigger('change');}
                if ('samples' in distortion) {$('#select-distortion-sample').val('value', distortion.samples);}
                if ('drive'   in distortion) {$('.slider-distortion-drive').slider('value', distortion.drive);}
                if ('color'   in distortion) {$('.slider-distortion-color').slider('value', distortion.color);}
                if ('tone'    in distortion) {$('.slider-distortion-tone').slider('value', distortion.tone);}
            }

            if ('wah' in patches) {
                var wah = patches.wah;

                if ('state'     in wah) {setState('wah', wah.state);}
                if ('cutoff'    in wah) {$('.slider-wah-cutoff').slider('value', wah.cutoff);}
                if ('depth'     in wah) {$('.slider-wah-depth').slider('value', wah.depth);}
                if ('rate'      in wah) {$('.slider-wah-rate').slider('value', wah.rate);}
                if ('resonance' in wah) {$('.slider-wah-resonance').slider('value', wah.resonance);}
            }

            if ('equalizer' in patches) {
                var equalizer = patches.equalizer;

                if ('state'    in equalizer) {setState('equalizer', equalizer.state);}
                if ('bass'     in equalizer) {$('.slider-equalizer-bass').slider('value', equalizer.bass);}
                if ('middle'   in equalizer) {$('.slider-equalizer-middle').slider('value', equalizer.middle);}
                if ('treble'   in equalizer) {$('.slider-equalizer-treble').slider('value', equalizer.treble);}
                if ('presence' in equalizer) {$('.slider-equalizer-presence').slider('value', equalizer.presence);}
            }

            if ('filter' in patches) {
                var filter = patches.filter;

                if ('state'     in filter) {setState('filter', filter.state);}
                if ('type'      in filter) {$('#select-filter-type').val(filter.type).trigger('change');}
                if ('frequency' in filter) {$('.slider-filter-cutoff').slider('value', filter.frequency);}
                if ('Q'         in filter) {$('.slider-filter-Q').slider('value', filter.Q);}
                if ('gain'      in filter) {$('.slider-filter-gain').slider('value', filter.gain);}
                if ('attack'    in filter) {$('.slider-filter-attack').slider('value', filter.attack);}
                if ('decay'     in filter) {$('.slider-filter-decay').slider('value', filter.decay);}
                if ('sustain'   in filter) {$('.slider-filter-sustain').slider('value', filter.sustain);}
                if ('release'   in filter) {$('.slider-filter-release').slider('value', filter.release);}
            }

            if ('autopanner' in patches) {
                var autopanner = patches.autopanner;

                if ('state' in autopanner) {setState('autopanner', autopanner.state);}
                if ('depth' in autopanner) {$('.slider-autopanner-depth').slider('value', autopanner.depth);}
                if ('rate'  in autopanner) {$('.slider-autopanner-rate').slider('value', autopanner.rate);}
            }

            if ('tremolo' in patches) {
                var tremolo = patches.tremolo;

                if ('state' in tremolo) {setState('tremolo', tremolo.state);}
                if ('depth' in tremolo) {$('.slider-tremolo-depth').slider('value', tremolo.depth);}
                if ('rate'  in tremolo) {$('.slider-tremolo-rate').slider('value', tremolo.rate);}
            }

            if ('ringmodulator' in patches) {
                var ringmodulator = patches.ringmodulator;

                if ('state' in ringmodulator) {setState('ringmodulator', ringmodulator.state);}
                if ('depth' in ringmodulator) {$('.slider-ringmodulator-depth').slider('value', ringmodulator.depth);}
                if ('rate'  in ringmodulator) {$('.slider-ringmodulator-rate').slider('value', ringmodulator.rate);}
            }

            if ('phaser' in patches) {
                var phaser = patches.phaser;

                if ('state'     in phaser) {setState('phaser', phaser.state);}
                if ('stage'     in phaser) {$('.select-phaser-stage').val(phaser.stage);}
                if ('frequency' in phaser) {$('.slider-phaser-cutoff').slider('value', phaser.frequency);}
                if ('depth'     in phaser) {$('.slider-phaser-depth').slider('value', phaser.depth);}
                if ('rate'      in phaser) {$('.slider-phaser-rate').slider('value', phaser.rate);}
                if ('mix'       in phaser) {$('.slider-phaser-mix').slider('value', phaser.mix);}
                if ('feedback'  in phaser) {$('.slider-phaser-feedback').slider('value', phaser.feedback);}
            }

            if ('flanger' in patches) {
                var flanger = patches.flanger;

                if ('state'    in flanger) {setState('flanger', flanger.state);}
                if ('time'     in flanger) {$('.slider-flanger-time').slider('value', flanger.time);}
                if ('depth'    in flanger) {$('.slider-flanger-depth').slider('value', flanger.depth);}
                if ('rate'     in flanger) {$('.slider-flanger-rate').slider('value', flanger.rate);}
                if ('mix'      in flanger) {$('.slider-flanger-mix').slider('value', flanger.mix);}
                if ('tone'     in flanger) {$('.slider-flanger-tone').slider('value', flanger.tone);}
                if ('feedback' in flanger) {$('.slider-flanger-feedback').slider('value', flanger.feedback);}
            }

            if ('chorus' in patches) {
                var chorus = patches.chorus;

                if ('state'    in chorus) {setState('chorus', chorus.state);}
                if ('time'     in chorus) {$('.slider-chorus-time').slider('value', chorus.time);}
                if ('depth'    in chorus) {$('.slider-chorus-depth').slider('value', chorus.depth);}
                if ('rate'     in chorus) {$('.slider-chorus-rate').slider('value', chorus.rate);}
                if ('mix'      in chorus) {$('.slider-chorus-mix').slider('value', chorus.mix);}
                if ('tone'     in chorus) {$('.slider-chorus-tone').slider('value', chorus.tone);}
                if ('feedback' in chorus) {$('.slider-chorus-feedback').slider('value', chorus.feedback);}
            }

            if ('delay' in patches) {
                var delay = patches.delay;

                if ('state'    in delay) {setState('delay', delay.state);}
                if ('time'     in delay) {$('.slider-delay-time').slider('value', delay.time);}
                if ('dry'      in delay) {$('.slider-delay-dry').slider('value', delay.dry);}
                if ('wet'      in delay) {$('.slider-delay-wet').slider('value', delay.wet);}
                if ('tone'     in delay) {$('.slider-delay-tone').slider('value', delay.tone);}
                if ('feedback' in delay) {$('.slider-delay-feedback').slider('value', delay.feedback);}
            }

            if ('reverb' in patches) {
                var reverb = patches.reverb;

                if ('state' in reverb) {setState('reverb', reverb.state);}
                if ('dry'   in reverb) {$('.slider-reverb-dry').slider('value', reverb.dry);}
                if ('wet'   in reverb) {$('.slider-reverb-wet').slider('value', reverb.wet);}
                if ('tone'  in reverb) {$('.slider-reverb-tone').slider('value', reverb.tone);}
            }

            $timeout(function() {
                $scope.currentPatches = getCurrentPatches();

                if (isPushState) {
                    history.pushState(getCurrentPatches(), null);
                }
            });
        };

        var _updatePatch = function(patchname) {
            $http({
                method           : 'POST',
                url              : (POST_ORIGIN + '/patch/update'),
                timeout          : TIMEOUT,
                withCredentials  : true,
                params           : '',  // Query Parameters (GET)
                data             : {
                    'name'  : patchname,
                    'patch' : angular.toJson(getCurrentPatches()),
                    '_csrf' : $scope.csrf
                },
                headers         : {
                    //'X-Requested-With' : 'XMLHttpRequest',  // Unnecessary for CORS
                    'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                transformRequest : function(data) {
                    // JSON -> serialize (key1=value1&key2=value2 ...)
                    return $.param(data);
                }
            }).then(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf       = data.csrf;
                    $scope.isAuth     = data.isAuth;
                    $scope.patchLists = angular.fromJson(data.patches);

                    angular.forEach(data.message, function(message) {
                        openDialog('Confirmation', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                }
            }).catch(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf   = data.csrf;
                    $scope.isAuth = data.isAuth;

                    angular.forEach(data.message, function(message) {
                        openDialog('Error', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                } else {
                    _ajaxErrorHandler();
                }
            });
        };

        var _deletePatch = function(patchname) {
            $http({
                method           : 'POST',
                url              : (POST_ORIGIN + '/patch/delete'),
                timeout          : TIMEOUT,
                withCredentials  : true,
                params           : '',  // Query Parameters (GET)
                data             : {
                    'name'  : patchname,
                    '_csrf' : $scope.csrf
                },
                headers         : {
                    //'X-Requested-With' : 'XMLHttpRequest',  // Unnecessary for CORS
                    'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                transformRequest : function(data) {
                    // JSON -> serialize (key1=value1&key2=value2 ...)
                    return $.param(data);
                }
            }).then(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf       = data.csrf;
                    $scope.isAuth     = data.isAuth;
                    $scope.patchLists = angular.fromJson(data.patches);

                    angular.forEach(data.message, function(message) {
                        openDialog('Confirmation', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                }
            }).catch(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf   = data.csrf;
                    $scope.isAuth = data.isAuth;

                    angular.forEach(data.message, function(message) {
                        openDialog('Error', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                } else {
                    _ajaxErrorHandler();
                }
            });
        };

        var _ajaxErrorHandler = function() {
            openDialog('Error', 500, 'auto', false, '<p><b>Connection to Server failed.</b></p>');
        };

        $window.onpopstate = function(event) {
            if (event.state) {
                _loadPatch(event.state, false);
            } else {
                _loadPatch(_defaultPatches, false);
            }
        };

        $scope.isAuth      = false;

        $scope.isSignin    = true;
        $scope.isSignup    = false;
        $scope.isPatchList = false;
        $scope.isSavePath  = false;
        $scope.isAccount   = false;

        $scope.isDisabled  = false;

        $scope.csrf = '';

        $scope.signups = {
            username : '',
            password : ''
        };

        $scope.signins = {
            username : '',
            password : ''
        };

        $scope.deleteAccounts = {
            username : '',
            password : ''
        };

        $scope.authedUsername = '';

        $scope.patchname  = '';
        $scope.patchLists = [];

        $scope.dialogPatchDetailId     = 'dialog-patch-detail';
        $scope.isShowDialogPatchDetail = false;

        $scope.$watch(function() {
            return $scope.isAuth;
        }, function(newVal) {
            if (newVal) {
                // Authenticated
                $scope.signups = {
                    username : '',
                    password : ''
                };

                $scope.signins = {
                    username : '',
                    password : ''
                };

                $scope.currentPatches = getCurrentPatches();

                $scope.toggleAction(null, 'patchList');
            } else {
                // Not Authenticated
                $scope.deleteAccounts = {
                    username : '',
                    password : ''
                };

                $scope.currentPatches = {};
                $scope.patches        = {};

                $scope.patchname      = '';
                $scope.patchLists     = [];

                $scope.authedUsername = '';

                $scope.isShowDialogPatchDetail = false;

                $scope.toggleAction(null, 'signin');
            }
        });

        // from XSoundController
        $scope.$on('onOpenPatchDialog', function(event) {
            $scope.currentPatches = getCurrentPatches();
        });

        /**
         * This event handler prevents from closing modal window at typing.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.cancelClose = function(event) {
            event.stopImmediatePropagation();
        };

        /**
         * This event handler changes flag for Tab-Panel menu.
         * @param {Event} event This argument is event object from ng-click directive.
         * @param {string} action This argument is one of 'signin', 'signup', 'patchList', 'savePatch', 'account'
         */
        $scope.toggleAction = function(event, action) {
            if (event !== null) {
                event.preventDefault();
            }

            $scope.isSignin    = false;
            $scope.isSignup    = false;
            $scope.isPatchList = false;
            $scope.isSavePatch = false;
            $scope.isAccount   = false;

            switch (action) {
                case 'signin' :
                    $scope.isSignin = true;
                    break;
                case 'signup' :
                    $scope.isSignup = true;
                    break;
                case 'patchList' :
                    $scope.isPatchList = true;
                    break;
                case 'savePatch' :
                    $scope.isSavePatch = true;
                    break;
                case 'account' :
                    $scope.isAccount = true;
                    break;
                default :
                    break;
            }
        };

        /**
         * This event handler is to sign in.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.signin = function(event) {
            event.preventDefault();

            $scope.isDisabled = true;

            $http({
                method           : 'POST',
                url              : (POST_ORIGIN + '/account/signin'),
                timeout          : TIMEOUT,
                withCredentials  : true,
                params           : '',  // Query Parameters (GET)
                data             : {
                    'username' : $scope.signins.username,
                    'password' : $scope.signins.password,
                    '_csrf'    : $scope.csrf
                },
                headers : {
                    //'X-Requested-With' : 'XMLHttpRequest',  // Unnecessary for CORS
                    'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                transformRequest : function(data) {
                    // JSON -> serialize (key1=value1&key2=value2 ...)
                    return $.param(data);
                }
            }).then(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf           = data.csrf;
                    $scope.isAuth         = data.isAuth;
                    $scope.authedUsername = data.username;
                    $scope.patchLists     = angular.fromJson(data.patches);
                }

                $scope.isDisabled = false;
            }).catch(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf = data.csrf;

                    angular.forEach(data.message, function(message) {
                        openDialog('Error', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                } else {
                    _ajaxErrorHandler();
                }

                $scope.isDisabled = false;
            });
        };

        /**
         * This event handler is to sign up.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.signup = function(event) {
            event.preventDefault();

            $scope.isDisabled = true;

            $http({
                method           : 'POST',
                url              : (POST_ORIGIN + '/account/signup'),
                timeout          : TIMEOUT,
                withCredentials  : true,
                params           : '',  // Query Parameters (GET)
                data             : {
                    'username' : $scope.signups.username,
                    'password' : $scope.signups.password,
                    '_csrf'    : $scope.csrf
                },
                headers          : {
                    //'X-Requested-With' : 'XMLHttpRequest',  // Unnecessary for CORS
                    'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                transformRequest : function(data) {
                    // JSON -> serialize (key1=value1&key2=value2 ...)
                    return $.param(data);
                }
            }).then(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf           = data.csrf;
                    $scope.isAuth         = data.isAuth;
                    $scope.authedUsername = data.username;

                    angular.forEach(data.message, function(message) {
                        openDialog('Confirmation', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                }

                $scope.isDisabled = false;
            }).catch(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf = data.csrf;

                    angular.forEach(data.message, function(message) {
                        openDialog('Error', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                } else {
                    _ajaxErrorHandler();
                }

                $scope.isDisabled = false;
            });
        };

        /**
         * This event handler is to sign out.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.signout = function(event) {
            $scope.isDisabled = true;

            $http({
                method           : 'POST',
                url              : (POST_ORIGIN + '/account/signout'),
                timeout          : TIMEOUT,
                withCredentials  : true,
                params           : '',  // Query Parameters (GET)
                data             : {
                    '_csrf' : $scope.csrf
                },
                headers         : {
                    //'X-Requested-With' : 'XMLHttpRequest',  // Unnecessary for CORS
                    'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                transformRequest : function(data) {
                    // JSON -> serialize (key1=value1&key2=value2 ...)
                    return $.param(data);
                }
            }).then(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf = data.csrf;

                    angular.forEach(data.message, function(message) {
                        openDialog('Confirmation', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                }

                $scope.isDisabled = false;
            }).catch(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf = data.csrf;

                    angular.forEach(data.message, function(message) {
                        openDialog('Error', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                } else {
                    _ajaxErrorHandler();
                }

                $scope.isDisabled = false;
            });
        };

        /**
         * This event handler is to delete account.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.deleteAccount = function(event) {
            // Delete OK ?
            $('<div />').html('<p><b>Delete your account. OK ?<br /> <b class="dangerous">If you delete account, the all of patches that you saved are also deleted.</b></b></p>').dialog({
                title     : 'Confirmation',
                autoOpen  : true,
                show      : 'bounce',
                hide      : 'explode',
                modal     : false,
                width     : 650,
                height    : 'auto',
                draggable : true,
                resizable : false,
                zIndex    : 9999,
                buttons   : {
                    'OK'    : function() {
                        _deleteAccount();

                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    },
                    'CANCEL' : function() {
                        $(this).dialog('close')
                               .dialog('destroy')
                               .remove();
                    }
                }
            });
        };

        /**
         * This event handler sets patch name.
         * @param {Event} event This argument is event object from ng-keyup directive.
         */
        $scope.typePatchname = function(event) {
            $scope.patchname = event.currentTarget.value;
        };

        /**
         * This event handler saves the designated patch.
         * @param {Event} event This argument is event object from ng-click directive.
         */
        $scope.savePatch = function(event) {
            $scope.isDisabled = true;

            $http({
                method           : 'POST',
                url              : (POST_ORIGIN + '/patch/add'),
                timeout          : TIMEOUT,
                withCredentials  : true,
                params           : '',  // Query Parameters (GET)
                data             : {
                    'name'  : $scope.patchname,
                    'patch' : angular.toJson(getCurrentPatches()),
                    '_csrf' : $scope.csrf
                },
                headers          : {
                    //'X-Requested-With' : 'XMLHttpRequest',  // Unnecessary for CORS
                    'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                transformRequest : function(data) {
                    // JSON -> serialize (key1=value1&key2=value2 ...)
                    return $.param(data);
                }
            }).then(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf       = data.csrf;
                    $scope.isAuth     = data.isAuth;
                    $scope.patchLists = angular.fromJson(data.patches);

                    angular.forEach(data.message, function(message) {
                        openDialog('Confirmation', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                }

                $scope.isDisabled = false;
            }).catch(function(response) {
                var data = response.data;

                if (angular.isObject(data)) {
                    $scope.csrf   = data.csrf;
                    $scope.isAuth = data.isAuth;

                    angular.forEach(data.message, function(message) {
                        openDialog('Error', 500, 'auto', false, ('<p><b>' + message + '</b></p>'));
                    });
                } else {
                    _ajaxErrorHandler();
                }

                $scope.isDisabled = false;
            });
        };

        /**
         *  This event handler opens the dialog for patch details.
         * @param {Event} event This argument is event object from ng-click directive.
         * @param {object|string} patchList This argument is patch data as associative array or JSON.
         */
        $scope.openPatchDetail = function(event, patchList) {
            if (angular.isObject(patchList) && (angular.isObject(patchList.patch))) {
                // Node.js + MongoDB
                $scope.patches = patchList.patch;
            } else if (angular.isString(patchList.patch)) {
                // PHP + MySQL
                var patch = patchList.patch.replace(/&quot;/g, '"')
                                           .replace(/&apos;/g, '\'')
                                           .replace(/&amp;/g, '&');

                $scope.patches = angular.fromJson(patch);
            } else {
                return;
            }

            $scope.isShowDialogPatchDetail = true;

            // Define dialog
            $('#' + $scope.dialogPatchDetailId).dialog({
                title     : patchList.name,
                autoOpen  : true,
                show      : 'explode',
                hide      : 'explode',
                modal     : false,
                width     : 600,
                height    : 400,
                draggable : true,
                resizable : false,
                zIndex    : 9999,
                position  : {
                    my : 'center top',
                    at : 'center top'
                },
                buttons   : {
                    'LOAD'   : function() {
                        _loadPatch($scope.patches, true);

                        $(this).dialog('close');
                    },
                    'UPDATE' : function() {
                        // Update OK ?
                        $('<div />').html('<p><b>Update the patch. OK ?</b></p>').dialog({
                            title     : 'Confirmation',
                            autoOpen  : true,
                            show      : 'explode',
                            hide      : 'explode',
                            modal     : false,
                            width     : 400,
                            height    : 'auto',
                            draggable : true,
                            resizable : false,
                            zIndex    : 10000,
                            buttons   : {
                                'OK'    : function() {
                                    _updatePatch(patchList.name);

                                    $(this).dialog('close')
                                           .dialog('destroy')
                                           .remove();

                                    $('#' + $scope.dialogPatchDetailId).dialog('close');
                                },
                                'CANCEL' : function() {
                                    $(this).dialog('close')
                                           .dialog('destroy')
                                           .remove();
                                }
                            }
                        });
                    },
                    'DELETE' : function() {
                        // Delet OK ?
                        $('<div />').html('<p><b>Delete the patch. OK ?</b></p>').dialog({
                            title     : 'Confirmation',
                            autoOpen  : true,
                            show      : 'explode',
                            hide      : 'explode',
                            modal     : false,
                            width     : 400,
                            height    : 'auto',
                            draggable : true,
                            resizable : false,
                            zIndex    : 10000,
                            buttons   : {
                                'OK'    : function() {
                                    _deletePatch(patchList.name);

                                    $(this).dialog('close')
                                           .dialog('destroy')
                                           .remove();

                                    $('#' + $scope.dialogPatchDetailId).dialog('close');
                                },
                                'CANCEL' : function() {
                                    $(this).dialog('close')
                                           .dialog('destroy')
                                           .remove();
                                }
                            }
                        });
                    },
                    'CLOSE'    : function() {
                        $(this).dialog('close');
                    }
                },
                close     : function(event, ui) {
                    $(this).dialog('destroy');

                    $timeout(function() {
                        $scope.isShowDialogPatchDetail = false;
                    });
                }
            });
        };

        $http({
            method          : 'GET',
            url             : POST_ORIGIN,
            timeout         : TIMEOUT,
            withCredentials : true,
            params          : '',  // Query Parameters (GET)
            headers         : {
                //'X-Requested-With' : 'XMLHttpRequest'  // Unnecessary for CORS
            }
        }).then(function(response) {
            var data = response.data;

           if (angular.isObject(data)) {
                $scope.isAuth         = data.isAuth;
                $scope.authedUsername = data.username;
                $scope.csrf           = data.csrf;

                if ($scope.isAuth) {
                    $scope.patchLists = angular.fromJson(data.patches);
                }
           }
        }).catch(function(response) {
            _ajaxErrorHandler();
        });
    }]);

})();
