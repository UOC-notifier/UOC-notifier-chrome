function check_messages() {
	chrome.alarms.get('refresh', function(alarm) {
		if (!alarm) {
			setup_alarm();
		}
	});

	var old_messages = Classes.notified_messages;
	retrieve_classrooms(false);
	var messages = Classes.notified_messages;
	set_icon(messages);

	console.log(old_messages+" "+messages);
	if(old_messages < messages){
		var notitication = get_notification();
		if( notitication && messages >= get_critical()){
			notify('Tienes '+messages+' mensajes por leer');
		}
	}
}

function notify(str) {
	var notification = new Notification('UOC Notifier', { icon: window.location.origin +"/logo.png", body: str });
	notification.onshow = function() {setTimeout(function(){
		notification.close();
	}, 3000)};
}

function set_icon(messages){
	if( messages > 0){
		chrome.browserAction.setBadgeText({text:""+messages});
	} else {
		chrome.browserAction.setBadgeText({text:""});
	}

	if( messages >= get_critical()){
		chrome.browserAction.setIcon({path:"logomsg.png"});
	}else{
		chrome.browserAction.setIcon({path:"logo.png"});
	}
}

function onAlarm(alarm) {
	if (alarm && alarm.name == 'refresh') {
		check_messages();
	}
}

function onStartup(alarm){
	reset_session();
	check_messages();
}

if (chrome.runtime && chrome.runtime.onStartup) {
	chrome.runtime.onStartup.addListener(onStartup);
}

chrome.runtime.onInstalled.addListener(check_messages);
chrome.alarms.onAlarm.addListener(onAlarm);
