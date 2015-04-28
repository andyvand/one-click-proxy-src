var button_onoff = document.getElementById('button_widget_onoff');
button_onoff.addEventListener('click', function(event) {
  if(event.button == 0)
    self.port.emit('left-click');
  event.preventDefault();
}, true);

var button_reload = document.getElementById('button_widget_reload');
button_reload.addEventListener('click', function(event) {
  if(event.button == 0)
    self.port.emit('reload-click');
  event.preventDefault();
}, true);

var button_config = document.getElementById('button_widget_config');
button_config.addEventListener('click', function(event) {
  if(event.button == 0)
    self.port.emit('config-click');
  event.preventDefault();
}, true);

self.port.on("proxy-activate", function activate() {
  var button = document.getElementById('button_widget_onoff');
  button.src = "../img/icon_16.png";
});
self.port.on("proxy-deactivate", function deactivate() {
  var button = document.getElementById('button_widget_onoff');
  button.src = "../img/icon_16_off.png";
});