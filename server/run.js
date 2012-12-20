#!/usr/bin/env node

var http = require('http');
var fs = require('fs');

var env = process.env.BLOG_ENV == 'dev' ? 'dev' : 'prod'

console.log("Environment: " + env);

var filenames = fs.readdirSync(__dirname + "/../posts");
var postIds = filenames.filter(function(filename) {
	return filename.match(/^\d+$/);
});

postIds.sort(function(a, b) { return Number(a) - Number(b); });
var latestPostId = postIds[postIds.length - 1];

var posts = Object.create(null);

postIds.forEach(function(id) {
	posts[id] = fs.readFileSync(__dirname + "/../posts/" + id, "utf-8");
});

function listener(req, res) {
	var match = req.url.match(/^\/(\d+|)$/);
	if (match) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		serve(match[1] || latestPostId);
	} else {
		fs.readFile(__dirname + '/../public/' + req.url,
			function(err, data) {
				if (err) {
//					console.log(err);
					res.writeHead(404);
					res.end("Not found");
				} else {
					var filetype = 'text/plain';
					if (req.url.match(/\.png$/)) {
						filetype = 'image/png';
					}

					res.writeHead(200);
					res.end(data);
				}
		 	});
	}

	function serve(id) {
		res.write(preamble);
		res.write(posts[id] || 'Post not found');
		res.end(postscript(id));
	}
}

try {
	var preamble = fs.readFileSync(__dirname + '/../preamble.html');
} catch (e) {
	preamble = '<!doctype html>\n<title>Blog</title>\n';
}

function postscript(id) {
	var result = "<footer>";
	if (Number(id) > 1)
		result += "<a class='prev' "
			+ "href='/" + (Number(id)-1) + "'>Previous post</a>";
	if (Number(id) < Number(latestPostId))
		result += "<a class='next' "
			+ "href='/" + (Number(id)+1) + "'>Next post</a>";
	result += "</footer>";
	return result;
}

var server = http.createServer(listener);
server.listen(3000);

if (env == 'dev') {
	setTimeout(function() { process.exit(0); }, 1000);
}

