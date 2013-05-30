#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
var pretext = require('pretext');
var express = require('express');

var env = process.env.BLOG_ENV == 'dev' ? 'dev' : 'prod'

function log(message) {
	console.log(new Date().toISOString().replace(/[TZ]/g, ' ') + message);
}

log("Server starting, env: " + env);

var filenames = fs.readdirSync(__dirname + "/../posts");

var validFile = /^(.+?)(\.pre)?$/;
var postFiles = filenames.filter(function(filename) {
	return filename.match(validFile);
}).map(function(filename) {
	var match = filename.match(validFile);
	return {
		id: match[1],
		filename: filename,
		type: match[2] == '.pre' ? 'pre' : 'html'
	};
});

// Posts will contain posts ordered by date.
var posts = [];

// This is used to look up posts by id.
var postsById = {};

postFiles.forEach(function(it, n) {
	var post = readPost(it.filename, it.type);
	post.id = it.id;
	posts.push(post);
});

posts.sort(function(a, b) { return a.date.getTime() - b.date.getTime(); });
posts.forEach(function(post, idx) {
	post.idx = idx;
	postsById[post.id] = post;
});

/*
var latestPostId = postFiles[postFiles.length - 1].id;

var posts = Object.create(null);

postFiles.forEach(function(postFile) {
	posts[postFile.id] = readPost(postFile.filename, postFile.type);
});

*/

function formatDate(date) {
	var months = [
		'January', 'February', 'March', 'April',
		'May', 'June', 'July', 'August', 'September',
		'October', 'November', 'December']

	return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function filter(post, type, filename) {
	var result = post;

	var start = new Date();
	if (type == 'pre') {
		result = pretext(post);
	} 

	var end = new Date();
	log("formatting post " + filename + " took " + (end - start) + " ms");
	result = result.replace(/\n/g, ' \n');
	return result;
}

function readPost(filename, type) {
	var content = fs.readFileSync(__dirname + "/../posts/" + filename, "utf-8");
	content = filter(content, type, filename);
	var titleMatch = content.match(/<h1>([^]*?)<\/h1>/);
	var title = titleMatch ? titleMatch[1] : "no title";
	var datePattern = /<time[^>]*datetime='([^\']*)'[^>]*>/;
	var dateMatch = content.match(datePattern);
	if (dateMatch) {
		var date = new Date(dateMatch[1]);
		content = content.replace(datePattern,
			dateMatch[0] + formatDate(date));
	}

	return {
		title: title,
		content: content,
		date: date
	}
}

var app = express();
app.use(listener);

function listener(req, res) {
	console.log(req.url);
	var match = req.url.match(/^\/(.*)$/);
//	console.log("Match! " + JSON.stringify(match));
	var id = match[1];
	if (id.length == 0) {
		serve(posts[posts.length - 1].id);
	} else if (postsById[id]) {
		serve(id);
	} else if (req.url == '/posts') {
		servePosts();
	} else {
		fs.readFile(__dirname + '/../public/' + req.url,
			function(err, data) {
				if (err) {
					res.writeHead(404);
					res.end("Not found");
				} else {
					if (req.url.match(/\.png$/)) {
						var contentType = 'image/png';
					} else if (req.url.match(/\.css$/)) {
						var contentType = 'text/css; charset=utf-8';
					} else {
						var contentType = 'text/plain';
					}

					res.writeHead(200, {
						'Content-Type': contentType
					});
					res.end(data);
				}
		 	});
	}

	function serve(id) {
		if (postsById[id]) {
			var post = postsById[id];
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(preamble.replace('$title', 'Blog - ' + post.title));
			res.write(links(id));
			res.write(post.content || 'Post not found');
			res.end();
			res.end(links(id));
		} else {
			res.writeHead(404);
			res.end("Not found");
		}
	}

	function servePosts() {
		res.write(preamble.replace('$title', 'Blog - all posts'));
		res.write("<h1>All posts</h1>");
		res.write("<ul>");
		for (var i = 0; i < posts.length; i++) {
			var post = posts[i];
			res.write("<li><a href='/" + post.id + "'>" + post.title + "</a>");
			if (post.date) {
				res.write(" - <time datetime='" + post.date.toISOString()
					+ "'>" + formatDate(post.date) + "</time>");
			}
		}
		res.write("</ul>");
		res.end();
	}
}

try {
	var preamble = fs.readFileSync(__dirname + '/../preamble.html', 'utf-8');
} catch (e) {
	preamble = '<!doctype html>\n<title>Blog</title>\n';
}

function links(id) {
	post = postsById[id];
	var result = "<div class=links>";
	idx = post.idx
	if (idx > 0) {
		var prevPost = posts[idx - 1];
		result += "<a class='prev' "
			+ "href='/" + prevPost.id + "'>" + prevPost.title + "</a>";
	}
	if (idx < posts.length - 1) {
		var nextPost = posts[idx + 1];
		result += "<a class='next' "
			+ "href='/" + nextPost.id + "'>" + nextPost.title + "</a>";
	}
	result += "</div>";
	return result;
}

var port = 3000;
app.listen(port);

log("Listening at http://localhost:" + port + "/");

if (env == 'dev') {
	setTimeout(function() {
		log("Restarting...");
		process.exit(0);
	}, 1000);
}

