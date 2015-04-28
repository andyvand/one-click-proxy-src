self.port.on("proxy-changed", function changeProxyOnPanel(proxy_ip) {
  var proxyText = document.getElementById('proxy_ip');
  proxyText.textContent = proxy_ip;
});
self.port.on("proxy-activate", function changeActivateOnPanel() {
  var button = document.getElementById('button_onoff');
  button.className = "buttonRed";
  button.textContent = "Turn Proxy Off";
});
self.port.on("proxy-deactivate", function changeDeactivateOnPanel() {
  var button = document.getElementById('button_onoff');
  button.className = "buttonGreen";
  button.textContent = "Turn Proxy On";
  var proxyText = document.getElementById('proxy_ip');
  proxyText.textContent = "Proxy is Off";
});

var button_onoff = document.getElementById('button_onoff');
button_onoff.addEventListener('click', function(event) {
  self.port.emit("click-onoff");
  event.preventDefault();
}, true);

var button_reload = document.getElementById('button_reload');
button_reload.addEventListener('click', function(event) {
  self.port.emit("click-reload");
  event.preventDefault();
}, true);

var ad_link = document.getElementById('ad_link');
ad_link.addEventListener('click', function(event) {
  self.port.emit("click-ad", "http://hidemyass.com/vpn/r751:23/");
  event.preventDefault();
}, true);