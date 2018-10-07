
console.log('______Reached Sunny contentScript.js______');
$(document).ready(function() {

	chrome.extension.sendMessage({'method':'getMessageText'}, (response)=>{
		console.log('______messageText: %s______', response);

		let msgString="";
		if(response){
			let firstname = extractFirstname();
			if(response){
				msgString = response.replace("{firstname}", firstname);
				// TODO: Handle encoding of special characters. Eg. space becomes &nbsp;
			}
		}

		let para=document.querySelector("div.msg-form__contenteditable > p");
		if(para){
			console.log('______insideParaIfCondition______');

			let msgdiv=document.querySelector("div.msg-form__contenteditable");
			if(msgdiv){
				$(msgdiv).focus();
			}
			let msgArray=msgString.split("\n");
			
			$(para).text(msgArray[0]);	// 1st <p> tag is already existing in DOM, so update html for that para tag
			if(msgArray.length>1){
				msgArray.slice(1).forEach((msg)=>{
					// FOr more sentences you need to create new <p> tags inside the DIV
					$( "div.msg-form__contenteditable p" ).last().after( "<p>"+msg+"</p>" );
				});
			}

			let paraPlaceholder=document.querySelector("div.msg-form__placeholder");
			if(paraPlaceholder){
				hide(paraPlaceholder);
			}
		}

	});
	// chrome.extension.sendMessage({'method':'contentScriptLoadedEvent'}, (response)=>{});
	chrome.runtime.onMessage.addListener(
		function(request, sender, reply) {
			console.log('_____reached contentScript.js switch case:%s',request.method);
			switch(request.method)
			{
				case 'scrollDownEvent':
					scrollDown();
					break;
				default:
					reply({data: 'failure', message:'Invalid arguments'});
			}
		}
	);
	const hide = (elem) => {
		elem.classList.remove("visible");
		elem.classList.remove("hidden");	// Add hidden class only if it is not there in classList of element
		elem.classList.add("hidden");
	};
	const triggerKeypressEvent = (elem, keyCode) => {
		var eventObj = document.createEventObject ?
			document.createEventObject() : document.createEvent("Events");
	  
		if(eventObj.initEvent){
		  eventObj.initEvent("keypress", true, true);
		}
		eventObj.keyCode = keyCode;
		eventObj.which = keyCode;
		
		elem.dispatchEvent ? elem.dispatchEvent(eventObj) : elem.fireEvent("onkeypress", eventObj);
	};


	const extractFirstname = () => {
		let finalName="";
		let extractedName = $("span.msg-connections-typeahead__recipient-name").html();
		if(extractedName){
			extractedName=extractedName.trim();
			let extractedNameArray=extractedName.split(" ");
			let firstname=extractedNameArray[0];
			let secondname=extractedNameArray[1];
			let finalNameArray=[];

			if((firstname.length<3 && secondname) || (firstname.length<4 && firstname.endsWith('\.') && secondname)){
				finalNameArray.push(firstname);
				finalNameArray.push(secondname);
			}else{
				finalNameArray.push(firstname);
			}
			//Converting to camel case
			finalName=finalNameArray
				.map((nameStr)=> nameStr.charAt(0).toUpperCase() + (nameStr.substr(1)?nameStr.substr(1).toLowerCase():""))
				.join(' ');
			
		}
		console.log("______Name:"+finalName);
		return finalName;
	};

	const scrollDown=()=>{
		console.log('________ Scrolling');
		let scrollToBottom = function() {
		  window.scrollTo(0, document.body.scrollHeight);
		};
		var delay = 2000;
		var intervalID = setInterval(scroll, delay);
	};

});