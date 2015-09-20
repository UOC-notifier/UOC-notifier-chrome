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

function check_messages(after_check_fnc){
	set_after_queue_function(after_check_fnc);

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
			retrieve_more_info_classrooms();
		} else {
			reset_session();
		}
	});
}

function set_messages() {
	var old_messages = get_icon();
	var messages = Classes.notified_messages;
	save_icon(messages);

	// Set icon
	if(messages > 0){
		chrome.browserAction.setBadgeText({text:""+messages});
		if(old_messages < messages && messages >= get_critical()){
			notify(_('Tienes ')+messages+_(' mensajes por leer'));
		}
	} else {
		chrome.browserAction.setBadgeText({text:""});
	}
	//chrome.browserAction.setIcon({path:"logo.png"});

	console.log("Check messages: Old "+old_messages+" New "+messages);
}

function show_PAC_notifications() {
	var text = "";
	var classrooms = Classes.get_notified();
	for(var i in classrooms) {
		for(var x in classrooms[i].events) {
			var ev = classrooms[i].events[x];
			var start = new Date(ev.start);
			var end = new Date(ev.end);
			if (isToday(ev.end)) {
				text += _("Hoy acaba la ")+ev.name+_(" de ")+classrooms[i].title+"\n";
			} else if (isToday(ev.start)) {
				text += _("Hoy empieza la ")+ev.name+_(" de ")+classrooms[i].title+"\n";
			}
		}
	}
	notify(text);
}

function notify(str) {
	if (get_notification() && str.length > 0) {
		var notification = new Notification('UOC Notifier', { icon: window.location.origin +"/logo.png", body: str });
		notification.onshow = function() {setTimeout(function(){
			notification.close();
		}, 3000)};
	}
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
		return classroom;
	}
	return false;
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

function retrieve_more_info_classrooms(){
	// Get the new aulas
	var args = {
		perfil : 'estudiant',
		setLng : get_lang()
	}
	enqueue_request('/app/guaita/assignatures', args, "GET", function(resp) {
		resp = resp.replace(/<img/gi, '<noload');
		$(resp).find('#sidebar .block').each(function() {
			parse_classroom_more_info(this);
		});
		retrieve_events();
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
	enqueue_request('/webapps/aulaca/classroom/LoadResource.action', args, 'GET', function(data) {
        var num_msg_pendents = Math.max(data.resource.newItems, 0);
        var num_msg_totals = data.resource.totalItems;
        var usernumber = data.currentUser.userNumber;
        var user_save = get_user();
        if (usernumber && user_save.usernumber != usernumber) {
        	save_usernumber(usernumber);
        }

		resource.set_messages(num_msg_pendents, num_msg_totals);
		classroom.add_resource(resource);
    },
    function(data) {
     	//On Error
    	resource.set_messages(0, 0);
    	classroom.add_resource(resource);
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
		enqueue_request('/app/guaita/calendari', args, 'GET', function(data) {
			//console.log(data.classrooms);
			for (x in data.classrooms) {
				var c = data.classrooms[x];
				if (c.activitats.length > 0) {
					var classroom = Classes.search_domain(c.domainId);
					for (y in c.activitats) {
						var act = c.activitats[y];
						var evnt = new Event(act.name);

						var args = {};
						if (c.presentation == "AULACA") {
							var urlbase = '/webapps/aulaca/classroom/Classroom.action';
							args.classroomId = act.classroomId;
							args.subjectId = act.subjectId;
							args.activityId = act.eventId;
							args.javascriptDisabled = false;
						} else {
							var urlbase = '/webapps/classroom/081_common/jsp/eventFS.jsp';
							args.domainId = act.domainId;
							var aux = c.domainCode.split('_');
							args.domainTemplate = 'uoc_'+aux[0]+'_'+c.codi;
							args.idLang = 'a';
							args.eventsId = act.eventId;
							args.opId = 'view';
							args.userTypeId = 'ESTUDIANT';
							args.canCreateEvent = false;
						}

						evnt.link = root_url + urlbase+'?'+uri_data(args)+'&s=';
						evnt.start = act.startDateStr;
						evnt.end = act.deliveryDateStr;
						evnt.solution = act.solutionDateStr;
						evnt.grading = act.qualificationDateStr;
						classroom.add_event(evnt);
					}
				}
			}
			var classrooms = Classes.get_notified();
			for(var i in classrooms) {
				if (classrooms[i].events.length > 0) {
					var classroom = Classes.search_domain(classrooms[i].domain);
					var args = {
						domainId: classrooms[i].domain
					}
					enqueue_request('/webapps/rac/listEstudiant.action', args, 'GET', function(data) {
						data = data.replace(/<img/gi, '<noload');
						data = $(data).filter('.TablaNotas');
						$(data).find("td a[href*='viewPrac']").each(function() {
							var name = $(this).parent('td').siblings('.PacEstudiant').text().trim();
							for(var x in classroom.events) {
								var s = name.search(classroom.events[x].name);
								if (s > 0 && s < 6) {
									var evnt = new Event(classroom.events[x].name);
									evnt.committed = true;
									classroom.add_event(evnt);
									break;
								}
							}
						});
						$(data).find('.Nota').each(function() {
							var nota = $(this).text().trim();
							if (nota.length > 0 && nota != '-') {
								var name = $(this).siblings('.PacEstudiant').text().trim();
								for(var x in classroom.events) {
									var s = name.search(classroom.events[x].name);
									if (s > 0 && s < 6) {
										var evnt = new Event(classroom.events[x].name);
										evnt.grade = nota;
										classroom.add_event(evnt);
										break;
									}
								}
							}
						});
					});
				}
			}
	    });
	}
}


function retrieve_session() {
	var user_save = get_user();
	if(user_save.username && user_save.password) {
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
					run_requests();
				} else {
					console.error('ERROR: Cannot fetch session');
					$("#status").text(_("El usuario/password no es correcto"));
					$(".alert").show();
				}
			});
		}
	}
}
