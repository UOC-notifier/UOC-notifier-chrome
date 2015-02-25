function refresh_alarm(doit) {
	chrome.alarms.get('refresh', function(alarm) {
		if (!alarm) {
			setup_alarm();
		}
	});
	if (doit) {
		check_messages(false);
	}
}

function onAlarm(alarm) {
	if (alarm && alarm.name == 'refresh') {
		refresh_alarm(true);
	}
}

function onStartup(alarm){
	reset_session();
	refresh_alarm(true);
}

if (chrome.runtime && chrome.runtime.onStartup) {
	chrome.runtime.onStartup.addListener(onStartup);
}

chrome.runtime.onInstalled.addListener(refresh_alarm);
chrome.alarms.onAlarm.addListener(onAlarm);
