

if( process.argv.length < 3 ){
	console.log("No webpage url specified - exiting");
	process.exit();
}

var webpageUrl = process.argv[2];
var pattern = process.argv.length > 3 ? process.argv[3] : 'href=\\\"([^"]+.jpg)\\\"';

var Rx = require("rx");
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
		
var regExp = new RegExp(pattern,"g");
try{
	var cookie = fs.readFileSync( "cookie.txt" );
}
catch(e){}

var concurrentDownloads = 4;

var totalDownloads = 0;
var completedDownloads = 0;

function getUrl(targetUrl){
	var urlObject = url.parse(targetUrl);

	var options = {
		hostname: urlObject.hostname,
		localAddress: urlObject.localAddress,
		port: urlObject.port,
		path: urlObject.path
	};

	if(cookie){
		console.log("Cookie content being added");
		options.headers = {"Cookie": cookie}
	}

	return Rx.Observable.fromEvent( http.get(options), "response" )
		.take(1);
}

function loadImages(){

	console.log("Loading Webpage: " + webpageUrl);

	getUrl(webpageUrl)
		.flatMap(function(response){
			
			return Rx.Observable.fromEvent(response, "data")
				.takeUntil( Rx.Observable.fromEvent(response, "end") );
		})
		.toArray()
		.map(function(allData){
			return allData.join("");
		})
		.flatMap( function(htmlContent){
			
			console.log( "Searching for images using " + pattern );
			
			var matches = htmlContent.match(regExp);

			if(!matches){
				console.log("no images found, exiting");
				process.exit();
			}

			totalDownloads = matches.length;

			console.log(totalDownloads + " matches found");

			return Rx.Observable.from(matches);
		})
		.map(function(regExMatch){
			var regExResults = regExp.exec(regExMatch);
			regExp.lastIndex = 0;
			
			return imageUrl = regExResults[regExResults.length-1];
		})
		.flatMapWithMaxConcurrent( concurrentDownloads, function(imageUrl){
			
			return Rx.Observable.defer( function(){

				var imagePath = path.parse(imageUrl);
				
				console.log( "Saving image " + imageUrl + " (" + imagePath.name + imagePath.ext + ")" );
				
				var fileStream = fs.createWriteStream("output/" + imagePath.name + imagePath.ext );
				var request = http.get(imageUrl, function(response) {
					response.pipe(fileStream);
				});

				return Rx.Observable.fromEvent(fileStream, "finish")
					.take(1)
					.do(function(event){
						completedDownloads++;
						console.log( "Download finished for " + imagePath.name + imagePath.ext + " (" + completedDownloads + "/" + totalDownloads + ")" );
					});
			});

		} )
		.subscribe( function(item){
			//console.log("item: " + item );
		},null,function(){
			console.log("All Downloads Finished");
		});
}

fs.lstat('output', function(err, stats) {

    if (!stats || !stats.isDirectory()) {
		console.log("Creating output folder");
        fs.mkdirSync("output");
    } 

	loadImages();
});