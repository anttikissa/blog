
function untabify(text) {
	result = '';
	column = 0;
	for (var i = 0, len = text.length; i < len; i++) {
		var c = text[i];
		if (c == '\t') {
			result += ' ';
			while (++column % 4 != 0) {
				result += ' ';
			}
			continue;
		} else if (c == '\n') {
			column = 0;
		} else {
			column++;
		}
		result += c;
	}
	return result;
}

function trim(text) {
	var withoutBlankLines = text.replace(/\n[ \f\r\t\v]*$/gm, '\n');
	var withoutStartingOrLeadingNewlines = withoutBlankLines.replace(/(^\n*)|(\n*$)/g, '');
	return withoutStartingOrLeadingNewlines;
}

function split(text) {
	return text.split(/\n{2,}/);
}

function italicize(text) {
}

function boldify(text) {
}

function linkify(text) {
}

function type(element) {
	if (/^#{1,6} /.test(element)) {
		return 'heading';
	} else if (/^    /.test(element)) {
		return 'codeBlock';
	} else if (/^\*   /.test(element)) {
		return 'codeBlock';
	} else if (/^\* /.test(element)) {
		return 'ul';
	} else if (/^\#\. /.test(element)) {
		return 'ol';
	} else if (/^> /.test(element)) {
		return 'blockquote';
	} else if (/^\s*</.test(element)) {
		return 'html';
	} else {
		return 'paragraph';
	}
}

function handle(element) {
	return handlers[type(element)](element)
}

function li(item, prefix) {
	var content = item.replace(prefix, '');
	return "<li>" + content;
}

function list(type, prefix, element) {
	result = "<" + type + ">\n";
	element.split('\n').forEach(function(item) {
		result += li(item, prefix) + '\n';
	});
	result += "</" + type + ">";
	return result;
}

var handlers = {
	paragraph: function(element) {
		return "<p>" + element;
	},
	heading: function(element) {
		var form = /^(#{1,6}) (.*)$/;
		var match = element.match(form);
		var level = match[1].length;
		var content = match[2];
		return "<h" + level + ">" + content + "</h" + level + ">";
	},
	codeBlock: function(element) {
		var lines = element.split('\n');
		function deindent(line) {
			var form = /^(\*| )   (.*)$/;
			var match = line.match(form);
			if (match[1] == '*') {
				return "<b>" + escape(match[2]) + "</b>";
			} else {
				return escape(match[2]);
			}
		}
		var content = lines.map(deindent).join('\n');

		return "<pre><code>" + content + "</code></pre>";
	},
	ul: function(element) {
		return list("ul", /^\* /, element);
	},
	ol: function(element) {
		return list("ol", /^#. /, element);
	},
	html: function(element) {
		return element;
	},
	blockquote: function(element) {
		var stripped = element.replace(/^> /gm, '');
		return "<blockquote>" + mk(stripped) + "</blockquote>";
	}
};

function escape(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function mk(text) {
	var preprocessed = untabify(trim(text));
	var parts = split(preprocessed);
	var converted = parts.map(handle);
	return converted.join('\n') + '\n';
}

module.exports = mk;

module.exports.trim = trim;
module.exports.untabify = untabify;
module.exports.split = split;
module.exports.type = type;
module.exports.handle = handle;

