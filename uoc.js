var root_url = 'http://cv.uoc.edu';
var root_url_ssl = 'https://cv.uoc.edu';
var anyAcad = calc_any();

function calc_any() {
	var d = new Date();
	var year = d.getFullYear();
	var month = d.getMonth();

	if (month <= 7) {
		// Previous year
		year--;
	}

	if (month >= 2 && month <= 7) {
		// March to August
		return year+"2";
	}
	return year+"1";
}

function check_messages(handler){
	var old_messages = Classes.notified_messages;
	retrieve_classrooms(handler);
	var messages = Classes.notified_messages;
	set_icon(messages);

	console.log("Check messages: Old "+old_messages+" New "+messages);
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
	//chrome.browserAction.setIcon({path:"logo.png"});
}

function retrieve_classrooms(handler){
	var args = {
		newStartingPage:0,
		language:"b"
	}
	ajax_uoc('/UOC2000/b/cgi-bin/hola', args, 'GET', function(resp) {
		var index = resp.indexOf("aulas = ");
		if (index != -1) {
			var lastPage = resp.substring(index + 8);
			var last = lastPage.indexOf(";");
			lastPage = lastPage.substring(0,last);
			var classrooms = eval(lastPage);
			var class_codes = [];
			for(var i in classrooms){
				classroom = parse_classroom(classrooms[i]);
				if(classroom){
					Classes.add(classroom);
				}
			}
			retrieve_more_info_classrooms(handler);
			retrieve_events();
			Classes.save();
		} else {
			reset_session();
		}
	});
}

function parse_classroom(classr){
	if(classr.title) {
		var title = classr.shortname ? classr.shortname : classr.title;
		switch (classr.domaintypeid) {
			case 'AULA':
				var classroom = Classes.search_domainassig(classr.domainfatherid);
				if (classroom) {
					//classroom.title = title;
					classroom.code = classr.code;
					classroom.domain = classr.domainid;
					classroom.domainassig = classr.domainfatherid;
					this.type = classr.domaintypeid;
					this.template = classr.pt_template;
				}
				break;
			case 'ASSIGNATURA':
				var classroom = Classes.search_domainassig(classr.domainid);
				classroom.title = title;
				break;
		}

		if (!classroom) {
			var classroom = new Classroom(title, classr.code, classr.domainid, classr.domaintypeid, classr.pt_template);
			if(classroom.type == 'AULA') {
				classroom.domainassig = classr.domainfatherid;
			}
		}

		if(!Classes.get_notify(classroom.code)) return classroom;

		for(var j in classr.resources){
			var resourcel = classr.resources[j];
			if(resourcel.title){
				if(resourcel.numMesTot != '0'){
					var resource = new Resource(resourcel.title, resourcel.code);
					resource.set_messages(resourcel.numMesPend, resourcel.numMesTot);
					classroom.add_resource(resource);
				}
			}
		}
		var show_pictures = get_show_pictures();
		if (show_pictures && classroom.notify && classroom.type == 'TUTORIA' && !classroom.picture ){
			retrieve_picture_tutoria(classroom);
		}
		return classroom;
	}
	return false;
}

function retrieve_picture_tutoria(classroom){
	var args = {
		param : 'dCode%3D'+classroom.code,
		up_xmlUrlServiceAPI : 'http%253A%252F%252Fcv.uoc.edu%252Fwebapps%252Fclassroom%252Fservlet%252FGroupServlet%253FdtId%253DDOMAIN',
		up_target:'aula.jsp',
		up_dCode: 'aula.code',
		fromCampus:'true',
		lang: get_lang(),
		country:'ES',
		hp_theme:'false'
	}
	// Get the tutoria aula just to get the photo...
	ajax_uoc('/webapps/widgetsUOC/widgetsDominisServlet', args, 'GET', function(resp) {
		var picture = $(resp).find('.foto').attr('src');
		classroom.set_picture(picture);
	});
}

function retrieve_news(){
	var args = {
		up_isNoticiesInstitucionals : false,
		up_title : 'Novetats%2520i%2520noticies',
		up_maximized: true,
		up_maxDestacades : 2,
		up_showImages : 0,
		up_sortable : true,
		up_ck : 'nee',
		up_maxAltres: 5,
		up_rssUrlServiceProvider : '%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant.js',
		up_target : 'noticies.jsp',
		libs : '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944751.js%3Ffeatures%3Dlibrary%3Asetprefs%3Adynamic-height',
		fromCampus : true,
		lang: get_lang(),
		country: 'ES',
		color: '',
		userType: 'UOC-ESTUDIANT-gr06-a',
		hp_theme: 'false'
	}

	ajax_uoc('/webapps/widgetsUOC/widgetsNovetatsExternesWithProviderServlet', args, 'GET', function(resp) {
		var news = $('<div />').append(resp).find('#divMaximizedPart>ul').html();
		if (news != undefined) {
			$('#detail_news').html(news);
		}
	});
}

function retrieve_more_info_classrooms(handler){
	var show_pictures = get_show_pictures();
	if (show_pictures) {
		var args = {
			domainPontCode : 'sem_pont'
		}
		// Old aulas page to get the picture
		ajax_uoc('/webapps/classroom/081_common/jsp/aules_estudiant.jsp', args, 'GET', function(resp) {
			var classrooms = Classes.get_all();
			var resp = $(resp);
			for(i in classrooms){
				var classroom = classrooms[i];
				if(!classroom.picture){
					var classroom_html = resp.find('#cap'+classroom.domain);
					if(classroom_html){
						var picture = classroom_html.find('img.fotoconsultor').attr('src');
						if(picture){
							picture= root_url +picture;
							classroom.set_picture(picture);
						}
					}
				}
			}
			Classes.save();
		}, "html");
	}

	// Get the new aulas
	var args = {
		perfil : 'estudiant',
		setLng : get_lang()
	}
	ajax_uoc('/app/guaita/assignatures', args, "GET", function(resp) {
		$(resp).find('#sidebar .block').each(function() {
			parse_classroom_more_info(this);
			if (handler) {
				handler();
			}
		});
		Classes.save();
	});
}
function parse_classroom_more_info(html){
	var domainid = get_url_attr($(html).find('.LaunchesOWin').attr('href'),'classroomId');
	if(!domainid){
		var domainid = get_url_attr($(html).find('.LaunchesOWin').attr('href'),'domainId');
	}
	if(domainid){
		var classroom = Classes.search_domain(domainid);
		if(classroom){
			classroom.set_color($(html).find('.block-color').attr('data-color'));
			$(html).find("a[data-bocamoll-object-resourceid]").each(function() {
	        	var element = $(this);

				var title = element.html();
				var code  = element.attr('data-bocamoll-object-resourceid');
				var resource = new Resource(title, code);
				var link = element.attr('href');
				resource.set_link(link);
				retrieve_resource(classroom, resource, element);
			});
		}
	}
}

function retrieve_resource(classroom, resource, element){
    var subjectid = $(element).data('bocamoll-subject-id');
    var classroomid= $(element).data('bocamoll-classroom-id');
    var resourceid = $(element).data('bocamoll-object-resourceid');

	var args = {
		sectionId : '-1',
		pageSize : 0,
		pageCount: 0,
		classroomId: classroomid,
		subjectId: subjectid,
		resourceId: resourceid
	};
	ajax_uoc('/webapps/aulaca/classroom/LoadResource.action', args, 'GET', function(data) {
        var num_msg_pendents = Math.max(data.resource.newItems, 0);
        var num_msg_totals = data.resource.totalItems;
        var usernumber = data.currentUser.userNumber;
        var user_save = get_user();
        if (usernumber && user_save.usernumber != usernumber) {
        	save_usernumber(usernumber);
        }

		resource.set_messages(num_msg_pendents, num_msg_totals);
		classroom.add_resource(resource);
		Classes.save();
    },
    function(data) {
     	//On Error
    	resource.set_messages(0, 0);
    	classroom.add_resource(resource);
    	Classes.save();
    });
}

function retrieve_events() {
	var user_save = get_user();
    if (user_save.usernumber) {
		var args = {
			idp: user_save.usernumber,
			perfil: 'estudiant',
			format: 'json'
		}
		ajax_uoc('/app/guaita/calendari', args, 'GET', function(data) {
			//console.log(data);
			for (x in data.classrooms) {
				var c = data.classrooms[x];
				if (c.activitats.length > 0) {
					var classroom = Classes.search_domain(c.domainId);
					for (y in c.activitats) {
						var act = c.activitats[y]
						var evnt = new Event(act.name);
						evnt.set_link(act.link);
						evnt.start = parseDate(act.startDateStr);
						evnt.end = parseDate(act.deliveryDateStr);
						evnt.solution = parseDate(act.solutionDateStr);
						evnt.grade = parseDate(act.qualificationDateStr);
						classroom.add_event(evnt);
					}
				}
			}
			Classes.save();
	    });
	}
}


function retrieve_session(url, data, type, handler_succ, handler_err){
	var user_save = get_user();
	if(user_save.username && user_save.password) {
		enqueue_petition(url, data, type, handler_succ, handler_err);
		if (!is_retrieving()) {
			set_retrieving(true);
			console.log('Retrieving session...');
			var data = {
				l:user_save.username,
				p:user_save.password,
				appid:"WUOC",
				nil:"XXXXXX",
				lb:"a",
				url:root_url,
				x:"13",
				y:"2"
			};
			ajax_uoc_login("/cgi-bin/uoc", data, "POST", function(resp) {
				var iSs = resp.indexOf("?s=");
				if( iSs != -1 ){
					var	iSf = resp.indexOf("\";", iSs);
					var	iSf2 = resp.indexOf("&", iSs);
					if (iSf2 < iSf && iSf2 > 0) {
						iSf = iSf2;
					}
					ses = resp.substring(iSs + 3, iSf);
					save_session(ses);
					console.log('Session! '+ses);
					run_petitions();
				} else {
					console.error('ERROR: Cannot fetch session');
				}
			});
		}
	}
}
