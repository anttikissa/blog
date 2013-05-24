#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
// var mk = require('../lib/mk');
var pretext = require('pretext');

var env = process.env.BLOG_ENV == 'dev' ? 'dev' : 'prod'

function log(message) {
	console.log(new Date().toISOString().replace(/[TZ]/g, ' ') + message);
}

log("Server starting, env: " + env);

var filenames = fs.readdirSync(__dirname + "/../posts");

var postFiles = filenames.filter(function(filename) {
	return filename.match(/^\d+(\.txt|\.md)?$/);
}).map(function(filename) {
	var match = filename.match(/^(\d+)(\.txt|\.md)?$/);
	return {
		id: match[1],
		filename: filename,
		type: match[2] == '.txt' ? 'mk' : match[2] == '.md' ? 'md' : 'html'
	};
});

postFiles.sort(function(a, b) { return Number(a.id) - Number(b.id); });
var latestPostId = postFiles[postFiles.length - 1].id;

var posts = Object.create(null);

postFiles.forEach(function(postFile) {
	posts[postFile.id] = readPost(postFile.filename, postFile.type);
});

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
	if (type == 'mk') {
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

function listener(req, res) {
	console.log(req.url);
	var match = req.url.match(/^\/(\d*)$/);
	if (match) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		serve(match[1] || latestPostId);
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
		if (posts[id]) {
			res.write(preamble.replace('$title', 'Blog - ' + posts[id].title));
			res.write(links(id));
			res.write(posts[id].content || 'Post not found');
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
		for (id in posts) {
			var post = posts[id];
			res.write("<li><a href='/" + id + "'>" + post.title + "</a>");
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
	id = Number(id);
	var result = "<div class=links>";
	if (id > 1)
		result += "<a class='prev' "
			+ "href='/" + (id - 1) + "'>" + posts[id - 1].title + "</a>";
	if (id < Number(latestPostId))
		result += "<a class='next' "
			+ "href='/" + (id + 1) + "'>" + posts[id + 1].title + "</a>";
	result += "</div>";
	return result;
}

var server = http.createServer(listener);
var port = 3000;
server.listen(port);
log("Listening http://localhost:" + port + "/");

if (env == 'dev') {
	setTimeout(function() {
		log("Restarting...");
		process.exit(0);
	}, 1000);
}

