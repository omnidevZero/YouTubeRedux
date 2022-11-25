/* PAGE LOCATION STATE */
let pageLocation = PAGE_LOCATION.Home;

const getPageLocation = () => {
	const location = window.location;
	
	if (location.pathname === '/') {
		return PAGE_LOCATION.Home;
	} else if (location.href.includes('/watch?')) {
		return PAGE_LOCATION.Video;
	} else if (location.pathname.startsWith('/user/') || location.pathname.startsWith('/c/')) {
		return PAGE_LOCATION.Channel;
	} else if (location.href.includes('/feed/trending')) {
		return PAGE_LOCATION.Trending;
	} else if (location.href.includes('/feed/explore')) {
		return PAGE_LOCATION.Explore;
	} else if (location.href.includes('/results?')) {
		return PAGE_LOCATION.SearchResults;
	} else if (location.href.includes('/shorts/')) {
		return PAGE_LOCATION.Shorts;
	}
};

const setPageLocation = () => {
	pageLocation = getPageLocation();
};

/* RELATED VIDEOS TYPE STATE */
let relatedVideosType = RELATED_VIDEOS_TYPE.Normal;

const getRelatedVideosType = () => {
	const relatedVideos = document.querySelector('#secondary-inner.ytd-watch-flexy #related #items ytd-item-section-renderer #contents > ytd-compact-video-renderer');
	const relatedVideosAlt = document.querySelector('#secondary-inner.ytd-watch-flexy #related #items > ytd-compact-video-renderer');

	if (relatedVideos) {
		return RELATED_VIDEOS_TYPE.Normal;
	} else if (relatedVideosAlt) {
		return RELATED_VIDEOS_TYPE.Alternative;
	}
};

const setRelatedVideosType = () => {
	relatedVideosType = getRelatedVideosType();
};

/* OBSERVERS */
let homeObserver = null;
let playerObserver = null;
let cinematicsObserver = null;

/* THEME STATE */
const getTheme = () => {
	if (document.querySelector('html[dark]')) {
		return THEME.Dark;
	} else {
		return THEME.Light;
	}
};