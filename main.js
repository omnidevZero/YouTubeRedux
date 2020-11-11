'use strict';
    var reduxSettingsJSON;

    var flags = {
        "likesChanged":false,
        "stylesChanged":false,
        "vidUnpaused": false
    }
    var likesInterval;
    var YTReduxURLPath;
    var YTReduxURLSearch;

    function getSettings(){
        if (localStorage.getItem("reduxSettings") == null){
            var newSettings = '{"gridItems": 6,"hideCastButton": true,"darkPlaylist": true,"smallPlayer": false, "showRawValues": true, "autoConfirm": true}';
            localStorage.setItem("reduxSettings", newSettings);
            reduxSettingsJSON = JSON.parse(newSettings);
        } else {
            reduxSettingsJSON = JSON.parse(localStorage.getItem("reduxSettings"));
        }
    }

    function confirmIt(){
        var confirmButton = document.querySelector('paper-dialog > yt-confirm-dialog-renderer > div:last-child > div > #confirm-button');
        if (confirmButton != null){
            confirmButton.click();
            console.log('Clicked at: ' + new Date());
                document.querySelector('video').play();
                flags.vidUnpaused = true;
                console.log('Unpaused at: ' + new Date());
                document.querySelector('paper-dialog').remove();
        }
    }

    function resumePlayback(){
        if (!document.querySelector('ytd-miniplayer[active]') && document.querySelector('.ytp-play-button > svg > path').getAttribute('d') == 'M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z'){ //click play if it's the displayed button icon and there is no mini player
            document.querySelector('.ytp-play-button').click();
            console.log('Unpaused at: ' + new Date());
        }
    }

    function changeGridWidth(){
        if (location.pathname == "/"){
            var retry = setInterval(function(){
                //console.log('Change grid')
                var styleItem = document.querySelector("#primary > ytd-rich-grid-renderer");
                var currentStyle = styleItem.style.cssText;
                var currentStyleArray = currentStyle.split(";");
                var currentSettings = [];
                currentStyleArray.pop();
                currentStyleArray.forEach(element => {
                    currentSettings.push(element.slice(-1));
                });

                var newSettings = currentSettings;
                newSettings[0] = reduxSettingsJSON.gridItems + " !important"; //to override different important from css
                for (var i = 0; i < currentStyleArray.length; i++){
                    currentStyleArray[i] = currentStyleArray[i].slice(0,-1) + newSettings[i];
                }
                styleItem.style.cssText = currentStyleArray.join(";") + ";";
                if (currentStyle != "" && currentSettings[0] == reduxSettingsJSON.gridItems + " !important"){clearInterval(retry);};
            },100);
        }
    }

    function addCustomStyles(){
        if (!flags.stylesChanged){
            var conditionalCast = reduxSettingsJSON.hideCastButton ? `/*PLAY ON TV BUTTON*/[class="ytp-button"] {display:none !important;}` : '';
            var conditionalPlayerSize = reduxSettingsJSON.smallPlayer ? `
/*SMALL PLAYER*/
ytd-watch-flexy[flexy_] #player-container-outer.ytd-watch-flexy {
max-width:calc(480px * ( 16 / 9 ));
max-height:480px;
}
.html5-video-container video {
max-width:calc(480px * ( 16 / 9 ));
max-height:480px;
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
` : '';
            var customStyle = document.createElement("style");
            customStyle.innerHTML = `` + conditionalCast + conditionalPlayerSize + conditionalDarkPlaylist;
            document.head.append(customStyle);
            flags.stylesChanged = true;
        }
    }

    function changeLikesCounter(){
        if (!flags.likesChanged && document.querySelectorAll('#top-level-buttons > ytd-toggle-button-renderer:first-child > a > yt-formatted-string')[0] !== undefined){
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

    function main(){
        //console.log('Start main')
        getSettings();
        if (reduxSettingsJSON.autoConfirm){
            var interval = interval == undefined ? setInterval(confirmIt, 500) : undefined;
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
                if (flags.vidUnpaused == true){
                    setTimeout(function(){
                        console.log('delayed play')
                        document.querySelector('video').play()
                    },5000); //TODO - properly detect video loaded event
                    flags.vidUnpaused = false;
                }
                main();
            }
        },100);
    }

    start();