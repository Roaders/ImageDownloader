

if( process.argv.length < 3 ){
	console.log("No webpage url specified - exiting");
	process.exit();
}

var webpageUrl = process.argv[2];
//var pattern = process.argv.length > 3 ? process.argv[3] : '/href=\\\"[^"]+.jpg\\\"/g';
var pattern = process.argv.length > 3 ? process.argv[3] : 'href=\\\"[^"]+.jpg\\\"';

var Rx = require("rx");
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
		
var regExp = new RegExp(pattern,"g");

var cookie = fs.readFileSync( "cookie.txt" );

console.log("Loading Webpage: " + webpageUrl);

console.log("Cookie content: " + cookie);

var url = url.parse(webpageUrl);

var options = {
	hostname: url.hostname,
	localAddress: url.localAddress,
	port: url.port,
	path: url.path,
	headers: {
		"Cookie": cookie
	}
};

console.log("hostname: " + url.hostname + " localAddress: " + url.localAddress + " path: " + url.path);

var clientRequest = http.get(options);

Rx.Observable.fromEvent( clientRequest, "response" )
	.take(1)
	.flatMap(function(response){
		console.log("handling response code: " + response.statusCode);
		
		return Rx.Observable.fromEvent(response, "data")
			.takeUntil( Rx.Observable.fromEvent(response, "end") );
	})
	.toArray()
	.map(function(allData){
		return allData.join("");
	})
	.flatMap( function(htmlContent){
		
		console.log( "Searching for images using " + pattern );
		
		return Rx.Observable.from(htmlContent.match(regExp));
	})
	.map(function(regExMatch){
		var regExResults = regExp.exec(regExMatch);
		regExp.lastIndex = 0;
		
		return imageUrl = regExResults[regExResults.length-1];
	})
	.do( function(imageUrl){
		
		var imagePath = path.parse(imageUrl);
		
		console.log( "saving image " + imageUrl + " (" + imagePath.name + imagePath.ext + ")" );
		
	} )
	.subscribe( function(item){
		console.log("item: " + item );
	},null,function(){
		console.log("complete");
	});