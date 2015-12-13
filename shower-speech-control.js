shower.modules.define('shower-speech-control', [
    'Options',
    'util.extend'
], function (provide, Options, extend) {
    var DefaultOptions = {
        lang: 'ru-RU',
        continuous: true,
        interimResults: true
    };
    var EMPTY_FUNC = function () {};
    var DefaultCallbacks = {
        onStart: EMPTY_FUNC,
        onEnd: EMPTY_FUNC,
        onResult: EMPTY_FUNC,
        onError: EMPTY_FUNC
    };

    /**
     * @class
     * Shower speech control plugin.
     *
     * @param {Shower} shower
     * @param {Object} [options]
     * @param {String} [options.lang = 'ru-RU']
     * @param {Boolean} [options.continuous = true]
     * @param {Boolean} [options.interimResults = true]
     * @param {Boolean} [options.autoStart = false]
     * @param {Object} [options.callbacks]
     * @param {Function} [options.callbacks.onStart]
     * @param {Function} [options.callbacks.onEnd]
     * @param {Function} [options.callbacks.onResult]
     * @param {Function} [options.callbacks.onError]
     * @constructor
     */
    function SpeechControl(shower, options) {
        options = options || {};
        this._shower = shower;
        this._callbacks = extend({}, DefaultCallbacks, options.callbacks || {});

        this.options = new Options(extend({}, DefaultOptions, options));

        this._isSupports = 'webkitSpeechRecognition' in window;
        this._recognition = null;
        this._table = [];

        if (this._isSupports) {
            this._table = this._getSlidesTable();
            this._setup();
            this.start();
        }
    }

    SpeechControl.prototype = {
        destroy: function () {
            this._shower = null;
            this._recognition.stop();
            this._recognition = null;
        },

        /**
         * Start listen and recognize.
         *
         * @example
         * shower.modules.require(['shower'], function (sh) {
         *      var showerInstance = sh.getInited()[0];
         *      var plugin = sh.plugins.get('shower-speech-control');
         *      plugin.start();
         * });
         */
        start: function () {
            this._recognition.start();
        },

        /**
         * Stop listen and recognize.
         */
        stop: function () {
            this._recognition.stop();
        },

        /**
         * @returns {Boolean}
         */
        isSupports: function () {
            return this._isSupports;
        },

        _getSlidesTable: function () {
            var slides = this._shower.getSlides();
            var table = [];
            slides.forEach(function (slide) {
                var speechBookmark = slide.layout.getData('speechBookmark');
                if (speechBookmark) {
                    table.push({
                        bookmark: speechBookmark,
                        slide: slide
                    });
                }
            });
            return table;
        },

        _setup: function () {
            var recognition = new webkitSpeechRecognition();
            this._recognition = recognition;

            recognition.continuous = this.options.get('continuous');
            recognition.interimResults = this.options.get('interimResults');
            recognition.lang = this.options.get('lang');

            recognition.onstart = this._onStart.bind(this);
            recognition.onerror = this._onError.bind(this);
            recognition.onend = this._onEnd.bind(this);
            recognition.onresult = this._onResult.bind(this);
        },

        _getKeyWords: function () {
            this._keywords = {
                keyword: '',
                slide: ''
            }
        },

        _onStart: function (event) {
            this._callbacks.onStart(event);
        },

        _onError: function (error) {
            this._callbacks.onError(error);
        },

        _onEnd: function (event) {
            this.start();
            this._callbacks.onEnd(event);
        },

        _onResult: function (event) {
            var text = '';
            for (var i = event.resultIndex, k = event.results.length; i < k; i++) {
                text += event.results[i][0].transcript;
            }

            this._table.forEach(function (item) {
                if (text.indexOf(item.bookmark) !== -1) {
                    this._shower.player.go(item.slide);
                }
            }, this);

            this._callbacks.onResult(event);
        }
    };

    provide(SpeechControl);
});

shower.modules.require(['shower'], function (sh) {
    sh.plugins.add('shower-speech-control');
});
