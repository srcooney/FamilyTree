SVG = {
  createCanvas : function( width, height ){
    var canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);  
    return canvas;
  },
  createLine : function (x1, y1, x2, y2, color, w) {
    var aLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    aLine.setAttribute('x1', x1);
    aLine.setAttribute('y1', y1);
    aLine.setAttribute('x2', x2);
    aLine.setAttribute('y2', y2);
    aLine.setAttribute('stroke', color);
    aLine.setAttribute('stroke-width', w);
    return aLine;
  }
}

$(document).ready(function(){
	$.ajax({url: "/GetUserFamilyTree", success: function(result){
		console.log(result);
		if(result == ""){
			$(document.body).load("html/home_page.html");
			return;
		}
		treeJson = JSON.parse(result);
		if(treeJson.length == 0){
			$(document.body).load("html/home_page.html");
			return;
		};
		for (i=0;i < treeJson.length;i+=1) {
			add_member_to_webpage(treeJson[i],true);
		};
		var old_level =-1;
		for (i=0;i < treeJson.length;i+=1) {
			if(treeJson[i].treeLevel != old_level){
				old_level =treeJson[i].treeLevel;
				var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
				$(svg).attr("width","100%").attr("height","90");
		    };
			if(treeJson[i].children.length != 0){
				for (j=0;j < treeJson[i].children.length;j+=1) {
					(function(n,m) {
						var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
						$(line).addClass("line")
						$(line).attr('stroke','#FF0000').attr('stroke-width','2')
						div = $( ".member:contains('"+treeJson[n].name+"')" );
						div1 = $( ".member:contains('"+treeJson[n].children[m]+"')" );
						var pos1 = div.position();
						var pos2 = div1.position();
						$(line).attr('x1',pos1.left+div1.width()/2).attr('y1',0).attr('x2',pos2.left+div1.width()/2).attr('y2',90);
						$(svg).append(line);
					 })(i,j);
				};
				div = $( ".member:contains('"+treeJson[i].name+"')" );
				div.parent().after(svg);
			};
		};
	}});
});
$.fn.filterByData = function(prop, val) {
    return this.filter(
        function() { return $(this).data(prop)==val; }
    );
}
var add_member_to_webpage = function(memberData,appendMemberHolder){
	var member_holder;
	member_holder = $(".member_holder").filterByData('treeLevel', memberData.treeLevel);
	if(member_holder.length == 0){
		member_holder = document.createElement( "div" );
		$(member_holder).addClass("member_holder")
		$(member_holder).data("treeLevel",memberData.treeLevel);
		if(appendMemberHolder == true) {
			$(document.body).append(member_holder);
		} else {
			$(document.body).prepend(member_holder);
		}
	}
	
	var member = document.createElement( "div" );
	$(member_holder).append(member);
	$(member).addClass("member label label-info");
	$(member).text(memberData.name);
	$(member).data("familyID",memberData.familyID);
	$(member).data("memberID",memberData.memberID);
};

$(document).on("click","#add_family_tree",function(){
	$(document.body).empty();
	$(document.body).load("html/new_family_tree.html");
});

$(document).on("click","#submit_family",function(){
	$.ajax({url: "/SaveFirstMember",data: {familyName: $("#family_name").val(), memberName:$("#member_name").val(),}, 
		success: function(result){
			$(document.body).empty();
			memberJson = JSON.parse(result);
			add_member_to_webpage(memberJson.member,true);
		}});
});

$(document).on("click",".member",function(){
	var that = this;
	var info_holder = document.createElement( "div" );
	$(document.body).append(info_holder);
	$( info_holder ).load( "html/member_info.html", function() {
		var modal = document.getElementById('myModal');
		var span = document.getElementsByClassName("close")[0];
		modal.style.display = "block";
		span.onclick = function() {
		    modal.style.display = "none";
		    $(info_holder).remove();
		}

		// When the user clicks anywhere outside of the modal, close it
		window.onclick = function(event) {
		    if (event.target == modal) {
		        modal.style.display = "none";
		        $(info_holder).remove();
		    }
		}
		console.log(that)
		$.ajax({url: "/GetUserFamilyMember",data: {familyID: $(that).data('familyID'), memberID:$(that).data('memberID')}, 
			success: function(result){
				var memberJson = JSON.parse(result);
				display_all_info(memberJson);	
			}});
		});
});

var add_info = function(place_holder,id){
	var info_input = '<div class="input-group"><input type="text" class="form-control" placeholder="'+place_holder+'" aria-describedby="basic-addon2">'+
	  '<span class="input-group-addon glyphicon glyphicon-cloud-upload" id="'+id+'"></span></div>';
	$(".member-content").append(info_input)	
};

var add_picture_info = function(place_holder,id){
//	var info_input = '<div class="input-group"><input type="file" class="form-control" placeholder="'+place_holder+'" aria-describedby="basic-addon2">'+
//	  '<span class="input-group-addon glyphicon glyphicon-cloud-upload" id="'+id+'"></span></div>';
//	$(".member-content").append(info_input)	
//	familyID: $('.member-content').data('familyID'), memberID:$('.member-content').data('memberID')
	
	var info_input = '<form action="/SaveAvatar" enctype="multipart/form-data" method="post">'+
	'<div><input name="familyID">'+$('.member-content').data('familyID')+'</input><input name="memberID">'+$('.member-content').data('memberID')+'</input>'+
    '<input type="file" name="file"/></div><div><input type="submit" value="Upload"></div></form>';
    
	
	$(".member-content").append(info_input)	
};

var save_info = function(that,url){
	var input = $(that).prev();
	$.ajax({url: url,data: {familyID: $('.member-content').data('familyID'), memberID:$('.member-content').data('memberID'),info:$(input).val()}, 
		success: function(result){
			$(".member-content").empty();
			var memberJson = JSON.parse(result);
			display_all_info(memberJson);
			if(memberJson.member2 != undefined) {
				if(url == "/SaveParent") {
					add_member_to_webpage(memberJson.member2,false);
				} else{
					add_member_to_webpage(memberJson.member2,true);
				}
			};
		}});
};

var display_single_info_type = function(title,info_type,separated = false,is_link = false){
   if(info_type != "" && info_type != null) {
	   var info_title = document.createElement( "h3" );
	   $(info_title).text(title);
	   $(".member-content").append(info_title);
	   if(info_type instanceof Array && separated) {
		   for (info in info_type) {
			   if(is_link){
				   var info_holder = document.createElement( "a" );
				   info_holder.href = info_type[info];
				   info_holder.target = "_blank";
			   } else{
				   var info_holder = document.createElement( "p" );
			   };
				$(info_holder).text(info_type[info]);
				$(".member-content").append(info_holder);
				var line = document.createElement( "hr" );
				$(".member-content").append(line);
		   };  
	   } else{
		   var info_holder = document.createElement( "p" );
		   $(info_holder).text(info_type);
		   $(".member-content").append(info_holder);
	   };  
   };
};


var display_all_info = function(memberJson){	
	$(".member-content").data("familyID",memberJson.member1.familyID);
	$(".member-content").data("memberID",memberJson.member1.memberID);
	
	var name = document.createElement( "h1" );
	$(name).text(memberJson.member1.name);
	$(".member-content").append(name);
	
	display_single_info_type("Birthday",memberJson.member1.birthday);
	display_single_info_type("Spouse",memberJson.member1.spouse);
	display_single_info_type("Parents",memberJson.member1.parents);
	display_single_info_type("Children",memberJson.member1.children,false);
	display_single_info_type("Links",memberJson.member1.links,true,true);
	display_single_info_type("Stories",memberJson.member1.stories,true);

};

$(document).on("click","#add_picture",function(){add_picture_info("Please Find Your Picture","submit_picture");});
$(document).on("click","#submit_picture",function(){save_info(this,"/SaveAvatar");});

$(document).on("click","#add_bday",function(){add_info("Please Enter Your Birthday","submit_bday");});
$(document).on("click","#submit_bday",function(){save_info(this,"/SaveBirthday");});

$(document).on("click","#add_spouse",function(){add_info("Who are you married to?","submit_spouse");});
$(document).on("click","#submit_spouse",function(){save_info(this,"/SaveSpouse");});

$(document).on("click","#add_parent",function(){add_info("Who is your mom or dad","submit_parent");});
$(document).on("click","#submit_parent",function(){save_info(this,"/SaveParent");});

$(document).on("click","#add_child",function(){add_info("Add a Child","submit_child");});
$(document).on("click","#submit_child",function(){save_info(this,"/SaveChild");});

$(document).on("click","#add_link",function(){add_info("Save a link","submit_link");});
$(document).on("click","#submit_link",function(){save_info(this,"/SaveLink");});

$(document).on("click","#add_story",function(){add_info("Tell us a story","submit_story");});
$(document).on("click","#submit_story",function(){save_info(this,"/SaveStory");});






