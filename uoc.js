var root_url = 'http://cv.uoc.edu';
var root_url_ssl = 'https://cv.uoc.edu';

function check_messages(async){
	var old_messages = Classes.notified_messages;
	retrieve_classrooms(async);
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

function retrieve_classrooms(async){
	var session = get_session();
	if(session){
		var args = {
			s : session,
			newStartingPage:0,
			language:"b"
		}
		console.log(session);
		$.ajaxSetup({async:async});
		$.get(root_url + '/UOC2000/b/cgi-bin/hola?'+uri_data(args), function(resp) {
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
				Classes.save();
			} else {
				reset_session();
			}
		});
	}
}

function parse_classroom(classr){
	if(classr.title && (classr.domaintypeid=='AULA'|| classr.domaintypeid=='TUTORIA')){
		//console.log(classr);
		var title = classr.shortname ? classr.shortname : classr.title;
		var classroom = new Classroom(title, classr.code, classr.domainid, classr.domaintypeid, classr.pt_template);

		if(!Classes.get_notify(classr.code)) return classroom;

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

		if(classroom.notify && classroom.type == 'TUTORIA' && !classroom.picture){
			retrieve_picture_tutoria(classroom);
		}
		return classroom;
	}
	return false;
}

function retrieve_picture_tutoria(classroom){
	var session = get_session();
	if(session){
		var args = {
			s : session,
			param : 'dCode%3D'+classroom.code,
			up_xmlUrlServiceAPI : 'http%253A%252F%252Fcv.uoc.edu%252Fwebapps%252Fclassroom%252Fservlet%252FGroupServlet%253FdtId%253DDOMAIN',
			up_target:'aula.jsp',
			up_dCode: 'aula.code',
			fromCampus:'true',
			lang:'es',
			country:'ES',
			hp_theme:'false'
		}
		$.ajaxSetup({async:false});
		$.get(root_url + '/webapps/widgetsUOC/widgetsDominisServlet?'+uri_data(args), function(resp) {
			var picture = $(resp).find('.foto').attr('src');
			classroom.set_picture(picture);
		});
	}
}

function retrieve_more_info_classrooms(){
	var session = get_session();
	if(session){
		var args = {
			s : session,
			domainPontCode : 'sem_pont'
		}
		$.ajaxSetup({async:false});
		$.get(root_url + '/webapps/classroom/081_common/jsp/aules_estudiant.jsp?'+uri_data(args), function(resp) {
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
		}, "html");

		var args = {
			s : session,
			perfil : 'estudiant'
		}
		$.get(root_url + '/app/guaita/assignatures?'+uri_data(args), function(resp) {
			$(resp).find('#sidebar .block').each(function() {
				parse_classroom_more_info(this);
			});
		});
	}
}
function parse_classroom_more_info(html){
	var domainid = get_url_attr($(html).find('.LaunchesOWin').attr('href'),'domainId');
	if(domainid){
		var classroom = Classes.search_domain(domainid);
		if(classroom){
			classroom.set_color($(html).find('.block-color').attr('data-color'));
			$(html).find('.block-content .list>li').each(function(){
				var label = $(this).find('.lbl');
				var title = label.html();
				var code  = label.attr('data-bocamoll-object-resourceid');
				var resource = new Resource(title, code);

				var link = label.attr('href');
				resource.set_link(link);

				var res_messages = $(this).find('.new').html();
				var all_messages = $(this).find('.all').html();
				resource.set_messages(res_messages, all_messages);
				classroom.add_resource(resource);
			});
		}
	}
}

function retrieve_session(){
	var user_save = get_user();
	if(user_save.username && user_save.password){
		$.ajaxSetup({async:false});
		$.ajax({
	            type:"POST",
	            beforeSend: function (request){
	                request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	            },
	            url: root_url + "/cgi-bin/uoc",
	            data: uri_data({
					l:user_save.username,
					p:user_save.password,
					appid:"WUOC",
					nil:"XXXXXX",
					lb:"a",
					url:root_url,
					x:"13",
					y:"2"
				}),
	            processData: false,
	            success: function(resp) {
	                var iSs = resp.indexOf("?s=");
					if( iSs != -1 ){
						var	iSf = resp.indexOf("\";", iSs);
						save_session(resp.substring(iSs + 3, iSf));
					}
					var args = {
						theme:'widgetUOC'
					}
					$.ajaxSetup({async:false});
					$.get(root_url + '/app/status.net/index.php?=?'+uri_data(args), function(resp) {
						return;
					});
				}
	    });
	}
}

function get_url_attr(url, attr){
	if(url.indexOf(attr) == -1){
		return false;
	}

	var regexp = attr+"=([^&]+)";
	regexp = new RegExp(regexp);
	var match = url.match(regexp);
	if(match){
		return match[1];
	}
	return false;
}

function get_url_withoutattr(url, parameter) {
    //prefer to use l.search if you have a location/link object
    url = get_real_url(url);
    var urlparts= url.split('?');
    if (urlparts.length >= 2) {
        var prefix =  encodeURIComponent(parameter)+'=';
		if(url.indexOf(prefix) == -1){
			return url;
		}

        var pars = urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (var i= pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        url= urlparts[0]+'?'+pars.join('&');
        return url;
    } else {
        return url;
    }
}


function uri_data(map){
	var str = "";
	for(var v in map){
		str += v+"="+map[v]+"&";
	}
	return str.slice(0,-1);
}

function get_real_url(url){
	if(url.indexOf('/') == 0){
		return root_url + url;
	} else if(url.indexOf('http://') == -1 || url.indexOf('https://') == -1){
		return root_url + '/' + url;
	}
	return url;
}
