function save_user(username, password){
	localStorage.setItem("user_username",username);
	localStorage.setItem("user_password",password);
}

function get_user(){
	var user_save = {};
	user_save.username = localStorage.getItem("user_username") || "";
	user_save.password = localStorage.getItem("user_password") || "";
	return user_save;
}

function get_interval(){
	var interval = localStorage.getItem("check_interval") || 5;
	return parseInt(interval);
}

function save_interval(minutes){
	localStorage.setItem("check_interval", minutes);
}

function get_news(){
	var news = localStorage.getItem("news") || "";
	return news;
}

function save_news(news){
	localStorage.setItem("news", news);
}


function get_notification(){
	var notify = localStorage.getItem("notification");
	if(notify == "undefined") return true;
	return notify == "true";
}

function save_notification(notify){
	localStorage.setItem("notification", notify);
}

function get_critical(){
	var critical = localStorage.getItem("critical") || 10;
	return parseInt(critical);
}

function save_critical(messages){
	localStorage.setItem("critical", messages);
}

function setup_alarm(alarm) {
	var delay = get_interval();
	chrome.alarms.create('refresh', {periodInMinutes: delay});
}

function reset_session(){
	localStorage.removeItem("session");
	get_session();
}

function save_session(session){
	localStorage.setItem("session",session);
}

function get_session(){
	var session = localStorage.getItem("session") || false;
	if(!session){
		retrieve_session();
		return "";
	}
	return session;
}

function save_notify_classroom(code, notify){
	var classroom = Classes.search_code(code);
	if(classroom){
		classroom.set_notify(notify);
		Classes.save();
	}
}

function get_uni(){
	var uni = localStorage.getItem("uni") || 'UOCc';
	return uni;
}

function save_uni(uni){
	localStorage.setItem("uni",uni);
}