var root_url = 'http://cv.uoc.edu';
var root_url_ssl = 'https://cv.uoc.edu';

function isToday(date) {
    var q = new Date();
    var y = q.getFullYear() - 2000;
    var m = q.getMonth() + 1;
    var d = q.getDate();
    var dsplit = date.split("/");
    return dsplit[0] == d && dsplit[1] == m && dsplit[2] == y;
}

function isBeforeToday(date) {
    var q = new Date();
    var y = q.getFullYear() - 2000;
    var m = q.getMonth() + 1;
    var d = q.getDate();
    var dsplit = date.split("/");
    if (dsplit[2] == y) {
        if (dsplit[1] == m) {
            return dsplit[0] < d;
        }
        return dsplit[1] < m;
    }
    return dsplit[2] < y;
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

function get_url_base(url) {
    //prefer to use l.search if you have a location/link object
    url = get_real_url(url);
    var urlparts= url.split('?');
    if (urlparts.length >= 2) {
        return urlparts[0];
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
    } else if(url.indexOf('http://') == -1 && url.indexOf('https://') == -1){
        return root_url + '/' + url;
    }
    return url;
}

function ajax_do(session, url, data, type, handler_succ, handler_err){
    if(!data) {
        data = {};
    }
    data.s = session;
    url = root_url + url;
    if (type == 'GET') {
        url += '?'+uri_data(data);
        var args = false;
    } else {
        var args = uri_data(data);
    }

    $.ajax({
        type: type,
        url: url,
        data: args,
        processData: false
    })
    .done(function(resp) {
        if (handler_succ) {
            handler_succ(resp, data);
        }
    })
    .fail(function(resp) {
        console.error('ERROR: Cannot fetch '+url);
        if (handler_err) {
            handler_err(resp);
        }
    })
    .always(function() {
        executing = false;
        run_requests();
    });
}

function ajax_uoc_login(url, data, type, handler_succ){
    url = root_url + url;
    $.ajax({
        type: type,
        beforeSend: function (request){
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        },
        xhrFields: {
            withCredentials: true
        },
        url: url,
        data: uri_data(data),
        processData: false
    })
    .done(handler_succ)
    .fail(function() {
        console.error('ERROR: Cannot fetch '+url);
    })
    .always(function() {
        set_retrieving(false);
    });
}

var queue = Array();
var after_queue_function = false;
var executing = false;
function enqueue_request(url, data, type, handler_succ, handler_err) {
    if (url) {
        var pet = {
            url: url,
            data: data,
            type: type,
            success: handler_succ,
            error: handler_err
        };
        queue.push(pet);
        console.log('Queued ' + url);
        run_requests();
    }
}

function set_after_queue_function(fnc){
    after_queue_function = fnc;
}

function run_requests() {
    var session = get_session();
    if (session) {
        if (!executing) {
            if (queue.length > 0) {
                executing = true;
                var pet = queue.shift();
                console.log('Run ' + pet.url);
                ajax_do(session, pet.url, pet.data, pet.type, pet.success, pet.error);
            } else {
                console.log('End of queue');
                Classes.save();
                if (after_queue_function) {
                    after_queue_function();
                }
            }
        }
    } else {
        retrieve_session();
    }
}