{\rtf1\ansi\ansicpg1251\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // TODO \'e0 checker !\
var autologin;\
var request_id ;\
var request_pseudo ;\
var request_page ;\
var request_pseudo_is_online ;\
var session_id ;\
var myself_data = null ;\
var myself_id ;\
var myself_pseudo ;\
var myself_email ;\
var myself_is_abo ;\
var myself_modale_add_pic = false ;\
var myself_abo ;\
var myself_avatar ;\
var myself_search = '';\
var photos_tab = [];\
var photos_tab_visibility = [];\
var photos_cur = 0;\
var myself_photos_tab = [];\
var myself_photos_cur = 0;\
var myself_notification_count = 0 ;\
var myself_notification_id = 0 ;\
var myself_messages_past ;\
var myself_tab_favoris = [];\
// #50 var interval_notification = 0 ;\
// #50  var interval_chat_load ;\
var types = \{ 1 : 'primary', 2 :'secondary', 3 :'tertiary', 4:'quaternary', 5:'quinary', 6:'senary'\} ;\
var canvas ;\
var myself_can_match  ;\
var imgGradius =0 ;\
var search_page =0;\
var destination_action ;\
var le_ws; \
var socket;\
var ws_url;\
var modale_premium_displayed = 0;\
var init_show_myself = 1;\
\
var new_compte_a_rebou_refresh_process = null;\
var date_compte_a_rebour_expire = null;\
var previous_state_menu = "edit_profil";\
var cropper;\
var last_change = "000000";\
var badge;\
\
const TAB_SMILE = [ '(yawn)', ':-&', '8-)', ':-P', '(y)', ':-)', ';-)', '%P', ']:-)', ':-(', 'x-(', '(smile12)', '(smile13)', ':-/', '(:|', ':-0', '(music)', ':-D', 'B-)', '0:-)', ':^D', '(smile22)', '>:-(', ':-@', ':-!', ':~-(', '<:-(', ':-S', '(inlove)', '>:-)' ];\
\
$(document).ready(function()\{\
		cookies_init();\
		main_init();\
		binding_init();\
\});\
\
// ouvrir la modale d'echec de paiement\
function modale_aboKo()\{\
	var myModal = new bootstrap.Modal(document.getElementById('abo-ko'), \{\});\
	myModal.show();\
	$('#payment-btn').click(function()\{\
		api_payment_iframe()\
	\})\
\}\
\
// ouvrir la modale de verification d'email\
function modale_emailVerif(msg)\{\
	var myModal = new bootstrap.Modal(document.getElementById('email-verif'), \{\});\
	myModal.show();\
	$('#email-verif p.lead').html(msg);\
\}\
\
function analyse_URL() \{\
	var URL_PARAMS = window.location.search;\
	if(URL_PARAMS.match(/\\?mod=abo&result=ko/))\{\
		modale_aboKo();\
	\}\
\}\
\
// login\
function do_login(message='', danger=false)\{\
	// ouvrir la modale loginModal\
	if (message!='') \{\
		$("#login_msg").html(message);\
		$("#login_msg").addClass("alert")\
		if (danger==true)\{\
			$("#login_msg").removeClass("alert-secondary");\
			$("#login_msg").addClass("alert-danger");\
		\} else \{\
			$("#login_msg").removeClass("alert-danger");\
			$("#login_msg").addClass("alert-secondary");\
		\}\
	\} else \{\
		$("#login_msg").removeClass("alert alert-danger alert-secondary");\
		$("#login_msg").html();\
	\}\
	var loginModal = new bootstrap.Modal(document.getElementById('loginModal'),\{keyboard:false\});\
	// $(loginModal).modal(\{keyboard:false\});\
	loginModal.show();\
\}\
 \
function login_get()\{\
	// auth via login pass\
	var login = $("#login").val();\
	var password = $("#password").val();\
	login_ajax(login,password)\
\}\
\
function login_get_from_cookie(s)\{\
	// auth via cookie\
	var t = s.split("|");\
	var login = t[0];\
	var token = t[1].substring(4);\
	login_ajax(login,token)\
	\
\}\
\
\
function myself_notification_display(data) \{\
// console.log("myself_notification_display");\
// console.log(data);\
\
	if(! data.msg) \{\
		$(".notifications-bell").html(''); \
		return\
	\} \
\
	if(data.action != "cmd_new")\{\
		$(".notifications-bell").html(data.nb_new);\
		$('.notifications-bell').css('animation-name', 'bounceIn');\
		$('.notifications-bell').show();\
	\}\
\
\
	myself_notification_count ++ ;\
	myself_notification_id++;\
	if (myself_notification_count > 6 )\
		myself_notification_count = 1;\
\
	var icone ='envelope';\
	// TODO \
	// match heartbeat\
	// birthday en attente\
\
	switch (data.action) \{\
		case "cmd_vote":\
			icone ='envelope';\
		break;\
		case "cmd_new" :\
			icone ='envelope';\
			myself_messages_past_get();\
		break;\
		case "cmd_favoris":\
			icone ='star';\
		break;\
		case "cmd_visit":\
			icone ='eye';\
		break;\
		 \
	\} \
	//  #45\
\
	var h ='';\
\
	vis='';\
	if (data.photo_x) \{\
		vis = data.photo_x;\
	\}\
\
	mes ='';\
	if (data.msg_txt) \{\
		mes = data.msg_txt;\
	\} else \{\
		mes = data.txt_title;\
	\}\
                    \
                    \
	// enlever les bulles de la meme personne\
	$(".notifications_user-"+data.infos_exp.user_id).remove();\
	n =0;\
	$(".notifications_stack_elem").each(function()\{\
		n++;\
		if ( n >=  8 ) \{  // TODO\
 			$(this).remove();\
		\}\
	\});\
	var mx2class = 'mx-2';\
	// var notifications_bandeau_class = "notifications-bandeau";\
	if( n >= 7 ) \{\
		$('#bandeau .avatar-online').removeClass('mx-2');\
		// mx2class = '';\
		$('#notifications-bandeau').removeClass('justify-content-start').addClass('justify-content-around');\
	\}\
	else \{\
		$('#notifications-bandeau').removeClass('justify-content-around').addClass('justify-content-start');\
	\}\
\
\
	$(".bounceIn .speech").addClass("d-none");\
\
	h += '<a data-toggle="dropdown" href="/membres_'+data.pseudo+'_'+data.infos_exp.user_id+'.html" class="avatar avatar-online '+mx2class+' bounceIn notifications_stack_elem notifications_user-'+data.infos_exp.user_id+'"  id="alert_n_'+myself_notification_id+'" ts="'+Date.now()+'">' ;\
	h += '<img src="'+data.tof+'" alt="#" class="avatar-img">'\
	h += '<div class="dropdown-menu speech border-0" id="dropdown_n_'+myself_notification_id+'">'\
	h += '<div class="text-truncate"><i class="fas fa-'+icone+'"> </i> ' + mes +  '</div>'\
	h += '</div>'\
	h += '</a>'\
\
	$(".bandeau-begin").after(h);\
	setTimeout(function()\{\
		'use strict';\
		$(".bounceIn .speech").addClass("d-none");\
	\},6000);\
\
	goto_binding();\
\
\}\
 \
\
\
// function myself_notification_remove() \{\
// 	var now = Date.now();\
// 	n =0;\
// 	$(".notifications_stack_elem").each(function()\{\
// 		n++;\
// 		var ts = $(this).attr("ts");\
// 		if (now - ts > 3000000000 || n > 8 ) \{  // TODO\
//  			$(this).remove();\
// 		\}\
// 	\})\
// \}\
\
function myself_messages_past_display(data)\{\
	var h = h2 = '';\
	var n = 0;\
	// console.log("myself_messages_past_display")\
	// console.log(data)\
	if(! data.contacts) \{\
		$(".messages-bell").html(''); \
		return\
	\} \
\
	let total = 0;\
	data.contacts.forEach(function(contact) \{\
		if (contact.nb_new) \{\
			// Total number of new messages\
			total += parseInt(contact.nb_new);\
			// TODO: Total number of contacts that have new messages\
			//total += 1;\
		\}\
	\});\
\
	$(".messages-bell").html(total);\
	$('.messages-bell').css('animation-name', 'bounceIn');\
	$('.messages-bell').show();\
\
\
 // 	$.each( data.contacts, function( key, value ) \{\
 // 		if (typeof (value.tab_last_msg) === 'undefined' ) \{\
 // 			return; \
 // 		\}\
\
 // 		// if ( value.tab_last_msg.message == '' ) \{\
 // 		// 	return; \
 // 		// \}\
\
 // 		if (n>5 ) \{\
 // 			return; \
 // 		\}\
 // 		n++;\
	// 	h +=  '<a href="/membres_'+value.pseudo+'_'+value.m_id+'.html" class="card border-0 user mb-2 bg-light">'\
	// 	h +=  '<div class="card-body">'\
	// 	h +=  '<div class="row gx-2">'\
	// 	h +=  '<div class="col-auto">'\
	// 	h +=  '<div class="avatar '\
	// 	if (value.online=='green')\
	// 		h += ' avatar-online '\
	// 	h += ' avatar-responsive  ">'  // \
\
	// 	h +=  '<span class="rounded-circle-blur">'\
	// 	h +=  '<img src="'+value.photo+'" alt="#" class="avatar-img '\
	// 	if (value.need_blur)\
	// 		h += value.need_blur ;\
	// 	h +=  '">'\
	// 	h +=  '</span>'\
		\
	// 	h +=  '</div>'\
	// 	h +=  '</div>'\
	// 	h +=  '<div class="col">'\
	// 	h +=  '<div class="d-flex align-items-center">'\
	// 	h +=  '<h5 class="fw-bold me-auto mb-0">'+value.pseudo+'</h5>'\
	// 	h +=  '<span class="text-muted extra-small ms-2">'+value.date_last_label+'</span>'\
	// 	h +=  '</div>'\
	// 	h +=  '<div class="d-flex align-items-center">'\
\
	// 	if (value.tab_last_msg.message!='') \{\
	// 		h +=  '<p>'+value.tab_last_msg.message+'</p>'\
	// 	\} \
	// 	if (value.tab_last_msg.id_extra) \{\
	// 		h +=  '<p>Acc\'e8s \'e0 l\\'album priv\'e9</p>'\
	// 	\} \
		\
\
	// 	if (value.nb_new > 0 ) \{\
	// 		h +=  '<div class="badge bg-secondary ms-auto rounded-pill"><span>'+value.nb_new+'</span></div>'\
	// 	\}\
	// 	h +=  '</div>'\
	// 	h +=  '</div>'\
	// 	h +=  '</div>'\
	// 	h +=  '</div>'\
	// 	h +=  '</a>'\
	// \});\
	// $("#messages-past").html(h); // #TODO_NOTIF\
\
\
	// panneau complet\
 	 n = 0 ;\
	 $.each( data.contacts, function( key, value ) \{\
 		if (typeof (value.tab_last_msg) === 'undefined' ) \{\
 			return; \
 		\}\
 		n++;\
\
		h2 += '<a href="/membres_'+value.pseudo+'_'+value.m_id+'.html" class="card border-0 user mb-4 bg-light shadow-sm wow fadeInDown" style="visibility: visible; animation-name: fadeInDown;">'\
		h2 += '<div class="card-body">'\
		h2 += '<div class="avatar '\
		if (value.online=='green')\
			h2 += ' avatar-online '\
		h2 += ' avatar-responsive">'\
		if (value.nb_new > 0 ) \{\
			h2 +=  '<span class="badge bg-primary rounded-pill position-absolute">'+value.nb_new+'</span>'\
		\}\
		h2 += '<span class="rounded-circle-blur"><img src="'+value.photo+'" alt="#" class="avatar-img"></span>'\
		h2 += '</div>'\
		\
		 let last_message = value.tab_last_msg.message;\
		if (value.tab_last_msg.message==='' && value.tab_last_msg.id_extra === "a-1")\
			last_message = "Demande d'acc\'e8s \'e0 l'album priv\'e9 refus\'e9e";\
		else if (value.tab_last_msg.message==='' && value.tab_last_msg.id_extra === "a0")\
			last_message = "Demande d'acc\'e8s \'e0 l'album priv\'e9";\
		else if (value.tab_last_msg.message==='' && value.tab_last_msg.id_extra === "a1")\
			last_message = "Demande d'acc\'e8s \'e0 l'album priv\'e9 accept\'e9e";\
		h2 += '<i class="fa-solid fa-envelope me-2"></i> <span class="text-primary">'+value.pseudo+'</span> : '+last_message+' '\
		h2 += '<span class="text-muted fw-normal small float-end">'+value.date_last_label+'</span>'\
		h2 += '</div>'\
		h2 += '</a>'\
\
\
 \
	\});\
\
	$("#messages-past-full").html(h2).ready(function () \{\
		$('#messages a').css('visibility', 'visible');\
		$('#messages a').css('animation-name', 'fadeInDown');\
		goto_binding();\
	\});\
\}\
\
function myself_notifications_past_display (data)\{\
	// console.log("myself_notifications_past_display")\
	// console.log(data)\
\
	var h = '';\
	var h_full ='';\
	var n = m = 0;\
 	var le_message ='';\
	// console.log("myself_notifications_past_display");\
	var removed_notifications = JSON.parse(localStorage.getItem("removed_notifications")); \
	// console.log(removed_notifications )\
	// console.log(data )\
	if (removed_notifications == null) \{\
		removed_notifications = [];\
	\}\
 	$.each( data.result, function( key, value ) \{\
 		n++;\
 		// console.log(removed_notifications.includes(key) )\
 		feminin = false;\
 		if(value.sexe1=="2") \{\
 			feminin = true;\
 		\}\
 		// TODO : id change \'e0 chaque appel #3\
 		if(removed_notifications.includes(value.id_u) == false) \{\
 			m++;\
 			var icone ='';\
 			var tmp = value.tab_photo[0].sq_small.split("?");\
			var img = tmp[0];\
	 		switch (value.action) \{ // cf d\'e9but de la doc\
				case 'birthday':\
				  le_message ='<span class="text-primary">'+value.pseudo+'</span> f\'eate son anniversaire';\
				  icone = 'birthday-cake';\
				  break;\
				case 'con':\
				  le_message ='<span class="text-primary">'+value.pseudo+'</span> s\\'est connect\'e9'; \
				  if (feminin == true ) \{\
				  	le_message +='e';\
				  \}\
\
				  icone = 'sign-in';\
				  break;\
				case 'visite':\
				  le_message ='<span class="text-primary">'+value.pseudo+'</span>  a visit\'e9 votre page';\
				   icone = 'eye';\
				  break;\
				case 'vote':\
				  le_message ='<span class="text-primary">'+value.pseudo+'</span> a not\'e9 une de vos photos';\
				   icone = 'camera';\
				  break;\
				 case 'modif':\
				  le_message ='<span class="text-primary">'+value.pseudo+'</span> a mis \'e0 jour son profil';\
				   icone = 'eye';\
				  break;\
				 case 'add_tof':\
				  le_message ='<span class="text-primary">'+value.pseudo+'</span> a ajout\'e9 une photo';\
				   icone = 'camera';\
				  break;\
				default:\
				  le_message ='<span class="text-primary">'+value.pseudo+'</span>';\
				  icone = 'eye';\
			\}\
\
\
			h = '<a href="/membres_'+value.pseudo+'_'+value.id+'.html" class="card border-0 user mb-4 bg-light shadow-sm wow fadeInLeft" style="visibility: visible; animation-name: fadeInLeft;">'\
			h += '<div class="card-body">'\
			h += '<div class="avatar avatar-online '\
			if (value.online=='1')\
				h += ' avatar-online '\
			h += 'avatar-responsive">'\
			// h += '<span class="badge bg-primary rounded-pill position-absolute">1</span>'\
			h += '<img src="'+img+'" alt="'+value.pseudo+'" class="avatar-img">'\
			h += '</div>'\
			h += '<i class="fas fa-'+icone+' me-2"></i> '+le_message+'</span>'  // C'est l'anniversaire de <span class="text-primary">Louise</span> '\
			h += '<span class="text-muted fw-normal small float-end">'+date_shorter(value.date_action)+'</span>'\
			h += '</div>'\
			h += '</a>'\
\
\
			// h =  '<div class="card border-0 user mb-2 bg-light notification-id-'+value.id_u+' ">'\
			// h +=  '<span class="btn-delete text-white btn-delete-notification" data-id="'+value.id_u+'" ><i class="fas fa-trash-alt"></i></span>'\
			// h +=  '<a href="/membres_'+value.pseudo+'_'+value.id+'.html">'\
			// h +=  '<div class="card-body">'\
			// h +=  '<div class="row gx-2 align-items-center">'\
			// h +=  '<div class="col-auto">'\
			// h +=  '<div class="avatar '\
			// if (value.online=='1')\
			// 	h += ' avatar-online '\
		\
			// h += ' avatar-responsive">'\
			// h +=  '<span class="rounded-circle-blur"><img src="'+img+'" alt="'+value.pseudo+'" class="avatar-img '\
			// if (value.need_blur)\
			// 	h += value.need_blur ;\
			// h += '"></span>'\
			// h +=  '</div>'\
			// h +=  '</div>'\
			// h +=  '<div class="col">'\
			// h +=  '<div class="d-flex align-items-center">'\
			// h +=  '<h5 class="fw-bold me-auto mb-0">'+value.pseudo+'</h5>'\
			// h +=  '<span class="text-muted extra-small ms-2">'+date_shorter(value.date_action)+'</span>'\
			// h +=  '</div>'\
			// h +=  '<div class="d-flex align-items-center">'\
			// h +=  '<p>'\
			// h +=  le_message\
			// h +=  '</p>'\
			// h +=  '<div class="badge bg-secondary ms-auto rounded-pill">'\
			// h +=  '<span>3</span>'\
			// h +=  '</div>'\
			// h +=  '</div>'\
			// h +=  '</div>'\
			// h +=  '</div>'\
			// h +=  '</div>'\
			// h +=  '</a>'\
			// h +=  '</div>'\
			// h +=  '</div>'\
			// h +=  '</a>'\
			// h +=  '</div>'\
\
			 \
			h_full += h;\
		\} else \{\
			// console.log(key + " est deja suppr")\
		\}\
	\});\
\
\
	$("#notifications-past-full").html(h_full); // #TODO_NOTIF\
	// $('.btn-delete-notification').off("click");\
	// $('.btn-delete-notification').click(function(e) \{ \
	// 	myself_notifications_remove_display($(this).data("id"));\
	// \});\
	goto_binding();\
\}	\
\
/*function myself_notifications_remove_display(id) \{\
	var t = '.notification-id-'+ id;\
	$(t).remove();\
	removed_notifications = JSON.parse(localStorage.getItem("removed_notifications"));\
	if (removed_notifications === null) \{\
		removed_notifications = [];\
	\}\
\
	if(removed_notifications.includes(id) == false) \{\
		removed_notifications.push(id)\
	\}  \
	localStorage.setItem('removed_notifications', JSON.stringify(removed_notifications) );\
\}*/\
\
\
\
function blacklist_display(data) \{\
	// console.log("blacklist_display")\
	// console.log(data)\
	n =0 ;\
	var h = '<div class="row gx-1">'\
\
	$.each( data.contacts, function( key, value ) \{\
		n++; \
		h +='<div class="col-4 p-2">'\
		h +='<a href="#"  data-id="'+value.m_id+'" class="profil profil-'+value.sexe1 +' d-flex align-items-center rounded-circle-blur rounded-circle delete-blacklist-link">'\
		h +='<img src="'+value.tab_photos[0].sq_middle+'" alt="" class="img-fluid '+value.need_blur+'">'\
		h +='<span class="infos-profil"><b>'+value.pseudo+'</b></span>'\
		h +='<i class="fas fa-times delete-blacklist"></i>'\
		h +='</div>'\
\
		if(n%3==0) \{\
			h+='</div><div class="row gx-1">'\
		\}\
\
	\});\
	if (data.contacts.length ==0 ) \{\
		h += '<p class="small text-center"><i class="fas fa-frown display-2 text-muted mb-2 mt-4"></i></p><p class="small  text-center">Aucun profil dans votre liste noire</p>'\
\
	\}\
\
	h += 	'</div>'\
	$("#blacklist-full").html(h);\
	$(".delete-blacklist-link").off('click');\
	$(".delete-blacklist-link").click(function(e)\{\
		blacklist_delete( $(this).data("id") ); \
	\})\
	// afficher le panneau \
	$("#col-content-left .tab-pane").removeClass("active");\
	$("#col-content-left .tab-pane").removeClass("show");\
	\
	$("#blacklist").addClass("active");\
	$("#blacklist").addClass("show");\
	// remonter le scroll\
	$("#col-content-left").animate(\{\
			scrollTop:0\
		\},500) \
\
\}\
/* MATCHS */  \
\
\
function myself_matchs_can_not_match_display()\{\
	var h ='<div class="alert alert-primary">'\
	h +='<a href="#"  class=" text-white " data-bs-toggle="modal" data-bs-target="#addphotoModal">'\
	h +='Pour utiliser les Matchs, vous devez avoir une photo de profil !</a></div>';\
	$("#all_matchs-display").html(h);\
	$(".match-count").html(0);\
	$("#match-future-display").html(h)\
\}\
function myself_matchs_past_display_back()\{\
	$(".match-toggle-2").hide();\
	$(".match-toggle-1").show();\
\
\}\
\
function myself_matchs_past_display  (data)\{\
	// console.log("myself_matchs_past_display")\
	var b ='<a href="#" class="btn btn-secondary btn-sm rounded-pill fw-bold px-4" OnClick="myself_matchs_past_display_back();" id="btn-retour_matchs">RETOUR</a>';\
	var h = b; \
	var n = 0;\
	// console.log(data);\
	if (data.result.nb_total =='') \
		data.result.nb_total = 0;\
	$(".match-count").html(data.result.nb_total)\
	if (data.result.nb_total == 1 ) \{\
		$(".match-word").html("match")\
	\}\
\
 	$.each( data.result.tab_profils, function( key, value ) \{\
		 // Verifie si le membre est favoris\
		var is_fav = false;\
		if( typeof myself_tab_favoris[value.pseudo] != 'undefined' ) \{\
			is_fav = true;\
		\}\
\
 		n++;\
\
		h +='<div class="col-6">'\
		h +='<div class="card bg-light border-0 shadow-sm mb-3">'\
		h +='<div class="card-body">'\
		h +='<a href="/membres_'+value.pseudo+'_'+value.id+'.html" class="profil  profil-'+value.sexe1+' d-flex align-items-center rounded-circle">'\
		h += '<img src="'+value.photos_v2.sq_middle+'" alt="" class="img-fluid"><span class="infos-profil"><b>'+value.pseudo+'</b></span>'\
		h += '</a>'\
		h +='<div class="row gx-2">'\
		h +='<div class="col-6">'\
		h +='<a href="#"  class="btn btn-primary rounded-pill fw-bold mt-2 text-uppercase text-center user_is_fav_from_list '+(is_fav ? 'btn-success' : '')+'" dest="'+value.id+'"><i class="fa-solid fa-star"></i></a>'\
		h +='</div>'\
		h +='<div class="col-6">'\
		h +='<a href="/membres_'+value.pseudo+'_'+value.id+'.html" class="btn btn-primary rounded-pill fw-bold mt-2 text-uppercase text-center btn_chat_from_matches" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Envoyer un message"><i class="fa-solid fa-comment-dots"></i></a>'\
		h +='</div>'\
		h +='</div>'\
		h +='</div>'\
		h +='</div>'\
		h +='</div>'\
\
	\});\
\
	if (data.result.nb_total > 6  ) \{\
		h += b + ' &nbsp;<br>'; \
	\}\
\
	$("#all_matchs-display").html(h);\
	$(".user_is_fav_from_list").off("click")\
	$(".user_is_fav_from_list").click(user_is_fav_from_list); // ajout dynamique du binding\
\
	goto_binding()\
\
\
\}	\
\
\
function myself_matchs_future_display  (data)\{\
	// console.log("myself_matchs_future_display")\
	// console.log(data)\
	var h ='';\
	var n = 0;\
 	$.each( data.result, function( key, value ) \{\
 		n++;\
 		if(n>1) \{return\}\
 		// console.log(value);\
		h +='<div class="col-12 text-center">' 		 \
		h +='<a href="/membres_'+value.pseudo+'_'+value.id+'.html" class="profil  profil-'+value.sexe1+' d-flex align-items-center rounded-circle"><img src="'+value.photos_v2.public[1].sq_middle+'" alt="" class="img-fluid '+value.photos_v2.public[1].visibility+'"><span class="infos-profil"><b>'+value.pseudo+'</b></span></a>'\
		h +='</div>'\
		h +='<div class="col-12 text-center">'\
		h +='<h4 class="fw-bold">'+value.pseudo+'<br><small class="text-muted">'+value.zone_name+'</small></h4>'\
		h +='</div>'\
		h +='<div class="row mb-2">'\
		h +='<div class="col-6"><a href="#" data-id_user="'+value.id+'" action="set_dislike"  data-pseudo="" data-pic="" class="btn btn-match shadow-sm text-secondary ms-auto btn-match-action  btn-match-del"><i class="fas fa-times"></i></a></div>'\
		h +='<div class="col-6"><a href="#" data-id_user="'+value.id+'" action="set_like"  data-pseudo="'+value.pseudo+'"  data-pic="'+value.photos_v2.public[1].sq_middle+'" data-city="'+value.zone_name+'"   data-pic-visibility="'+value.photos_v2.public[1].visibility+'" class="btn btn-match shadow-sm text-primary ms-end btn-match-action  btn-match-add"><i class="fas fa-heart"></i></a></div>'\
		h +='</div>'\
	\});\
	$("#match-future-display").html(h);\
	$(".btn-match-action").off("click")\
	$(".btn-match-action").click(myself_matchs_add); // ajout dynamique du binding\
	goto_binding()\
\
\}	\
 \
\
function myself_matchs_add() \{\
	\
	var id_user = $(this).data("id_user");\
	var pseudo = $(this).data("pseudo");\
	var pic = $(this).data("pic");\
	var visibility = $(this).data("pic-visibility");\
	var city = $(this).data("city");\
	var action = $(this).attr("action");\
	// console.log("myself_matchs_add : " + action); \
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/match",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		id_user: id_user,\
	    		action : action\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	     	// console.log(result);  \
	     	if(result.result=="match") \{\
	     		// todo #139 sexe1\
	     		myself_matchs_new_match(id_user, pseudo,pic,visibility,city)\
	     	\}\
	     	myself_matchs_get () // on relance tout\
	    \} \
	\});\
\
\}\
\
function myself_matchs_new_match(id_user, pseudo, pic,visibility,city) \{\
	// console.log("myself_matchs_new_match")\
	// vient de gagner \
\
	// todo #139\
	var h='<div class="alert alert-success p-5 text-center wow fadeInDown position-absolute h-100 alert-match" role="alert" style="visibility: visible; animation-name: fadeInDown;">'\
	h += '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'\
	h += '<h4 class="fw-bold">Vous avez un Match !</h4>'\
	h += '<a href="" class="profil d-flex align-items-center rounded-circle"><img src="'+pic+'" alt="" class="img-fluid  '+visibility+'"></a>'\
	h += '<h4 class="fw-bold">'+pseudo+'<br><small class="text-muted">'+city+'</small></h4>'\
	h += '<a href="/membres_'+pseudo+'_'+id_user+'.html" class="btn btn-primary rounded-pill fw-bold px-4 w-100">ENVOYER UN MESSAGE</a>'\
	h += '<a href="#" class="btn btn-secondary btn-sm rounded-pill fw-bold px-4 mt-2 w-100" data-bs-dismiss="alert" aria-label="Close">CONTINUER A SWIPER</a>'\
	h += '</div>'\
\
	$("#match_new").prepend(h);\
	goto_binding()\
\
\}\
 \
/* MATCHS END */  \
\
\
\
\
function myself_display(data) \{\
\
	// clearInterval(interval_notification); // #50\
	// interval_notification = setInterval(myself_notification, 8000);  // #50\
\
	le_ws = new WS() ;\
	le_ws.new_socket();\
	le_ws.start();\
\
	// console.log("myself_display");\
	// console.log(data);\
\
	myself_data = data.result;\
	myself_pseudo = data.result.pseudo;\
	myself_search = data.result.cherche1;\
	myself_abo  = data.result.abo_infos;\
	myself_email = data.result.email; \
	$("#contact-form-email").val(myself_email);\
	$("#mailing-pseudo").val(myself_pseudo);\
	myself_can_match = false;\
	if (data.result.tab_photo) \{\
		if (data.result.tab_photo.length==0) \{\
			myself_can_match = false;\
		\} else \{\
			myself_can_match = true;\
		\}\
	\}\
	\
	if(myself_data.sexe1 == 2)\{\
		$('.btn-menu-crown').find('a').html("<i class='fas fa-crown text-secondary me-2'></i> Demander votre acc\'e8s gratuit");\
		$('.btn-crown').parent().attr("data-bs-original-title","Demander votre acc\'e8s gratuit");\
		let contactModal = $('#contactModal');\
		var optionExists = (contactModal.find("select option[value='Valider mon acc\'e8s femme']").length > 0);\
		if(!optionExists)\
		\{\
			contactModal.find("select").append("<option value='Valider mon acc\'e8s femme'>Valider mon acc\'e8s femme</option>");\
		\}\
	\}\
	\
	// afficher la couronne que si pas abonn\'e9 et homme ou couple \
	if(data.result.abo_infos.end_date!= null && data.result.sexe1!=2) \{	\
		$(".btn-chat-crown , .btn-menu-crown").hide();\
		myself_is_abo = true;\
	\} else \{\
		myself_is_abo = false;\
		if(data.result.sexe1!=2 && modale_premium_displayed <1 )\{\
			if(window.location.href.indexOf("Confirmation_eclair") > -1) modale_conf_eclair();\
			else modale_premium();\
			\
			modale_premium_displayed ++;\
		\}\
	\}\
\
	myself_avatar = data.result.main_photo.sqsmall ; \
	$("#myself-avatar-mini").attr("src",data.result.main_photo.sqsmall + "?" + last_change);\
	$("#myself-avatar-maxi").attr("src",data.result.main_photo.sqmiddle + "?" + last_change);\
	$("#myself-prenom").html(data.result.pseudo);\
	$("#myself-age").html(data.result.age);\
	$("#myself-ans").html(" ans,");\
	$("#myself-city").html(data.result.zone_name);\
	if (data.result.sexe1==2) \{\
		$(".myself-profil-symbol").addClass("fa-venus") ;\
		$("#myself-sexe").html("Femme");\
	\} else if(data.result.sexe1 == 1) \{\
		$(".myself-profil-symbol").addClass("fa-mars") ;\
		$("#myself-sexe").html("Homme");\
	\} else \{\
		$(".myself-profil-symbol").addClass("fa-venus") ;\
		$(".myself-profil-symbol2").addClass("fa-mars") ;\
		$("#myself-sexe").html("Couple");\
	\}\
	if (data.result.sexe2==1) \{\
		$("#myself-pref").html("H\'e9t\'e9ro");\
	\} else if (data.result.sexe2==2) \{\
		$("#myself-pref").html("Homo");\
	\} else \{\
		$("#myself-pref").html("Bi");\
	\}\
	if (data.result.description =="") \{\
		data.result.description ="Ajouter une description" \
	\}\
	$("#myself-description").html(data.result.description); \
\
	$("#myself-taille .taille-val").html(data.result.taille);\
	$("#myself-poids .poids-val").html(data.result.poids);\
\
	// photos\
	var h ='<div class="row gx-1 my-3">';\
	var h_thumbs ='';\
	var n = 0;\
 	$.each( data.result.public_album, function( key, value ) \{\
 		n++;\
		h +=  '<div class="col-4"><span class="media d-flex align-items-center"><a href="#" class="infos-start myself-pic-settings" OnClick="private_modal_change_settings('+key+', \\'public\\')" ><i class="fas fa-lock-open"></i></a><a href="#" OnClick="private_modal_change_pic('+key+')"  class="infos-end" data-bs-toggle="modal" data-bs-target="#editphotoModal"><i class="fas fa-edit"></i></a><img src="'+value.normal+'" alt="" class="img-fluid myself-pic"></span></div>';\
		h_thumbs += '<div class="choose-photo" thumb_id="'+key+'"><a href="#" class="thumb-chooser" thumb_id="'+key+'" thumb-target="'+value.normal+'"><img src="'+value.sq_small+'" alt="" thumb_id="'+key+'" class="img-fluid w-100"></a></div>';\
		if(n%3==0) \{\
			h+='</div><div class="row gx-1 my-3">'\
		\}\
\
	\});\
 	$.each( data.result.private_album, function( key, value ) \{\
 		n++;\
		h +=  '<div class="col-4"><span class="media d-flex align-items-center"><a href="#" class="infos-start myself-pic-settings" OnClick="private_modal_change_settings( '+key+', \\'private\\')"  ><i class="fas fa-lock"></i></a><a href="#" OnClick="private_modal_change_pic('+key+')"  class="infos-end" data-bs-toggle="modal" data-bs-target="#editphotoModal"><i class="fas fa-edit"></i></a><img src="'+value.normal+'" alt="" class="img-fluid  myself-pic"></span></div>';\
		h_thumbs += '<div class="choose-photo"><a href="#" class="thumb-chooser" thumb_id="'+key+'" thumb-target="'+value.normal+'"><img src="'+value.sq_small+'" alt="" thumb_id="'+key+'" class="img-fluid w-100"></a></div>';\
		if(n%3==0) \{\
			h+='</div><div class="row gx-1 my-3">'\
		\}\
	\});\
\
	h +=  '<div class="mt-2"><a href="#" class="" data-bs-toggle="modal" data-bs-target="#addphotoModal"><i class="fas fa-plus"></i> Ajouter</a></div>';\
		\
\
\
 	h_thumbs += '<div class="choose-photo"><a href="#" data-bs-target="#addphotoModal" data-bs-toggle="modal" data-bs-dismiss="modal"><i class="fas fa-plus"></i></a></div>'; \
 	h+='</div>'\
 	$("#myself-pics-count").html(n);\
	$("#myself-photos").html(h);\
	$("#editphotoModal-thumbs").html(h_thumbs);\
\
	private_modal_init();\
\
\
	// videos\
	var n = 0;\
	h ='<div class="row gx-1 my-3">';\
	$.each( data.result.tab_videos, function( key, value ) \{\
 		n++;\
		h += '<div class="col-4"><span class="media d-flex align-items-center">'\
\
		if (value.private=='1') \{\
			h += '<a href="#" class="infos-start myself-pic-settings" OnClick="private_modal_change_settings_video( \\''+key+'\\', \\'private\\')"  ><i class="fas fa-lock"></i></a>'\
		\} else \{\
			h += '<a href="#" class="infos-start myself-pic-settings" OnClick="private_modal_change_settings_video( \\''+key+'\\', \\'public\\')"  ><i class="fas fa-lock-open"></i></a>'\
		\}\
\
		h += '<a href="#" OnClick="private_modale_delete_video(\\''+key+'\\')"  class="infos-end" data-bs-toggle="modal" data-bs-target="#privateModalvideoDelete"><i class="fas fa-x"></i></a>'\
\
		h += '<img src="'+value.url.img_default+'" alt="" class="img-fluid  myself-video"></span></div>';\
		// h_thumbs += '<div class="choose-photo"><a href="#" class="thumb-chooser" thumb_id="'+key+'" thumb-target="'+value.normal+'"><img src="'+value.sq_small+'" alt="" thumb_id="'+key+'" class="img-fluid w-100"></a></div>';\
		if(n%3==0) \{\
			h+='</div><div class="row gx-1 my-3">'\
		\}\
	\});\
	h +=  '<div class="mt-2"><a href="#" class="" data-bs-toggle="modal" data-bs-target="#addvideoModal"><i class="fas fa-plus"></i> Ajouter</a></div>';\
	h +='</div>'\
	$("#myself-videos-count").html(n); \
	$("#myself-videos").html(h);\
\
	// confirmation Modal\
	if($("#confirmationModal").length)\{\
					if (data.result.sexe1==2) \{\
			$("#myself-confirm-sexe2").prop('checked',true);\
		\}\
		else if (data.result.sexe1==3) \{\
			$("#myself-confirm-sexe3").prop('checked',true);\
		\}\
		else\{\
			$("#myself-confirm-sexe1").prop('checked',true);\
		\}\
\
		if (data.result.cherche1.indexOf("1") > -1 ) \{\
			$("#myself-confirm-sexeSearch1").prop('checked',true);\
		\}\
		if (data.result.cherche1.indexOf("2") > -1 ) \{\
			$("#myself-confirm-sexeSearch2").prop('checked',true);\
		\}\
		if (data.result.cherche1.indexOf("3") > -1 ) \{\
			$("#myself-confirm-sexeSearch3").prop('checked',true);\
		\}\
		\
		tab = data.result.naissance.split("-");\
		$("#myself-confirm-day").val(tab[2]);\
		$("#myself-confirm-month").val(tab[1]);\
		$("#myself-confirm-year").val(tab[0]);\
		$("#myself-confirm-city").val(data.result.zone_name);\
		$("#myself-confirm-id_ville").val(data.result.ville);\
		$("#myself-confirm-region").val(data.result.zone);\
		$("#myself-confirm-id_countryObj").val(data.result.pays);\
	\}\
\
	// infos modal \
	$("#myself-edit-description").attr("placeholder", data.result.description);\
\
	if (data.result.description && data.result.description !== "Ajouter une description") \{\
		$("#myself-edit-description").val(data.result.description);\
	\} else \{\
		$("#myself-edit-description").val("");\
	\}\
	tab = data.result.naissance.split("-");\
	$("#myself-edit-day").val(tab[2]);\
	$("#myself-edit-month").val(tab[1]);\
	$("#myself-edit-year").val(tab[0]);\
	$("#myself-edit-city").attr("placeholder", data.result.zone_name);\
\
	if(data.result.taille && data.result.taille >= 110) \{\
		$("#myself-edit-taille").val(data.result.taille) + " cm";\
	\}\
	if(data.result.poids && data.result.poids >= 40) \{\
		$("#myself-edit-poids").val(data.result.poids) + " kg";\
	\}\
\
	// pref\'e9rences newsletter\
	// 	0: All newsletters Disabled.\
	// 1: All newsletters Enabled.\
	// 2: Only Alert and necessary emails.\
	// 3: Only partner\'92s emails.\
	// console.log(" data.result.newsletter " + data.result.newsletter)\
	switch(data.result.newsletter) \{\
		case "0" :\
	    $("#ok-alert").prop('checked',false);\
	    $("#ok-partners").prop('checked',false);\
	    break;\
	    case "1" :\
	    $("#ok-alert").prop('checked',true);\
	    $("#ok-partners").prop('checked',true);\
	    break;\
	    case "2" :\
	    $("#ok-alert").prop('checked',true);\
	    $("#ok-partners").prop('checked',false);\
	    break;\
	    case "3" :\
	    $("#ok-alert").prop('checked',false);\
	    $("#ok-partners").prop('checked',true);\
	    break;\
	\}\
\
	if ( modale_premium_displayed<1 && data.result.tab_photo.length==0 && myself_modale_add_pic == false ) \{\
		modale_takephoto();\
	\} \
	myself_modale_add_pic = true; // ne pas relancer\
\
	if(init_show_myself)\{\
		$("#edit-profile").addClass("active");\
		$("#edit-profile").addClass("show");\
		$("#user ").removeClass("active");\
		$("#user ").removeClass("show");\
		$("#edit-profile .infos-user").show();\
\
		previous_state_menu = "edit_profil";\
	\}\
	else\{\
		init_show_myself = 1;//On initialise la variable init_show_myself pour afficher myself au prochain display\
	\}\
\
\}\
\
function myself_fav_display(data)\{\
 	var h = c = '';\
	 // console.log("myself_fav_display")\
	$.each( data.contacts, function( key, value ) \{\
		myself_tab_favoris[value.pseudo] = value;\
		// if (value.online=='green') // TODO marqueur online\
		// 	h += ' avatar-online '\
		if (value.m_id==request_id) \{ \
 			c = 'active';\
 		\} else \{\
 			c = ''\
 		\}\
 		 // value.need_blur\
 		// console.log(value);\
 		var classe_blur  =   span_blur1 =  span_blur2 = online = "";\
\
 		if(value.need_blur) \{\
 			span_blur1 = '<span class="rounded-circle-blur">'; span_blur2 = '</span>';\
 			classe_blur = value.need_blur;\
 		\} \
\
 		if (value.online=="green") \{\
 			online="avatar-online";\
 		\}\
\
\
\
\
		h += '<div class="col-4 p-2">'+span_blur1+'<div class="'+online+'"><a href="/membres_'+value.pseudo+'_'+value.m_id+'.html" class="profil profil-'+value.sexe1+' ' +c+'  d-flex align-items-center rounded-circle"><img src="'+value.tab_photos[0].sq_middle+'" alt="" class="img-fluid ' + classe_blur +'"><span class="infos-profil"><b>'+value.pseudo+'</b></span></a></div>'+span_blur2+'</div>';\
	\});\
// console.log("myself_tab_favoris : ", myself_tab_favoris);\
	if (data.contacts)\{\
		if (data.contacts.length<1) \{\
			h += '<div class=" text-center"><i class="fas fa-frown display-2 text-muted mb-2 mt-4"></i><p class="small  text-center">Aucun contact dans vos favoris</p></div>'\
		\}\
	\}\
	$("#favoris-results").html(h);\
	goto_binding();\
\}\
\
 \
\
\
\
\
function user_display(data) \{\
	 // console.log("user_display : " + data.result.pseudo);\
	 // console.log(data);\
	 if (data.error) \{\
	 	default_error(data.error);\
	 	return; \
	 \}\
	 \
	request_id = data.result.id ;\
	request_pseudo_is_online = data.result.online;\
	photos_cur = 0;\
	request_pseudo = data.result.pseudo\
	document.title = data.result.pseudo;\
	$("#profil-prenom").html(data.result.pseudo);\
	$("#profil-age").html(data.result.age);\
	$("#profil-ans").html(" ans,");\
	$(".profil-symbol").removeClass("fa-mars") ;\
	$(".profil-symbol").removeClass("fa-venus") ;\
	$(".profil-symbol2").removeClass("fa-mars") ;\
	$(".profil-symbol2").removeClass("fa-venus") ;\
\
	if (data.result.sexe1==2) \{\
		$(".profil-symbol").addClass("fa-venus") ;\
		$("#profil-sexe").html("Femme, ");\
	\} else if (data.result.sexe1==3) \{\
		$(".profil-symbol").addClass("fa-venus") ;\
		$(".profil-symbol2").addClass("fa-mars") ;\
		$("#profil-sexe").html("Couple, ");\
	\} else \{\
		$(".profil-symbol").addClass("fa-mars") ;\
		$("#profil-sexe").html("Homme, ");\
	\}\
	\
\
 	if (data.result.sexe2==1) \{\
		$("#profil-pref").html("H\'e9t\'e9ro");\
	\} else if (data.result.sexe2==2) \{\
		$("#profil-pref").html("Homo");\
	\} else \{\
		$("#profil-pref").html("Bi");\
	\}\
\
	$("#profil-city").html(data.result.zone_name);\
	\
	if (data.result.taille > 99 || data.result.poids > 0) \{\
		$("#profil-details").css("display","flex");\
		\
		if (data.result.taille > 99) \{\
			$("#profil-taille .taille-val").html(data.result.taille);\
			$("#profil-taille span").show();\
		\}\
		else\{\
			$("#profil-taille span").hide();\
		\}\
		\
		if (data.result.poids > 0) \{\
			$("#profil-poids .poids-val").html(data.result.poids);\
			$("#profil-poids span").show();\
		\}\
		else\{\
			$("#profil-poids span").hide();\
		\}\
	\}\
	else\{\
		$("#profil-details").hide();\
	\}\
\
	$("#profil-descr").html('');\
	$("#suite-description").html('');\
	$("#suite-description").hide();\
	$("#btn-suite-description").hide();\
	// description \
	if (data.result.description != undefined ) \{\
		tab = data.result.description.split(" ");\
		n = 18 ;\
		if (tab.length > n) \{\
			var h1 = h2 ='';\
			for(i=0 ; i < n ; i++) \{\
				h1 += tab[i]+' ';\
			\} \
			for(i=n ; i < tab.length ; i++) \{\
				h2 += tab[i]+' ';\
			\} \
			$("#profil-descr").html(h1);\
			$("#suite-description").html(h2);\
			$("#btn-suite-description").show();\
\
		\} else \{\
			$("#profil-descr").html(data.result.description);\
			$("#suite-description").html('');\
			$("#btn-suite-description").hide();\
		\}\
	\}  \
\
\
	if (data.result.main_photo.sqmiddle != undefined ) \{\
		$("#profil-avatar-img").attr("src",data.result.main_photo.sqmiddle);\
		$("#profil-avatar-img").removeClass("blur_light blur_strong")\
		$("#profil-avatar-img").addClass(data.result.main_photo.visibility)\
	\} else \{\
		$("#profil-avatar-img").attr("src",'img/g.jpg');\
	\}\
	if (data.result.online>0) \{\
		$("#profil-avatar-online").addClass("avatar-online ") ;\
		$("#profil-avatar-online").removeClass("avatar-offline ") ;\
		\
	\}else \{\
		$("#profil-avatar-online").addClass("avatar-offline ") ;\
		$("#profil-avatar-online").removeClass("avatar-online ") ;\
		$("#profil-avatar-online").css("bi-online ") ;\
	\}\
\
\
	// is favorite\
	if (data.result.is_my_friend ==1 ) \{\
		$("#user_is_fav").addClass("btn-success");\
		$("#user_is_fav").attr("data-bs-original-title", "Retirer des favoris");\
	\} else \{\
		$("#user_is_fav").removeClass("btn-success"); \
		$("#user_is_fav").attr("data-bs-original-title", "Ajouter aux favoris");\
		\
		// Affichage du btn ajout favoris\
		if(data.result.sexe1 == 1 && data.result.cherche1.indexOf("1") == -1)\{\
			//Pas de favoris entre hommes qui cherchent pas d'homme\
			$("#user_is_fav").addClass("chat_hh");\
			\
			if(!myself_data)\{\
				setTimeout(function()\{\
					if(!myself_data || myself_data.sexe1 == 1)\{\
						$("#user_is_fav").addClass("chat_hh");\
					\}\
					else\{\
						$("#user_is_fav").removeClass("chat_hh");\
					\}\
				\},1000);\
			\}\
			else if(myself_data.sexe1 != 1)\{\
				$("#user_is_fav").removeClass("chat_hh");\
			\}\
		\}\
		else\{\
			$("#user_is_fav").removeClass("chat_hh");\
		\}\
		// Fin de Affichage du btn ajout favoris\
	\}\
\
	// photos\
	// TODO : faire code sans r\'e9p\'e9titions \
	photos_tab = [];\
	photos_tab_visibility = [];\
	$("#collapse-photos").html('');\
 	var h ='<div class="row gx-1 my-3">';\
 	var n =0 ; \
\
	$("#profil-avatar-a").off("click").click(function() \{\
		if (data.result.main_photo && data.result.main_photo.real_size !== undefined && data.result.main_photo.real_size.indexOf("tmp-php/sq") === -1) \{\
			modal_change_pic(data.result.main_photo.real_size, 0, data.result.main_photo.visibility);\
			var myModal = new bootstrap.Modal(document.getElementById('photoModal'), \{\});\
			myModal.show();\
		\}\
	\});\
 	$.each( data.result.public_album, function( key, value ) \{\
 		photos_tab.push(value.normal);\
		photos_tab_visibility.push(value.visibility);	\
\
		var blur_1 = ''; var blur_2 ='' ; var a_1 ='';\
 		// TODO : d\'e9sactiver pour ne pas afficher la pic en grand (et l'enlever du tab principal )\
 		\
		blur_1 ='<span class="'+value.visibility+'">' ;\
		blur_2 ='</span>' ; \
\
 		a_1 ='<a OnClick="modal_change_pic(\\''+value.normal+'\\', '+n+',\\''+ value.visibility +'\\')" class="media d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#photoModal" style="cursor:pointer;">';\
\
		h += '<div class="col-4">';\
		h += a_1;\
		h += blur_1;\
		h +=  '<img src="'+value.normal+'" alt="" class="img-fluid">' ;\
		h += blur_2;\
		h += '</a>';\
		h += '</div>';\
 		n++ ;\
		if (n%3 == 0) \{\
			h += '</div><div class="row gx-1 my-3">';\
		\}\
	\});\
\
\
	$.each( data.result.private_album, function( key, value ) \{\
 		photos_tab.push(value.normal);\
 		photos_tab_visibility.push(value.visibility);\
 		var blur_1 = ''; var blur_2 ='';  var a_1 ='';\
 		// TODO : d\'e9sactiver pour ne pas afficher la pic en grand (et l'enlever du tab principal )\
 		blur_1 ='<span class="'+value.visibility+'">' ;\
		blur_2 ='</span>' ; \
\
		if (value.visibility =="visible") \{\
 			a_1 ='<a OnClick="modal_change_pic(\\''+value.normal+'\\', '+n+',\\''+ value.visibility +'\\')" class="media d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#photoModal" style="cursor:pointer;">';\
		\} else \{\
	 		a_1 ='<a OnClick="modal_request_access(\\''+value.normal+'\\', '+n+',\\''+ value.visibility +'\\')" class="media d-flex align-items-center">';\
		\}\
\
		h += '<div class="col-4">';\
		h += a_1;\
		// cadenas\
		h += '<div class="infos-start"><i class="fas fa-lock"></i></div>';\
		h += blur_1;\
		h +=  '<img src="'+value.normal+'" alt="" class="img-fluid">' ;\
		h += blur_2;\
		h += '</a>';\
		h += '</div>';\
 		n++ ;\
		if (n%3 == 0) \{\
			h += '</div><div class="row gx-1 my-3">';\
		\}\
	\});\
\
	$.each( data.result.tab_videos, function( key, value ) \{\
\
		var cl = 'blur_strong';\
		var cadenas =''\
		if (value.private=="0") \{\
			cl = ''\
			cadenas= '<div class="infos-start"><i class="fas fa-lock"></i></div>'\
		\}\
		// TODO le cadenas\
		blur_1 ='<span class="'+cl+'">' ;\
		blur_2 ='</span>' ; \
\
\
		h += '<div class="col-4">';\
		h += cadenas + blur_1;\
		h += '<a OnClick="modal_change_video(\\''+value.url.img_default+'\\', \\''+value.url.mp4+'\\',\\''+ value.url.webm +'\\')" class="media d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#videoModal" style="cursor:pointer;">';\
		h +=  '<img src="'+value.url.img_default+'" alt="" data-mp4="'+value.url.mp4+'" data-webm="'+value.url.webm+'" class="img-fluid">' ;\
		h += '</a>';\
		h += blur_2;\
		h += '</div>';\
		n++ ;\
		if (n%3 == 0) \{\
			h += '</div><div class="row gx-1 my-3">';\
		\}\
	\});	\
\
\
 	h+= '</div>';\
 	$("#collapse-photos").html(h);\
	$("#profil-pics-count").html(n);\
	modal_init();\
	\
	// mettre ce panneau visible\
	$("#col-content-left .tab-pane").removeClass("active");\
	$("#col-content-left .tab-pane").removeClass("show");\
	\
	$("#user").addClass("active");\
	$("#user").addClass("show");\
	$(".infos-user").show();\
	previous_state_menu = "user_profil";\
\
	// remonter le scroll\
	$("#col-content-left").animate(\{\
			scrollTop:0\
		\},500) \
\}\
\
\
function promotion_abo(data) \{\
	// console.log("promotion_abo ")\
	// console.log(data)\
	// retrouver le dernier message dans myself_messages_past (load contacts)\
	chat_display();\
	$.each( myself_messages_past.contacts, function( key, value ) \{\
		if (value.m_id == request_id) \{\
			// console.log("Trouv\'e9 ")\
			// console.log(value)\
			let data = \{\};\
			data.eclairs=[];\
			data.eclairs[0]=\{\};\
			data.eclairs[0].msg = value.tab_last_msg.message;\
			data.eclairs[0].date = value.tab_last_msg.date;\
			data.eclairs[0].exp = request_pseudo;\
			data.eclairs[0].from_me =0 ;\
			data.eclairs[0].date = '';\
			data.photos_v2=[];\
			data.photos_v2=[];\
			data.photos_v2.public=[];\
			data.photos_v2.public[1]=\{\};\
			data.photos_v2.public[1].sq_middle =value.photo ;\
			data.photos_v2.public[1].visibility =value.need_blur;\
			chat_display_message(data);\
			return\
 \
		\}\
	\});\
	if(data.tab_last_msg) \{\
		$("#html_timer").addClass("d-none");\
		$("#html_timer_msg1").html("Vous avez un nouveau message");\
		$("#html_timer_msg2").html("D\'e9p\'eachez-vous de lire le message avant qu'il ne soit supprim\'e9 !");\
\
\
		// $("#html_timer_date").html(rebours(data.tab_last_msg.date));\
\
		// Gestion du compte \'e0 rebours\
		if( typeof data.tab_last_msg == "object" ) \{\
			var tab_last_msg = data.tab_last_msg;\
			var date_now_object = new Date();\
			var date_now = date_now_object.getTime();\
\
			var tabDateLM_Global = tab_last_msg.date.split(' ');\
			var tabDateLM_First = tabDateLM_Global[0].split('-');\
			var formatedLM_Date = tabDateLM_First[1] + '/' + tabDateLM_First[2] + '/' + tabDateLM_First[0] + ' ' + tabDateLM_Global[1];\
			var date_compte_a_rebour_expire_object = new Date(formatedLM_Date);\
			date_compte_a_rebour_expire = date_compte_a_rebour_expire_object.getTime();\
			date_compte_a_rebour_expire = parseInt(parseInt(date_compte_a_rebour_expire) + 3600000);	// + 1 * 3600 * 1000 (ms)\
\
			var diff_time = date_now_object.getTime() - date_compte_a_rebour_expire_object.getTime();\
			if ( parseInt(diff_time) < 3600000 ) \{	// Moins d'une heure en ms\
				start_timer_refresh_compte_a_rebour();\
			\} else \{\
				stop_timer_refresh_compte_a_rebour();\
				$("#html_timer_msg1").html("Discutez avec " + request_pseudo);\
				$("#html_timer_msg2").html("Abonnez-vous ");\
				$("#html_timer").addClass("d-none");\
			\}\
		\}\
		else \{\
			stop_timer_refresh_compte_a_rebour();\
		\}\
\
	\} else \{\
		stop_timer_refresh_compte_a_rebour();\
\
		$("#html_timer_msg1").html('Discutez avec <a href="/membres_'+request_pseudo+'_'+request_id+'.html">' + request_pseudo+'</a>');\
		$("#html_timer_msg2").html("Abonnez-vous ");\
\
		$("#html_timer").addClass("d-none");\
\
	\}\
	$("#alert-abo-ko").removeClass("d-none");\
\
	// V\'e9rrouille la zone d'envoie du message car l'utilisateur n'a plus le droit d'en envoyer\
	$(".chat-footer").addClass("disable");\
\
	$(".message").addClass("blur_light");\
\}\
\
/* Modale */\
function modal_change_pic(pic,n,visibility)\{\
	$("#photoModal-img").on('load', function() \{\
		$("#photoModal-img").addClass(visibility);\
		if (visibility =="blur_light") \{\
			$("#photoModal-img").removeClass("blur_strong locked  visible");\
		\}\
		if (visibility =="blur_strong") \{\
			$("#photoModal-img").removeClass("blur_light locked visible");\
		\}\
		if (visibility =="locked") \{\
			$("#photoModal-img").removeClass("blur_light blur_strong  visible");\
		\}\
		if (visibility =="visible") \{\
			$("#photoModal-img").removeClass("blur_light blur_strong locked");\
		\}\
		photos_cur = n ;\
	\});\
	$("#photoModal-img").attr("src",pic);\
\}\
\
function modal_change_chat_pic(pic,n,visibility)\{\
	$("#photoModalChat-img").on('load', function() \{\
		$("#photoModalChat-img").addClass(visibility);\
		if (visibility =="blur_light") \{\
			$("#photoModalChat-img").removeClass("blur_strong locked  visible");\
		\}\
		if (visibility =="blur_strong") \{\
			$("#photoModalChat-img").removeClass("blur_light locked visible");\
		\}\
		if (visibility =="locked") \{\
			$("#photoModalChat-img").removeClass("blur_light blur_strong  visible");\
		\}\
		if (visibility =="visible") \{\
			$("#photoModalChat-img").removeClass("blur_light blur_strong locked");\
		\}\
		photos_cur = n ;\
	\});\
	$("#photoModalChat-img").attr("src",pic);\
\}\
\
function modal_init()\{\
	$(".modal-browse-up , .modal-browse-down").off("click");\
\
	$(".modal-browse-up").click(function()\{\
		photos_cur ++; \
		if (photos_cur >= photos_tab.length )\
			photos_cur = 0;\
		modal_change_pic(photos_tab[photos_cur],photos_cur, photos_tab_visibility[photos_cur])\
	\})\
	$(".modal-browse-down").click(function()\{\
		photos_cur --; \
		if (photos_cur < 0)\
			photos_cur =  photos_tab.length -1 ;\
		modal_change_pic(photos_tab[photos_cur],photos_cur, photos_tab_visibility[photos_cur])\
	\})\
\
	$(document).keydown(function(e)\{\
		if (e.keyCode == 38 || e.keyCode == 39 ) \{\
			photos_cur ++; \
			if (photos_cur >= photos_tab.length )\
				photos_cur = 0;\
			modal_change_pic(photos_tab[photos_cur],photos_cur, photos_tab_visibility[photos_cur])\
		\} else if((e.keyCode == 37 || e.keyCode == 40 )) \{\
			photos_cur --; \
			if (photos_cur < 0)\
				photos_cur =  photos_tab.length -1 ;\
			modal_change_pic(photos_tab[photos_cur],photos_cur, photos_tab_visibility[photos_cur])\
		\}\
	\})\
\
\
\
\
\}\
\
function modal_request_access(a,b,c)\{\
	// console.log("modal_request_access");\
	$("#modal_request_access_pic").attr("src",a);\
	$("#modal_request_access_pseudo").html(request_pseudo);\
	var myModal2 = new bootstrap.Modal(document.getElementById('modal_request_access_modal'), \{\});\
	myModal2.show()\
\}\
\
\
/* Private Modale photos */\
\
function private_modal_change_settings(id,type) \{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        \
	        if(result.connected!=1) \{\
	        	return\
	        \}\
	        $.each( result.photos, function( key, value ) \{\
		 		if (value.num==id) \{\
		 			$("#myself-pic-edit-name").val(value.name)\
		 			if(value.is_private==1) \{\
		 				$("#myself-pic-edit-private").prop('checked',true);\
		 			\}  else \{\
		 				$("#myself-pic-edit-private").prop('checked',false);\
		 			\}\
		 			if(value.is_main==1) \{\
		 				$("#myself-pic-edit-is-main").prop('checked',true);\
		 			\}  else \{\
		 				$("#myself-pic-edit-is-main").prop('checked',false)\
		 			\}\
		 		\} else \{\
		 		\}\
				 \
			\});\
\
	    \}\
	\});\
	\
	$("#myself-pic-setting-id").val(id);\
	if(type =="public") \{\
	 	$("#myself-pic-setting-public").prop("checked",true);\
	 	$("#myself-pic-setting-private").prop("checked",false);\
	\} else \{\
	 	$("#myself-pic-setting-public").prop("checked",false);\
	 	$("#myself-pic-setting-private").prop("checked",true);\
	\}\
	\
	var privateModal = new bootstrap.Modal(document.getElementById('privateModal'), \{\
	\}) \
	privateModal.toggle();\
\}\
\
\
function private_modal_change_pic(id)\{\
	imgGradius = 0;\
	$("#editphotoModal-img-main").removeClass("rotate-0 rotate-90 rotate-180 rotate-270")\
	var localpic ='' ;\
	var name;\
	const image = document.querySelector("#editphotoModal-img-main");\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if(result.connected!=1) \{\
	        	return\
	        \}\
	        $.each( result.photos, function( key, value ) \{\
		 		if (value.num==id) \{\
					let currentDate = new Date();\
					let tmp_change = currentDate.getHours() + "" + currentDate.getMinutes() + "" + currentDate.getSeconds();\
		 			localpic = value.url_big\
					$("#editphotoModal-img-main").attr("src",localpic + "?" + tmp_change);\
					if(cropper)\{\
						cropper.destroy();\
					\}\
					cropper = new Cropper(image, \{\
 						checkCrossOrigin: false,\
						aspectRatio: 1,\
						viewMode: 3,\
						minCropBoxWidth: 215,\
						minCropBoxHeight: 215\
					\});\
					\
		 			$("#myself-pic-edit-name").val(value.name)\
		 			if(value.is_private==1) \{\
		 				$("#myself-pic-setting-3").prop('checked',true);\
		 			\}  else \{\
		 				$("#myself-pic-setting-2").prop('checked',true);\
		 			\}\
		 			if(value.is_main==1) \{\
		 				$("#myself-pic-setting-1").prop('checked',true)\
		 			\}   \
		 		\} else \{\
		 		\}\
				 \
			\});\
\
	    \}\
	\});\
	$("#editphotoModal-img-main").attr("dest",id);\
\}\
\
function private_modal_init()\{\
	$(".thumb-chooser").off("click")\
	$(".thumb-chooser").click(function()\{\
		$(".choose-photo").removeClass('active');\
		$(this).parent().addClass("active");\
		private_modal_change_pic($(this).attr("thumb_id"))\
	\})\
\}\
\
\
\
function private_modale_setting_submit()\{\
\
	var is_private = $(".myself-pic-setting-privacy:checked").val();\
	if (is_private =='private' ) \{\
		is_private = 1;\
	\} else \{\
		is_private = 0;\
	\}\
	var is_main =$("#myself-pic-edit-is-main:checked").val();\
	if (is_main ==1) \{\
		is_main = 1;\
	\} else \{\
		is_main = 0;\
	\}\
	var photo_num = $("#myself-pic-setting-id").val();\
	\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos/modify",\
	    data: \{ \
	    		session_id:session_id,\
	    		api_key: API_KEY, \
	    		photo_num: photo_num,\
	    		is_private : is_private,\
	    		is_main : is_main,\
\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if (result.result.modify !='success' ) \{ // TODO a v\'e9rifier \
	        	// console.log("error private_modale_setting_submit");\
	        	// console.log(result);\
\
	        \} else\{\
	        	// console.log("Success private_modale_setting_submit");\
	        	// console.log(result);\
	        	$('#privateModal').modal('hide');\
	        	myself_get(myself_id);\
	        \}\
	    \}\
	\});\
\}\
\
function private_modale_delete_submit()\{\
	// console.log("private_modale_delete_submit")\
	var photo_num = $("#editphotoModal-img-main").attr("dest");\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos/del",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id:session_id,\
	    		photo_num: photo_num,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if (result.result.del =='success' ) \{ \
	        	// console.log("success private_modale_delete_submit");\
	        	// console.log(result);\
	        	$('#editphotoModal').modal('hide');\
	        	myself_get(myself_id);\
	        \} else\{\
	        	// console.log("error");\
	        	// console.log(result);\
	        \}\
	    \}\
	\});\
\}\
function private_modale_edit_rotate(e) \{\
	var angle = parseInt(e.attr("data-angle"));\
	imgGradius = angle < 0 ? -90 : 90;\
	cropper.rotate(imgGradius);\
\}\
\
function private_modale_edit_submit()\{\
	var photo_num = $("#editphotoModal-img-main").attr("dest");\
	var name =$("#myself-pic-edit-name").val();\
	\
	var currentDate = new Date();\
	last_change = currentDate.getHours() + "" + currentDate.getMinutes() + "" + currentDate.getSeconds();\
	\
	var radio = $(".myself-pic-setting-radio:checked").val();\
\
	switch (radio) \{\
	  case 'principale':\
	    is_private = 0;\
	    is_main =1;\
	    break;\
	  case 'public':\
	  	is_private = 0;\
	    is_main =0;\
	    break;\
	  case 'private':\
	  	is_private = 1;\
	    is_main =0;\
	    break;\
	\}\
\
	let info = cropper.getData();\
	let infoGradius = info.rotate;\
	if(infoGradius==90 || infoGradius==-90) infoGradius=infoGradius*(-1);\
\
 	var fd = \{\
			"session_id":session_id,\
    		"api_key": API_KEY, \
    		"photo_num": photo_num,\
    		"is_private" : is_private,\
    		"is_main":is_main,\
    		"name":name,\
			"x": info.x,\
			"y": info.y,\
			"w": info.width,\
			"h": info.height,\
			"imgGradius": infoGradius\
			\};	 \
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos/modify",\
	    data: fd,\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if (result.result.modify !='success' ) \{  \
	        	// console.log("Error private_modale_edit_submit");\
	        	// console.log(result);\
\
	        \} else\{\
	        	// console.log("Success private_modale_edit_submit");\
	        	// console.log(result);\
	        	$('#editphotoModal').modal('hide');\
	        	myself_get(myself_id);\
	        \}\
	    \}\
	\});\
\}\
\
/* END photos */\
\
\
/* VIDEOS */\
\
function modal_change_video(poster,mp4,webm)\{\
	// console.log( " modal_change_video  "  + poster + ' '  + mp4   +' ' + webm)\
	// vjs-fluid\
	var v =''\
	v +=  '<video  id="my-video" class="video-js vjs-big-play-centered h-100 w-100" autoplay loop controls preload="auto" '\
	// v += ' poster="'+poster+'" '\
    v += ' data-setup="\{\}" '\
    v += ' >'\
	v += '<source src="'+mp4+'" type="video/mp4" />'\
	v += '<source src="'+webm+'" type="video/webm" />'\
    v += '<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>'\
    v += '</video>'+ mp4\
	$("#videomodal-video").html(v);\
\}\
\
\
/* Private Modale photos */\
\
function private_modal_change_settings_video(id,type) \{\
	$("#myself-video-setting-id").val(id);\
	// console.log("private_modal_change_settings_video " + type  + ' ' + id)\
	if(type =="public") \{\
		$("#myself-video-setting-public").prop("checked",true);\
	 	$("#myself-video-setting-private").prop("checked",false);\
	\} else \{\
	 	$("#myself-video-setting-public").prop("checked",false);\
	 	$("#myself-video-setting-private").prop("checked",true);\
	\}\
	\
	var privateModalvideo = new bootstrap.Modal(document.getElementById('privateModalvideo'), \{\
	\}) \
	privateModalvideo.toggle();\
\}\
\
\
function private_modale_delete_video(id)\{\
	// console.log("private_modale_delete_video ")\
	$("#myself-video-delete-id").val(id);\
\}\
\
\
function private_modale_delete_video_submit()\{\
	// console.log("private_modal_delete_video_submit ")\
	var photo_num = $("#myself-video-delete-id").val();\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos/del",\
	    data: \{ \
	    		session_id:session_id,\
	    		api_key: API_KEY, \
	    		photo_num: photo_num,\
\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        if (result.success  !='1' ) \{ // TODO a v\'e9rifier \
	        	// console.log("error private_modal_delete_video_submit");\
	        \} else\{\
	        	// console.log("Success private_modal_delete_video_submit");\
	        	$('#privateModalvideoDelete').modal('hide');\
	        	myself_get(myself_id);\
	        \}\
	    \}\
	\});\
\}\
\
// TODO et la suite #17\
function private_modal_change_video(id)\{\
	// console.log("private_modal_change_video 1124 " + id)\
	$("#editphotoModal-img-main").removeClass("rotate-0 rotate-90 rotate-180 rotate-270")\
	var localpic ='' ;\
	var name;\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if(result.connected!=1) \{\
	        	return\
	        \}\
	        $.each( result.photos, function( key, value ) \{\
		 		if (value.num==id) \{\
		 			localpic = value.url_middle\
					$("#editphotoModal-img-main").attr("src",localpic);\
		 			$("#myself-pic-edit-name").val(value.name)\
		 			if(value.is_private==1) \{\
		 				$("#myself-pic-setting-3").prop('checked',true);\
		 			\}  else \{\
		 				$("#myself-pic-setting-2").prop('checked',true);\
		 			\}\
		 			if(value.is_main==1) \{\
		 				$("#myself-pic-setting-1").prop('checked',true)\
		 			\}   \
		 		\} else \{\
		 		\}\
				 \
			\});\
\
	    \}\
	\});\
	$("#editvideoModal-img-main").attr("dest",id);\
\}\
\
\
\
\
\
function private_modal_video_init()\{\
	$(".thumb-chooser").off("click")\
	$(".thumb-chooser").click(function()\{\
		$(".choose-photo").removeClass('active');\
		$(this).parent().addClass("active");\
		private_modal_change_pic($(this).attr("thumb_id"))\
	\})\
\}\
\
\
\
function private_modale_video_setting_submit()\{\
	// console.log("private_modale_video_setting_submit")\
	var is_private = $(".myself-video-setting-privacy:checked").val();\
	if (is_private =='private' ) \{\
		is_private = 1;\
	\} else \{\
		is_private = 0;\
	\}\
	 \
	var photo_num = $("#myself-video-setting-id").val();\
	\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user_edit_photos/modify",\
	    data: \{ \
	    		session_id:session_id,\
	    		api_key: API_KEY, \
	    		photo_num: photo_num,\
	    		is_private : is_private,\
	    		is_main : 0,\
\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if (result.result.modify !='success' ) \{ // TODO a v\'e9rifier \
	        	// console.log("error private_modale_video_setting_submit");\
	        	// console.log(result);\
\
	        \} else\{\
	        	// console.log("Success private_modale_video_setting_submit");\
	        	// console.log(result);\
	        	$('#privateModalvideo').modal('hide');\
	        	myself_get(myself_id);\
	        \}\
	    \}\
	\});\
\} \
\
/* END VIDEOS */\
\
\
\
\
 \
\
function search_display(data) \{\
	// console.log("search_display")\
	// console.log(data)\
\
	var h ='';\
	var c =''\
	if (data.total==0) \{\
		h = '<p class="small text-center"><i class="fas fa-frown display-2 text-muted mb-2 mt-4"></i></p><p class="small  text-center">Aucun r\'e9sultat pour votre recherche</p>'\
	\}\
 	$.each( data.result, function( key, value ) \{\
 		if (value.id==request_id) \{\
 			c = 'active';\
 		\} else \{\
 			c = ''\
 		\}\
\
 		var classe_blur  =   span_blur1 =  span_blur2 = online = "";\
\
 		if(value.photo_x!=0) \{\
 			span_blur1 = '<span class="rounded-circle-blur">'; span_blur2 = '</span>';\
 			classe_blur = value.photo_x\
 		\} \
\
 		if (value.online=="1") \{\
 			online="avatar-online";\
 		\} else \{\
 			online="";\
 		\}\
\
 		h += '<div class="col-4 p-2"><div class="'+online+'">'+span_blur1 ;\
\
 		if (myself_id != value.id ) \{\
			h += '<a href="/membres_'+value.pseudo+'_'+value.id+'.html" ' \
 		\} else \{\
 			h += '<a OnClick="myself_get('+myself_id+');go_home();" ';\
 		\}\
\
 		h +='class="profil  profil-'+value.sexe1+'  '+c+' d-flex   align-items-center rounded-circle "><img src="'+value.photos[0].url_middle+'" alt="" class="img-fluid  '+classe_blur+' "><span class="infos-profil"><b>'+value.pseudo+'</b></span></a>'+span_blur2+'</div></div>';\
\
\
	\});\
\
	if (data.nb_pages>1 && search_page ==0 ) \{\
		h += '</div><div class="row gx-1" id="lazy-list-suite"></div>'\
	\}\
\
 \
\
	if (search_page<1) \{\
		$("#recherche-results").html(h); \
	\} else \{\
		$("#lazy-list-suite").append(h)\
	\}\
	// console.log("search_page " + search_page )\
	// console.log("nb_pages " + data.nb_pages )\
\
	$("#col-right").off("scroll");\
	$("#col-right").scroll(function(e) \{\
  			if($("#recherche").hasClass("active")) \{\
	  			if (  ($("#col-right").scrollTop() +  $("#col-right").height() ) >=  $("#col-right").prop('scrollHeight') ) \{\
  					search_page ++ ; \
			 		if (search_page< data.nb_pages ) \{\
						search_get(0,0,0,search_page);\
			 		\}\
	  			\}\
  			\}\
	\});\
\
	goto_binding();\
\}\
\
function goto_binding()\
\{	// \'e0 appeler \'e0 chaque fois qu'on ajoute des liens  dans le dom\
	\
	$("a[href^='/membres']").off("click");\
	$("a[href^='/membres']").click(function(e)\{\
		let href_member = $(this).attr("href");\
		let last_part = href_member.split("_").pop().split(".")[0];\
		let notification_user = $(".notifications_user-"+last_part);\
		if(notification_user.length)\
			notification_user.remove();\
		// vers des utilisateurs\
		e.preventDefault();\
		badge = $(this).find('.badge');\
		goto_member($(this).attr("href"));\
		if( $(this).hasClass('notifications_stack_elem') ) \{\
			$(this).remove();\
		\}\
		if(badge.length) setTimeout("badge.remove();",800);\
		window.history.pushState(\{\
		url: $(this).attr("href"),\
		title: ""\
		\},"",  $(this).attr("href"));\
	\})\
\}\
\
function goto_member(href) \{\
	var t = href.split("_");\
	if(t[2]) \{\
		var u = t[2].split(".");\
		user_get(parseInt(u[0]));\
	\}\
\}\
\
function binding_init()\{\
\
	$("#logo-top").click(function()\{\
			if (myself_id>0) \{\
				myself_get(myself_id);\
			\}\
			//go_home();\
	\})\
	\
	$("#messages-link").click(function()\{\
			messages_display()\
	\})\
	$("#notifications-link").click(function()\{\
			notifications_display()\
	\})\
	$("#modal_request_access_modal_submit").click(function()\{\
			modal_request_access_modal_submit();\
	\})\
	$("#chat-form").submit(function(e)\{\
			chat_send(e);\
	\})\
\
\
	// login_btn\
	$("#login_btn").click(function()\{\
			login_get() ;\
	\})\
\
\
	$("#nav-tgl , #myself-avatar-mini-back ").click(function()\{\
			$(".nav-tgl").toggle();\
			if ($("#li-tgl").attr("data-bs-original-title")  == "Modifier mon profil") \{\
				$("#li-tgl").attr("data-bs-original-title","Retour")\
\
				$("#menu").addClass("active");\
				$("#menu").addClass("show");\
				$("#edit-profile .infos-user").hide();\
				$("#user").removeClass("active");\
				$("#user").removeClass("show");\
			\}\
			else if ( previous_state_menu == "edit_profil" ) \{\
				$("#li-tgl").attr("data-bs-original-title","Modifier mon profil")\
\
				$("#menu").removeClass("active");\
				$("#menu").removeClass("show");\
				myself_get(myself_id);\
				go_home();\
				$("#user").removeClass("active");\
				$("#user").removeClass("show");\
				$("#edit-profile .infos-user").hide();\
			\} else \{\
				$("#li-tgl").attr("data-bs-original-title","Modifier mon profil")\
\
				$("#menu").removeClass("active");\
				$("#menu").removeClass("show");\
				$("#user").addClass("active");\
				$("#user").addClass("show");\
			\}\
\
	\});\
\
	$('#btn_logo_home, #myself-avatar-mini-link').unbind().click(function()\{\
		//console.log("Go HOME");\
		//console.log($("#li-tgl").attr("data-bs-original-title"));\
		if ($("#li-tgl").attr("data-bs-original-title")  == "Retour") \{\
			//console.log("TOGGLED")\
			$(".nav-tgl").toggle();\
		\}\
		$("#li-tgl").attr("data-bs-original-title","Modifier mon profil");\
\
		$("#menu").removeClass("active");\
		$("#menu").removeClass("show");\
		myself_get(myself_id);\
		go_home();\
		$("#user").removeClass("active");\
		$("#user").removeClass("show");\
		$("#edit-profile .infos-user").hide();\
	\});\
\
	// photos\
	$(".myself-pic-setting-submit").click(function()\{\
			private_modale_setting_submit ();\
	\})\
\
	$(".myself-pic-edit-submit").click(function()\{\
			private_modale_edit_submit ();\
	\})\
\
	$(".myself-pic-delete-submit").click(function()\{\
			private_modale_delete_submit ();\
	\})\
	// videos\
	$(".myself-video-setting-submit").click(function()\{\
			private_modale_video_setting_submit ();\
	\})\
\
	$(".myself-video-edit-submit").click(function()\{\
			private_modale_video_edit_submit ();\
	\})\
\
	$(".myself-video-delete-submit").click(function()\{\
			private_modale_delete_video_submit ();\
	\})\
\
	$(".myself-edit-submit").click(function()\{\
			infos_modale_submit ();\
	\})\
	\
	$(".rotator").click(function()\{\
			private_modale_edit_rotate ($(this));\
	\})\
\
	$(".myself-account-delete-submit").click(function()\{\
			private_modale_account_delete_submit();\
	\})\
	\
	$(".mailing-submit").click(function()\{\
			mailing_modale_submit ();\
	\})\
\
	$("#btn-matchs").click(function()\{\
			myself_matchs_get ();\
	\})\
\
	$("#btn-all_matchs").click(function()\{\
		$(".match-toggle-1").hide();\
		$(".match-toggle-2").show();\
		$('#btn_all_matchs_panel').tab('show');\
		$("#col-right").animate(\{\
			scrollTop:0\
		\},500) \
\
	\})\
\
	$("#btn-suite-description").click(function()\{\
		$('#btn-suite-description').hide();\
		$('#suite-description').show();\
	\})\
	$("#open-liste-noire").click(function()\{\
		blacklist_get();\
	\})\
\
	$(".btn-chat-crown , .btn-menu-crown, .btn-popup-crown, .alert-abo-ko-btn").click(function()\{\
		if(myself_data.sexe1 != 2)\{\
			var url = api_payment_iframe(); \
		\}\
		else\{\
			// contact \
			let contactModal = $('#contactModal');\
			contactModal.modal('show');\
			contactModal.find("select option:last").attr("selected", true)\
		\}\
		\
	\})\
\
	$(".btn-down-crown").click(function()\{\
		myself_gestion_abo();\
	\})\
 	\
	$("#myself-gestion-abo-submit").click(function()\{\
		modale_gestion_abo_submit();\
	\})\
	$("#myself-gestion-abo-confirm-submit").click(function()\{\
		modale_gestion_abo_confirm_submit();\
	\})\
 	\
 	\
	// ville dans la recherche\
	$("#search-city" ).autocomplete(\{\
  		source:  function( request, response ) \{\
  		\
	    $.ajax(\{\
		    url: API_ENDPOINT + "ajax_api/getRegionsAutocomp",\
		    type: 'post',\
		    dataType: "json",\
		    data: \{\
				session_id: session_id,\
		     	q: request.term\
		\},\
	    success: function( data ) \{\
	     	var r = [];\
	     	$.each( data.result, function( key, value ) \{\
	     		// assigne les elements dans data pour r\'e9utilisation dans la function select \
	     		r.push( \{ \
	     							label : value.zone_name,\
	     							value : value.zone_name ,\
	     							data : value.ID_city +'-'+value.ID_region +'-'+value.ID_country ,\
	     						\}\
	     					);\
	     	\});\
	     	response(r);\
	    \}\
	   \});\
	  \},\
\
	  select: function( event, ui ) \{\
	  	//	console.log("SELECT");\
	  	// console.log( ui.item);\
	  		var t =  ui.item.data.split("-") ;\
			id_ville 	= t[0];\
			region 		= t[1];\
			countryObj 		= t[2];\
			setCookie("geoloc", ui.item.data , 200);\
			setCookie("geoloctxt", ui.item.label , 200);\
		 	search_get(id_ville,region,countryObj,0);\
	  \},\
\
	  change: function( event, ui ) \{\
	  	if (  ui.item === null ) \{\
 			setCookie("geoloc", '' , 200);\
			setCookie("geoloctxt", '' , 200);\
		 	search_get();\
 			return;\
 		\}\
	  		var t =  ui.item.data.split("-") ;\
			id_ville 	= t[0];\
			region 		= t[1];\
			countryObj 		= t[2];\
			setCookie("geoloc", ui.item.data , 200);\
			setCookie("geoloctxt", ui.item.label , 200);\
		 	search_get(id_ville,region,countryObj,0);\
\
	  \}\
	\}).autocomplete("widget").addClass("dropdown-autocomplete");\
\
	let click_autocomplete = false;\
\
	$(document).on('mousedown', '.dropdown-autocomplete .ui-menu-item', function(e) \{\
		click_autocomplete = true;\
	\});\
\
	$('#geoloc-dropdown').on('hidden.bs.dropdown', function (e) \{\
		if (click_autocomplete) \{\
			$('#geoloc-dropdown').dropdown('toggle');\
			click_autocomplete = false;\
		\}\
	\});\
\
	// ville dans la modale infos\
	$("#myself-edit-city,#myself-confirm-city" ).autocomplete(\{\
  		source:  function( request, response ) \{\
  		\
	    $.ajax(\{\
		    url: API_ENDPOINT + "ajax_api/getRegionsAutocomp",\
		    type: 'post',\
		    dataType: "json",\
		    data: \{\
				session_id: session_id,\
		     	q: request.term\
		\},\
	    success: function( data ) \{\
	     	var r = [];\
	     	$.each( data.result, function( key, value ) \{\
	     		// assigne les elements dans data pour r\'e9utilisation dans la function select \
	     		r.push( \{ \
	     							label : value.zone_name,\
	     							value : value.zone_name ,\
	     							data : value.ID_city +'-'+value.ID_region +'-'+value.ID_country ,\
	     						\}\
	     					);\
	     	\});\
	     	response(r);\
	    \}\
	   \});\
	  \},\
\
	  select: function( event, ui ) \{\
	  		var t =  ui.item.data.split("-") ;\
			id_ville 	= t[0];\
			region 		= t[1];\
			countryObj 		= t[2];\
			if($("#confirmationModal").length && $("#confirmationModal").is(":visible") )\{\
				$("#myself-confirm-id_ville").val(id_ville);\
				$("#myself-confirm-region").val(region);\
				$("#myself-confirm-id_countryObj").val(countryObj);\
			\}\
			else\{\
			$("#myself-edit-id_ville").val(id_ville);\
			$("#myself-edit-region").val(region);\
			$("#myself-edit-id_countryObj").val(countryObj);\
			\}\
	  \},\
\
	  change: function( event, ui ) \{\
	  	if (  ui.item === null ) \{\
 			$("#myself-edit-id_ville").val();\
			$("#myself-edit-region").val();\
			$("#myself-edit-id_countryObj").val();\
 			return;\
 		\}\
	  \}\
	\});\
\
\
	// MODALES LISTENERS\
\
	// faqModal\
	var myModalFAQ = document.getElementById('faqModal')\
	myModalFAQ.addEventListener('show.bs.modal', function (event) \{\
	  $.ajax(\{\
		    type: "GET",\
		    url: API_ENDPOINT + "index_api/faq",\
		    data: \{ \
		    		api_key: API_KEY, \
		    		json: 1,\
		    	\},\
		    dataType: "json",\
		    success: function (result, status) \{\
		        modale_faq(result);\
		    \} \
		\});\
\
	\})\
\
	// modale ajout de photo \
	var addphotoModal = document.getElementById('addphotoModal')\
	addphotoModal.addEventListener('show.bs.modal', function (event) \{\
	  $("#progress_bar").css("width", 0);\
	\})\
	// modale ajout de video \
	var addvideoModal= document.getElementById('addvideoModal')\
	addvideoModal.addEventListener('show.bs.modal', function (event) \{\
	  $("#progress_bar_video").css("width", 0);\
	\})\
	// modale video user \
	var videoModal   = document.getElementById('videoModal')\
	videoModal.addEventListener('hide.bs.modal', function (event) \{\
	  $("#videomodal-video").html('');\
	\})\
\
  	// CGU\
	var myModalCGU = document.getElementById('cgvModal')\
	myModalCGU.addEventListener('show.bs.modal', function (event) \{\
	  $("#cgvModaliframe").attr("src", API_ENDPOINT + 'index_api/cgu?api_key='+ API_KEY + '&session_id=' +session_id + '&site_type=zm2022');\
	\})\
\
	// contact \
  	var myModalcontact = document.getElementById('contactModal')\
	myModalcontact.addEventListener('show.bs.modal', function (event) \{\
		$(myModalcontact).find("select option:last").attr("selected", false);\
	  // load captcha \
	  $("#captcha-img").attr("src" ,API_ENDPOINT + 'index_api/captcha?api_key='+ API_KEY + '&session_id=' +session_id );\
	\})\
	\
\
	$("#contact-form-submit").click(function()\{\
			contact_form_submit ();\
	\})\
	\
	$("#parametres-form-submit").click(function()\{\
			parametres_form_submit ();\
	\})\
	$("#email-form-submit").click(function()\{\
			email_form_submit ();\
	\})\
	\
	$("#user-report").click(function()\{\
			reportuser_open_modal ()\
	\})\
	$(".reportuser-submit").click(function()\{\
			reportuser_form_submit ();\
	\})\
	\
\
	$("#user-blacklist").click(function()\{\
			 // TODO\
			 if (confirm("D\'e9placer cet utilisateur dans la liste noire ?")) \{\
			 	$.ajax(\{\
				    type: "GET",\
				    url: API_ENDPOINT + "ajax_api/setIgnore",\
				    data: \{ \
				    		api_key: API_KEY, \
				    		session_id: session_id,\
				    		action: "add",\
				    		target_id: request_id,\
				    	\},\
				    dataType: "json",\
				    success: function (result, status) \{\
				        modale_generique_message("Liste noire","Cet utilisateur a \'e9t\'e9 plac\'e9 dans votre liste noire");\
				        go_home();\
				        $("#edit-profile .infos-user").show();\
				        $("#user").removeClass("active show");\
				    \} \
				\});\
			 \}\
\
	\})\
\
	$("#user-delete-contact").click(function()\{\
			 // TODO : on fait quoi ensuite ? \
			 if (confirm("Supprimer cette conversaton  ?")) \{\
			 	$.ajax(\{\
			    type: "GET",\
			    url: API_ENDPOINT + "ajax_api/setContact",\
			    data: \{ \
			    		api_key: API_KEY, \
			    		session_id: session_id,\
			    		action: "del",\
			    		target_id: request_id,\
			    	\},\
			    dataType: "json",\
			    success: function (result, status) \{\
			        // console.log(result);\
			        modale_generique_message("Supprimer une conversation","Cette conversation a \'e9t\'e9 supprim\'e9e");\
					myself_messages_past_get();\
			        go_home();\
			        $("#edit-profile .infos-user").show();\
			        $("#user").removeClass("active show");\
			    \} \
			\});\
			 \}\
\
	\})\
\
\
\
\
	// mentions l\'e9gales\
	var myModallegal = document.getElementById('legalModal')\
	myModallegal.addEventListener('show.bs.modal', function (event) \{\
		$("#legalModaliframe").attr("src", API_ENDPOINT + 'index_api/informations?api_key='+ API_KEY + '&session_id=' +session_id );\
	\})\
\
\
	// ajout aux favoris  depuis profil \
	$("#user_is_fav").click(function()\{\
			// console.log("user_is_fav click")\
			$( "#fakeinput").focus();	\
			var action ='add' ;\
			if ($("#user_is_fav").hasClass("btn-success")) \{\
				action ='del';\
			\}\
\
		 	$.ajax(\{\
			    type: "GET",\
			    url: API_ENDPOINT + "ajax_api/setFriend",\
			    data: \{ \
			    		api_key: API_KEY, \
			    		session_id: session_id,\
			    		target_id: request_id,\
			    		action: action,\
\
			    	\},\
			    dataType: "json",\
			    success: function (result, status) \{\
			        if (action=="add") \{\
			        	$("#user_is_fav").addClass("btn-success"); // todo : faut cliquer ailleurs pour que la classe soit visible \
						$("#user_is_fav").attr("data-bs-original-title", "Retirer des favoris");\
			        \} else \{\
			        	$("#user_is_fav").removeClass("btn-success");\
						$("#user_is_fav").attr("data-bs-original-title", "Ajouter aux favoris");\
			        \}\
					// relancer pour actualiser le panneau\
					myself_favoris_get();\
				\}\
\
			\});\
	\})\
\
\
\
\
	binding_webcam(); \
	binding_video();\
\}\
\
\
\
\
\
\
/* WEBCAM */\
function binding_webcam()\{\
	var Modal_addphotoModal = new bootstrap.Modal(document.getElementById('addphotoModal'), \{\});\
\
	$(".addphoto_toggle").click(function()\{\
			$(".addphoto_fileform , .addphoto_webcamform").toggle();\
			Modal_addphotoModal.handleUpdate() \
	\})\
	$(".toggle_camera").click(function()\{\
		$(".toggle_camera").toggle();\
		Modal_addphotoModal.handleUpdate() \
	\})\
	$( "#addphoto_file" ).on( "change", function() \{\
		var file = $("#addphoto_file").val();\
		if(file != "" )\{\
			addphoto_modale_submit();\
		\}\
	  \} );\
\
\
	$(".addphoto-form-submit").click(function()\{\
		// selon si on est en mode file ou camera\
		if($(".addphoto_webcamform").css("display") =="block") \{\
			$(".toggle_camera").toggle();\
			canvas = document.getElementById('capturecanvas');\
			// canvas.getContext('2d').drawImage(videoCapture, 0, 0, 1024, 768);\
			var data = canvas.toDataURL('image/png');\
			addphoto_modale_webcam_submit(dataType64toFile(data))\
		\}	else \{\
			addphoto_modale_submit ();\
		\}\
	\})\
	// webcam https://www.thecodehubs.com/how-to-capture-photo-using-webcam-in-jquery/ \
	// https://developer.mozilla.org/fr/docs/Web/API/WebRTC_API/Taking_still_photos\
	videoCapture = document.getElementById('capturevideo');\
	$("#btnActivateCamera").click(function()\{\
			if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) \{\
		        // access video stream from webcam\
		        navigator.mediaDevices.getUserMedia(\{ video: true \}).then(function (stream) \{\
		            // on success, stream it in video tag \
		            window.localStream = stream;\
		            videoCapture.srcObject = stream;\
		            videoCapture.play();\
		            activateCamera();\
		        \}).catch(e => \{\
		            // on failure/error, alert message. \
		            alert("Please Allow: Use Your Camera!");\
		        \});\
		    \}\
	\})\
\
	$("#btnDeactivateCamera , .addphoto-form-submit" ).click(function()\{\
		// stop video streaming if any\
		if (typeof localStream === 'undefined') \{\
			return; \
		\}\
    	localStream.getTracks().forEach(function (track) \{\
	        if (track.readyState == 'live' && track.kind === 'video') \{\
	            track.stop();\
	            deactivateCamera();\
	        \}\
    	\});\
	\})\
\
	$("#btnCapture").click(function()\{\
		document.getElementById('capturecanvas').getContext('2d').drawImage(videoCapture, 0, 0, 293, 220); // format 4/3 mini 215  \
	\})\
\}\
\
function activateCamera() \{\
    $("#btnActivateCamera").addClass("d-none");\
    $("#btnDeactivateCamera").removeClass("d-none");\
    $("#capturevideo").removeClass("d-none");\
    $("#btnCapture").removeClass("d-none");\
    $("#capturecanvas").removeClass("d-none");\
\}\
function deactivateCamera() \{\
    $("#btnDeactivateCamera").addClass("d-none");\
    $("#btnActivateCamera").removeClass("d-none");\
    $("#capturevideo").addClass("d-none");\
    $("#btnCapture").addClass("d-none");\
    $("#capturecanvas").addClass("d-none");\
\}\
\
function dataType64toFile (dataurl, filename = "webcam.png")   \{\
  //Convert base64 to file\
  let arr = dataurl.split(","),\
    mime = arr[0].match(/:(.*?);/)[1],\
    bstr = atob(arr[1]),\
    n = bstr.length,\
    u8arr = new Uint8Array(n)\
  while (n--) \{\
    u8arr[n] = bstr.charCodeAt(n)\
  \}\
  let newFile = new File([u8arr], filename, \{\
    type: mime,\
  \})\
  return newFile\
\}\
\
function invite_photo_add()\{\
	var myModal = new bootstrap.Modal(document.getElementById('takephotoModal'), \{\});\
	myModal.hide();\
	var myModal2 = new bootstrap.Modal(document.getElementById('addphotoModal'), \{\});\
	myModal2.show()\
\}\
function addphoto_modale_submit()\{\
	$(".addphoto-form-submit").attr('disabled', 'disabled');  \
	var error = 0;\
	var file = $("#addphoto_file").val();\
\
	if(file =="" )\{\
		alert( "Merci de s\'e9lectionner une image");\
		error++;\
	\}\
	var fd = new FormData();\
    var files = $('#addphoto_file')[0].files;\
\
\
    if(files.length > 0 )\{\
           fd.append('file',files[0]);\
    \} else \{\
    	error++;\
    \}\
\
    fd.append('api_key',API_KEY);\
    fd.append('session_id',session_id);\
\
	if (error>0) \{\
		return ;\
	\}\
 	$.ajax(\{\
 		xhr: function() \{\
	        var xhr = new window.XMLHttpRequest();\
	        xhr.upload.addEventListener("progress", function(evt) \{\
	            if (evt.lengthComputable) \{\
	                var percentComplete = Math.round ( (evt.loaded / evt.total) * 100 );\
	                // console.log(percentComplete)\
	                $("#progress_bar").css("width",percentComplete+'%')\
	            \}\
	       \}, false);\
	       return xhr;\
	    \},\
	    type: "POST",\
	    url: API_ENDPOINT + "ajax_api/upload_photo",\
	    data: fd,\
	    contentType: false,\
	    processData: false,\
	    dataType: "json",\
	    success: function (data, status) \{\
	        if(  data.result.id_photo > 0) \{\
				private_modal_change_pic(data.result.id_photo);\
				$('#addphotoModal').modal('hide');\
				$('#editphotoModal').modal('show');\
	        	myself_get(myself_id);\
	        \} else \{\
	        	alert("Une erreur s'est produite, v\'e9rifiez votre format de fichier")\
	        \}\
	        $(".addphoto-form-submit" ).removeAttr('disabled');\
	    \} \
	\});\
\}\
\
\
function addphoto_modale_webcam_submit(pic)\{\
	$( ".addphoto-form-submit" ).prop( "disabled", true );\
	var error = 0;\
	if(pic =="" )\{\
		alert( "Merci de prendre une photo !");\
		error++;\
	\}\
	var fd = new FormData();\
     \
    fd.append('file',pic);  \
    fd.append('api_key',API_KEY);\
    fd.append('session_id',session_id);\
\
	if (error>0) \{\
		return ;\
	\}\
\
	$.ajax(\{\
	    type: "POST",\
	    url: API_ENDPOINT + "ajax_api/upload_photo?api_key="+API_KEY+"&session_id="+session_id,\
	    // url: "/debug.php",\
	    data: fd,\
	    contentType: false,\
	    processData: false,\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if(result.id_photo < 1 ) \{\
	        	alert("Une erreur s'est produite, v\'e9rifiez votre format de fichier")\
	        \} else \{\
	        	myself_get(myself_id);\
	        	$('#addphotoModal').modal('hide');\
	        \}\
	    \} \
	\});\
	$(".addphoto-form-submit" ).prop( "disabled", false );\
\}	\
\
/* END WEBCAM */\
\
\
/* VIDEO UPLOAD */ \
\
function binding_video()\{\
	var Modal_addvideoModal = new bootstrap.Modal(document.getElementById('addvideoModal'), \{\});\
\
	$(".addvideo_toggle").click(function()\{\
			$(".addvideo_fileform").toggle();\
			$(".addvideo_webcamform").toggle();\
			Modal_addvideoModal.handleUpdate() \
	\})\
	 \
\
\
	$(".addvideo-form-submit").click(function()\{\
		// selon si on est en mode file ou camera\
		if($(".addvideo_webcamform").css("display") =="block") \{\
			addvideo_modale_submit(recorded_video)\
		\}	else \{\
			addvideo_modale_submit ();\
		\}\
	\})\
\}\
\
function addvideo_modale_submit(video =false)\{\
	// console.log("addvideo_modale_submit")\
	$(".addvideo-form-submit").attr('disabled', 'disabled');  \
	var error = 0;\
	var fd = new FormData();\
\
	if(video==false) \{\
		var file = $("#addvideo_file").val();\
\
		if(file =="" )\{\
			alert( "Merci de s\'e9lectionner une vid\'e9o");\
			error++;\
		\}\
	    var files = $('#addvideo_file')[0].files;\
	    // console.log("files[0]" )\
	    // console.log(files[0])\
\
	    if(files.length > 0 )\{\
	           fd.append('file',files[0]);\
	    \} else \{\
	    	error++;\
	    \}\
	\} else \{\
		// console.log("video")\
		// console.log(video)\
		// console.log("Envoi video webcam ");\
		fd.append("file", video);\
	\}\
\
	// console.log(fd);\
\
    fd.append('api_key',API_KEY);\
    fd.append('session_id',session_id);\
\
	if (error>0) \{\
		return ;\
	\}\
 	$.ajax(\{\
 		xhr: function() \{\
	        var xhr = new window.XMLHttpRequest();\
	        xhr.upload.addEventListener("progress", function(evt) \{\
	            if (evt.lengthComputable) \{\
	                var percentComplete = Math.round ( (evt.loaded / evt.total) * 100 );\
	                // console.log(percentComplete)\
	                $("#progress_bar_video").css("width",percentComplete+'%')\
	            \} else \{\
	            	// console.log("evt.lengthComputable : false ")\
	            \}\
	       \}, false);\
	       return xhr;\
	    \},\
	    type: "POST",\
	    url: API_ENDPOINT + "ajax_api/upload_photo",\
	    data: fd,\
	    contentType: false,\
	    processData: false,\
	    dataType: "json",\
	    success: function (data, status) \{\
	        if(  data.result.success == 1) \{\
	        	data.result.token_video; // TODO\
				// private_modal_change_pic(data.result.id_photo); // TODO\
				$('#addvideoModal').modal('hide');\
				// $('#editphotoModal').modal('show');  // TODO\
	        	myself_get(myself_id);\
	        \} else \{\
	        	alert("Une erreur s'est produite, v\'e9rifiez votre format de fichier")\
	        \}\
	        $(".addvideo-form-submit" ).removeAttr('disabled');\
	    \} \
	\});\
\}\
\
 \
\
/* VIDEO RECORDING \
https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element\
https://yari-demos.prod.mdn.mozit.cloud/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element/_sample_.Example_of_recording_a_media_element.html\
*/ \
\
let preview = document.getElementById("preview");\
let recording = document.getElementById("recording");\
let startButton = document.getElementById("startButton");\
let stopButton = document.getElementById("stopButton");\
let downloadButton = document.getElementById("downloadButton");\
let logElement = document.getElementById("log");\
let recordingTimeMS = 10000; // TODO 15\
var recorded_video ;\
\
function video_log(msg) \{\
  logElement.innerHTML += msg + "<br>";\
\}\
\
function wait(delayInMS) \{\
  return new Promise(resolve => setTimeout(resolve, delayInMS));\
\}\
\
function startRecording(stream, lengthInMS) \{\
  let recorder = new MediaRecorder(stream);\
  let data = [];\
  logElement.innerHTML =  "";\
  recorder.ondataavailable = event => data.push(event.data);\
  recorder.start();\
  // + recorder.state\
  video_log("<div class='mb-2 badge bg-light text-dark'> Enregistrement "   + (lengthInMS/1000) + " secondes...</div>");\
\
  let stopped = new Promise((resolve, reject) => \{\
    recorder.onstop = resolve;\
    recorder.onerror = event => reject(event.name);\
  \});\
\
  let recorded = wait(lengthInMS).then(\
    () => recorder.state == "recording" && recorder.stop()\
  );\
\
  return Promise.all([\
    stopped,\
    recorded\
  ])\
  .then(() => data);\
\}\
\
function video_stop(stream) \{\
  stream.getTracks().forEach(track => track.stop());\
\}\
\
startButton.addEventListener("click", function() \{\
  navigator.mediaDevices.getUserMedia(\{\
    video: true,\
    audio: true\
  \}).then(stream => \{\
    preview.srcObject = stream;\
    downloadButton.href = stream;\
    preview.captureStream = preview.captureStream || preview.mozCaptureStream;\
    return new Promise(resolve => preview.onplaying = resolve);\
  \}).then(() => startRecording(preview.captureStream(), recordingTimeMS))\
  .then (recordedChunks => \{\
    let recordedBlob = new Blob(recordedChunks, \{ type: "video/webm" \});\
	recorded_video =   	 new File(recordedChunks, "video.webm", \{\
	    type: "video/webm",\
  	\})\
\
    recording.src = URL.createObjectURL(recordedBlob);\
    downloadButton.href = recording.src;\
    downloadButton.download = "video.webm";\
    video_log("<div class='mb-2 badge bg-success'>Enregistrement termin\'e9</div>")\
    // video_log("Successfully recorded " + recordedBlob.size + " bytes of " +        recordedBlob.type + " media.");\
    video_stop(preview.srcObject);\
\
  \})\
  .catch((error) => \{\
    if (error.name === "NotFoundError") \{\
      video_log("<div class='mb-2 badge bg-warning text-dark'>Cam\'e9ra ou microphone non d\'e9tect\'e9 !</div>");\
    \} else \{\
      video_log(error);\
    \}\
  \});\
\}, false);\
\
stopButton.addEventListener("click", function() \{\
  video_stop(preview.srcObject);\
\}, false);\
\
\
\
\
function user_is_fav_from_list()\{\
	var dest_id = $(this).attr("dest");\
	var dest_btn = $(this) ;\
	var action ='add' ;\
	// todo : savoir s'il est d\'e9j\'e0 en favori \
	if ($(this).hasClass("btn-success")) \{ \
		action ='del';\
	\}\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/setFriend",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		action: action,\
	    		target_id: dest_id,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if (action=="add") \{\
	        	dest_btn.addClass("btn-success"); // todo : faut cliquer ailleurs pour que la classe soit visible ===> 	$( "#fakeinput").focus();\
			\} else \{\
	        	dest_btn.removeClass("btn-success");\
	        \}\
			$(dest_btn).parents('.card-body').find('.profil').focus();\
		\}\
	\});\
\}\
\
function modale_generique_message(title,body,next_step=false) \{\
	$("#modal-generique-message-title").html(title);\
	$("#modal-generique-message-body").html(body);\
	var myModal = new bootstrap.Modal(document.getElementById('modal-generique-message'), \{\});\
	myModal.show()\
\
\
	var myModalEl = document.getElementById('modal-generique-message')\
	if (next_step) \{\
		myModalEl.addEventListener('hidden.bs.modal', function (event) \{\
	  		window.location = next_step ;\
		\})\
	\}  \
\}\
\
function modale_premium()\{\
	if($("#abo-ko").is(":visible") == false && $("#parametresModal").is(":visible") == false && $("#mailingModal").is(":visible") == false && destination_action != "abo_confirm")\{\
		var myModal = new bootstrap.Modal(document.getElementById('premiumModal'), \{\});\
		myModal.show();\
	\}\
\}\
\
function modale_takephoto()\{\
	if($("#abo-ko").is(":visible") == false && $("#modal-generique-message").is(":visible") == false && $("#parametresModal").is(":visible") == false)\{\
		var myModal = new bootstrap.Modal(document.getElementById('takephotoModal'), \{\});\
		myModal.show()\
	\}\
\}\
\
function modale_conf_eclair()\{\
	if($("#abo-ko").is(":visible") == false && $("#parametresModal").is(":visible") == false)\{\
		var myModal = new bootstrap.Modal(document.getElementById('confirmationModal'), \{\});\
		myModal.show();\
	\}\
\}\
\
\
\
function myself_gestion_abo() \{\
	if(myself_is_abo) \{\
		modale_gestion_abo()\
	\} else\{\
		api_redirect_payment();\
	\}\
\}\
\
function modale_gestion_abo () \{\
	$("#modal-gestion-abo-title").html("G\'e9rer mon abonnement");\
	var v =''; var w ='';\
	if (myself_is_abo) \{\
		v ='Actif' \
	\}\
	body= '<h4>Votre abonnement est actuellement <span class="badge bg-secondary">'+v+'</span></h4>'\
	body += '<p>Vous vous \'eates abonn\'e9 le <span class="badge bg-warning text-dark ">'+date_mysql_to_fr(myself_abo.start_date)+'</span></p>'\
	body += '<p>Votre acc\'e8s se termine le <span class="badge bg-warning text-dark ">'+date_mysql_to_fr(myself_abo.end_date)+'</span></p>'\
\
\
	// + description depuis abo_infos\
    // + si cancelled = 1 : votre abonnement est r\'e9sili\'e9 \'e0 date_end\
    if (myself_abo.cancelled=="1") \{\
    	body += '<p>Votre abonnement sera r\'e9sili\'e9 le <span class="badge bg-info text-dark ">'+date_mysql_to_fr(myself_abo.end_date)+'</span></p>'\
    \} \
\
    // + nodesabo  = true : il ne peut pas proc\'e9der \'e0 la r\'e9siliation, attente phrase \
  	if (myself_abo.nodesabo==true) \{\
    	body += '<p>Phrase en attente nodesabo==true</span></p>'  //  #TODO\
    \} else \{\
	    // + si cancelled = 0 : modifier mon compte > ouvre une popup > appel api  /index_api/p_compte/unsubscribe (doc pas \'e0 jour, manque email)> \'e7a va envoyer un email\
	    if (myself_abo.cancelled=="0") \{\
	    	body += '<div class=" mb-4 text-center"><a href="#" id="gestion_abo_modifier" class="btn btn-primary">Modifier mon compte</a></div>';\
	    \}\
    \}\
\
	$("#modal-gestion-abo-body").html(body);\
\
\
	$("#gestion_abo_modifier").click(function()\{\
		// console.log("gestion_abo_modifier")\
		$('#form-gestion-abo').toggle();\
	\})\
	var myModal = new bootstrap.Modal(document.getElementById('modal-gestion-abo'), \{\});\
	myModal.show()\
\}\
\
function modale_gestion_abo_submit() \{\
	// console.log("modale_gestion_abo_submit")\
	var error = 0;\
	var email = $("#myself-gestion-abo-email").val();\
	if(email =="" )\{\
		alert( "Merci de renseigner votre email");\
		error++;\
	\}\
	if (error>0) \{\
		return ;\
	\}\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/p_compte/unsubscribe",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		desabo_step1 : 1,\
	    		email : email\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        if(result.error ==0) \{\
	        	$('#modal-gestion-abo').modal('hide');\
	        	modale_generique_message("G\'e9r\'e9r mon abonnement",result.result.url_desabo)\
	        	 $("#myself-gestion-abo-email").val('');\
	        \} \
	    \} \
	\});\
\}\
function modale_gestion_abo_confirm_submit() \{\
	// #TODO #46 \
	// console.log("modale_gestion_abo_confirm_submit")\
	var error = 0;\
	var email = $("#myself-gestion-abo-confirm-email").val();\
	if(email =="" )\{\
		alert( "Merci de renseigner votre email");\
		error++;\
	\}\
	if (error>0) \{\
		return ;\
	\}\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/p_compte/unsubscribe",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		desabo_complet : 1,\
	    		email : email\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        if(result.error ==0) \{\
	        	$('#modal-gestion-abo-confirm').modal('hide');\
	        	modale_generique_message("R\'e9siliation confirm\'e9e",result.result.url_desabo)\
	        	$("#myself-gestion-abo-confirm-email").val('');\
	        \} \
	    \} \
	\});\
\}\
\
\
function modale_faq(result) \{\
	h='';\
	n= 0;\
	$.each( result, function( key, value ) \{\
    	$.each( value, function( key2, v ) \{\
	    	h += '<div><strong>'+ v.nom+'</strong></div>';\
	    	$.each( v.questions, function( key3, v3 ) \{\
		    	n++ ;\
		    	h += '<div class="accordion-item bg-light">';\
		    	h += '<h2 class="accordion-header" id="faq'+n+'">';\
		    	h += '<button class="accordion-button collapsed bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#faqcollapse'+n+'" aria-expanded="true" aria-controls="faqcollapse'+n+'">';\
		    	h += v3;\
		    	h += '</button>';\
		    	h += '</h2>';\
		    	h += '<div id="faqcollapse'+n+'" class="accordion-collapse collapse" aria-labelledby="faq'+n+'" data-bs-parent="#accordionFAQ">';\
		    	h += '<div class="accordion-body">';\
		    	h += '<strong>' + v.reponses[key3].replace(/\\n/g, "<br>")+'</strong>';\
		    	h += '</div>';\
		    	h += '</div>';\
		    	h += '</div>';\
		    	h += '';\
\
		 	\});\
	 	\});\
 	\});\
\
 	$("#accordionFAQ").html(h);\
\
\}\
\
 \
\
\
\
\
function cookies_init() \{\
\
	if (autologin==true)\{\
		// console.log("autologin");\
		setCookie("session_id", session_id , 1);\
		setCookie("myself_id", myself_id , 200);\
		setCookie("rememberme", rememberme, 20000);\
\
		// return ; // #36\
	\}\
	var s = getCookie("session_id");\
	if(s!='') \{\
		session_id = s;\
	\}\
	var s = getCookie("myself_id");\
	if(s!='') \{\
		myself_id = s;\
	\}\
	var s = getCookie("sexe-select");\
	if(s ) \{\
		var t = s.split('');\
		t.forEach(function(item)\{\
		  $("#sexe-select"+item).prop("checked", true); \
		\});\
	\}\
\
	var s = getCookie("age_from");\
	if(s>1) \{\
		$("#age_from").val(s) ;\
	\}\
	var s = getCookie("age_to");\
	if(s>1) \{\
		$("#age_to").val(s) ;\
	\}\
\
\
	var s = getCookie("is_online");\
	if(s==1) \{\
		$("#is_online").val(1) ;\
		$(".btn-is_online").addClass("btn-success") ;\
	\} else \{\
		$("#is_online").val(0) ;\
		$(".btn-is_online").removeClass("btn-success") ;\
	\}\
\
\
	var s = getCookie("geoloctxt");\
	if (s) \{\
		$("#search-city").val(s) ;\
	\}\
\
	$(".btn-is_online").click(function()\{\
		// console.log("2655 ")\
		if ($("#is_online").val()==1 ) \{\
			$(".btn-is_online").removeClass("btn-success") ;\
			$("#is_online").val(0) \
			setCookie("is_online", 0 , 200);\
		\} else \{\
			$(".btn-is_online").addClass("btn-success") ;\
			$("#is_online").val(1) \
			setCookie("is_online", 1 , 200);\
		\}\
		search_get();\
	\})\
\
\
\
	$(".sexe-select").change(function()\{\
		var sex =''; \
		$(".sexe-select").each(function( index ) \{\
		  if ( $( this ).prop('checked') ) \{\
		  	sex +=  $( this ).val().toString() ;\
		  \}\
		\});\
		setCookie("sexe-select", sex , 200);\
		search_get();\
	\})\
\
	$("#age_from").change(function()\{\
		setCookie('age_from', $(this).val() , 200); \
		search_get();\
	\})\
	$("#age_to").change(function()\{\
		setCookie('age_to', $(this).val() , 200); \
		search_get();\
	\})\
\
	$("#search-txt").change(function()\{\
		search_get();\
	\})\
\}\
\
\
 \
function main_init()\{\
	// console.log("myself_id " + myself_id ) ;\
	// console.log("session_id " + session_id ) ;\
	if (myself_id=='') \{\
		// login_get();\
		// do_login("Entrez votre identifiant et mot de passe");\
		// Redirect vers la landing\
		window.location.href = "index.php";\
	\}	else \{\
		if (request_id || request_pseudo) \{\
			init_show_myself = 0;//N\'e9cessaire pour \'e9viter que le "myself" profil \'e9crase celui du membre\
		\}\
		// je suis connect\'e9 \
		myself_get(myself_id);\
\
		if (request_id) \{\
			user_get(request_id);\
		\} else if( request_pseudo) \{\
			user_get_by_pseudo(request_pseudo);\
		\} else \{\
			go_home();\
		\}\
		\
		if( request_page && request_page == "changepass" ) \{\
			$('#parametresModal').modal('show');\
		\}\
		\
		if( request_page && request_page == "mailing" ) \{\
			$('#mailingModal').modal('show');\
		\}\
	\}\
	search_get();  // todo \
	// todo : oblig\'e9 de lancer en fin car besoin sexe recherch\'e9\
	\
	if (destination_action=="desabo_complet") \{\
		$("#modal-gestion-abo-confirm").modal("show");\
	\}\
	if (destination_action=="abo_confirm") \{\
		modale_generique_message("Abonnement confirm\'e9","Votre abonnement est actif");\
	\}\
\
	\
	// var interval_myself_notification_remove = setInterval(myself_notification_remove, 1000);  \
\
	analyse_URL();\
\}\
\
\
\
// envoi panneau gestion du compte : descr, age, ville #26\
function infos_modale_submit()\{\
	var error = 0;\
	var description = $("#myself-edit-description").val();\
	var day = $("#myself-edit-day").val();\
	var month = $("#myself-edit-month").val();\
	var year = $("#myself-edit-year").val();\
	var id_ville = $("#myself-edit-id_ville").val();\
	var countryObj = $("#myself-edit-id_countryObj").val();\
	var region = $("#myself-edit-region").val();\
	var sex = 0;\
	var cherche1 = "";\
	\
	var uri_age_sexe_ville="index_api/user/modify/age_sexe_ville";\
	\
	if($("#confirmationModal").length && $("#confirmationModal").is(":visible") )\{\
		uri_age_sexe_ville="index_api/confirmation_eclair";\
\
		day = $("#myself-confirm-day").val();\
		month = $("#myself-confirm-month").val();\
		year = $("#myself-confirm-year").val();\
		\
		id_ville = $("#myself-confirm-id_ville").val();\
		countryObj = $("#myself-confirm-id_countryObj").val();\
		region = $("#myself-confirm-region").val();\
		\
		sex = $('input[name="myself-confirm-sexe"]:checked').val();\
		\
		if($('#myself-confirm-sexeSearch1').is(":checked")) cherche1 +="1";\
		if($('#myself-confirm-sexeSearch2').is(":checked")) cherche1 +="2";\
		if($('#myself-confirm-sexeSearch3').is(":checked")) cherche1 +="3";\
		\
		if(!sex)\{\
			alert( "Merci de renseigner votre sexe");\
			return ;\
		\}\
		if(!id_ville)\{\
			alert( "Merci de renseigner votre ville");\
			return ;\
		\}\
		\
	\}\
	else\{\
	var taille = $("#myself-edit-taille").val();\
	var poids = $("#myself-edit-poids").val();\
\
	// description\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user/modify/description",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		description : description\
\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        if(result.error =="") \{\
	        	// ok\
	        \} \
	    \} \
	\});\
	\}\
\
	// asv TODO : controle date #25\
	var fd = \{\
			"api_key": API_KEY, \
			"session_id": session_id,\
			"year":year,\
			"month":month,\
			"day":day,\
			\};\
	 \
\
	if (id_ville!="" && countryObj!="" ) \{\
		fd['id_ville'] = id_ville ;\
		fd['countryObj'] =  countryObj;\
		fd['region'] = region ;\
	\}\
	if(sex != 0)\{\
		fd['action'] = 1;\
		fd['sex'] =  sex;\
		fd['cherche1'] =  cherche1;\
	\}\
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + uri_age_sexe_ville,\
	    data: fd,\
	    dataType: "json",\
	    success: function (result, status) \{\
	    	// console.log("index_api/user/modify/age_sexe_ville");\
	        // console.log(result);\
	        if(result.accepted === true || result.accepted === 1) \{\
	        	myself_get(myself_id);\
	        \} \
	    \} \
	\});\
\
	if(poids && taille)\{\
		var fd2 = \{\
			"api_key": API_KEY, \
			"session_id": session_id,\
		\};\
		if(taille) fd2["taille"]=taille;\
		if(poids) fd2["poids"]=poids;\
		\
		$.ajax(\{\
			type: "GET",\
		    url: API_ENDPOINT + "index_api/user/modify/informations",\
		    data: fd2,\
		    dataType: "json",\
		    success: function (result, status) \{\
		        if(result.accepted === true) \{\
		        	//success\
		        \} \
		    \}\
		\});\
	\}\
\
	$('#infosModal').modal('hide');\
	if(sex != 0)\{\
		$('#confirmationModal').modal('hide');\
	\}\
\}\
\
\
\
function private_modale_account_delete_submit()\{\
	// console.log("private_modale_account_delete_submit")\
	var error = 0;\
	var password = $("#myself-account-delete-pass").val();	\
	if(password =="" )\{\
		alert( "Merci de renseigner votre mot de passe");\
		error++;\
	\}\
	\
	if (error>0) \{\
		return ;\
	\}\
\
	var fd = \{\
			"api_key": API_KEY, \
			"session_id": session_id,\
			"ActionDelete":1,\
			"pass":password,\
			\};\
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/delete",\
	    data: fd,\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if (result.success==1 ) \{\
	        	$("#myself-account-delete-pass").val('');	\
	        	modale_generique_message('Compte supprim\'e9',"Votre compte a \'e9t\'e9 supprim\'e9.","/logout.php") // 	\
	        \} else \{\
	        	modale_generique_message('Erreur',result.error)	\
	        \}\
	    \}\
	\});\
\}\
\
\
\
function mailing_modale_submit()\{\
	var error = 0;\
	var password = $("#mailing-password").val();	\
	var pseudo = $("#mailing-pseudo").val();	\
\
	var newsletter = '';\
\
\
	var mails_alertes = $("#ok-alert:checked").val();\
	var mails_commerciaux = $("#ok-partners:checked").val();\
	 \
	if(mails_alertes==undefined)\
		mails_alertes ='';\
	else\
		mails_alertes =1;\
	if(mails_commerciaux==undefined)\
		mails_commerciaux ='';\
	else\
		mails_commerciaux = 1;\
\
	if(password =="" )\{\
		alert( "Merci de renseigner votre mot de passe");\
		error++;\
	\}\
	if(pseudo =="" )\{\
		alert( "Merci de renseigner votre pseudo");\
		error++;\
	\}\
	\
	if (error>0) \{\
		return ;\
	\}\
	var fd = \{\
			"api_key": API_KEY, \
			"session_id": session_id,\
			"pseudo":pseudo,\
			"pass":password,\
			"mails_alertes":mails_alertes,\
			"mails_commerciaux":mails_commerciaux,\
			"confirmer":1\
			\};\
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/mailing",\
	    data: fd,\
	    dataType: "json",\
	    success: function (result, status) \{\
	        $('#mailingModal').modal('hide');\
	        $("#mailing-password").val('');	\
			$("#mailing-pseudo").val('');	\
\
	        if (result.error!="" ) \{\
	        	modale_generique_message('Erreur',result.error) // 	\
	        \} else \{\
	        	\
	        \}\
	    \}\
	\});\
\}\
\
\
function parametres_form_submit()\{\
	// modif pass \
	var error = 0;\
	\
	var day = $("#myself-edit-day").val();\
	var month = $("#myself-edit-month").val();\
	var year = $("#myself-edit-year").val();\
\
	var password1 = $("#password1").val();\
	var password2 = $("#password2").val();\
	if(password1 =="" )\{\
		alert( "Merci de renseigner votre nouveau mot de passe ");\
		error++;\
	\}\
	if(password2 =="" )\{\
		alert( "Merci de renseigner votre nouveau mot de passe dans la seconde case ");\
		error++;\
	\}\
	if(password1 !=password2 )\{\
		alert( "Les  mots de passe ne correspondent pas");\
		error++;\
	\}\
	if (error>0) \{\
		return ;\
	\}\
	var fd = \{\
			"api_key": API_KEY, \
			"session_id": session_id,\
			"year":year,\
			"month":month,\
			"day":day,\
			"pass1":password1,\
			"pass2":password2\
			\};\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user/modify/age_sexe_ville",  // TODO : j'ai pas le token ! \
	    data: fd,\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if(result.accepted ==false) \{\
	        	alert(result.error) ; \
	        \} else \{\
				$("#password1").val('');\
				$("#password2").val('');\
\
				$('#parametresModal').modal('hide');\
	        \}\
	    \} \
	\});\
\}\
\
\
\
function email_form_submit()\{\
	var error = 0;\
	var email1 = $("#email1").val();\
	var email2 = $("#email2").val();\
	if(email1 =="" )\{\
		alert( "Merci de renseigner votre email");\
		error++;\
	\}\
	if(email2 =="" )\{\
		if(error==0) \{\
			alert( "Merci de renseigner votre email dans la seconde case ");\
		\}\
		error++;\
	\}\
	if(email1 !=email2 )\{\
		if(error==0) \{\
			alert( "Les emails ne correspondent pas");\
		\}\
		error++;\
	\}\
\
	if (error>0) \{\
		return ;\
	\}\
	var fd = \{\
			"api_key": API_KEY, \
			"session_id": session_id,\
			"nom_complet":myself_pseudo,\
			"email":email1,\
			\};\
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user/modify/informations",  // TODO : j'ai pas le token ! \
	    data: fd,\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if(result.accepted ==false) \{\
				alert(result.error.replace('<br/>', '')) ;\
	        \} else \{\
				$('#emailModal').modal('hide');\
				$("#email1").val('');\
				$("#email2").val('');\
				if(result.alert_info)\{\
					modale_emailVerif(result.alert_info);\
				\}\
	        \}\
	    \} \
	\});\
\}\
\
\
function contact_form_submit()\{\
	var error = 0;\
	var email = $("#contact-form-email").val();\
	var theme = $("#contact-form-theme").val();\
	var text = $("#contact-form-text").val();\
	var code = $("#contact-form-code").val();\
\
	if(email =="" )\{\
		alert( "Merci de renseigner votre email");\
		error++;\
	\}\
	if(text =="" )\{\
		alert( "Merci de renseigner votre message");\
		error++;\
	\}\
	if(code =="" )\{\
		alert( "Merci de renseigner le code de v\'e9rification");\
		error++;\
	\}\
\
	if (error>0) \{\
		return ;\
	\}\
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/contact",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		email_from: email,\
	    		message: text,\
	    		code: code,\
	    		theme: theme,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if(result.error ==1) \{\
	        	alert("Une erreur s'est produite, v\'e9rifiez peut-\'eatre le code de v\'e9rification")\
	        \} else \{\
	        	alert("Votre message a bien \'e9t\'e9 envoy\'e9")\
	        	$('#contactModal').modal('hide');\
				var email = $("#contact-form-email").val('');\
				var theme = $("#contact-form-theme").val('');\
				var text = $("#contact-form-text").val('');\
				var code = $("#contact-form-code").val('');\
	        \}\
	    \} \
	\});\
\}\
\
\
function reportuser_open_modal()\{\
\
	// r\'e9cuperer les raisons\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/array/get/raisons_signal",  \
	    data: \{ \
	    		api_key: API_KEY, \
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        $('#reportuser-raison').html('');\
	        $.each( result.result.raisons_signal, function( key, value ) \{\
	     		$('#reportuser-raison').append($('<option>', \{\
				    value: key,\
				    text: value\
				\}));\
	     	\});\
	    \} \
	\});\
\
\
	$("#reportuser-pseudo").html(request_pseudo);\
	$("#reportuser-id").val(request_id);\
	$("#reportuser-captcha-img").attr("src" ,API_ENDPOINT + 'index_api/captcha?api_key='+ API_KEY + '&session_id=' +session_id );\
	var myModal = new bootstrap.Modal(document.getElementById('reportuserModal'), \{\});\
	myModal.show();\
\
\
\}\
function reportuser_form_submit()\{\
	var error = 0;\
	var raison = $("#reportuser-raison option:selected").text();  \
	var detail = $("#reportuser-detail").val();\
	var id = $("#reportuser-id").val();\
	var code = $("#reportuser-code").val();\
\
	if(raison =="" )\{\
		alert( "Merci de renseigner la raison du signalement");\
		error++;\
	\}\
	if(code =="" )\{\
		alert( "Merci de renseigner le code de v\'e9rification ");\
		error++;\
	\}\
	 \
	if (error>0) \{\
		return ;\
	\}\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user/is_suspect",   \
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id, \
	    		id: id,\
	    		code: code,\
	    		raison: raison,\
	    		details: detail,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if(result.error !=0) \{\
	        	alert("Une erreur s'est produite, peut-\'eatre le code de v\'e9rification ?") ; // TODO\
	        \}  else \{\
				$('#reportuserModal').modal('hide');\
				modale_generique_message("Signalement effectu\'e9","Merci pour votre signalement");\
\
				$("#reportuser-raison option:selected").text('');  \
				$("#reportuser-detail").val('');\
				$("#reportuser-code").val('');\
\
	        \}\
	    \} \
	\});\
\}\
\
\
\
function home_display()\{\
	$("#home").removeClass("d-none");\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/search",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		sex: myself_search,\
	    		is_photo: 1, \
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        home_display_profils(result);\
	    \},\
	\});\
\}\
\
function home_display_profils(result) \{\
	var n = 0 ;\
	var h ='';\
	$.each( shuffle(result.result), function( key, value ) \{\
	        	n++;\
	        	if(n<4) \{\
	        		// console.log(value)\
	        		//   BLUR #45\
	        		vis ='';\
	        		if(value.photo_x)\{\
	        			vis = value.photo_x\
	        		\}\
		        	h+='<div class="col"><a href="/membres_'+value.pseudo+'_'+value.id+'.html"><span class="rounded-circle-blur"><img class="img-fluid rounded-circle '+vis +'" src="'+value.photos[0].url_middle+'" alt=""></span></a></div>';\
	        	\} else \{\
	        		return false;\
	        	\}\
	     	\});\
	$("#home-profils").html(h);\
	goto_binding();\
\}\
\
\
function payment_display() \{\
	// console.log("payment_display");\
\
	$("#home").addClass("d-none");\
	$("#center .tab-pane").removeClass("active");\
	$("#center .tab-pane").removeClass("show");\
\
	$("#chat").removeClass("active");\
	$("#chat").removeClass("show");\
	$("#chat").addClass("d-none");\
\
	$("#notifications").removeClass("active");\
	$("#notifications").removeClass("show");\
	$("#notifications").addClass("d-none");\
\
	$("#messages").removeClass("active");\
	$("#messages").removeClass("show");\
	$("#messages").addClass("d-none");\
\
	$("#payment").addClass("active");\
	$("#payment").addClass("show");\
	$("#payment").removeClass("d-none");\
\}\
\
\
function messages_display() \{\
	// console.log("messages_display");\
\
	$("#home").addClass("d-none");\
	$("#center .tab-pane").removeClass("active");\
	$("#center .tab-pane").removeClass("show");\
\
	$("#chat").removeClass("active");\
	$("#chat").removeClass("show");\
	$("#chat").addClass("d-none");\
\
	$("#notifications").removeClass("active");\
	$("#notifications").removeClass("show");\
	$("#notifications").addClass("d-none");\
\
	$("#payment").removeClass("active");\
	$("#payment").removeClass("show");\
	$("#payment").addClass("d-none");\
\
\
\
	$("#messages").addClass("active");\
	$("#messages").addClass("show");\
	$("#messages").removeClass("d-none");\
\
\
	$('.messages-bell').css('animation-name', 'none');\
	$('.messages-bell').hide();\
\}\
function messages_display_off() \{\
	$("#messages").removeClass("active");\
	$("#messages").removeClass("show");\
	$("#messages").addClass("d-none");\
\}\
function messages_display_on() \{\
	$("#messages").addClass("active");\
	$("#messages").addClass("show");\
	$("#messages").removeClass("d-none");\
\}\
\
function notifications_display() \{\
	// console.log("notifications_display");\
\
	$("#home").addClass("d-none");\
	$("#center .tab-pane").removeClass("active");\
	$("#center .tab-pane").removeClass("show");\
\
	$("#chat").removeClass("active");\
	$("#chat").removeClass("show");\
	$("#chat").addClass("d-none");\
\
	$("#messages").removeClass("active");\
	$("#messages").removeClass("show");\
	$("#messages").addClass("d-none");\
\
	$("#payment").removeClass("active");\
	$("#payment").removeClass("show");\
	$("#payment").addClass("d-none");\
	\
	$("#notifications").addClass("active");\
	$("#notifications").addClass("show");\
	$("#notifications").removeClass("d-none");\
\
\
	$(".notifications-bell").html('');\
	$('.notifications-badge').css('animation-name', 'none');\
	$('.notifications-badge').hide();\
\}\
\
\
/* CHAT */\
\
\
\
function chat_display()\{\
	// console.log("chat_display")\
	$("#home").addClass("d-none");\
	$("#messages").addClass("d-none");\
	$("#center .tab-pane").removeClass("active");\
	$("#center .tab-pane").removeClass("show");\
\
\
	$("#notifications").removeClass("active");\
	$("#notifications").removeClass("show");\
	$("#notifications").addClass("d-none");\
\
	$("#payment").removeClass("active");\
	$("#payment").removeClass("show");\
	$("#payment").addClass("d-none");\
\
	$("#messages").removeClass("active");\
	$("#messages").removeClass("show");\
	$("#messages").addClass("d-none");\
\
\
	$("#chat").addClass("active");\
	$("#chat").addClass("show");\
	$("#chat").removeClass("d-none");\
	// $("#chat-messages-div").html('')\
\}\
\
\
function chat_display_message(data)\{\
	$("#fleche-bas-chat").addClass("d-none");\
	$(".chat-footer").removeClass("disable");\
	$("#alert-abo-ko").addClass("d-none");\
\
	if(! data.eclairs[0]) \{\
\
		h = '<div class="row h-100 align-items-center">';\
		h +='<div class="col-lg-8 mx-auto">'\
		h +='<div class="row">'\
		h +='<div class="col-12 text-center">'\
		h +='<div class="card p-2 p-sm-4 bg-transparent border-0">'\
		h +='<div class="card-body">'\
		h +='<i class="fas fa-comment-dots display-1 text-primary"></i><br>'\
		h +='<h4>Discutez avec <b class="text-primary"><a href="/membres_'+request_pseudo+'_'+request_id+'.html">'+request_pseudo+'</a></b></h4>'\
		h +='<p>Vous n\\'avez encore jamais parl\'e9 avec <b class="text-primary"><a href="/membres_'+request_pseudo+'_'+request_id+'.html">'+request_pseudo+'</a></b>.<br>'\
		h +='Dites-lui quelque chose qui va lui donner envie de r\'e9pondre ou simplement coucou !'\
		h +='</p>'\
		h +='</div>'\
		h +='</div>'\
		h +='</div>'\
		h +='</div>'\
		h +='</div>'\
		h +='</div>'\
\
		$("#chat-messages-div").html(h)\
		$("#fleche-bas-chat").removeClass("d-none");\
		goto_binding();\
		return;\
	\}\
\
\
	var h =''\
	$.each( data.eclairs, function( key, value ) \{\
		value.msg = smiley(value.msg);\
		// if (value.msg.length>200) \{\
			// TODO si message trop long \
		// 	value.msg ='raccourci';\
		// \}\
\
		var stateLabel = value.state;		\
		if(value.state == 'sent')\{\
			stateLabel = "Envoy\'e9";\
		\} else \{\
			stateLabel = "Lu";\
		\}\
\
		if(! value.notification) \{\
			var html_btn_album = '';\
			var class_message_text = "";\
			var class_message_p = "";\
			var html_album = "";\
\
			var url_picture_private_me = "";\
			var url_picture_private_dest = "";\
			if( typeof (myself_data) != 'undefined' && typeof (myself_data.private_album) != 'undefined' && typeof (myself_data.private_album[1001]) != 'undefined' && typeof (myself_data.private_album[1001].sq_middle) != 'undefined' ) \{\
				url_picture_private_me = myself_data.private_album[1001].sq_middle;\
			\}\
			if( typeof (data.photos_v2) != 'undefined' && typeof (data.photos_v2.private) != 'undefined' && typeof (data.photos_v2.private[1001]) != 'undefined' && typeof (data.photos_v2.private[1001].sq_middle) != 'undefined' ) \{\
				url_picture_private_dest = data.photos_v2.private[1001].sq_middle;\
			\}\
			if(value.album_share) \{\
				class_message_text = "text-center p-4 col-7";\
				class_message_p = "mt-3";\
				switch (value.album_share) \{\
					case 'ask_sent':\
						html_album = '<div class="col private rounded"> <img class="img-fluid blur" src="'+url_picture_private_dest+'" alt=""></div>';\
						value.msg = (value.msg !='') ? value.msg : 'Bonjour '+ request_pseudo+', s\\'il te plait donne moi acc\'e8s \'e0 ton album priv\'e9';\
						break;\
					case 'ask_opened':\
						html_btn_album = '<a href="#" class="btn btn-secondary rounded-pill px-3 text-uppercase fw-bold " Onclick="request_access_deny();">Refuser</a>&nbsp;&nbsp;'\
							+ '<a href="#" class="btn btn-primary rounded-pill px-3 text-uppercase fw-bold" Onclick="request_access_accept();">Accepter</a>';\
						class_message_p = "mt-3 pb-3";\
						html_album = '<div class="col private rounded"><img class="img-fluid blur" src="'+url_picture_private_me+'" alt=""></div>';\
						value.msg = (value.msg !='') ? value.msg : request_pseudo+' demande acc\'e8s \'e0 votre album priv\'e9';\
						break;\
					case 'ask_closed':\
						html_album = '<div class="col private rounded"><img class="img-fluid blur" src="'+url_picture_private_me+'" alt=""></div>';\
						value.msg = (value.msg !='') ? value.msg : request_pseudo+', a demand\'e9 l\\'acc\'e8s \'e0 votre album priv\'e9';\
						break;\
					case 'ask_accepted':\
						class_message_p = "mt-3 pb-3";\
						html_album = '<img class="img-fluid" style="cursor:pointer;" src="'+url_picture_private_dest+'" Onclick="open_private_album(\\''+url_picture_private_dest+'\\');">';\
						value.msg = (value.msg !='') ? value.msg : request_pseudo + ' vous a donn\'e9 acc\'e8s \'e0 son album priv\'e9';\
						html_btn_album = '<a href="#" class="btn btn-success rounded-pill px-3 text-uppercase fw-bold " Onclick="open_private_album(\\''+url_picture_private_dest+'\\');">Voir son album</a>';\
						break;\
					case 'accept_sent':\
						html_album = '<img class="img-fluid" src="'+data.first_private_pic+'">';\
						value.msg = (value.msg !='') ? value.msg : 'Vous avez donn\'e9 l\\'acc\'e8s \'e0 votre album priv\'e9';\
						break;\
					case 'ask_refused':\
						html_album = '<div class="col private rounded"><img class="img-fluid blur" src="'+url_picture_private_dest+'" alt=""></div>';\
						value.msg = (value.msg !='') ? value.msg : ''+ request_pseudo+' vous a refus\'e9 l\\'acc\'e8s \'e0 son album priv\'e9';\
						break;\
					case 'refus_sent':\
						html_album = '<div class="col private rounded"><img class="img-fluid blur" src="'+url_picture_private_me+'" alt=""></div>';\
						value.msg = (value.msg !='') ? value.msg : 'Vous avez refus\'e9 l\\'acc\'e8s \'e0 votre album priv\'e9';\
						break;\
\
				\}\
			\}\
\
			if(value.from_me == 0) \{\
				if (request_pseudo_is_online==1) \{\
					classe='avatar-online';\
				\} else \{\
					classe='';\
				\}\
\
				h += '<div class="message">'\
				h += '  <a href="/membres_'+value.exp+'_'+request_id+'.html" class="avatar '+classe+' avatar-responsive">'\
\
				if(data.photos_v2.public) \{\
					h += '    <span class="rounded-circle-blur"><img class="avatar-img '+data.photos_v2.public[1].visibility+'" src="'+data.photos_v2.public[1].sq_middle+'" alt=""></span>'\
				\} else \{\
					h += '    <span class="rounded-circle-blur"><img class="avatar-img" src="'+data.photos_v2.avatar+'" alt=""></span>'\
				\}\
				h += '  </a>'\
				h += '  <div class="message-inner">'\
				h += '    <div class="message-body">'\
				h += '      <div class="message-content">'\
				h += '        <div class="message-text '+class_message_text+'">'\
				h += '          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20" width="24" height="20" fill="currentColor" align="left" role="presentation" class="bubble-left"><path d="M11.92 16.062A19.91 19.91 0 0 1 0 20V0h20c0 7.668-.155 16.282 4 20-5.176-.054-9.12-1.727-12.08-3.938z"></path></svg>'\
				h += html_album;\
				if(value.msg == "" && value.p_extra != "")\{\
					h += ' <a OnClick="modal_change_chat_pic(\\''+ value.p_extra +'\\', 1 ,\\'visible\\')" class="media d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#photoModalChat" style="cursor:pointer;">';\
					h += '          <img src='+ value.p_extra +' alt="">'\
					h += '          </a>'\
\
				\}else\{\
					h += '          <p  class="message-p '+class_message_p+'">'+value.msg+'</p>'\
				\}\
				h += html_btn_album;\
				h += '        </div>'\
				h += '      </div>'\
				h += '    </div>'\
				h += '    <div class="message-footer">'\
				h += '      <span class="extra-small text-muted">'+date_shorter(value.date)+'</span>'\
				h += '    </div>'\
				h += '  </div>'\
				h += '</div>'\
			\} else \{\
				h += '<div class="message message-out">'\
				h += '	<span class="avatar avatar-responsive"><img class="avatar-img" src="'+myself_avatar+'" alt=""></span>'\
				h += '	<div class="message-inner">'\
				h += '		<div class="message-body">'\
				h += '			<div class="message-content">'\
				h += '				<div class="message-text '+class_message_text+'">'\
				h += '					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20" width="24" height="20" fill="currentColor" align="right" role="presentation" class="bubble-right"><path d="M11.92 16.062A19.91 19.91 0 0 1 0 20V0h20c0 7.668-.155 16.282 4 20-5.176-.054-9.12-1.727-12.08-3.938z"></path></svg>'\
				h += html_album;\
				if(value.msg == "" && value.p_extra != "")\{\
					h += ' <a OnClick="modal_change_chat_pic(\\''+ value.p_extra +'\\', 1 ,\\'visible\\')" class="media d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#photoModalChat" style="cursor:pointer;">';\
					h += '          <img src='+ value.p_extra +' alt="">'\
					h += '          </a>'\
				\}else\{\
					h += '					<p class="message-p '+class_message_p+'">'+value.msg+'</p>'\
				\}\
				h += '				</div>'\
				h += '			</div>'\
				h += '		</div>'\
				h += '		<div class="message-footer">'\
				h += '			<span class="extra-small text-muted">'+date_shorter(value.date)+' ('+stateLabel+')</span>'\
				h += '		</div>'\
				h += '	</div>'\
				h += '</div>'\
			\}\
		\}  else if (value.notification=='alert1') \{\
			promotion_abo(value);\
		\}\
\
	\});\
\
// $("#chat-messages-div").data('');\
	$("#chat-messages-div").html(h).ready(function() \{\
		$(".chat-body").animate(\{\
			scrollTop:10000\
		\},100);\
		goto_binding();\
	\});\
\
\}\
/* /CHAT */\
\
\
function default_error (title,body='')\{\
	modale_generique_message(title,body)\
\}\
\
function go_home()\{\
	$("#li-tgl").attr("data-bs-original-title","Modifier mon profil");\
	$("#edit-profile").removeClass("active show");\
	$("#user , #edit-profile").addClass("active show");\
	$("#user .infos-user").hide();\
	$("#edit-profile .infos-user").hide();\
	$("#chat").removeClass("active show");\
	$("#chat").addClass("d-none");\
	$("#messages").removeClass("active show");\
	$("#messages").addClass("d-none");\
	home_display();	\
\}\
\
\
/* API */\
\
\
function login_ajax(login,pass) \{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/login",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		login: login,\
	    		pass: pass \
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        if (result.error ==1) \{\
	        	do_login(result.error_label,true);\
	        \} else\{\
	        	session_id = result.session_id;\
	        	myself_id = result.user_id;\
	        	setCookie("session_id", session_id , 1);\
	        	setCookie("myself_id", myself_id , 200);\
	        	setCookie("rememberme", result.setcookie_rememberme.value , 20000);\
	        	myself_get(result.user_id);\
	        	if(request_id>0) \{\
	        		user_get(request_id);\
	        	\} else \{\
	        		home_display()\
	        	\}\
\
	        \}\
	    \},\
	    error: function (xhr, status, error) \{\
	    \}\
	\});\
\}\
\
// my profil\
function myself_get(id)\{\
	// profil\
	// console.log("myself_get , id " +id)\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		id: id ,\
	    		get_abo_infos :1\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	    		// console.log("myself_get");\
	    		// console.log(result);\
\
	    		if (typeof result.connected != 'undefined' && result.connected == 0) \{\
	    			var s = getCookie("rememberme");\
	    			if (s) \{\
	    				login_get_from_cookie(s)\
	    				return;\
	    			\}  else \{\
						// do_login();\
						// Redirect vers la landing\
						window.location.href = "logout.php";\
						return;\
	    			\}\
				\}\
\
				if( typeof result.result.email != 'undefined' && result.result.email != "" ) \{\
					$('#email_actuel>span').html(result.result.email).ready(function () \{\
						$('#email_actuel').show();\
					\});\
				\}\
\
				myself_display(result);\
	    \},\
	    error: function (xhr, status, error) \{\
	    \}\
	\});\
	// favoris \
	myself_favoris_get();\
\
	 \
	// messages pr\'e9c\'e9dents\
	myself_messages_past_get() ;\
	myself_notifications_past_get () ;\
\
\}\
\
function myself_messages_past_get() \{\
	// console.log("myself_messages_past_get")\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/load_contacts",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		filter : 1\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	    	myself_messages_past = result;\
	        myself_messages_past_display(result);\
	    \},\
	    error: function (xhr, status, error) \{\
	    \}\
	\});\
\}\
\
function myself_favoris_get () \{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/load_contacts",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		filter : 3\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        myself_fav_display(result);\
	    \},\
	    error: function (xhr, status, error) \{\
	    \}\
	\});\
\}\
/* Notifications */ \
\
function myself_notifications_past_get () \{\
	// notifications pr\'e9c\'e9dentes\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/wall",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	      myself_notifications_past_display(result);\
	    \}\
	\});\
\}\
\
\
 \
\
\
\
\
// one user\
function user_get(id)\{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		id: id \
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        user_display(result);\
	        chat_display();\
	        chat_load();\
	        // #50 clearInterval(interval_chat_load);\
	        // #50 interval_chat_load = setInterval(chat_load, 10000);  \
	    \},\
	    error: function (xhr, status, error) \{\
	    \}\
	\});\
\}\
function user_get_by_pseudo(pseudo)\{\
	// console.log("user_get_by_pseudo "  + pseudo);\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/user",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		pseudo: pseudo \
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        user_display(result);\
	        chat_display();\
	    \},\
	    error: function (xhr, status, error) \{\
	    \}\
	\});\
\}\
\
\
\
function search_get(id_ville=0,region=0,countryObj=0,page=0)\{\
	var is_online =$("#is_online").val();\
	var nick = $("#search-txt").val();\
	var age_from = $("#age_from").val();\
	var age_to 	 = $("#age_to").val();\
	var sex =''; \
	$(".sexe-select").each(function( index ) \{\
	  if ( $( this ).prop('checked') ) \{\
	  	sex +=  $( this ).val().toString() ;\
	  \}\
	\});\
\
	\
	// console.log ("search_get " + sex )\
\
	if (page ==0) \{\
		search_page = 0; // r\'e9initialiser le lazy\
	\}\
	if (id_ville==0 && region==0 && countryObj==0) \{\
		var s = getCookie("geoloc");\
		if (s!='') \{\
			var t =  s.split("-") ;\
			id_ville 	= t[0];\
			region 		= t[1];\
			countryObj 		= t[2];\
		\}\
	\}\
\
	if (nick=="") \{ \
		var params = \{\
			api_key: API_KEY, \
    		session_id: session_id,\
    		sex: sex,\
    		age_from: age_from,\
    		age_to: age_to,\
    		is_online:is_online,\
    		nick: nick,\
    		id_ville: id_ville,\
    		region: region,\
    		countryObj: countryObj,\
    		dist :200,\
    		pas : 30,\
    		page :search_page\
	    \}\
	\} else \{\
		var params = \{\
			api_key: API_KEY, \
    		session_id: session_id,\
    		nick: nick,\
	    \}\
	\}\
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/search",\
	    data:   \
	    		params\
	    	 ,\
	    dataType: "json",\
	    success: function (result, status) \{\
	        search_display(result);\
	    \},\
	\});\
\}\
\
\
\
\
function api_redirect_payment ()\{\
	api_payment_iframe();\
\
	/*\
		$.ajax(\{\
		    url: API_ENDPOINT + "index_api/abo_pay2secure",\
		    type: 'get',\
		    dataType: "json",\
		    data: \{\
				 api_key : API_KEY,\
				 session_id: session_id\
		\},\
	    success: function( data ) \{\
	     	 // console.log(data)\
	     	 if (data.result.URL != null) \{\
	     	 	window.location.href= data.result.URL; \
	     	 \}\
	    \}\
	   \});\
	 */\
\}\
function api_payment_iframe ()\{\
		// console.log( "api_redirect_payment")\
		$.ajax(\{\
		    url: API_ENDPOINT + "index_api/abo_pay2secure",\
		    type: 'get',\
		    dataType: "json",\
		    data: \{\
				 api_key : API_KEY,\
				 session_id: session_id,\
				 version : 3\
		\},\
	    success: function( data ) \{\
	     	 // console.log(data) #136 \
	     	 if (data.result.URL != null) \{\
	     	 	// console.log(data.result.URL)\
	     	 	var h = '<iframe class="payment_iframe" src="'+data.result.URL+'" allow="payment">';\
	     	 	$("#payment-full").html(h);\
	     	 	payment_display();\
\
	     	 \}\
	    \}\
	   \});\
\}\
\
function chat_send(e)\{\
	e.preventDefault();\
	// console.log("chat_send")\
	var message = $("#chat-input").val();\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/send_message",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		dest: request_pseudo,\
	    		msg: message, \
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        $("#chat-input").val('');\
	        chat_load();\
	    \},\
	\});\
\}\
\
\
function chat_load()\{\
	if(request_id<1)\
		return;\
	// console.log("chat_load")\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/load_messages",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		contact: request_pseudo,\
	    		contact_id: request_id, \
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        chat_display_message(result)\
	    \},\
	\});\
\}\
\
function modal_request_access_modal_submit() \{\
	// console.log("modal_request_access_modal_submit"); \
\
	// var message = 'Bonjour '+ request_pseudo+', s\\'il te plait donne moi acc\'e8s \'e0 ton album priv\'e9';\
\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/send_message",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		dest: request_pseudo,\
	    		id_extra : 'a0'\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        // $("#chat-input").val('');\
	        chat_load();\
	    \},\
	\});\
\}\
\
function request_access_accept()\{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/send_message",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		dest: request_pseudo,\
	    		id_extra : 'a1'\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        // $("#chat-input").val('');\
	        chat_load();\
	    \},\
	\});\
\
\}\
function request_access_deny()\{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/send_message",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		dest: request_pseudo,\
	    		id_extra : 'a-1'\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	        // console.log(result);\
	        // $("#chat-input").val('');\
	        chat_load();\
	    \},\
	\});\
\}\
function open_private_album(url) \{\
	modal_change_pic(url, 0,'visible');\
	$('#photoModal').modal('show');\
\}\
\
\
function blacklist_get ()\{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/load_contacts",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		filter : "2"\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	     blacklist_display(result);\
	    \} \
	\});\
\}\
function blacklist_delete (id)\{\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "ajax_api/setIgnore",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		action : "del",\
	    		target_id : id\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	     blacklist_get(result);\
	    \} \
	\});\
\}\
\
\
\
\
function myself_matchs_get ()\{\
	// console.log("myself_can_match "  + myself_can_match);\
	if (myself_can_match === false) \{\
		myself_matchs_can_not_match_display();\
		return;\
	\}\
	// les matches effectifs  \
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/match",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		action : "get_matches"\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	     myself_matchs_past_display(result);\
	    \} \
	\});\
\
	// les matches potentiels  #4 TODO\
	$.ajax(\{\
	    type: "GET",\
	    url: API_ENDPOINT + "index_api/match",\
	    data: \{ \
	    		api_key: API_KEY, \
	    		session_id: session_id,\
	    		action : "get_profile"\
	    	\},\
	    dataType: "json",\
	    success: function (result, status) \{\
	     	// console.log("index_api/match get_profile")\
	     	// console.log(result);\
	     	myself_matchs_future_display(result)\
	    \} \
	\});\
\}\
\
\
\
\
\
\
/* FIN API */\
\
/* WEBSOCKET */\
\
\
\
\
\
\
class WS  \{\
     \
    new_socket () \{\
        socket = new WebSocket(ws_url);\
        // console.log(" socket created" )\
        return this;\
	\}        \
\
    start () \{ \
                     \
        socket.onmessage = function(event) \{\
// console.log(" socket.onmessage  ", event);\
            if(event.data) \{\
                // console.log("s_pending receive " + event.data);\
                if (event.data=='ok') \
                	return; \
                var data = JSON.parse( event.data );\
                if (data.action=="cmd_new" && data.infos_exp.user_id == request_id) \{\
                	// console.log("user get et chat load d\'e9clench\'e9 depuis WS")\
                	user_get(request_id); \
                \}\
\
                myself_notification_display(data);\
\
				// if( $("#chat").hasClass("active") && )\
\
            \}\
        \}\
\
        socket.onopen = function() \{\
// console.log(" socket.onopen  ");\
			var msg = 'auth:'+session_id ;\
            this.send(msg);\
            \}\
\
        socket.onerror = function(event) \{\
            console.error("Erreur WebSocket observ\'e9e :", event);\
        \};\
\
		socket.onclose = function (event) \{\
// console.log(" socket.onclose  ", event);\
\
			le_ws.new_socket();\
			le_ws.start();\
		\}\
        return this;\
	\}\
 \}\
\
\
\
/* TOOLS */\
\
function smiley(s) \{\
	var n=1;\
	var replace;\
	TAB_SMILE.forEach(function(item)\{\
		replace = "<img src='https://dev2018.de5a7.com/webapp/i/smile"+n+".png' class='smiley'>";\
  		s = s.replaceAll(item , replace)\
  		n++\
	\});\
	return s\
\}\
\
function add_smiley(s) \{\
	var str = $("#chat-input").val() +s;\
	$("#chat-input").val(str)\
\}\
\
window.addEventListener('click', function(e)\{\
	if (!document.getElementById('smileys').contains(e.target))\{\
	$("#smileys").removeClass("show");\
\}\
\});\
\
function shuffle(array) \{\
  let currentIndex = array.length,  randomIndex;\
  // While there remain elements to shuffle.\
  while (currentIndex != 0) \{\
    // Pick a remaining element.\
    randomIndex = Math.floor(Math.random() * currentIndex);\
    currentIndex--;\
\
    // And swap it with the current element.\
    [array[currentIndex], array[randomIndex]] = [\
      array[randomIndex], array[currentIndex]];\
  \}\
\
  return array;\
\}\
function setCookie(cname, cvalue, exdays) \{\
  const d = new Date();\
  d.setTime(d.getTime() + (exdays * 24 * 3600 * 1000));\
  let expires = "expires="+d.toUTCString();\
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";\
\}\
\
function getCookie(cname) \{\
  let name = cname + "=";\
  let ca = document.cookie.split(';');\
  for(let i = 0; i < ca.length; i++) \{\
    let c = ca[i];\
    while (c.charAt(0) == ' ') \{\
      c = c.substring(1);\
    \}\
    if (c.indexOf(name) == 0) \{\
      return c.substring(name.length, c.length);\
    \}\
  \}\
  return "";\
\}\
function date_mysql_to_fr(dateTime)\{\
	let	dateTimeParts= dateTime.split(/[- :]/);\
	dateTimeParts[1]--; \
	r = new Date(...dateTimeParts)\
	return  r.toLocaleString('fr-FR');\
\}\
function date_shorter(s) \{\
	if (! s) \
		return; \
	var jsDate = new Date(Date.parse(s.replace(/[-]/g,'/')));\
	return getRelativeTime(jsDate)\
\}\
var units = \{\
  year  : 24 * 60 * 60 * 1000 * 365,\
  month : 24 * 60 * 60 * 1000 * 365/12,\
  day   : 24 * 60 * 60 * 1000,\
  hour  : 60 * 60 * 1000,\
  minute: 60 * 1000,\
  second: 1000\
\}\
\
var rtf = new Intl.RelativeTimeFormat('fr', \{ numeric: 'auto' \})\
\
var getRelativeTime = (d1, d2 = new Date()) => \{\
  var elapsed = d1 - d2\
  for (var u in units) \
    if (Math.abs(elapsed) > units[u] || u == 'second') \
      return rtf.format(Math.round(elapsed/units[u]), u)\
\} \
\
function dateDiff(date1, date2)\{\
    var diff = \{\}                           // Initialisation du retour\
    var tmp = date2 - date1;\
    tmp = Math.floor(tmp/1000);             // Nombre de secondes entre les 2 dates\
    diff.sec = tmp % 60;                    // Extraction du nombre de secondes\
    tmp = Math.floor((tmp-diff.sec)/60);    // Nombre de minutes (partie enti\'e8re)\
    diff.min = tmp % 60;                    // Extraction du nombre de minutes\
    tmp = Math.floor((tmp-diff.min)/60);    // Nombre d'heures (enti\'e8res)\
    diff.hour = tmp % 24;                   // Extraction du nombre d'heures\
    tmp = Math.floor((tmp-diff.hour)/24);   // Nombre de jours restants\
    diff.day = tmp;\
    return diff;\
\}\
\
function start_timer_refresh_compte_a_rebour() \{\
	if( new_compte_a_rebou_refresh_process != null ) \{\
		clearInterval(new_compte_a_rebou_refresh_process);\
	\}\
	new_compte_a_rebou_refresh_process = setInterval(compte_a_rebour_refresh, 1000);\
\}\
function stop_timer_refresh_compte_a_rebour() \{\
	if( new_compte_a_rebou_refresh_process != null ) \{\
		clearInterval(new_compte_a_rebou_refresh_process);\
	\}\
	$("#html_timer").addClass("d-none");\
\}\
function compte_a_rebour_refresh() \{\
	if( date_compte_a_rebour_expire == null ) \{\
		console.error("compte_a_rebour_refresh | return");\
		$('#compteur_a_rebour_content').hide();\
		return;\
	\}\
\
	var date_now = new Date();\
	var diff_date = new Date(date_compte_a_rebour_expire - date_now)\
\
	if (diff_date.valueOf() > 0) \{\
		var hh_restant = parseInt(diff_date.getHours()) - 1;\
		var mm_restant = diff_date.getMinutes();\
		var ss_restant = diff_date.getSeconds();\
		mm_restant = (mm_restant < 10) ? '0'+mm_restant : mm_restant;\
		ss_restant = (ss_restant < 10) ? '0'+ss_restant : ss_restant;\
\
		$('#html_timer_date').html(hh_restant + ':' + mm_restant + ':' + ss_restant).ready(function () \{\
			$("#html_timer").removeClass("d-none");\
		\});\
	\}\
\}\
\
// Function to send the photo\
function chat_send_photo(id) \{\
	message = "p_" + id\
  $.ajax(\{\
	type: "GET",\
	url: API_ENDPOINT + "ajax_api/send_message",\
	data: \{ \
	  api_key: API_KEY, \
	  session_id: session_id,\
	  dest: request_pseudo,\
	  id_extra: message, \
	\},\
	cache: false,\
	dataType: "json",\
	success: function(result, status) \{\
	  // console.log(result);\
	  chat_load();\
	\},\
  \});\
\
\}\
\
function cleanModalSharePhoto() \{\
	setTimeout(() => \{\
		$("#my-album-photos").empty();\
	\}, 500);\
\}\
\
// Function to check if any photo has 'border' and 'border-primary' classes\
function hasSelectedPhotos() \{\
	return $("#my-album-photos").find('.card.border.border-primary').length > 0;\
\}\
\
// Function to update the send button state and classes\
function updateSendButtonState() \{\
	  var hasSelected = hasSelectedPhotos();\
  \
	  // Enable or disable the send button based on the check\
	  $(".sendButton").prop('disabled', !hasSelected);\
  \
	  // Toggle button classes based on the check\
	  $(".sendButton").toggleClass('btn-dark', !hasSelected);\
	  $(".sendButton").toggleClass('btn-primary', hasSelected);\
\}\
\
$("#share_photo").click(function() \{\
	var Modal_share_photo = new bootstrap.Modal(document.getElementById('sharephotoModal'), \{\});\
	Modal_share_photo.show();\
	var $albumPhotos = $("#my-album-photos");\
	var $sendButton = $(".sendButton");\
	var selectedPhotoId = ""; // Initialize selectedPhotoId as an empty string\
	\
	$.ajax(\{\
	  type: "GET",\
	  url: API_ENDPOINT + "index_api/user_edit_photos",\
	  data: \{ \
		api_key: API_KEY, \
		session_id: session_id,\
	  \},\
	  dataType: "json",\
	  success: function(result, status) \{\
		if (result.connected !== 1) \{\
		  return;\
		\}\
  \
		// Loop through the photos and create the HTML elements\
		  \
		  \
		if(result.photos.length < 1)\{\
			$albumPhotos.html('<div class="col pt-4 pb-4">Vous n\'92avez pas de photos disponibles dans votre album priv\'e9.</div>');\
		\}\
		  \
		$.each(result.photos, function(key, photo) \{\
		  var localpic = photo.url_middle;\
		  var photoId = photo.id;\
		  var $photoElement = $(`<div class="col">\
								  <div class="card h-100">\
									<div class="card-body">\
									  <img src=$\{localpic\} alt='' style="width: 100%;" class='album-photo'>\
									</div>\
								  </div>\
								</div>`);\
  \
		  $photoElement.find('.card').click(function() \{\
			if (selectedPhotoId === photoId) \{\
			  selectedPhotoId = ""; // Deselect the photo if it's already selected\
			  $(this).removeClass('border border-primary border-2');\
			\} else \{\
			  selectedPhotoId = photoId; // Select the clicked photo\
			  // Remove 'border' and 'border-primary' from all other elements\
			  $albumPhotos.find('.card').not(this).removeClass('border border-primary border-2');\
			  $(this).addClass('border border-primary border-2');\
			\}\
  \
			//console.log("Selected photoId:", selectedPhotoId); // Log the updated photoId value\
			updateSendButtonState();\
		  \});\
  \
		  $albumPhotos.append($photoElement);\
		\});\
  \
		// Event handler for sendButton click\
		$sendButton.off("click").on("click",function(e) \{\
		  if (!$sendButton.prop('disabled')) \{\
			cleanModalSharePhoto();\
			chat_send_photo(selectedPhotoId);\
		  \}\
		\});\
  \
		// Initially, disable the send button and set its class to 'btn-dark'\
		updateSendButtonState();\
	  \}\
	\});\
\});\
\
}