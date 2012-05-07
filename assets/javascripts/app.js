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


function generate_app_list() {
	var block = "";	
	var html = "";

	block += '<dd><a href="#{{app_id}}"><img src="{{icon_url}}" /> {{name}}</a></dd>';
	
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
			dd = dd.replace("{{app_id}}", app.app_id);
			dd = dd.replace("{{icon_url}}", app.icon_url);
			dd = dd.replace("{{name}}", app.name);
			
			html += dd;
		});
	}
	
	$("dl#apps").html(html);
	
	html = "";
	block = "";
	block += '<li id="{{app_id}}Tab">'+$loading+'</li>';
	
	try{
		html = Mustache.render(block, {"apps" : '{{#apps}}' + apps + '{{/apps}}'});
	} catch(e){
		$.each(apps, function(i, app) {
			var li = block;
			li = li.replace("{{app_id}}", app.app_id);
			
			html += li;
		});		
		
	}
	
	$("ul#apps").append(html);
	
	
}


var $loading = '<div style="text-align: center;"><img src="assets/images/loading.gif"></div>'; // will display this HTML code while loading
storage.ns = "fbtuc";




jQuery(document).ready(function ($) {
	
	storage.grab();
	
	if(storage.element === null) { // if, null, app is being used for the first time, initialize the storage element with predefined objects
		storage.element = {
			//apps: new Array(),
			apps: {},
			settings: []
		}
		
		// save the object
		storage.save();
	}
	
	
	//console.log(storage.element);
	
	localStorage.removeItem("fbtuc");
	//storage.__remove(storage.ns);
	
	// generate the list of apps
	generate_app_list();

	/// add an app
	$("a#add_app").on("click", function(e){
		e.preventDefault();
		$("#modal #add_app").reveal();
	});
	
	// save the app information
	$("#modal #add_app input#submit").on("click", function(e){
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
