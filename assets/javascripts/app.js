/* Foundation v2.2.1 http://foundation.zurb.com */

/**
 * fb object to perform Facebook graph API operations
 *
 */
 
var fb = {
	end_point: "https://graph.facebook.com/",
	
	api: function(uri, type, data, success_callback, error_callback){
		if( data.batch!= undefined  ){ // if making a batch call
			data.batch = JSON.stringify(data.batch); // batch parameter must be a JSON array     
		}
		
		$.ajax({
			url: this.end_point+uri,
			type: type,
			data: data,
			dataType: "json",
			crossDomain: true,
			success: function(response){
				try{
					success_callback(response);
				} catch(e){ };
			},
			error: function(jqXHR, textStatus, errorThrown){
				try{
					error_callback(jqXHR, textStatus, errorThrown);
				} catch(e){};
			}
		});	
	}

};


/**
 * manipulate HTML 5 localStorage via this object
 */
var storage = {
	ns: null, // storage name space
	element: null,
	/**
	 * save to HTML 5 localStorage
	 *
	 * @var key key of the object
	 * @var value value of the object
	 */
	__set: function(key, value) { 
		try {
			localStorage.setItem(key, value); //saves to the database, "key", "value"
			return true;
		} catch (e) {
			 if (e == QUOTA_EXCEEDED_ERR) {
				 alert('Quota exceeded!'); //data wasn't successfully saved due to quota exceed so throw an error
				 return false;
			}
		}
		
		return false;
	},

	/**
	 * get from HTML 5 localStorage
	 * @var key key of the object
	 */
	__get: function(key) { 
		return localStorage.getItem(key); //saves to the database, "key", "value"
	},

	/**
	 * remove from HTML 5 localStorage
	 * @var key key of the object
	 */
	__remove: function(key) {
		localStorage.removeItem(key);
		return true;
	},
	
	grab: function(){
		this.element = JSON.parse( storage.__get( this.ns ) ); // get the fbtuc local object
	},
	
	save: function() {
		storage.__set(this.ns, JSON.stringify(this.element));
	}
};

/**
 * generate left side list for the apps
 */ 
function generate_app_list() {
	var block = "";	
	var html = "";

	block += '<dd><a href="#{{app_id}}" data-app_id="{{app_id}}"><img src="{{icon_url}}" /> {{name}}</a></dd>';
	
	var apps = new Array();
	
	$.each(storage.element.apps, function(k, v){
		//console.log(v);
		apps.push(v);
	});
	
	try{
		html = Mustache.render(block, {"apps" : '{{#apps}}' + apps} + '{{/apps}}');
	} catch(e){
		$.each(apps, function(i, app) {
			var dd = block;
			dd = dd.replace(/{{app_id}}/g, app.app_id);
			dd = dd.replace(/{{icon_url}}/g, app.icon_url);
			dd = dd.replace(/{{name}}/g, app.name);
			
			html += dd;
		});
	}
	
	$("dl#apps").html(html);
	
	html = "";
	block = "";
	block += '<li id="{{app_id}}Tab" data-app_id="{{app_id}}">'+$loading+'</li>';
	
	try{
		html = Mustache.render(block, {"apps" : '{{#apps}}' + apps + '{{/apps}}'});
	} catch(e){
		$.each(apps, function(i, app) {
			var li = block;
			li = li.replace(/{{app_id}}/g, app.app_id);
			html += li;
		});		
	}
	
	$("ul#apps").append(html);
}


/**
 * generate app page
 */
function generate_app_page(app_id) {
	var block = "";	
	var html = "";

	block += '	<p>';
	block += '		<a href="#'+app_id+'addUser" class="small blue button radius addUser" data-app_id="'+app_id+'" >Add user</a>';
	block += '		<a href="#'+app_id+'removeUser" class="small red button radius removeUser" data-app_id="'+app_id+'" >Remove user</a>';
	block += '		<a href="#'+app_id+'removeApp" class="small red button radius removeApp" data-app_id="'+app_id+'" >Remove app</a>';
	block += '	</p>';
	block += '	<ul id="users">';
	block += '		<li> ' + $loading + ' </li>';
	block += '	</ul>';
	
	html = block;
	
	$("#"+app_id+"Tab").html(html);
	
	// get all test users
	var app = storage.element.apps[app_id];
	get_users(app_id,  storage.element.apps[app_id].app_id + "|" + storage.element.apps[app_id].app_secret, function(users){
		
		if(users.length>0){
			$("#"+app_id+"Tab ul#users li").html(generate_users_list(app_id, users));
		} else{
			$("#"+app_id+"Tab ul#users li").html("<h4><em>"+app.name+"</em> does not have any test users.");
		}
	}, function(jqXHR, textStatus, errorThrown) {
	});
}


/**
 * generate user table HTML
 * 
 * @var app_id int applciation ID
 * @var users mixed users object
 * @var limit limit user
 * @var page int current page
 */
function generate_users_list(app_id, users) {
	var block = "";	
	var html = "";
	
	block += '<tr>';
	block += '	<td>{{i}}</td>';
	block += '	<td><a href="{{link}}" target="_blank"><img src="http://graph.facebook.com/{{id}}/picture" /></a></td>';
	block += '	<td><a href="{{link}}" target="_blank">{{id}}</a></td>';
	block += '	<td><a href="{{link}}" target="_blank">{{name}}</a></td>';
	
	block += '	<td><a href="#{{id}}AccessDetails" class="accessDetails" data-access_token="{{access_token}}" data-email={{email}}>Show</a>';
	block += '	';

	block += '	</td>';
	
	block += '	<td><a href="{{login_url}}" target="_blank">Login</a></td>';
	block += '</tr>';
		
	html +='<table>';
	html +='  <thead>';
	html +='    <tr>';
	html +='      <li><th>&nbsp;&nbsp;&nbsp;</th>';
	html +='      <th>Avatar</th>';
	html +='      <th>ID</th>';
	html +='      <th>Name</th>';
	html +='      <th>Access Details</th>';
	html +='      <th>Login</th>';
	html +='    </tr>';
	html +='  </thead>';
	html +='  <tbody>';
	
	try{
		html += Mustache.render("{{#users}}" + block+ "{{/users}}", {users:users});
	} catch(e){ 
		$.each(users, function(i, user) {
			var tr = block;
			tr = tr.replace(/{{i}}/g, user.i);
			tr = tr.replace(/{{link}}/g, user.link);
			tr = tr.replace(/{{id}}/g, user.id);
			tr = tr.replace(/{{name}}/g, user.name);
			tr = tr.replace(/{{email}}/g, user.email);
			tr = tr.replace(/{{access_token}}/g, user.access_token);
			tr = tr.replace(/{{login_url}}/g, user.login_url);
			
			html += tr;
		});		

	}
	
	html +='  </tbody>';
	html +='</table>';                  
                  
	return html;		
}

/**
 * get test usres for this application
 */
function get_users(app_id, access_token, success_callback, error_callback) {
	
	var users       = {}; // to store user information
        var user_info   = []; // array for mustache 
        
        var args = {
            access_token: access_token,
            batch: []
        };
    
        args.batch.push({
            method                      : "GET",
            name                        : "get-users",
            relative_url                : "/"+app_id+"/accounts/test-users?limit=500",
            omit_response_on_success    : false
        });

        args.batch.push({
            method        : "GET",
            relative_url  : "?ids={result=get-users:$.data.*.id}"
        });
        
	
        // make batch API call to get more information about this user. notice how we are submitting a POST to / 
	fb.api("", "POST", args, function(batch_response) { // success_callback
		try{
			//console.log(batch_response);
			var body = JSON.parse(batch_response[0].body);  // we need to get user's access token
			
			$.each(body.data, function(i, user){
				users[user.id] = user;    // push to users object with id being the key
				users[user.id].i = (i+1);
			});
			
			body = JSON.parse(batch_response[1].body);
				
			$.each(body, function(id, user) {
				$.each(user, function(k, v) { // get each peace 
					users[id][k] = v; // update users object with id being the key
				});
				
				user_info.push(users[id]); // push to user_info array
			});
		} catch(e){}
		
		try{ 
			success_callback(user_info);	
		} catch(e){}
		
	}, function(jqXHR, textStatus, errorThrown){ // error_callback 
		var response_text = JSON.parse(jqXHR.responseText); 
		
		$.each(response_text.error, function(k, v) {
			console.log(k + " : " + v);
		});
	}); // end of fb.api call
}

var $loading = '<div style="text-align: center;"><img src="assets/images/loading.gif"></div>'; // will display this HTML code while loading
storage.ns = "fbtuc";

jQuery(document).ready(function ($) {
	
	storage.grab();
	
	if(storage.element === null) { // if, null, app is being used for the first time, initialize the storage element with predefined objects
		storage.element = {
			//apps: new Array(),
			apps: {},
			settings: {}
		}
		
		// save the object
		storage.save();
	}
	
	// generate the list of apps
	generate_app_list();

	/// add an app
	$("a#addApp").on("click", function(e){
		e.preventDefault();
		$("#modal #addApp").reveal();
	});
	
	$("a#removeApps").on("click", function(e){
		e.preventDefault();
		localStorage.removeItem("fbtuc");
	});	
	
	$(document).on("click", ".accessDetails", function(e){
		e.preventDefault();
		
		$("#modal #accessDetails p#access_token").html($(this).data("access_token"));
		$("#modal #accessDetails p#email").html($(this).data("email"))
		
		$("#modal #accessDetails").reveal();
	});
	
	$(document).on("click", ".addUser", function(e){
		e.preventDefault();
		var app = storage.element.apps[$(this).data("app_id")]
		
		$("#modal #addUser #appName").html(app.name);
		
		$("#modal #addUser").reveal();
	});


	
	// add user to an app
	$("#modal #addUser input#submit").on("click", function(e) {
		e.preventDefault();
		
	});
		
	
	// save the app information
	$("#modal #addApp input#submit").on("click", function(e){
		e.preventDefault();
		var $form = $(this).closest('form');
		var $app_id = $form.find(':input[name="app_id"]');
		var $app_secret = $form.find(':input[name="app_secret"]'); 
		var $alert_box = $form.siblings('div.alert-box');
		
		$form.find('small').hide();
		$alert_box.removeClass('error success');
		$alert_box.hide();
		
		var can_submit = true; // can submit flag
		
		if( $app_id.val()  == '' ){
			can_submit = false;
			$app_id.closest('.form-field').addClass("error");
			$app_id.siblings('small').show();
		}
		
		if( $app_secret.val()  == '' ) {
			can_submit = false;
			$app_secret.closest('.form-field').addClass("error");
			$app_secret.siblings('small').show();			
		}
		
		
		if(can_submit) {
			$alert_box.html($loading);
			$alert_box.show();
			// get facebook app
			var data = {
				access_token: $app_id.val() + "|" + $app_secret.val() // as we are passing the access_token, it is a full-proof approach to make sure we only get the application information
			}
			// graph API call to get the applciation details
			fb.api($app_id.val(),"GET", data, function(response){
					//console.log(response);
					$alert_box.addClass('success');
					$alert_box.html('Application added.<a href="" class="close">&times;</a>');
					$alert_box.show();
					
					// save application information here 
					storage.element.apps[$app_id.val()] = { // save by the app ID
						app_id: $app_id.val(),
						app_secret: $app_secret.val(),
						icon_url: response.icon_url,
						name: response.name
					};
					
					// save to local storage
					storage.save();
					
					// re-generate app list
					generate_app_list();
				}, function(jqXHR, textStatus, errorThrown) {
					//console.log(eval(jqXHR.responseText));
					var message = "error: " + errorThrown + "<br />";
					message += "HTTP status: " + textStatus + "<br />";
					var response = JSON.parse(jqXHR.responseText);
					$.each( response.error , function(k, v){
						message += k + ": " + v + "<br />";
					});
					
					$alert_box.addClass('error');
					$alert_box.html(message+' <a href="" class="close">&times;</a>');
					
					$alert_box.show();
				}
			
			);
		}	
	});
	
	
	/* Use this js doc for all application specific JS */
	
	/* TABS --------------------------------- */
	/* Remove if you don't need :) */
	
	function activateTab($tab) { 
		var $activeTab = $tab.closest('dl').find('a.active'),
		contentLocation = $tab.attr("href") + 'Tab';
		
		// Strip off the current url that IE adds
		contentLocation = contentLocation.replace(/^.+#/, '#');
		
		//Make Tab Active
		$activeTab.removeClass('active');
		$tab.addClass('active');
		
		//Show Tab Content
		$(contentLocation).closest('.tabs-content').children('li').hide();
		$(contentLocation).css('display', 'block');
		
		generate_app_page($tab.data("app_id"));
	}
	
	$('dl.tabs').each(function () {
		//Get all tabs
		var tabs = $(this).children('dd').children('a');
		tabs.click(function (e) {
			activateTab($(this));
		});
	});
	
	if (window.location.hash) {
		activateTab($('a[href="' + window.location.hash + '"]'));
		$.foundation.customForms.appendCustomMarkup();
	}
	
	/* ALERT BOXES ------------ */
	$(".alert-box").delegate("a.close", "click", function(event) {
		event.preventDefault();
		$(this).closest(".alert-box").fadeOut(function(event){
			$(this).remove();
		});
	});
	
	
	/* PLACEHOLDER FOR FORMS ------------- */
	/* Remove this and jquery.placeholder.min.js if you don't need :) */
	
	$('input, textarea').placeholder();
	
	/* TOOLTIPS ------------ */
	$(this).tooltips();
	
	
	/* DROPDOWN NAV ------------- */
	
	var lockNavBar = false;
	$('.nav-bar a.flyout-toggle').live('click', function(e) {
		e.preventDefault();
		var flyout = $(this).siblings('.flyout');
		if (lockNavBar === false) {
			$('.nav-bar .flyout').not(flyout).slideUp(500);
			flyout.slideToggle(500, function(){
				lockNavBar = false;
			});
		}
	
	
		lockNavBar = true;
	});
	
	
	if (Modernizr.touch) {
		$('.nav-bar>li.has-flyout>a.main').css({
			'padding-right' : '75px'
		});
		$('.nav-bar>li.has-flyout>a.flyout-toggle').css({
			'border-left' : '1px dashed #eee'
		});
	} else {
		$('.nav-bar>li.has-flyout').hover(function() {
			$(this).children('.flyout').show();
		}, function() {
			$(this).children('.flyout').hide();
		})
	}
	
	
	/* DISABLED BUTTONS ------------- */
	/* Gives elements with a class of 'disabled' a return: false; */

});
