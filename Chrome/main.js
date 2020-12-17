'use strict';
    var reduxSettingsJSON;
    var flags = {
        "likesChanged":false,
        "stylesChanged":false,
        "isRearranged":false
    }
    var likesInterval;
    var YTReduxURLPath;
    var YTReduxURLSearch;
    var aspectRatio = window.screen.width / window.screen.height;

    function getSettings(){
        if (localStorage.getItem("reduxSettings") === null){
            var newSettings = '{"gridItems": 6,"hideCastButton": false,"darkPlaylist": true,"smallPlayer": false, "showRawValues": true, "autoConfirm": true, "disableInfiniteScrolling": false, "blackBars": false, "rearrangeInfo": false, "classicLogo": false}';
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
max-width: calc(480px * ${aspectRatio}) !important;
min-width: 0 !important;
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
.title.ytd-playlist-panel-renderer {
--yt-endpoint-color: white;
}
.title.ytd-playlist-panel-renderer a:hover {
--yt-endpoint-color: white;
color: white !important;
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
#publisher-container > yt-formatted-string[has-link-only_]:not([force-default-style]) a.yt-simple-endpoint.yt-formatted-string:visited {
color: #CACACA;
}
` : '';
            var conditionalLogo = reduxSettingsJSON.classicLogo ? `
            #logo-icon-container {
                content: url('${chrome.extension.getURL('/images/classicLogo.png')}');
                width: 72px !important;
                height: auto !important;
            }
            ` : '';

            var customStyle = document.createElement("style");
            customStyle.id = 'redux-style';
            var customStyleInner = conditionalCast + conditionalPlayerSize + conditionalDarkPlaylist + conditionalLogo;
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
        var calcPadding = player == null || content == null ? 0 : Math.ceil(player.getBoundingClientRect().left - content.getBoundingClientRect().left);
        if (calcPadding == 0 || calcPadding >= 1000 || player == null || content == null){
            waitForElement('#columns > #primary > #primary-inner', 10, alignItems);
        } else {
            var reduxAlignElement = document.querySelector('#redux-style-align');
            var calcInner = `
            #columns > #primary > #primary-inner {
                padding: 0 ${calcPadding}px 0 ${calcPadding}px !important;
            }
            #secondary.ytd-watch-flexy {
                transform: translateX(-${calcPadding}px);
            }
            #playlist > #container {
                max-height: calc(${Math.ceil(document.querySelector('video').getBoundingClientRect().height)}px + 1px) !important;
            }
            `;
            if (reduxSettingsJSON.blackBars){
                calcInner += `
                .html5-video-container video {
                    background-color: black;
                }
                `;
            }
            if (reduxAlignElement == null){
                var customStyle = document.createElement("style");
                customStyle.id = 'redux-style-align';
                var customStyleInner = calcInner;
                customStyle.appendChild(document.createTextNode(customStyleInner));
                document.head.append(customStyle); 
            } else {
                if (reduxAlignElement != null){
                    reduxAlignElement.textContent = "";
                }
                reduxAlignElement.appendChild(document.createTextNode(calcInner));
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

    function clearScrollingStuff(){
        document.onscroll = function(){};
        if (!!document.querySelector('#dummyComment')){
            document.querySelector('#dummyComment').remove();  
        }
    }

    function rearrangeInfo(){
        var infoTop = document.querySelector('#top-row.ytd-video-secondary-info-renderer');
        var infoBar = document.querySelector('#info.ytd-video-primary-info-renderer');
        var infoContents = document.querySelector('#info-contents > ytd-video-primary-info-renderer');
        var topLevelElements = document.querySelectorAll('.ytd-video-primary-info-renderer > #top-level-buttons.ytd-menu-renderer ytd-button-renderer');
        var miscButton = document.querySelector('#menu-container > #menu > ytd-menu-renderer > yt-icon-button') || 
        document.querySelector('#info-contents > ytd-video-primary-info-renderer > yt-icon-button.ytd-menu-renderer');
        var dateElement = document.querySelector('#date > yt-formatted-string');
        var dateOuter = document.querySelector('#info-text > #date');
        var descriptionElement = document.querySelector('#container > ytd-expander.ytd-video-secondary-info-renderer > #content');
        var descriptionElementInner = document.querySelector('#container > ytd-expander.ytd-video-secondary-info-renderer > #content > #description');
        var descriptionMeta = document.querySelector('#primary-inner > #meta > #meta-contents > ytd-video-secondary-info-renderer > #container > ytd-expander');
        var views = document.querySelector('#info-text > #count');
        var likesContainer = document.querySelector('#info > #menu-container');
        var likesBar = document.querySelector('#info > #menu-container > ytd-sentiment-bar-renderer');
        var likesWithValues =  document.querySelector('.ytd-video-primary-info-renderer > #top-level-buttons.ytd-menu-renderer');
        var subButton =  document.querySelector('ytd-video-secondary-info-renderer > #container > #top-row > #subscribe-button');
        var uploadInfo =  document.querySelector('#top-row > ytd-video-owner-renderer > #upload-info');
        var channelName = document.querySelector('#top-row > ytd-video-owner-renderer > #upload-info > #channel-name');
        var subCount = document.querySelector('#top-row > ytd-video-owner-renderer > #upload-info > #owner-sub-count');
        var reduxSubDiv = document.createElement('div');
        reduxSubDiv.id = 'reduxSubDiv';
        dateElement.classList.add('redux-moved-date');

        infoBar.prepend(infoTop);
        infoContents.append(miscButton);
        moveTopLevelItems();
        descriptionElement.prepend(dateElement);
        if (dateOuter != null){dateOuter.remove()};
        likesContainer.prepend(likesBar);
        likesContainer.prepend(views);
        uploadInfo.prepend(reduxSubDiv);
        reduxSubDiv.append(subButton);
        reduxSubDiv.append(subCount);
        uploadInfo.prepend(channelName);

        var style = document.createElement('style');
        style.id = 'redux-style-rearrange';
        var innerStyle = `
        /*VID REARRANGE STYLES*/
        .ytd-video-primary-info-renderer > #top-level-buttons.ytd-menu-renderer ytd-button-renderer {
            display:none;
        }
        #reduxSubDiv {
            display: flex !important;
            margin-top: 5px !important;
        }
        #info.ytd-video-primary-info-renderer > #menu-container {
            transform: translateY(5px) !important;
        }
        #count.ytd-video-primary-info-renderer {
            width: 100% !important;
            display: flex !important;
            justify-content: flex-end !important;
        }
        #info > #menu-container > ytd-sentiment-bar-renderer {
            display: block !important;
            width:100% !important; 
            padding:0 !important;
        }
        #date > yt-formatted-string, .redux-moved-date {
            font-weight: 500 !important;
        }
        #container > ytd-expander.ytd-video-secondary-info-renderer > #content > #description {
            margin-top: 5px !important;
        }
        #menu.ytd-video-primary-info-renderer {
            display: flex !important;
            justify-content: flex-end !important;
        }
        #primary-inner > #meta > #meta-contents > ytd-video-secondary-info-renderer > #container > ytd-expander {
            margin-left: 0 !important;
        }
        #top-row > ytd-video-owner-renderer > #upload-info > #owner-sub-count, #reduxSubDiv > #owner-sub-count {
            padding-top: 2px !important;
        }
        #reduxSubDiv > #subscribe-button > ytd-subscribe-button-renderer > paper-button, #reduxSubDiv > #subscribe-button > ytd-button-renderer > a > paper-button {
            margin: 0 !important; 
            padding: 2px 8px 2px 8px !important; 
            text-transform: none !important; 
            font-weight: normal !important; 
            margin-right: 5px !important; 
            max-height: 21px !important;
        }
        #notification-preference-button > ytd-subscription-notification-toggle-button-renderer > a > yt-icon-button {
            max-height: 21px !important; 
            max-width: 21px !important; 
            padding: 0 !important; 
            margin-right: 5px !important;
        }
        #meta-contents > ytd-video-secondary-info-renderer > #container > ytd-expander > #content {
            margin-top: 5px !important;
        }
        `;
        style.appendChild(document.createTextNode(innerStyle));
        document.querySelector('head').append(style);
        flags.isRearranged = true;
    }

    function moveTopLevelItems(){
        var topLevelElements = document.querySelectorAll('.ytd-video-primary-info-renderer > #top-level-buttons.ytd-menu-renderer ytd-button-renderer');
        var infoContents = document.querySelector('#info-contents > ytd-video-primary-info-renderer');
        var existingMovedItem = document.querySelector('#menu-container > #menu > ytd-menu-renderer > yt-icon-button') || 
        document.querySelector('#info-contents > ytd-video-primary-info-renderer > yt-icon-button.ytd-menu-renderer');
        for (var i = topLevelElements.length-1; i >= 0; i--){
            infoContents.insertBefore(topLevelElements[i], existingMovedItem);
            topLevelElements[i].classList.add('redux-moved-info');
            topLevelElements[i].style.display = 'inline-block';
        }
    }

    function clearMovedInfo(){
        var moveInfo = document.querySelectorAll('.redux-moved-info');
        for (var i = 0; i < moveInfo.length; i++){
            moveInfo[i].remove();
        }
        waitForElement('.ytd-video-primary-info-renderer > #top-level-buttons.ytd-menu-renderer ytd-button-renderer', 10, moveTopLevelItems);
    }

    function main(){
        getSettings();
        if (reduxSettingsJSON.autoConfirm){
            var interval = interval == undefined ? setInterval(confirmIt, 500) : undefined;
        }
        if (!reduxSettingsJSON.rearrangeInfo && window.location.href.includes('/watch?') && !flags.isRearranged){
            waitForElement('.ytd-video-primary-info-renderer > #top-level-buttons.ytd-menu-renderer ytd-button-renderer', 10, rearrangeInfo);
        }
        if (reduxSettingsJSON.smallPlayer && window.location.href.includes('/watch?')){
            recalc();
            waitForElement('#columns > #primary > #primary-inner', 10, alignItems);
        }
        if (reduxSettingsJSON.disableInfiniteScrolling && window.location.href.includes('/watch?')){
            checkForComments();
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
                    clearScrollingStuff();
                }
                if (!!document.querySelector('.redux-moved-info')){
                    clearMovedInfo();
                }
                main();
            }
        },100);
    }

    start();