var donateButton = document.querySelector('#donate');
var globalURL;
var currentSettings;

donateButton.onclick = function() {
  window.open("https://paypal.me/kowpowkow");
};

browser.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
  globalURL = tabs[0].url;
  var fields = document.querySelectorAll('fieldset');
  if (!globalURL.includes("www.youtube.com")){
    for (var i = 0; i < fields.length; i++){
      document.querySelectorAll('fieldset')[i].setAttribute("disabled", "")
    }
    document.querySelector('.outer-warning').style.display = "table";
  }
});

var settingsElements = document.querySelectorAll('.settings:not(.slider-control)');
for (var i = 0; i < settingsElements.length; i++){
  document.querySelectorAll('.settings:not(.slider-control)')[i].addEventListener('change', function(){
    saveSettings();
  })
}

document.querySelector('input[type="range"]').addEventListener('change', function(){
  var inputControl = document.querySelector('.slider-control');
  inputControl.value = this.value;
  saveSettings();
  changeGridWidth(this.value);
})

document.querySelector('input[name="smallPlayer"]').addEventListener('change', () => {
  if (document.querySelector('input[name="smallPlayer"]').checked){
    document.querySelector('input[name="blackBars"]').removeAttribute('disabled');
  } else {
    document.querySelector('input[name="blackBars"]').setAttribute('disabled', '');
    document.querySelector('input[name="blackBars"]').checked = false;
    saveSettings();
  }
})

document.querySelector('.slider-control').addEventListener('change', function(){
  var slider = document.querySelector('input[type="range"]');
  slider.value = this.value;
  saveSettings();
  changeGridWidth(this.value);
})

function saveSettings(){
  var newSettings = {};
  //save slider
  newSettings[document.querySelector('input[type="range"]').name] = document.querySelector('input[type="range"]').value;

  //save checkboxes
  var itemsCheck = document.querySelectorAll('input[type="checkbox"]');
  for (var i = 0; i < itemsCheck.length; i++){
    newSettings[itemsCheck[i].name] = itemsCheck[i].checked;
  }

  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var storageSettings = JSON.stringify(newSettings);
    browser.tabs.executeScript(
        tabs[0].id,
        {code: `localStorage.setItem("reduxSettings", ${JSON.stringify(storageSettings)})`});
    });
}

function changeGridWidth(numberOfItems){
  if (globalURL == "https://www.youtube.com/" || globalURL == "http://www.youtube.com/"){
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      browser.tabs.executeScript(
          tabs[0].id,
          {code: `var styleItem = document.querySelector("#primary > ytd-rich-grid-renderer");
          styleItem.style.setProperty("--ytd-rich-grid-items-per-row", ${numberOfItems}, "important")
          `
          });
      });
    }
  }

  function getSettings(){
    if (currentSettings == null){return};
    var itemsCheck = document.querySelectorAll('input[type="checkbox"]');

    //set slider
    document.querySelector('input[type="range"]').value = currentSettings.gridItems;
    document.querySelector('.slider-control').value = currentSettings.gridItems;
    //set checkboxes
    for (var i = 0; i < itemsCheck.length; i++){
      for (var j = 0; j < Object.keys(currentSettings).length; j++){
        if (itemsCheck[i].name == Object.keys(currentSettings)[j]){
          itemsCheck[i].checked = Object.values(currentSettings)[j];
        }
      }
    }
        //uncheck subsetting
        if (document.querySelector('input[name="smallPlayer"]').checked){
          document.querySelector('input[name="blackBars"]').removeAttribute('disabled');
        }
  }

  //main
  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var key = "reduxSettings";
      browser.tabs.executeScript(
        tabs[0].id,
        {
          code:`localStorage["${key}"];`
        }, function(result){
          if (result == null || result == undefined){return};
          currentSettings = JSON.parse(result[0]);
          getSettings();
        }
      )
  });