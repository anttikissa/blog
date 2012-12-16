#!/usr/bin/env node

var http = require('http');
var fs = require('fs');

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
		serve(match[1] || latestPostId);
	} else {
		res.writeHead(404);
		res.end("Not found");
	}

	function serve(id) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write(preamble);
		res.write(posts[id] || 'Post not found');
		res.end(postscript(id));
	}
}

try {
	var preamble = fs.readFileSync('preamble.html');
} catch (e) { preamble = '<!doctype html>\n<title>Blog</title>\n'; }

function postscript(id) {
	result = "";
	if (Number(id) > 1)
		result += "<p><a href='/" + (Number(id)-1) + "'>Previous post</a>";
	if (Number(id) < Number(latestPostId))
		result += "<p><a href='/" + (Number(id)+1) + "'>Next post</a>";
	return result;
}

var server = http.createServer(listener);

server.listen(3000);
