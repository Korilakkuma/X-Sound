/** 
 * controller.js
 *
 * @fileoverview AngularJS controller for X Sound Application
 * 
 * JavaScript Libraries :
 *     XSound.js (https://github.com/Korilakkuma/XSound)
 *     jQuery / jQuery UI
 *     select2.js
 *
 * Copyright 2012, 2013, 2014@Tomohiro IKEDA
 * Released under the MIT license
 */
 
 
 
(function() {

    var xsound = angular.module('xsound', []);

    /**
     * This configuration for set Data URL and Object URL  (except "unsafe:").
     * @param {$compileProvider} This argument is service of DI (Dependency Injection).
     */
    xsound.config(['$compileProvider', function($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data|blob):/);
    }]);

    /**
     * for loading resources (one-shot audios, RIRs, MML texts).
     */
    xsound.factory('BASE_URL', ['$location', function($location) {
        var baseURL = '';

        if ($location.host() === 'localhost') {
            baseURL = $location.protocol() + '://' + $location.host() + '/~rilakkuma3xjapan/portfolio-x-sound/resources/';
        } else {
            baseURL = $location.protocol() + '://' + $location.host() + '/X-Sound/resources/';
        }

        return baseURL;
    }]);

    /**
     * This is the sound sources that this application uses.
     */
    xsound.value('sources', ['mixer', 'oscillator', 'oneshot', 'audio', 'stream']);

    /**
     * This service sets parameter each oscillator.
     * @param {number} number This argument is either 0 or 1 in this application.
     * @param {string} module This argument is module name this is defined by XSound.js.
     * @param {string} param This argument is parameter name that is defined by XSound.js.
     * @param {number|string} value This argument is parameter value.
     */
    xsound.value('updateParamEachOscillator', function(number, module, param, value) {
        var oscillatorNumbers = [0, 1, 2, 3];

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

    /*
     * This service sets parameter for module.
     * @param {string} source This argument is sound source name that is defined by XSound.js.
     * @param {string} module This argument is module name this is defined by XSound.js.
     * @param {string} param This argument is parameter name that is defined by XSound.js.
     * @param {number|string} value This argument is parameter value.
     */
    xsound.value('updateParamOfModule', function(source, module, param, value) {
        if ((source === 'oscillator') && (module === 'eg')) {
            X('oscillator').module('eg').param(param, value);
            C('oscillator').module('eg').param(param, value);
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

    xsound.factory('updateParam', ['updateParamEachOscillator', 'updateParamOfModule', 'updateParamOfSource', function(updateParamEachOscillator, updateParamOfModule, updateParamOfSource) {
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
                sources = ['mixer', 'oscillator', 'oneshot', 'audio', 'stream'];
            }

            angular.forEach(sources, function(source) {
                var matches = source.match(/oscillator(0|1)/);

                if (matches !== null) {
                    updateParamEachOscillator(parseInt(matches[1]), module, param, value);
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
            buttons   : {
                'OK'    : function() {
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
            try {
                var file = X.file(options);
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
                scope.readFileProgress         = progress;

                if (!scope.isModalProgressReadFile) {
                    scope.isModalProgressReadFile = true;
                }
            });
        }
    });

    /**
     * This service redraws Canvas or SVG according to audio position.
     * @param {$scope} scope This argument is scope object of AudioController.
     * @param {$timeout} timeout This argument is in order to update view.
     * @param {number} currentTime This argument is current time of audio.
     */
    xsound.value('drawNodeCallback', function(scope, timeout, currentTime) {
        if ((currentTime >= 0) && (currentTime <= X('audio').param('duration'))) {
            X('audio').param('currentTime', currentTime);
            X('audio').module('analyser').domain('time-all-L').update(currentTime);
            X('audio').module('analyser').domain('time-all-R').update(currentTime);

            var times = X.convertTime(currentTime);

            timeout(function() {
                scope.currentTime     = currentTime;
                scope.currentTimeText = ('0' + times.minutes).slice(-2) + ' : ' + ('0' + times.seconds).slice(-2) + '.' + String(times.milliseconds).slice(2, 4);
            });
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

        $rootScope.isActives               = {};
        $rootScope.isActives.visualization = false;
        $rootScope.isActives.mml           = false;

        //Initialization for using XSound.js

        // Clone X object as global object
        $window.C = X.clone();  // for MML of OscillatorModule

        // Not used
        X.free([
            X('media'),
            X('fallback'),
            C('oneshot'),
            C('audio'),
            C('media'),
            C('fallback'),
            C('stream'),
            C('mixer')
        ]);

        // Resize buffer of ScriptProcessorNode
        X('mixer').resize(4096);
        X('oscillator').resize(4096);
        C('oscillator').resize(4096);
        X('oneshot').resize(4096);
        X('audio').resize(8192);
        X('stream').resize(512);

        X('oscillator').setup([true, false, false, false]);
        C('oscillator').setup([false, false, false, false]);

        X('stream').setup(false, function(stream) {
            console.dir(stream);
        }, function(error) {
            openDialog('Confirmation', 400, 'auto', true, '<p><b>Cancel Microphone.</b></p>');
            console.dir(error);
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
    }]);

    /**
     * Directive for wrapping jQuery UI Slider.
     * @param {function} updateParam This argument is service of DI (Dependency Injection).
     */
    xsound.directive('uiSlider', ['updateParam', function(updateParam) {
        return {
            restrict : 'EA',
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
            restrict : 'EA',
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
     */
    xsound.directive('uiSliderTime', [function() {
        return {
            restrict : 'EA',
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
                    }
                });

                // Object.observe
                scope.$watch(function() {
                    return scope.duration;
                }, function(newVal) {
                    $('#slider-audio-current-time').slider('option', 'max', newVal);
                    $('#spinner-audio-current-time').spinner('option', 'max', newVal);
                });

                // Object.observe
                scope.$watch(function() {
                    return scope.currentTime;
                }, function(newVal) {
                    $('#slider-audio-current-time').slider('value', newVal);
                    $('#spinner-audio-current-time').spinner('value', newVal);
                });
            }
        };
    }]);

   /**
     * Directive for current time of audio (Spinner).
     */
    xsound.directive('uiSpinnerTime', [function() {
        return {
            restrict : 'EA',
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
     */
    xsound.directive('uiModalProgress', [function() {
        return {
            restrict   : 'EA',
            link       : function(scope, iElement, iAttrs, controller, iTransclude) {
                $(iElement).css({
                    'position'         : 'fixed',
                    'top'              : '0px',
                    'left'             : '0px',
                    'z-index'          : 9999,
                    'padding'          : '15% 0%',
                    'width'            : '100%',
                    'height'           : '100%',
                    'background-color' : 'rgba(0, 0, 0, 0.6)'
                });
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
     */
    xsound.directive('uiSelect', ['$timeout', 'sources', function($timeout, sources) {
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
                                        scope.currentSoundSource = value;
                                    });

                                    break;
                                case 'one-shot'   :
                                    if (scope.isEnableOneshot) {
                                        $timeout(function() {
                                            // This is scope of XSoundController
                                            scope.currentSoundSource = value;
                                        });
                                    }

                                    X('stream').stop();

                                    break;
                                case 'microphone' :
                                    try {
                                        X('stream').start();
                                        X('stream').module('session').start();
                                    } catch (error) {
                                        openDialog('Error', 400, 'auto', true, ('<p><b>' + error.message + '</b></p>'));

                                        $timeout(function() {
                                            // This is scope of XSoundController
                                            scope.currentSoundSource = value;
                                        });
                                    }

                                    break;
                                case 'midi' :
                                    X('stream').stop();
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
                                if ((source !== 'oscillator') && (source !== 'audio')) {
                                    X(source).module('recorder').ready(value);
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
     * This controller is super class in X Sound Application
     * @param {$rootScope} $rootScope This argument is service of DI (Dependency Injection).
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$window} $window This argument is service of DI (Dependency Injection).
     * @param {$timeout} $timeout This argument is to update view.
     * @param {string} BASE_URL This argument is service of DI (Dependency Injection).
     * @param {Array.<string>} sources readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} openDialog This argument is service of DI (Dependency Injection).
     */
    xsound.controller('XSoundController', ['$rootScope', '$scope', '$window', '$timeout', 'BASE_URL', 'sources', 'openDialog', function($rootScope, $scope, $window, $timeout, BASE_URL, sources, openDialog) {
        var NUMBER_OF_ONESHOTS = 88;
        var AJAX_TIMEOUT       = 60000;

        var _oneshots = [
            (BASE_URL + 'one-shot/piano-2/C.wav'),
            (BASE_URL + 'one-shot/piano-2/D.wav'),
            (BASE_URL + 'one-shot/piano-2/E.wav'),
            (BASE_URL + 'one-shot/piano-2/F.wav'),
            (BASE_URL + 'one-shot/piano-2/G.wav'),
            (BASE_URL + 'one-shot/piano-2/A.wav'),
            (BASE_URL + 'one-shot/piano-2/B.wav')
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
                    break;
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

        var _calculateRate = function(pianoIndex) {
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
                setting.rate   = _calculateRate(i);

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
                            $scope.progressStyle['width'] = $scope.progress + '%';
                        });

                        if (reverbs.length === $scope.rirs.length) {
                            angular.forEach(sources, function(source) {
                                X(source).module('reverb').preset(reverbs);
                            });

                            C('oscillator').module('reverb').preset(reverbs);

                            _loadUI();
                        }
                    }, function() {
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
                    openDialog('Error', 400, 'height', true, '<p><b>The loading of audio files failed.</b></p>');
                },
                progress : function(event) {
                }
            });
        } catch (error) {
            openDialog('Error', 400, 'height', true, ('<p><b>' + error.message + '</b></p>'));
        }

        // This model is refered by other controllers.
        $scope.currentSoundSource = 'oscillator';

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

        $scope.headerStyle = {'top' : (parseInt(($window.innerHeight) / 4) + 'px')};

        // Models for modal window directive
        $scope.isModalProgressDecodeAudio   = false;
        $scope.isModalProgressReadFile      = false;
        $scope.isModalProgressSessionWait   = false;

        // Models for Oscillator
        $scope.oscillators                      = {};
        $scope.oscillators.oscillator0          = {};
        $scope.oscillators.oscillator0.isActive = true;
        $scope.oscillators.oscillator0.type     = 'sine';
        $scope.oscillators.oscillator1          = {};
        $scope.oscillators.oscillator1.isActive = false;
        $scope.oscillators.oscillator1.type     = 'sine';

        $scope.readFileProgress = '';

        // for Revreb
        $scope.rirs = (function() {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
                // Firefox
                return [];
            } else {
                // Chrome, Opera, Safari
                return [
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
            }
        })();

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

            if ($scope.currentSoundSource === 'oscillator') {
                X('oscillator').ready(0, 0).start(X.toFrequencies(index));
                C('oscillator').ready(0, 0).start(X.toFrequencies(index));

                X('mixer').mix([X('oscillator'), C('oscillator')]);

                X('mixer').module('recorder').start();
                X('mixer').module('session').start();
            } else {
                X('oneshot').ready(0, 0).start(index);

                X('oneshot').module('recorder').start();
                X('oneshot').module('session').start();
            }

            $scope.isSoundStops[index] = false;
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
            } else {
                X('oneshot').stop(index);
            }

            $scope.isSoundStops[index] = true;
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
            var state = !$scope.oscillators['oscillator' + number]['isActive'];

            switch (number) {
                case 0 :
                    X('oscillator', 0).state(state);
                    break;
                case 1 :
                    C('oscillator', 0).state(state);
                    break;
                default :
                    break;
            }

            $scope.oscillators['oscillator' + number]['isActive'] = state;
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
         * This event handler is to change oscillator's wave type.
         * @param {Event} event This argument is event object from ng-click directive.
         * @param {number} number This argument is either 0 or 1.
         * @param {string} type This argument is one of 'sine', 'square', 'sawtooth', 'triangle'.
         */
        $scope.changeWaveType = function(event, number, type) {
            switch (number) {
                case 0 :
                    X('oscillator', 0).param('type', type);
                    break;
                case 1 :
                    C('oscillator', 0).param('type', type);
                    break;
                default :
                    break;
            }

            $scope.oscillators['oscillator' + number]['type'] = type;
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
     * @param {$scope} $scope This argument is scope of this controller.
     * @param {$timeout} $timeout This argument is to update view.
     * @extends {XSoundController}
     */
    xsound.controller('AudioController', ['$scope', '$timeout', function($scope, $timeout) {
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

                // Update UI value
                var times = X.convertTime(duration);

                $scope.durationText    = ('0' + Math.floor(times.minutes)).slice(-2)+ ' : ' + ('0' + Math.floor(times.seconds)).slice(-2) + '.' + String(times.milliseconds).slice(2, 4);
                $scope.currentTimeText = '00 : 00.00';
            });
        };

        var _startCallback = function(source, currentTime) {
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
            var times = X.convertTime(currentTime);

            $timeout(function() {
                $scope.currentTime     = currentTime;
                $scope.currentTimeText = ('0' + times.minutes).slice(-2) + ' : ' + ('0' + times.seconds).slice(-2) + '.' + String(times.milliseconds).slice(2, 4);
            });
        };

        var _endedCallback = function(source, currentTime) {
            X('audio').module('analyser').domain('time-all-L').update(0);
            X('audio').module('analyser').domain('time-all-R').update(0);

            $timeout(function() {
                $scope.isActive        = false;
                $scope.currentTime     = 0;
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
                buttons   : {
                    'START' : function() {
                        angular.forEach(sources, function(source) {
                            if ((source !== 'oscillator') && (source !== 'audio')) {
                                X(source).module('recorder').ready($scope.activeTrack);
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
                buttons   : {
                    'STOP'  : function() {
                        angular.forEach(sources, function(source) {
                            if ((source !== 'oscillator') && (source !== 'audio')) {
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
            if ((source !== 'oscillator') && (source !== 'audio')) {
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
            var TYPE    = 'blob';  // or 'dataURL'

            var source = $scope.$parent.currentSoundSource;

            if (source === 'oscillator') {
                source = 'mixer';
            }

            $scope.objectURL = X(source).module('recorder').create('all', BIT, CHANNEL, TYPE);

            if ($scope.objectURL) {
                var audio = new Audio($scope.objectURL);

                audio.setAttribute('controls', false);
                audio.play();
            }
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
                buttons   : {
                    'CLEAR' : function() {
                        angular.forEach(sources, function(source) {
                            if ((source !== 'oscillator') && (source !== 'audio')) {
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
     * @param {$timeout} $timeout This argument is to update view.
     * @param {Array.<string>} sources readFileByDragAndDrop This argument is service of DI (Dependency Injection).
     * @param {function} drawNodeCallback This argument is service of DI (Dependency Injection).
     * @extends {XSoundController}
     */
    xsound.controller('VisualizationController', ['$rootScope', '$scope', '$timeout', 'sources', 'drawNodeCallback', function($rootScope, $scope, $timeout, sources, drawNodeCallback) {
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

            X(source).module('analyser').domain('time').setup(api, (api + '-time'), 'svg-parent-time').param({
                interval : 500,
                shape    : 'line',
                wave     : 'rgba(0, 0, 255, 1.0)',
                font     : '12px Times New Roman',
                width    : 2,
                right    : 0
            });

            X(source).module('analyser').domain('fft').setup(api, (api + '-spectrum'), 'svg-parent-spectrum').param({
                interval : 500,
                shape    : 'rect',
                wave     :  (api === 'canvas') ? 'gradient' : 'rgba(0, 0, 255, 1.0)',
                grad     : [{offset : 0, color : 'rgba(0, 128, 255, 1.0)'}, {offset : 1, color : 'rgba(0, 0, 255, 1.0)'}],
                font     : '12px Times New Roman',
                width    : 2,
                right    : 0,
                type     : 'uint',
                size     : 256
            });
        };

        /**
         * This function initializes analyser each domain ("time-all-L" and "time-all-R").
         * @param {string} api This argument is either 'canvas' or 'svg'.
         */
       $scope.setAnalyser = function(api) {
            X('audio').module('analyser').domain('time-all-L').setup(api, (api + '-time-all-L'), 'svg-parent-L').state(true).param({
                shape : (api === 'canvas') ? 'rect' : 'line',
                wave  : (api === 'canvas') ? 'gradient' : 'rgba(0, 0, 255, 1.0)',
                grad  : [{offset : 0, color : 'rgba(0, 128, 255, 1.0)'}, {offset : 1, color : 'rgba(0, 0, 255, 1.0)'}],
                font  : '12px Times New Roman',
                width : 0.5,
                right : 0
            });

            X('audio').module('analyser').domain('time-all-R').setup(api, (api + '-time-all-R'), 'svg-parent-R').state(true).param({
                shape : (api === 'canvas') ? 'rect' : 'line',
                wave  : (api === 'canvas') ? 'gradient' : 'rgba(0, 0, 255, 1.0)',
                grad  : [{offset : 0, color : 'rgba(0, 128, 255, 1.0)'}, {offset : 1, color : 'rgba(0, 0, 255, 1.0)'}],
                font  : '12px Times New Roman',
                width : 0.5,
                right : 0
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
            X('audio').module('analyser').domain('time-all-L').drag(function(currentTime) {drawNodeCallback($scope, $timeout, currentTime);});
            X('audio').module('analyser').domain('time-all-R').drag(function(currentTime) {drawNodeCallback($scope, $timeout, currentTime);});
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
     * @param {string} BASE_URL This argument is service of DI (Dependency Injection).
     * @param {function} createDateTimeString This argument is service of DI (Dependency Injection).
     * @extends {XSoundController}
     */
    xsound.controller('MMLController', ['$rootScope', '$scope', '$http', '$timeout', 'BASE_URL', 'createDateTimeString', function($rootScope, $scope, $http, $timeout, BASE_URL, createDateTimeString) {
        var _oscillatorNumbers = [0, 1, 2, 3];

        var _startCallback =  function(sequence, index) {
            if ($scope.$parent.currentSoundSource === 'oscillator') {
                X('mixer').mix([X('oscillator'), C('oscillator')]);
            }

            if (sequence.indexes[index] === 'R') {
                return;
            }

            var pianoIndex = sequence.indexes[index];

            $timeout(function() {
                $scope.$parent.isSoundStops[pianoIndex] = false;
            });
        };

        var _stopCallback = function(sequence, index) {
            if (sequence.indexes[index] === 'R') {
                return;
            }

            var pianoIndex = sequence.indexes[index];

            $timeout(function() {
                $scope.isSoundStops[pianoIndex] = true;
            });
        };

        var _endedCallback = function() {
            angular.forEach(_oscillatorNumbers, function(number) {
                X('oscillator', number).state(false);
                C('oscillator', number).state(false);
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
                default    :
                    //$scope.error = 'The designated MML is invalid.';
                    break;
            }
        };

        var _mmlSetups = {
            start : _startCallback,
            stop  : _stopCallback,
            ended : _endedCallback,
            error : _errorCallback
        };

        X('mml').setup(_mmlSetups);
        C('mml').setup(_mmlSetups);

        $scope.paused   = true;
        $scope.mml      = '';
        $scope.dataURL  = '';
        $scope.filename = '';
        $scope.error    = '';

        // Object.observe
        // Chnage sound source -> parse MML text
        $scope.$watch(function() {
            return $scope.$parent.currentSoundSource;
        }, function(newVal) {
            $scope.readyMML();
        });

        // Get MML tex for placeholder
        $http.get(Math.floor(Math.random() * 2) ? (BASE_URL + 'mml/mml-foreverlove.txt') : (BASE_URL + 'mml/mml-tears.txt'))
             .success(function(data, status, headers, config) {
                 $scope.mml = data;
                 $scope.typeMML();
             })
             .error(function(data, status, headers, config) {
             });

        /**
         * This event hander is to update MML text.
         * @param {Event} event This argument is event object from ng-keyup directive.
         */
        $scope.typeMML = function(event) {
            $scope.readyMML();
            $scope.paused = true;
        };

        /**
         * This function parses MML text and sets performance information.
         */
        $scope.readyMML = function() {
            var mmls = $scope.mml.split(/\|+/);

            if ($scope.$parent.currentSoundSource === 'oscillator') {
                if (mmls.length > 0) {
                    X('mml').ready(X('oscillator'), mmls[0]);
                    C('mml').ready(C('oscillator'), []);
                }

                if (mmls.length > 1) {
                    C('mml').ready(C('oscillator'), mmls[1]);
                }
            } else {
                X('mml').ready(X('oneshot'), mmls);
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
                    angular.forEach(_oscillatorNumbers, function(number) {
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
                    angular.forEach(parts, function(part, index) {
                        X('mml').start(index);
                    });

                    X('oneshot').module('recorder').start();
                    X('oneshot').module('session').start();
                }

                $scope.paused = false;
            } else {
                // Stop MML
                X('mml').stop();
                C('mml').stop();

                angular.forEach(_oscillatorNumbers, function(number) {
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

            $scope.dataURL  = X('mml').download($scope.mml);
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
        var HOST = '';
        var PATH = '';

        if ($location.host().indexOf('localhost') !== -1) {
            HOST = 'localhost';
            PATH = '';
        } else if ($location.host().indexOf('korilakkuma.github.io') !== -1) {
            HOST = '210.152.156.200';
            PATH = '/home/node/websocket/';
        }

        var _openCallback = function(event, socket) {
            openDialog('Confirmation', 800, 'auto', false, ('<p><b>Connection to (' + socket.url + ') succeeded.</b></p>'));

            $timeout(function() {
                $scope.isActive = true;
            });
        };

        var _closeCallback = function(event, socket) {
            openDialog('Confirmation', 400, 'auto', true, '<p><b>Connection closed.</b></p>');

            $timeout(function() {
                $scope.isActive = false;
            });
        };

        var _errorCallback = function(event, socket) {
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
                if (X('mixer').module('session').isConnected()
                    && X('oneshot').module('session').isConnected()
                    && X('audio').module('session').isConnected()
                    && X('stream').module('session').isConnected()) {
                    // Connection to server has existed already
                   angular.forEach(sources, function(source) {
                        if (source !== 'oscillator') {
                            X(source).module('session').state(true, _stateCallback, _waitCallback);
                        }
                    });
                } else {
                    var _sessionSetups = {
                        tls   : false,
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
                                X('mixer').module('session')
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

})();
