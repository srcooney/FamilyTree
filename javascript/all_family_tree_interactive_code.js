$(document).ready(function(){
	
	$.ajax({url: "/GetUserFamilyTree", success: function(result){
		treeJson = JSON.parse(result);
		if(treeJson.length == 0){
			$(document.body).load("html/home_page.html");
			return;
		};
		console.log(result)
		
		console.log(treeJson)
		for (i=0;i < treeJson.length;i+=1) {
			var member_holder = document.createElement( "div" );
			$(member_holder).addClass("member_holder")
			$(member_holder).data("level",0);
			var member = document.createElement( "div" );
			$(member_holder).append(member);
			$(member).addClass("member label label-info");
			$(member).text(treeJson[i].name);
			$(member).css("margin","0 auto");
			$(member).data("familyID",treeJson[i].familyID);
			$(member).data("memberID",treeJson[i].memberID);
			$(document.body).append(member_holder);
		};
	}});
});

$(document).on("click","#add_family_tree",function(){
	$(document.body).empty();
	$(document.body).load("html/new_family_tree.html");
});

$(document).on("click","#submit_family",function(){
	$.ajax({url: "/SaveFirstMember",data: {familyName: $("#family_name").val(), memberName:$("#member_name").val(),}, 
		success: function(result){
			$(document.body).empty();
			memberJson = JSON.parse(result);
			var member = document.createElement( "div" );
			$(member).addClass("member label label-info");
			$(member).text(memberJson.member.name);
			$(member).width(100);
			$(member).css("margin","auto");
			$(member).data("familyID",memberJson.member.familyID);
			$(member).data("memberID",memberJson.member.memberID);
			$(document.body).append(member);
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
				display_all_info(result);	
			}});
		});
});

var add_info = function(place_holder,id){
	var info_input = '<div class="input-group"><input type="text" class="form-control" placeholder="'+place_holder+'" aria-describedby="basic-addon2">'+
	  '<span class="input-group-addon glyphicon glyphicon-cloud-upload" id="'+id+'"></span></div>';
	$(".member-content").append(info_input)	
};

var save_info = function(that,url){
	var input = $(that).prev();
	$.ajax({url: url,data: {familyID: $('.member-content').data('familyID'), memberID:$('.member-content').data('memberID'),info:$(input).val()}, 
		success: function(result){
			$(".member-content").empty();
			display_all_info(result);
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


var display_all_info = function(member_json){
	memberJson = JSON.parse(member_json);
	$(".member-content").data("familyID",memberJson.member1.familyID);
	$(".member-content").data("memberID",memberJson.member1.memberID);
	
	var name = document.createElement( "h1" );
	$(name).text(memberJson.member1.name);
	$(".member-content").append(name);
	console.log(memberJson.member1);
	
	display_single_info_type("Birthday",memberJson.member1.birthday);
	display_single_info_type("Spouse",memberJson.member1.spouse);
	display_single_info_type("Parents",memberJson.member1.parents);
	display_single_info_type("Children",memberJson.member1.children,false);
	display_single_info_type("Links",memberJson.member1.links,true,true);
	display_single_info_type("Stories",memberJson.member1.stories,true);
	console.log(memberJson.member2);
	if(memberJson.member2 != undefined) {
		var member = document.createElement( "div" );
		$(".member_holder").append(member);
		$(member).addClass("member label label-info");
		$(member).text(memberJson.member2.name);
		$(member).css("margin","0 auto");
		$(member).data("familyID",memberJson.member2.familyID);
		$(member).data("memberID",memberJson.member2.memberID);
	};
};

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






