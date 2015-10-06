function get_icon(){
	return localStorage.getItem("messages_icon") || 0;
}

function save_icon(number){
	localStorage.setItem("messages_icon",number);
}

function save_user(username, password){
	localStorage.setItem("user_username",username);
	save_password(password);
}

function get_user(){
	var user_save = {};
	user_save.username = localStorage.getItem("user_username") || "";
	user_save.password = get_password();
	return user_save;
}

function has_username_password(){
	var username = localStorage.getItem("user_username") || false;
	var password = localStorage.getItem("user_password") || false;
	return username && password;
}

function get_password() {
	var password = localStorage.getItem("user_password") || "";
	if (password != "") {
		password = b64_to_utf8(password);
	}
	return password;
}

function save_password(password) {
	password = utf8_to_b64(password);
	localStorage.setItem("user_password",password);
}

function get_interval(){
	var interval = localStorage.getItem("check_interval") || 5;
	return parseInt(interval);
}

function save_interval(minutes){
	// Do not allow < 5 intervals to not saturate
	if (minutes < 5 && minutes != 0) {
		minutes = 5;
	}
	localStorage.setItem("check_interval", minutes);
}

function get_notification(){
	var notify = localStorage.getItem("notification");
	if (notify == undefined) {
		return true;
	}
	return notify == "true";
}

function save_notification(notify){
	localStorage.setItem("notification", notify);
}

function get_sorting(){
	var sorting = localStorage.getItem("sorting") || 'start';
	return sorting;
}

function save_sorting(sorting){
	localStorage.setItem("sorting", sorting);
}

function get_critical(){
	var critical = localStorage.getItem("critical") || 10;
	return parseInt(critical);
}

function save_critical(messages){
	// Do not allow < 0 messages
	if (messages < 0) {
		minutes = 0;
	}
	localStorage.setItem("critical", messages);
}

function reset_session(handler){
	localStorage.removeItem("session");
	Session.retrieve();
	if (handler) {
		handler();
	}
}

function save_session(session){
	localStorage.setItem("session", session);
}

function get_session() {
	var session = localStorage.getItem("session") || false;
	if(!session){
		return false;
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

function get_lang() {
	var uni =  get_uni();
    if(uni == 'UOCi'){
        return 'es';
    }
    return 'ca';
}

function save_uni(uni){
	localStorage.setItem("uni",uni);
}