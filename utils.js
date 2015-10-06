var root_url = 'http://cv.uoc.edu';
var root_url_ssl = 'https://cv.uoc.edu';

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    try {
        return decodeURIComponent(escape(window.atob(str)));
    } catch(err) {
        return str;
    }
}

function getDate(date) {
    var sp = date.split('T');
    sp = sp[0].split('-');
    if (sp.length <= 2) {
        return "";
    }
    return sp[2]+"/"+sp[1];
}

function getTime(date) {
    var sp = date.split('T');
    if (sp.length <= 1) {
        return "";
    }
    sp = sp[1].split(':');
    if (sp.length <= 1) {
        return "";
    }
    return sp[0]+":"+sp[1];
}

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

function compareDates(dateA, dateB) {
    var asplit = dateA.split("/");
    var bsplit = dateB.split("/");
    if (bsplit[2] != asplit[2]) {
        return asplit[2] - bsplit[2];
    }
    if (bsplit[1] != asplit[1]) {
        return asplit[1] - bsplit[1];
    }
    return asplit[0] - bsplit[0];
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

function get_real_url(url) {
    if(url.indexOf('/') == 0){
        return root_url + url;
    } else if(url.indexOf('http://') == -1 && url.indexOf('https://') == -1){
        return root_url + '/' + url;
    }
    return url;
}

function get_url_with_data(url, data) {
    var uri = get_real_url(url) + '?' + uri_data(data);
}


var Queue = new function(){
    var queue = Array();
    var after_function = false;
    var executing = false;

    var run = this.run = function() {
        var session = Session.get();
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
                    if (after_function) {
                        after_function();
                    }
                }
            }
        } else {
            Session.retrieve();
        }
    }

    this.request = function(url, data, type, handler_succ, handler_err) {
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
            run();
        }
    }

    this.set_after_function = function(fnc){
        after_function = fnc;
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
            run();
        });
    }
};

function _(str, params) {
    var st = translate(str, params);
    if (st) {
        return st;
    }
    // Not found
    console.log(str);
    return str;
}

$( document ).ready(function() {
    $('.translate').each(function() {
        var text = $(this).text();
        $(this).text(_(text));
    });
    $('.translateph').each(function() {
        var text = $(this).attr('placeholder');
        $(this).attr('placeholder', _(text));
    });
    $('.translatetit').each(function() {
        var text = $(this).attr('title');
        $(this).attr('title', _(text));
    });
    $('.translateal').each(function() {
        var text = $(this).attr('aria-label');
        $(this).attr('aria-label', _(text));
    });
});