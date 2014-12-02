var Classes = new function(){
	var classes = [];
	this.messages = 0;
	this.notified_messages = 0;

	this.add = function(classr){
		var idx = this.get_index(classr.code);
		if(idx !== false){
			classr.notify = classes[idx].notify;
			classes[idx] = classr;
		} else {
			classes.push(classr);
		}
	};

	this.save = function(){
		this.count_messages();
		console.log(classes);
		localStorage.setItem("classes", JSON.stringify(classes));
	};

	this.search_code = function(code){
		for(i in classes){
			if(classes[i].code == code){
				return classes[i];
			}
		}
		return false;
	};

	this.delete_code = function(code){
		for(i in classes){
			if(classes[i].code == code){
				classes.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	this.get_index = function(code){
		for(i in classes){
			if(classes[i].code == code){
				return i;
			}
		}
		return false;
	};

	this.get_notify = function (code){
		var idx = this.get_index(code);
		if (idx === false) {
			// New Classrooms won\'t be notified
			return false;
		}
		return classes[idx].notify;
	}

	this.search_domain = function(domain){
		for(i in classes){
			if(classes[i].domain == domain){
				return classes[i];
			}
		}
		return false;
	};

	this.search_domainassig = function(domain){
		for(i in classes){
			if(classes[i].domainassig == domain){
				return classes[i];
			}
		}
		return false;
	};

	this.load = function (){
		var classroom = localStorage.getItem("classes");
		if(classroom){
			classes = [];
			this.messages = 0;
			this.notified_messages = 0;
			var classesl = JSON.parse(classroom);
			for(i in classesl){
				var classl = classesl[i];
				var classr = new Classroom(classl.title, classl.code, classl.domain, classl.type, classl.template);
				classr.domainassig = classl.domainassig;
				classr.set_color(classl.color);
				classr.set_picture(classl.picture);
				classr.set_notify(classl.notify);
				if(classl.notify) {
					for(j in classl.resources){
						var resourcel = classl.resources[j];
						var resource = new Resource(resourcel.title, resourcel.code);
						resource.set_messages(resourcel.messages, resourcel.all_messages);
						resource.set_link(resourcel.link);
						classr.add_resource(resource);
					}
				}
				this.add(classr);
			}
			this.count_messages();
		}
	};

	this.get_all = function (){
		return classes;
	};

	this.get_notified = function (){
		var classrooms = [];
		for(i in classes){
			if(classes[i].notify){
				classrooms.push(classes[i]);
			}
		}
		return classrooms;
	};

	this.count_messages = function(){
		var classrooms = this.get_all();
		this.notified_messages = 0;
		this.messages = 0;
		for(i in classrooms){
			if(classrooms[i].notify){
				this.notified_messages += classrooms[i].messages;
			}
			this.messages += classrooms[i].messages;
			this.all_messages += classrooms[i].all_messages;
		}
	};

	this.load();
}

function Classroom(title, code, domain, type, template){
	this.title = title;
	this.code = code;
	this.domain = domain;
	this.domainassig = domain;
	this.type = type;
	this.template = template;
	this.color = false;
	this.picture = false;
	this.notify = true;
	this.messages = 0;
	this.resources = [];

	this.set_color = function(color){
		if(color && color != 'undefined' && color != 'false'){
			this.color = color;
		}
	};

	this.set_picture = function(picture){
		if(picture && picture != 'undefined' && picture != 'false'){
			this.picture = picture;
		}
	};

	this.set_notify = function(notify){
		this.notify = notify;
	};

	this.reset_messages = function(){
		this.messages = 0;
	};

	this.add_resource = function(resource){
		if(!this.notify) return;

		var idx = this.get_index(resource.code, resource.lcode);
		if(idx >= 0){
			this.resource_merge(idx, resource);
		} else {
			this.resources.push(resource);
			if(resource.messages != '-'){
				this.messages += resource.messages;
			}
		}
	};

	this.get_index = function(code, lcode){
		for(i in this.resources){
			if(this.resources[i].code == code) {
				return i;
			}
			if(this.resources[i].lcode == lcode) {
				return i;
			}
			if(this.resources[i].lcode == code) {
				return i;
			}
			if(this.resources[i].code == lcode) {
				return i;
			}
		}
		return -1;
	};

	this.get_resources = function(){
		return resources;
	};

	this.resource_merge = function(idx, resource) {
		if(this.resources[idx].messages != '-'){
			this.messages -= this.resources[idx].messages;
		}
		this.resources[idx].set_messages(resource.messages, resource.all_messages);
		this.resources[idx].link = resource.link;
		this.resources[idx].code = resource.code;
		this.resources[idx].lcode = resource.lcode;
		this.resources[idx].title = resource.title;
		if(this.resources[idx].messages != '-'){
			this.messages += this.resources[idx].messages;
		}
	};
}

function Resource(title, code){
	this.title = title;
	this.code = code;
	this.lcode = code;
	this.messages =  '-';
	this.all_messages =  '-';
	this.link =  "";

	this.set_messages = function(messages, all_messages){
		messages = parseInt(messages);
		all_messages = parseInt(all_messages);

		if (!isNaN(all_messages) && all_messages >= 0) {
			this.all_messages = all_messages;
		}
		if (!isNaN(messages) &&  messages >= 0) {
			this.messages = messages;
		}

		if(!isNaN(this.messages) && isNaN(this.all_messages)){
			this.messages = 0;
			this.all_messages = 0;
		}

		if(this.messages == '-') {
			return 0;
		}
		return this.messages;
	};

	this.set_link = function(link){
		var url = get_url_attr(link, 'redirectUrl');
		if(url){
			link = decodeURIComponent(url);
			/*var url = get_url_attr(link, 'url');
			if(url){
				link = root_url + '/' + decodeURIComponent(url);
			}*/
		}

		code = get_url_attr(link, 'l');
		if(code){
			this.lcode = code;
		}

		session = get_url_attr(link, 's');
		if(session){
			link = get_url_withoutattr(link,'s');
			link += '&s=';
		} else {
			session = get_url_attr(link, 'sessionId');
			if(session){
				link = get_url_withoutattr(link,'sessionId');
				link += '&sessionId=';
			}
		}
		this.link = link;
	};
}
