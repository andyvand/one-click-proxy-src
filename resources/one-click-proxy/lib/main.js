// The main module of the zzenitt Add-on, One Click Proxy

'use strict';

const DEBUG = false;

const {Cc,Ci,Cu} = require("chrome");
var {Services} = Cu.import("resource://gre/modules/Services.jsm");
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

var storage = require("sdk/simple-storage").storage;

var widgets;
var tabs;
var data;
var proxy_active;
var first_use_in_session;
var proxy_ip;
var proxy_port;
var toolbarButton;
var mainWidget;
var popupPanel;

widgets = require("widget");
tabs = require('tabs');
data = require("self").data;

proxy_active = false;
first_use_in_session = true;
proxy_ip = "";
proxy_port = 0;

mainWidget = widgets.Widget({
    id: "ocp_widget",
    width: 56,
    label: "One Click Proxy Add-on",
    contentURL: data.url('html/widget.html'),
    contentScriptWhen: 'ready',
    contentScriptFile: data.url('js/widget.js')
});

mainWidget.port.on('left-click', function() {
    on_off();
    if(DEBUG) console.log('OneClickProxy: left click on widget');
});

mainWidget.port.on('reload-click', function() {
    reloadProxy();
    if(DEBUG) console.log('OneClickProxy: reload click on widget');
});

mainWidget.port.on('config-click', function() {
    if(storage.toolbarButton_destroyed){
        addToolbarButton();
    }else{
        removeToolbarButton();
    }
    if(DEBUG) console.log('OneClickProxy: left click on config widget');
});

popupPanel = require("panel").Panel({
    contentURL: data.url("html/popup.html"),
    contentScriptFile: data.url("js/popup.js"),
    contentScriptWhen: "ready",
    height: 262,
    width: 150
});

popupPanel.port.on('click-onoff', function() {
    on_off();
    if(DEBUG) console.log('OneClickProxy: click on/off in panel');
});

popupPanel.port.on('click-reload', function() {
    reloadProxy();
    if(DEBUG) console.log('OneClickProxy: click reload proxy on panel');
});

popupPanel.port.on('click-ad', function(url) {
    if(tabs.activeTab.url == 'about:blank' || tabs.activeTab.url == '') {
        tabs.activeTab.url = url;
    }else{
        tabs.open({
            url: url
        });
    }
    popupPanel.hide();
});

//functions
function prepareToolbarButton() {
    // this document is an XUL document
	var document = mediator.getMostRecentWindow('navigator:browser').document;		

	toolbarButton = document.createElement('toolbarbutton');	
	toolbarButton.setAttribute('id', 'ocp_navbar_button');
	toolbarButton.setAttribute('type', 'button');
	// the toolbarbutton-1 class makes it look like a traditional button
	toolbarButton.setAttribute('class', 'toolbarbutton-1');
	// the data.url is relative to the data folder
	toolbarButton.setAttribute('image', data.url('img/icon_16_off.png'));
	toolbarButton.setAttribute('orient', 'horizontal');
	// this text will be shown when the toolbar is set to text or text and iconss
	toolbarButton.setAttribute('label', 'One Click Proxy');
    toolbarButton.setAttribute('tooltiptext', 'One Click Proxy');
	toolbarButton.addEventListener('click', function() {
        popupPanel.show(toolbarButton);
	}, false)

}

function addToolbarButton() {
    // this document is an XUL document
	var document = mediator.getMostRecentWindow('navigator:browser').document;		
	var navBar = document.getElementById('nav-bar');
	if (navBar && toolbarButton) {
        navBar.appendChild(toolbarButton);
        storage.toolbarButton_destroyed = false;
	}
}

function removeToolbarButton() {
	// this document is an XUL document
	var document = mediator.getMostRecentWindow('navigator:browser').document;		
	var navBar = document.getElementById('nav-bar');
	var btn = document.getElementById('ocp_navbar_button');
	if (navBar && btn) {
		navBar.removeChild(btn);
        //verify if its done
        btn = document.getElementById('ocp_navbar_button');
        if(btn){
            navBar.removeChild(btn);
	    }
        storage.toolbarButton_destroyed = true;
	}
}

function reloadProxy(){
    var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
    //req.overrideMimeType("application/javascript");
    
    Services.prefs.setIntPref("network.proxy.type", 0);

    var proxyfound = false;
    req.open("GET", "http://api.proxy-ip-list.com/oneclickproxy.php", false); // false = synchronous    
    req.channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;
    req.send(null);
    if (req.status == 200){
        var tosplit = req.responseText.split(":");
        proxy_ip = tosplit[0];
        proxy_port = tosplit[1];
        proxyfound = true;
        if(DEBUG) console.log(proxy_ip);
        if(DEBUG) console.log(proxy_port);
    }else{
        //try with another domain for the GET
        req.open("GET", "http://proxyipchecker.com/ffaddon/oneclickproxy.php", false); // false = synchronous    
        req.channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;
        req.send(null);
        if (req.status == 200){
            var tosplit = req.responseText.split(":");
            proxy_ip = tosplit[0];
            proxy_port = tosplit[1];
            proxyfound = true;
            if(DEBUG) console.log(proxy_ip);
            if(DEBUG) console.log(proxy_port);
        }
    }
    if (proxyfound){
        if(proxy_active){
            Services.prefs.setCharPref("network.proxy.http", proxy_ip);
            Services.prefs.setCharPref("network.proxy.socks", proxy_ip);
            Services.prefs.setCharPref("network.proxy.ftp", proxy_ip);
            Services.prefs.setCharPref("network.proxy.ssl", proxy_ip);
            Services.prefs.setIntPref("network.proxy.http_port", proxy_port);
            Services.prefs.setIntPref("network.proxy.socks_port", proxy_port);
            Services.prefs.setIntPref("network.proxy.ftp_port", proxy_port);
            Services.prefs.setIntPref("network.proxy.ssl_port", proxy_port);
            Services.prefs.setIntPref("network.proxy.type", 1);
            popupPanel.port.emit("proxy-changed", proxy_ip);
        }
    }else{
        var errmsg = 'Can\'t connect to internet, please verify your connection or contact us at ocp.support@proxy-ip-list.com';
        popupPanel.port.emit("proxy-changed", errmsg);
        //alert(errmsg);
    }
}

//activates and deactivates proxy
function on_off(){
    if(proxy_active){
        proxy_active = false;
        restoreOriginalPrefs();
        mainWidget.port.emit("proxy-deactivate");
        toolbarButton.image = data.url('img/icon_16_off.png');
        popupPanel.port.emit("proxy-deactivate");
    }else{
        proxy_active = true;
        saveOriginalPrefs();
        mainWidget.port.emit("proxy-activate");
        toolbarButton.image = data.url('img/icon_16.png');
        if(first_use_in_session){
            first_use_in_session = false;
            reloadProxy();
        }
        Services.prefs.setCharPref("network.proxy.http", proxy_ip);
        Services.prefs.setCharPref("network.proxy.socks", proxy_ip);
        Services.prefs.setCharPref("network.proxy.ftp", proxy_ip);
        Services.prefs.setCharPref("network.proxy.ssl", proxy_ip);
        Services.prefs.setIntPref("network.proxy.http_port", proxy_port);
        Services.prefs.setIntPref("network.proxy.socks_port", proxy_port);
        Services.prefs.setIntPref("network.proxy.ftp_port", proxy_port);
        Services.prefs.setIntPref("network.proxy.ssl_port", proxy_port);
        Services.prefs.setIntPref("network.proxy.type", 1);
        popupPanel.port.emit("proxy-activate");
        popupPanel.port.emit("proxy-changed", proxy_ip);

    }
}

function saveOriginalPrefs(){
    storage.proxy_http = Services.prefs.getCharPref("network.proxy.http");
    storage.proxy_socks = Services.prefs.getCharPref("network.proxy.socks");
    storage.proxy_ftp = Services.prefs.getCharPref("network.proxy.ftp");
    storage.proxy_ssl = Services.prefs.getCharPref("network.proxy.ssl");
    storage.http_port = Services.prefs.getIntPref("network.proxy.http_port");
    storage.socks_port = Services.prefs.getIntPref("network.proxy.socks_port");
    storage.ftp_port = Services.prefs.getIntPref("network.proxy.ftp_port");
    storage.ssl_port = Services.prefs.getIntPref("network.proxy.ssl_port");
    storage.proxy_type = Services.prefs.getIntPref("network.proxy.type");
}

function restoreOriginalPrefs(){
    Services.prefs.setCharPref("network.proxy.http", storage.proxy_http);
    Services.prefs.setCharPref("network.proxy.socks", storage.proxy_socks);
    Services.prefs.setCharPref("network.proxy.ftp", storage.proxy_ftp);
    Services.prefs.setCharPref("network.proxy.ssl", storage.proxy_ssl);
    Services.prefs.setIntPref("network.proxy.http_port", storage.http_port);
    Services.prefs.setIntPref("network.proxy.socks_port", storage.socks_port);
    Services.prefs.setIntPref("network.proxy.ftp_port", storage.ftp_port);
    Services.prefs.setIntPref("network.proxy.ssl_port", storage.ssl_port);
    Services.prefs.setIntPref("network.proxy.type", storage.proxy_type);
}

//main
exports.main = function(options, callbacks) {
    prepareToolbarButton();
    if (options.loadReason == "install") {
        storage.toolbarButton_destroyed = false;
    }
    if (! storage.toolbarButton_destroyed){
        addToolbarButton();
    }
};

exports.onUnload = function(reason) {
    if (reason === 'disable' || reason === 'uninstall') {
        if( ! storage.toolbarButton_destroyed )
            removeToolbarButton();
    }
    restoreOriginalPrefs();
};
