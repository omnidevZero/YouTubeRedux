'use strict';
    var reduxSettingsJSON;
    var flags = {
        "likesChanged":false,
        "stylesChanged":false,
        "isRearranged":false,
        "likesTracked":false,
        "recalcListenersAdded":false
    }
    var likesInterval;
    var YTReduxURLPath;
    var YTReduxURLSearch;
    var confirmInterval;
    var aspectRatio = (window.screen.width / window.screen.height).toFixed(2);
    var playerSize = {};
    var observerComments;
    var observerRelated;

    function getSettings(){
        if (localStorage.getItem("reduxSettings") === null){
            var newSettings = '{"gridItems": 6,, "hideAutoplayButton": false, "hideCastButton": false,"darkPlaylist": true,"smallPlayer": false, "smallPlayerWidth": 853, "showRawValues": true, "autoConfirm": true, "disableInfiniteScrolling": false, "blackBars": false, "rearrangeInfo": false, "classicLogo": false}';
            localStorage.setItem("reduxSettings", newSettings);
            reduxSettingsJSON = JSON.parse(newSettings);
        } else {
            reduxSettingsJSON = JSON.parse(localStorage.getItem("reduxSettings"));
            playerSize.width = reduxSettingsJSON.smallPlayerWidth == undefined ? 853 : reduxSettingsJSON.smallPlayerWidth;
            playerSize.height = Math.ceil(playerSize.width / aspectRatio);
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
            //console.log('YouTube Redux Unpaused at: ' + new Date());
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
            var conditionalCast = reduxSettingsJSON.hideCastButton ? `/*PLAY ON TV BUTTON*/[class="ytp-button"]:not([data-tooltip-target-id="ytp-autonav-toggle-button"]) {display:none !important;}` : '';
            var conditionalAutoplay = reduxSettingsJSON.hideAutoplayButton ? `/*AUTOPLAY BUTTON*/[class="ytp-button"][data-tooltip-target-id="ytp-autonav-toggle-button"] {display:none !important;}` : '';
            var conditionalPlayerSize = reduxSettingsJSON.smallPlayer ? `
/*SMALL PLAYER*/
#primary {
max-width: calc((100vh - (var(--ytd-watch-flexy-masthead-height) + var(--ytd-margin-6x) + var(--ytd-watch-flexy-space-below-player))) * (${window.screen.width} / ${window.screen.height})) !important;
min-width: calc(var(--ytd-watch-flexy-min-player-height) * (${window.screen.width} / ${window.screen.height})) !important;
}
#player-container-outer {
max-width: ${playerSize.width}px  !important;
min-width: 0 !important;
position: relative;
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
top: 0 !important;
}
/*[class="ytp-chrome-bottom"] {
width: calc(100% - 12px) !important;
}*/
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
            var customStyleInner = conditionalAutoplay + conditionalCast + conditionalPlayerSize + conditionalDarkPlaylist + conditionalLogo;
            customStyle.appendChild(document.createTextNode(customStyleInner));
            document.head.append(customStyle);
            flags.stylesChanged = true;
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
                padding: 0 ${(calcPadding / window.innerWidth * 100).toFixed(3)}vw 0 ${(calcPadding / window.innerWidth * 100).toFixed(3)}vw !important;
                /*padding: 0 ${calcPadding}px 0 ${calcPadding}px !important;*/
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
        var likes = document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:first-child > a > yt-formatted-string')[0];
        var dislikes = document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:nth-child(2) > a > yt-formatted-string')[0];

        var observerConfig = {
            attributes: true
        }
        var observerLikes = new MutationObserver(fixLikes);
        observerLikes.observe(likes, observerConfig);
        var observerDislikes = new MutationObserver(fixLikes);
        observerDislikes.observe(dislikes, observerConfig);
        fixLikes();
        flags.likesTracked = true;

        function fixLikes(){
            observerLikes.disconnect();
            observerDislikes.disconnect();

            var likes = document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:first-child > a > yt-formatted-string')[0];
            var dislikes = document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:nth-child(2) > a > yt-formatted-string')[0];
            var rawLikes = document.querySelectorAll('#info > #menu-container > ytd-sentiment-bar-renderer > paper-tooltip > #tooltip')[0].innerText.split("/")[0].trim();
            var rawDislikes = document.querySelectorAll('#info > #menu-container > ytd-sentiment-bar-renderer > paper-tooltip > #tooltip')[0].innerText.split("/")[1].trim();
            likes.innerText = rawLikes;
            dislikes.innerText = rawDislikes;

            observerLikes.observe(likes, observerConfig);
            observerDislikes.observe(dislikes, observerConfig);
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

    function recalculateVideoSize(){

        function addListenersForRecalc(){
            var buttons = [
                document.querySelector('.ytp-size-button')
                //document.querySelector('.ytp-fullscreen-button')
            ]

            for (var i = 0; i < buttons.length; i++){
                buttons[i].addEventListener('click', function(){
                    startRecalc();
                    setTimeout(alignItems, 40); //TODO slow systems may struggle with this timeout when exiting fullscreen - properly detect mode change
                });
            }
            document.addEventListener("fullscreenchange", function(){
                    startRecalc();
                    setTimeout(alignItems, 40);
            })
            window.addEventListener('resize', () => {
                var repeatInsert = setInterval(() => { //insert in loop for X seconds to prevent YT from overriding
                    var specialWidth = document.querySelector('video').offsetWidth;
                    var specialHeight = document.querySelector('video').offsetHeight;
                    insertRecalcScript(specialWidth, specialHeight);
                }, 500);
                setTimeout(() => {
                    clearInterval(repeatInsert);
                }, 2000);
                alignItems();
            })
            flags.recalcListenersAdded = true;
        }

        function insertRecalcScript(width, height){
            if (width == undefined){width = playerSize.width};
            if (height == undefined){height = playerSize.height};
            var existingRecalc = document.querySelector('#redux-recalc');
            if (existingRecalc){existingRecalc.remove()};
            var script = document.createElement('script');
            script.id = 'redux-recalc';
            var scriptInner = `
            var player = document.querySelector('#movie_player');
            player.setInternalSize(${width},${height});
            `;
            script.appendChild(document.createTextNode(scriptInner));
            document.body.append(script);
        }

        function startRecalc(){
            var checkingTimeout;
            var checkingVideo = setInterval(() => { //check in loop for X seconds if player size is correct; reset checking if it's not; applied to fix initial page elements load
                var progressBar = document.querySelector('.ytp-chrome-bottom');
                if (progressBar.offsetWidth+12 >= playerSize.width && progressBar.offsetWidth+12 >= playerSize.width && !isTheater() && !isFullscreen()){ //TODO more precise condition
                    insertRecalcScript();
                    if (checkingTimeout != undefined){
                        clearTimeout(checkingTimeout);
                        checkingTimeout = undefined;
                    }
                } else {
                    if (checkingTimeout == undefined){
                        checkingTimeout = setTimeout(() => {
                            clearInterval(checkingVideo);
                        }, 5000);
                    }
                }
            }, 10)
        }
        if (!flags.recalcListenersAdded){addListenersForRecalc()}; //to recalculate player size when changing between normal, theater and fullscreen modes
        startRecalc();
    }

    function startObservingComments(){

        function disableInfiniteComments(){
            var comments = document.querySelectorAll('#contents > ytd-comment-thread-renderer');
            var commentsContinuation = document.querySelector('#comments > #sections > #continuations');
            commentsContElement = commentsContinuation.querySelector('yt-next-continuation');
            if (comments.length >= maxComments && commentsContElement != null){
                observerComments.disconnect();
                commentsContElement.remove();
                if (document.querySelector('#show-more-comments') == null){
                    addCommentsButton();
                }
            }
        }

        function disableInfiniteRelated(){
            setLayoutDifferences();            
            if (related.length >= maxRelated && relatedContinuation != null){
                observerRelated.disconnect();
                relatedContinuation.remove();
                addRelatedButton();
            }
        }

        function addCommentsButton(){
            var showMoreComments = document.createElement('div');
            var continueElement = commentsContElement;
            showMoreComments.id = 'show-more-comments';
            showMoreComments.style = 'text-align:center; margin-bottom: 16px;';
            showMoreComments.innerHTML = '<input type="button" style="height:30px; width:100%; transition-duration: 0.5s; border-top: 1px solid #e2e2e2; border-bottom: none; border-left: none; border-right: none; background:none; font-size:11px; outline: none; color: var(--yt-spec-text-primary);" value="SHOW MORE"></input>';
            contentsElement.append(showMoreComments);
            document.querySelector('#show-more-comments').onclick = function(){
                var commentsContinuation = document.querySelector('#comments > #sections > #continuations');
                commentsContinuation.append(continueElement);
                window.scrollBy({top: 50, left: 0, behavior: "smooth"});
                this.remove();
                maxComments += commentsInterval;
                observerComments.observe(contentsElement, observerConfig);
            }
        }

        function addRelatedButton(){
            var showMoreRelated = document.createElement('div');
            var continueElement = relatedContinuation;
            showMoreRelated.id = 'show-more-related';
            showMoreRelated.style = 'text-align:center; margin-bottom: 16px; margin-top: 4px;';
            showMoreRelated.innerHTML = '<input type="button" style="height:30px; width:100%; transition-duration: 0.5s; border-top: 1px solid #e2e2e2; border-bottom: none; border-left: none; border-right: none; background:none; font-size:11px; outline: none; color: var(--yt-spec-text-primary);" value="SHOW MORE"></input>';
            relatedElement.append(showMoreRelated);
            document.querySelector('#show-more-related').addEventListener('click', function(){
                relatedElement.append(continueElement);
                window.scrollBy({top: 50, left: 0, behavior: "smooth"});
                this.remove();
                maxRelated += relatedInterval;
                observerRelated.observe(relatedElement, observerConfig);
            });
        }

        function setLayoutDifferences(){
            if (document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items').childElementCount <= 3){ //condition for differences in layout between YT languages
                related = document.querySelectorAll('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-item-section-renderer > #contents > .ytd-item-section-renderer:not(ytd-continuation-item-renderer)');
                relatedContinuation = document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-item-section-renderer > #contents > ytd-continuation-item-renderer');
                relatedElement = document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-item-section-renderer > #contents');
            } else {
                related = document.querySelectorAll('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > .ytd-watch-next-secondary-results-renderer:not(ytd-continuation-item-renderer)');
                relatedContinuation = document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-continuation-item-renderer');
                relatedElement = document.querySelector('#secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items');
            }
        }

        var maxComments = 20;
        var commentsInterval = 20;
        var maxRelated;
        var relatedInterval = 20;
        var commentsContElement;
        var observerConfig = {
            childList: true
        }
        var contentsElement = document.querySelector('#contents.style-scope.ytd-item-section-renderer');
        var relatedElement;
        var related;
        var relatedContinuation;

        if (!!document.querySelector('#show-more-comments')){document.querySelector('#show-more-comments').remove();}
        if (!!document.querySelector('#show-more-related')){document.querySelector('#show-more-related').remove();}
        setLayoutDifferences();
        maxRelated = related.length >= 39 ? 20 : related.length; //to reset max on url change;
        if (related.length >= maxRelated && relatedContinuation != null){
            relatedContinuation.remove();
            addRelatedButton();
        }

        observerComments = new MutationObserver(disableInfiniteComments);
        observerComments.observe(contentsElement, observerConfig);
        observerRelated = new MutationObserver(disableInfiniteRelated);
        observerRelated.observe(relatedElement, observerConfig);

        var sortButtons = document.querySelectorAll('div[slot="dropdown-content"] > #menu > a');
        sortButtons.forEach(element => {
            element.onclick = resetCommentsObserver;
        });

        function resetCommentsObserver() {
            var comments = document.querySelectorAll('#contents > ytd-comment-thread-renderer');
            comments.forEach(element => {
                element.remove();
            });
            if (!!document.querySelector('#show-more-comments')){document.querySelector('#show-more-comments').remove();}
            maxComments = 20;
            observerComments.observe(contentsElement, observerConfig);
        };
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
        var subscribeButton = document.querySelector('#sponsor-button');
        var analyticsButton = document.querySelector('#analytics-button');
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
        reduxSubDiv.prepend(analyticsButton);
        reduxSubDiv.prepend(subscribeButton);
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
            margin-right: 15px !important;
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
            color: var(--yt-spec-text-primary) !important;
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
            margin-left: 4px !important;
        }
        #reduxSubDiv > #subscribe-button > ytd-subscribe-button-renderer > paper-button, #reduxSubDiv > #subscribe-button > ytd-button-renderer > a > paper-button,
        #sponsor-button > ytd-button-renderer > a > paper-button, #analytics-button > ytd-button-renderer > a > paper-button {
            margin: 0 !important; 
            padding: 2px 8px 2px 8px !important; 
            text-transform: none !important; 
            font-weight: normal !important; 
            max-height: 21px !important;
        }
        #sponsor-button.ytd-video-owner-renderer, #analytics-button.ytd-video-owner-renderer {
            margin-right: 0px !important;
        }
        #sponsor-button.ytd-video-owner-renderer > ytd-button-renderer, #analytics-button.ytd-video-owner-renderer > ytd-button-renderer {
            margin-right: 4px !important;
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
        #top-level-buttons > ytd-toggle-button-renderer > a > yt-icon-button > #button > yt-icon {
            height: 20px !important;
            width: 20px !important;
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
            if (confirmInterval == undefined){
                confirmInterval = setInterval(confirmIt, 500);
            }
        }
        if (!reduxSettingsJSON.rearrangeInfo && window.location.href.includes('/watch?') && !flags.isRearranged){
            waitForElement('.ytd-video-primary-info-renderer > #top-level-buttons.ytd-menu-renderer ytd-button-renderer', 10, rearrangeInfo);
        }
        if (reduxSettingsJSON.smallPlayer && window.location.href.includes('/watch?')){
            waitForElement('#movie_player', 10, recalculateVideoSize);
            waitForElement('#redux-recalc', 10, alignItems);
        }
        if (reduxSettingsJSON.disableInfiniteScrolling && window.location.href.includes('/watch?')){
            waitForElement('#contents > ytd-comment-thread-renderer, #contents > ytd-message-renderer', 10, startObservingComments);  // additional element in selector for videos with disabled comments
        }
        if (reduxSettingsJSON.showRawValues && window.location.href.includes('/watch?') && !flags.likesTracked){
            waitForElement('#top-level-buttons > ytd-toggle-button-renderer:first-child > a > yt-formatted-string[aria-label]:not([aria-label=""])', 10, changeLikesCounter);
        }
        changeGridWidth();
        addCustomStyles();
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
                if (!!document.querySelector('.redux-moved-info')){
                    clearMovedInfo();
                }
                if (reduxSettingsJSON.disableInfiniteScrolling){
                    if (observerComments != undefined){observerComments.disconnect();}
                    if (observerRelated != undefined){observerRelated.disconnect();}
                    var comments = document.querySelectorAll('#contents > ytd-comment-thread-renderer');
                    comments.forEach(element => { //remove comments because YT sometimes keeps old ones after url change which messes with comments observer checking their length; also applied when sorting
                        element.remove();
                    });
                }
                main();
            }
        },100);
    }

    start();