var map;
var Center= new Object();
$('body').on('change','.eqLogicAttr[data-l1key=configuration][data-l2key=heliotrope]',function(){
	$.ajax({
		type: 'POST',            
		async: false,
		url: 'plugins/Volets/core/ajax/Volets.ajax.php',
		data:{
			action: 'getInformation',
			heliotrope:$(this).val(),
		},
		dataType: 'json',
		global: false,
		error: function(request, status, error) {},
		success: function(data) {
			if (!data.result)
				$('#div_alert').showAlert({message: 'Aucun message recu', level: 'error'});
			if (typeof(data.result.geoloc) !== 'undefined') {
				var center=data.result.geoloc.configuration.coordinate.split(",");
				Center.lat=parseFloat(center[0]);
				Center.lng=parseFloat(center[1]);
				map = new google.maps.Map(document.getElementById('map'), {
					center: Center,
					mapTypeId: 'satellite',
					scrollwheel: true,
					zoom: 20
				});
			}
		}
	});
});
function TraceDirection(Coordinates) {
	var milieu=new Array();
	milieu['lat']=(Coordinates[0].lat+Coordinates[1].lat)/2;
	milieu['lng']=(Coordinates[0].lng+Coordinates[1].lng)/2;
	var perpendiculaire=new Array();
	perpendiculaire['lat']=milieu['lat']+Math.cos(90);
	perpendiculaire['lng']=milieu['lng']+Math.cos(90);
	return [milieu,perpendiculaire];
}
function TracePolyLigne(Coordinates) {
	/*new google.maps.Polyline({
		path: TraceDirection(Coordinates),
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		map: map,
		strokeWeight: 2
	});*/
	new google.maps.Polyline({
		path: Coordinates,
		geodesic: true,
		strokeColor: '#40A497',
		strokeOpacity: 1.0,
		map: map,
		strokeWeight: 2
	});
}
function saveEqLogic(_eqLogic) {
	var state_order = '';
    if (!isset(_eqLogic.configuration)) {
        _eqLogic.configuration = {};
    }	
	if (typeof( _eqLogic.cmd) !== 'undefined') {
		for(var index in  _eqLogic.cmd) { 
			_eqLogic.cmd[index].configuration.action=new Object();
			var cmdParameters=$('.cmd[data-cmd_id=' + init(_eqLogic.cmd[index].id) + ']');
			_eqLogic.cmd[index].configuration.action.in=cmdParameters.find('.ActionIn').getValues('.expressionAttr');
			_eqLogic.cmd[index].configuration.action.out=cmdParameters.find('.ActionOut').getValues('.expressionAttr');
			if(_eqLogic.cmd[index].id =="new")
				_eqLogic.cmd[index].id=null;
		}
	}
    return _eqLogic;
}
function addCmdToTable(_cmd) {
	if (!isset(_cmd)) {
		var _cmd = {configuration: {}};
		bootbox.prompt("Nom ?", function (result) {
			if (result !== null && result != '') 
				_cmd.id="new";
				_cmd.name=result;
				AddZone(_cmd);
			//$('.eqLogicAction[data-action=save]').trigger('click');
		});
	}
	else
		AddZone(_cmd);
	
}
function AddZone(_zone){
	if (init(_zone.name) == '') {
      		return;
   	}
	if (init(_zone.icon) == '') {
     	   // _zone.icon = '<i class="icon fa fa-dot-circle-o"><\/i>';
    	    _zone.icon = '';
  	  }
	if (typeof(_zone.configuration.Droit) !== 'undefined' && _zone.configuration.Droit != "" && typeof(_zone.configuration.Gauche) !== 'undefined' && _zone.configuration.Gauche != "") {
		_zone.configuration.Droit.lat=parseFloat(_zone.configuration.Droit.lat);
		_zone.configuration.Droit.lng=parseFloat(_zone.configuration.Droit.lng);
		_zone.configuration.Gauche.lat=parseFloat(_zone.configuration.Gauche.lat);
		_zone.configuration.Gauche.lng=parseFloat(_zone.configuration.Gauche.lng);
	}else {
		_zone.configuration.Droit= new Object();
		_zone.configuration.Droit=Center;
		_zone.configuration.Gauche= new Object();
		_zone.configuration.Gauche.lat=_zone.configuration.Droit.lat;
		_zone.configuration.Gauche.lng=_zone.configuration.Droit.lng+ (1 / 3600);
	}	
	var Coordinates=[_zone.configuration.Droit,_zone.configuration.Gauche];
	var Droit=new google.maps.Marker({
		position: _zone.configuration.Droit,
		map: map,
		draggable:true,
		title: _zone.name + " - Droite vue exterieur"
	  });
	var Gauche=new google.maps.Marker({
		position:_zone.configuration.Gauche,
		map: map,
		draggable:true,
		title: _zone.name  + " - Gauche vue exterieur"
	  });
	TracePolyLigne(Coordinates);
	google.maps.event.addListener(Droit,'drag', function(event) {
		Coordinates[0]=event.latLng;
		TracePolyLigne(Coordinates);
		$('.cmd[data-cmd_id=' + init(_zone.id) + ']').find('.cmdAttr[data-l1key=configuration][data-l2key=Droit]').val(JSON.stringify(event.latLng));
	});
	google.maps.event.addListener(Gauche,'drag', function(event) {
		Coordinates[1]=event.latLng;
		TracePolyLigne(Coordinates);
		$('.cmd[data-cmd_id=' + init(_zone.id) + ']').find('.cmdAttr[data-l1key=configuration][data-l2key=Gauche]').val(JSON.stringify(event.latLng));
	});
	if($('#tab_new').lenght >0)
		$('#tab_new').remove();
	if ($('#tab_zones #' + init(_zone.id)).length == 0) {
		$('#tab_zones').append($('<li id="' +init(_zone.id) + '">')
			.append($('<a href="#tab_' + init(_zone.id) + '">')
				.append($(_zone.display.icon))
				.text(_zone.name)));
	}
	var NewMode = $('<div style="margin-right:20px" class="cmd tab-pane tabAttr" data-cmd_id="' +init(_zone.id) + '" id="tab_' +init(_zone.id) + '">')
		.append($('<div class="row">')
			.append($('<input class="cmdAttr" data-l1key="id"  style="display : none;"/>'))
			.append($('<input class="cmdAttr" data-l1key="logicalId" style="display : none;"/>'))
			.append($('<input class="cmdAttr" data-l1key="name" style="display : none;"/>'))
			.append($('<input class="cmdAttr" data-l1key="type" value="action" style="display : none;"/>'))
			.append($('<input class="cmdAttr" data-l1key="subType" value="other" style="display : none;"/>'))
			.append($('<input class="cmdAttr" data-l1key="configuration" data-l2key="Droit" style="display : none;" />'))
			.append($('<input class="cmdAttr" data-l1key="configuration" data-l2key="Gauche" style="display : none;" />'))
			.append($('<input class="cmdAttr" data-l1key="display" data-l2key="icon" style="display : none;" />'))
			.append($('<input type="checkbox" class="cmdAttr" data-l1key="isHistorized" style="display : none;"/>'))
			.append($('<div class="btn-group pull-right" role="group">')
				.append($('<a class="modeAction btn btn-default btn-sm" data-l1key="chooseIcon">')
					.append($('<i class="fa fa-flag">'))
					.text('{{Modifier Icône}}'))
				.append($('<a class="modeAction btn btn-default btn-sm" data-l1key="removeIcon">')
					.append($('<i class="fa fa-trash">'))
					.text('{{Supprimer l\'icône}}'))
				.append($('<a class="modeAction btn btn-danger btn-sm" data-l1key="removeZone">')
					.append($('<i class="fa fa-minus-circle">'))
					.text('{{Supprimer}}'))))
		.append($('<div class="row">')
			.append($('<div>')
				.append($('<label>').text('Valeur Température de la zone'))
				.append($('<div class="input-group">')
					.append($('<span class="input-group-btn">')
						.append($('<sup class="btn  btn-sm">')
							.append($('<i class="fa fa-question-circle tooltips" style="font-size : 1em;color:grey;" title="Séléctioner l\'objet de température de la zone">'))))
					.append($('<input class="cmdAttr form-control input-sm"  data-l1key="configuration" data-l2key="TempObjet">'))
					.append($('<span class="input-group-btn">')
						.append($('<a class="btn btn-success btn-sm bt_selectCmdExpression" id="value">')
							.append($('<i class="fa fa-list-alt">'))))))
			.append($('<div>')
				.append($('<label>').text('Seuil de température de la zone'))
				.append($('<div class="input-group">')
					.append($('<span class="input-group-btn">')
						.append($('<sup class="btn  btn-sm">')
							.append($('<i class="fa fa-question-circle tooltips" style="font-size : 1em;color:grey;" title="Choisissez un objet jeedom contenant la valeur de votre commande">'))))
					.append($('<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="SeuilTemp">'))))
			.append($('<div>')
				.append($('<label>').text('Angle d\'ensoleillement de la Zone'))
				.append($('<div class="input-group">')
					.append($('<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="Angle">')))))
		.append($('<div class="row">')
			.append($('<div class="col-lg-6 ActionIn">')
				.append($('<form class="form-horizontal">')
					.append($('<legend>')
						.text('{{Ajouter les actions a mener lorsque le soleil est dans la zone :}}')
						.append($('<a class="btn btn-success btn-xs ActionAttr" data-action="add" style="margin-left: 5px;">')
							.append($('<i class="fa fa-plus-circle">'))
							.text('{{Ajouter Action}}')))
					.append($('<div class="div_action">'))))
			.append($('<div class="col-lg-6 ActionOut">')
				.append($('<form class="form-horizontal">')
					.append($('<legend>')
						.text('{{Ajouter les actions a mener lorsque le soleil n\'est pas dans la zone :}}')
						.append($('<a class="btn btn-success btn-xs ActionAttr" data-action="add" style="margin-left: 5px;">')
							.append($('<i class="fa fa-plus-circle">'))
							.text('{{Ajouter Action}}')))
					.append($('<div class="div_action">')))));
	$('.TabCmdZone').append(NewMode);
	$('.TabCmdZone .cmd[data-cmd_id=' + init(_zone.id)+ ']').setValues(_zone, '.cmdAttr');
	$('.cmd[data-cmd_id=' + init(_zone.id) + ']').find('.cmdAttr[data-l1key=configuration][data-l2key=Droit]').val(JSON.stringify(_zone.configuration.Droit));
	$('.cmd[data-cmd_id=' + init(_zone.id) + ']').find('.cmdAttr[data-l1key=configuration][data-l2key=Gauche]').val(JSON.stringify(_zone.configuration.Gauche));
	$('#tab_zones a').on('click', function (e) {
		e.preventDefault();
		$(this).tab('show');
	});	
	if (typeof(_zone.configuration.action) !== 'undefined') {
		if (typeof(_zone.configuration.action.in) !== 'undefined') {
			for(var index in _zone.configuration.action.in) { 
				if( (typeof _zone.configuration.action.in[index] === "object") && (_zone.configuration.action.in[index] !== null) )
					addAction(_zone.configuration.action.in[index],  '{{Action}}',$('.cmd[data-cmd_id=' + init(_zone.id)+ ']  .ActionIn').find('.div_action'));
			}
		}
		if (typeof(_zone.configuration.action.out) !== 'undefined') {
			for(var index in _zone.configuration.action.out) { 
				if( (typeof _zone.configuration.action.out[index] === "object") && (_zone.configuration.action.out[index] !== null) )
					addAction(_zone.configuration.action.out[index],  '{{Action}}',$('.cmd[data-cmd_id=' + init(_zone.id)+ ']  .ActionOut').find('.div_action'));
			}
		}
	}	
}
function addAction(_action, _name, _el) {
	if (!isset(_action)) {
		_action = {};
	}
	if (!isset(_action.options)) {
		_action.options = {};
	}
    	var div = $('<div class="form-group ActionGroup">')
  		.append($('<label class="col-lg-1 control-label">')
			.text(_name))
   		.append($('<div class="col-lg-1">')
    			.append($('<a class="btn btn-warning btn-sm listCmdAction" >')
				.append($('<i class="fa fa-list-alt">'))))
		.append($('<div class="col-lg-3">')
			.append($('<input class="expressionAttr form-control input-sm cmdAction" data-l1key="cmd" />')))
		.append($('<div class="col-lg-6 actionOptions">')
    			.append($(jeedom.cmd.displayActionOption(init(_action.cmd, ''), _action.options))))
 		.append($('<div class="col-lg-1">')
  			.append($('<i class="fa fa-minus-circle pull-left cursor bt_removeAction">')));
        _el.append(div);
        _el.setValues(_action, '.expressionAttr');
  
}
$('#tab_zones a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
});

$('body').on('click','.ActionAttr[data-action=add]',function(){
	addAction({},  '{{Action}}',$(this).closest('.form-horizontal').find('.div_action'));
});
$('body').on('click','.modeAction[data-l1key=removeIcon]', function () {
	var zoneId = $(this).closest('.tabAttr').attr("id");
	$('#tab_zones #' + zoneId ).find('.icon').parent().remove();
	$(this).closest('.cmd').find('.cmdAttr[data-l1key=display][data-l2key=icon]').val('');
});
$('body').on('click','.modeAction[data-l1key=chooseIcon]', function () {
	var zoneId = $(this).closest('.tabAttr').attr("id");
	var _this = this;
   	chooseIcon(function (_icon) {
		alert(_icon);
		$('#tab_zones #' + zoneId ).append(_icon);
		$(_this).closest('.cmd').find('.cmdAttr[data-l1key=display][data-l2key=icon]').val('');
    	});
});
$('body').on('click','.modeAction[data-l1key=removeZone]', function () {
	var zoneId = $(this).closest('.tabAttr').attr("id");
	$('#tab_zones #' + zoneId).parent().remove();
	$(this).closest('.cmd').remove();
});
$("body").on('click', ".listCmdAction", function() {
    	var el = $(this).closest('.form-group').find('.expressionAttr[data-l1key=cmd]');
    	jeedom.cmd.getSelectModal({cmd: {type: 'action'}}, function(result) {
		el.value(result.human);
        	jeedom.cmd.displayActionOption(el.value(), '', function(html) {
			el.closest('.form-group').find('.actionOptions').html(html);
        	});
    	});
});
$('body').on('click','.bt_removeAction', function () {
	var zoneId = $(this).closest('.ActionGroup').remove();
});
$('body').on( 'click','.bt_selectCmdExpression', function() {
	var _this=this;
	jeedom.cmd.getSelectModal({cmd: {type: 'info'},eqLogic: {eqType_name : ''}}, function (result) {
		$(_this).closest('.input-group').find('.cmdAttr').val(result.human);
	});
});  
