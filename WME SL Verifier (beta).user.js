// ==UserScript==
// @name         WME No SL Verifier (beta)
// @namespace    https://greasyfork.org/users/45389
// @version      0.1.b1
// @description  Allows you to verify that a segment should not have a speed limit applied in WME (no sign posted, no local ordinances, etc).
// @author       MapOMatic
// @include      https://beta.waze.com/*editor/*
// @include      https://www.waze.com/*editor/*
// @exclude      https://www.waze.com/*user/editor/*
// @license      MIT/BSD/X11
// @require      https://www.gstatic.com/firebasejs/3.2.1/firebase.js
// ==/UserScript==

(function() {
    'use strict';
    var _debugLevel = 0;
    var _scriptVersion = GM_info.script.version;
    var signedInUser;
    var selectedSegId = null;

    function log(message, level) {
        if (message && level <= _debugLevel) {
            console.log('WME SL Verifier: ' + message);
        }
    }

    function toggleSignIn() {
        console.log(signedInUser);
        if (firebase.auth().currentUser) {
            // [START signout]
            firebase.auth().signOut();
            // [END signout]
        } else {
            firebase.auth().signInAnonymously().catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                log(error,0);
            }).then(function(user) {
                signedInUser = user;
            });
        }
    }

    function onSelectionChanged(evt) {
        console.log(evt);
        var items = W.selectionManager.selectedItems;
        if(items.length === 1 && items[0].model.type === 'segment') {
            $('#noSL').show();
            selectedSegId = items[0].model.attributes.id;
            var ref = 'no-sl/' + selectedSegId;
            log('Looking up in Firebase at "' + ref + '"', 0);
            firebase.database().ref(ref).once('value').then(function(data) {
                $('#cbox1').prop('checked', data.val() !== null);
            });
        } else {
            $('#noSL').hide();
        }
    }

    function init() {
        Waze.selectionManager.events.register("selectionchanged", null, onSelectionChanged);

        $('document').ready(function() {
            var $div = $('<div style="display:block;height:auto;width100%;padding-right:20px;" id="noSL">');
            $div.append($('<input type="checkbox" id="cbox1" value="first_checkbox"></input>)').change(function() {
                var ref = 'no-sl/' + selectedSegId;
                var value = this.checked ? 1 : null;
                firebase.database().ref(ref).set(value);
            })).hide();
            $div.append($('<label for="cbox1">no SL</label>'));
            $($('aside')[0]).append($div);
            console.log('div appended');
        });

        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyCQIqr9dNlZrvQjMnttkS1z4CQzzSiue-4",
            authDomain: "wme-sl-verifier.firebaseapp.com",
            databaseURL: "https://wme-sl-verifier.firebaseio.com",
            storageBucket: "wme-sl-verifier.appspot.com",
        };
        var result = firebase.initializeApp(config);

        toggleSignIn();
        console.log('initialized');
    }

    function bootstrap() {
        var bGreasemonkeyServiceDefined = false;
        try {
            if ("object" === typeof Components.interfaces.gmIGreasemonkeyService){
                bGreasemonkeyServiceDefined = true;
            }
        } catch (err) {
            //Ignore.
        }
        if ( "undefined" === typeof unsafeWindow || ! bGreasemonkeyServiceDefined) {
            unsafeWindow = (function () {
                var dummyElem   = document.createElement('p');
                dummyElem.setAttribute ('onclick', 'return window;');
                return dummyElem.onclick ();
            }) ();
        }

        var wz = unsafeWindow.W;
        if (wz && wz.loginManager &&
            wz.loginManager.events.register &&
            wz.map && wz.loginManager.isLoggedIn()) {
            log('Initializing...', 0);
            init();
        } else {
            log('Bootstrap failed. Trying again...', 0);
            unsafeWindow.setTimeout(function () {
                bootstrap();
            }, 1000);
        }
    }

    log('Bootstrap...', 0);
    bootstrap();
})();