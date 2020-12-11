'use strict';
    var reduxSettingsJSON;
    var flags = {
        "likesChanged":false,
        "stylesChanged":false
    }
    var likesInterval;
    var YTReduxURLPath;
    var YTReduxURLSearch;
    var aspectRatio = window.screen.width / window.screen.height;

    function getSettings(){
        if (localStorage.getItem("reduxSettings") == null){
            var newSettings = '{"gridItems": 6,"hideCastButton": false,"darkPlaylist": true,"smallPlayer": false, "showRawValues": true, "autoConfirm": true, "disableInfiniteScrolling": false, "alignContentToPlayer": false}';
            localStorage.setItem("reduxSettings", newSettings);
            reduxSettingsJSON = JSON.parse(newSettings);
        } else {
            reduxSettingsJSON = JSON.parse(localStorage.getItem("reduxSettings"));
        }
    }

    function confirmIt(){
        var confirmButton = document.querySelector('paper-dialog > yt-confirm-dialog-renderer > div:last-child > div > #confirm-button');
        if (confirmButton != null && !document.querySelector('paper-dialog[aria-hidden="true"]')){
            confirmButton.click();
            document.querySelector('video').play();
            //console.log('Clicked at: ' + new Date());
        }
    }

    function resumePlayback(){
        if (!document.querySelector('ytd-miniplayer[active]') && document.querySelector('.ytp-play-button > svg > path').getAttribute('d') == 'M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z'){ //click play if it's the displayed button icon and there is no mini player
            document.querySelector('.ytp-play-button').click();
            console.log('YouTube Redux Unpaused at: ' + new Date());
        }
    }

    function changeGridWidth(){
        if (location.pathname == "/"){
            var retry = setInterval(function(){
                var styleItem = document.querySelector("#primary > ytd-rich-grid-renderer");
                var currentStyle = styleItem.style.cssText;
                var currentStyleArray = currentStyle.split(";");
                var currentSettings = currentStyle.match(/\d+/gm);

                for (var i = 0; i < currentStyleArray.length-1; i++){ //split, replace and join settings on the fly
                    if (currentStyleArray[i].includes('--ytd-rich-grid-items-per-row')){
                        var splitElement = currentStyleArray[i].split(":");
                        splitElement[1] = reduxSettingsJSON.gridItems + " !important"; //to override different important from css
                        currentStyleArray[i] = splitElement.join(":");  
                    }
                }
                styleItem.style.cssText = currentStyleArray.join(";");
                if (currentStyle != "" && currentStyle.includes('--ytd-rich-grid-items-per-row:' + reduxSettingsJSON.gridItems)){clearInterval(retry);};
            },100);
        }
    }

    function addCustomStyles(){
        if (!flags.stylesChanged){
            var conditionalCast = reduxSettingsJSON.hideCastButton ? `/*PLAY ON TV BUTTON*/[class="ytp-button"] {display:none !important;}` : '';
            var conditionalPlayerSize = reduxSettingsJSON.smallPlayer ? `
/*SMALL PLAYER*/
#primary {
max-width: calc((100vh - (var(--ytd-watch-flexy-masthead-height) + var(--ytd-margin-6x) + var(--ytd-watch-flexy-space-below-player))) * (${window.screen.width} / ${window.screen.height})) !important;
min-width: calc(var(--ytd-watch-flexy-min-player-height) * (${window.screen.width} / ${window.screen.height})) !important;
}
#player-container-outer {
width:calc(480px * ${aspectRatio}) !important;
height:480px !important;
}
#player-container-inner {
    padding-top: calc(${window.screen.height} / ${window.screen.width} * 100%) !important;
}
.html5-video-container {
    width:100% !important;
    height:100% !important;
}
.html5-video-container video {
width:100% !important;
height:100% !important;
left:0 !important;
}
[class="ytp-chrome-bottom"] {
width: calc(100% - (2 * 12px)) !important;
}
` : '';
            var conditionalDarkPlaylist = reduxSettingsJSON.darkPlaylist ? `
/*DARK PLAYLIST*/
#playlist.ytd-watch-flexy {
transform: translate(-25px, -1px);
}
.header.ytd-playlist-panel-renderer {
background-color: #1a1a1a;
}
ytd-playlist-panel-renderer[collapsible] .title.ytd-playlist-panel-renderer {
color: #fff;
}
.publisher.ytd-playlist-panel-renderer {
color: #B8B8B8;
}
.playlist-items.ytd-playlist-panel-renderer {
background-color: #222;
}
#video-title.ytd-playlist-panel-video-renderer {
color: #CACACA;
}
#byline.ytd-playlist-panel-video-renderer {
color: #767676;
}
ytd-playlist-panel-video-renderer.ytd-playlist-panel-renderer:hover:not(.dragging) {
background-color: #525252;
}
ytd-playlist-panel-video-renderer[selected] {
background-color: #3a3a3a !important;
}
yt-formatted-string[has-link-only_]:not([force-default-style]) a.yt-simple-endpoint.yt-formatted-string:visited {
color: #CACACA;
}
` : '';
            var customStyle = document.createElement("style");
            customStyle.id = 'redux-style';
            var customStyleInner = conditionalCast + conditionalPlayerSize + conditionalDarkPlaylist;
            customStyle.appendChild(document.createTextNode(customStyleInner));
            document.head.append(customStyle);
            flags.stylesChanged = true;

            //window.dispatchEvent(new Event('resize'));
        }
    }

    function waitForElement(selector, interval, callback){
        var wait = setInterval(() => {
            var element = document.querySelector(selector)
            if (element != null){
                clearInterval(wait);
                callback();
            }
        }, interval);
    }

    function alignItems(){
        var player = document.querySelector('.html5-video-container video');
        var content = document.querySelector('#columns > #primary > #primary-inner');
        var calcPadding = player == null || content == null ? 0 : player.getBoundingClientRect().left - content.getBoundingClientRect().left;
        if (calcPadding == 0 || calcPadding >= 1000 || player == null || content == null){
            waitForElement('#columns > #primary > #primary-inner', 10, alignItems);
        } else {
            var reduxAlignElement = document.querySelector('#redux-style-align');
            var calcInner = `
            #columns > #primary > #primary-inner {
                padding: 0 ${calcPadding}px 0 ${calcPadding}px !important;
            }
            `;
            if (reduxAlignElement == null){
                var customStyle = document.createElement("style");
                customStyle.id = 'redux-style-align';
                var customStyleInner = calcInner;
                customStyle.appendChild(document.createTextNode(customStyleInner));
                document.head.append(customStyle); 
            } else {
                reduxAlignElement.innerHTML = calcInner;
            }
        }
    }

    function changeLikesCounter(){
        if (!flags.likesChanged && document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:first-child > a > yt-formatted-string[aria-label]')[0] !== undefined){
            var changeLikesInterval = setInterval(function(){
                var likes = document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:first-child > a > yt-formatted-string')[0];
                var dislikes = document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:nth-child(2) > a > yt-formatted-string')[0];
                var rawLikes = document.querySelectorAll('#info > #menu-container > ytd-sentiment-bar-renderer > paper-tooltip > #tooltip')[0].innerText.split("/")[0].trim();
                var rawDislikes = document.querySelectorAll('#info > #menu-container > ytd-sentiment-bar-renderer > paper-tooltip > #tooltip')[0].innerText.split("/")[1].trim();
                likes.innerText = rawLikes;
                dislikes.innerText = rawDislikes;
            },10);
            setTimeout(function(){
                flags.likesChanged = true;
                clearInterval(changeLikesInterval);
            },3000);
        }
    }

    function isTheater(){
        if (document.querySelector('ytd-watch-flexy[theater]') != null){
            return true;
        }
    }

    function isFullscreen(){
        if (document.querySelector('ytd-watch-flexy[fullscreen]') != null){
            return true;
        }
    }

    function recalc(){
        //console.log('Recalculate video dimensions');
        var previewHeightOffset = '303px'; //TODO get real offset from default height to small height (currently 720px to 480px)
        var observerConfig = {
            attributeFilter: ["style"]
        }
        var previewElement;

        function fixPreview(){
            if (!isTheater() && !isFullscreen()){
                previewElement.style.top = previewHeightOffset; 
            }
        }

        function setObserver(){
            var observer = new MutationObserver(fixPreview);
            observer.observe(previewElement, observerConfig); 
        }

        var checkForPreview = setInterval(() => {
            previewElement = document.querySelector('div[aria-live="polite"]:not(.iron-a11y-announcer)');
            if (previewElement != null && previewElement != undefined){
                clearInterval(checkForPreview);
                setObserver();
            }
        }, 100)
    }

    function startObserving(){

        function insertDummy(){
            var infiniteStopped = false;
            var comments = document.querySelectorAll('ytd-comment-thread-renderer');
            var suggestions = document.querySelectorAll('ytd-compact-video-renderer');
            if (comments.length >= 0 && !infiniteStopped){
                observer.disconnect();
                var dummyComment = document.createElement('div');
                dummyComment.id = 'dummyComment';
                dummyComment.style = 'height:2000px;width:100%; text-align:center;';
                dummyComment.innerHTML = '<input type="button" style="height:30px; width:50%; transition-duration: 0.5s;" value="Show more..."></input>';
                contentsElement.append(dummyComment);
                infiniteStopped = true;
                document.onscroll = preventScrolling;
                document.querySelector('#dummyComment > input').addEventListener('click', () => {
                    dummyComment.remove();
                    infiniteStopped = false;
                    window.scrollBy({top: 100, left: 0, behavior: "smooth"});
                    observer.observe(contentsElement, observerConfig);
                });
            }
        }

        var observerConfig = {
            childList: true
        }
        var contentsElement = document.querySelector('#contents.style-scope.ytd-item-section-renderer');
        var observer = new MutationObserver(insertDummy);
        observer.observe(contentsElement, observerConfig);
    }

    function preventScrolling(){
        var blocker = document.querySelector('#dummyComment > input');
        if (blocker != null && window.scrollY >= blocker.offsetTop - (window.innerHeight/2)){
            blocker.scrollIntoView({block: "center"});
        }
    }

    function checkForComments(){
        var checkForCommentsInt = setInterval(() => {
            if (document.querySelector('#contents > ytd-comment-thread-renderer') != null){
                clearInterval(checkForCommentsInt);
                startObserving();
            }
        }, 500)
    }

    function clearStuff(){
        document.onscroll = function(){};
        if (!!document.querySelector('#dummyComment')){
            document.querySelector('#dummyComment').remove();  
        }
    }

    function main(){
        getSettings();
        if (reduxSettingsJSON.autoConfirm){
            var interval = interval == undefined ? setInterval(confirmIt, 500) : undefined;
        }
        if (reduxSettingsJSON.smallPlayer && window.location.href.includes('/watch?')){
            recalc();
        }
        if (reduxSettingsJSON.disableInfiniteScrolling && window.location.href.includes('/watch?')){
            checkForComments();
        }
        if (reduxSettingsJSON.alignContentToPlayer && window.location.href.includes('/watch?')){
            waitForElement('#columns > #primary > #primary-inner', 10, alignItems);
        }
        changeGridWidth();
        addCustomStyles();
        var changeLikes = reduxSettingsJSON.showRawValues ? setInterval(changeLikesCounter,10) : '';
        setTimeout(function(){
            clearInterval(changeLikes);
        },3000);
    }

    function start(){
        main();
        YTReduxURLPath = location.pathname;
        YTReduxURLSearch = location.search;
        var checkURLChange = setInterval(function(){
            if (location.pathname != YTReduxURLPath || location.search != YTReduxURLSearch){
                YTReduxURLPath = location.pathname;
                YTReduxURLSearch = location.search;
                flags.likesChanged = false;
                if (reduxSettingsJSON.disableInfiniteScrolling){
                    clearStuff();
                }
                main();
            }
        },100);
    }

    start();