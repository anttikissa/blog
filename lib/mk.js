
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

function escape(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/\\(.)/g, '$1');
}

function filter(text) {
	return linkify(boldify(italicize(codify(text))));
}

function filterCode(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/(^|[^<])\//g, '$1&sol;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/\*/g, '&ast;')
		.replace(/_/g, '&lowbar;')
		.replace(/\\(.)/g, '$1');
}

function codify(text) {
	var pattern = /([^\\]|^)`([^\\`]*(?:\\.[^`\\]*)*)`/g;

	var codeBlocksEscaped = text.replace(pattern, function(match, p1, p2) {
		return p1 + '<code>' + filterCode(p2) + '</code>';
	});

	var restPattern = /(^|<\/code>)(.*?)(<code>|$)/g;
	return codeBlocksEscaped.replace(restPattern, function(match, p1, p2, p3) {
		return p1 + escape(p2) + p3;
	});
}

function italicize(text) {
	var pattern = /\B\/(?!\s)([^]*?[^\s])\/\B/g;
	return text.replace(pattern, function(match, p1, offset) {
		if (offset > 0 && text[offset-1] == '<') {
			return match;
		}
		if (offset > 1 && text[offset-2] == ':' && text[offset-1] == '/') {
			return match;
		}
		return '<i>' + p1 + '</i>';
	});
}

function boldify(text) {
	var pattern = /\B\*(?!\s)([^]*?[^\s])\*\B/g;
	return text.replace(pattern, '<b>$1</b>');
}

function linkify(text) {
	var pattern = /\b_(?!\s)([^]*?[^\s])_(?:\s*\(((?:[^\(\)]*\((?:[^\(\)]*\([^\(\)]*\))*[^\(\)]*\))*[^\(\)]*)\)|\b)/g;

	return text.replace(pattern, function(match, p1, p2, p3) {
		var href = p2 ? " href='" + escape(p2)+ "'" : "";
		return '<a' + href + '>' + p1 + '</a>';
	});
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
	return "<li>" + filter(content);
}

function list(type, prefix, element) {
	var result = "<" + type + ">\n";
	element.split('\n').forEach(function(item) {
		result += li(item, prefix) + '\n';
	});
	result += "</" + type + ">";
	return result;
}

var handlers = {
	paragraph: function(element) {
		return "<p>" + filter(element);
	},
	heading: function(element) {
		var form = /^(#{1,6}) (.*)$/;
		var match = element.match(form);
		var level = match[1].length;
		var content = filter(match[2]);
		return "<h" + level + ">" + content + "</h" + level + ">";
	},
	codeBlock: function(element) {
		var lines = element.split('\n');
		function deindent(line) {
			var form = /^(\*| )   (.*)$/;
			var match = line.match(form);
			if (!match) {
				return filterCode(line);
			}
			if (match[1] == '*') {
				return "<b>" + filterCode(match[2]) + "</b>";
			} else {
				return filterCode(match[2]);
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

function joinCodeBlocks(parts) {
	var result = [];
	for (var i = 0, len = parts.length; i < len; i++) {
		var part = parts[i];
		if (result.length) {
			if (type(part) == 'codeBlock') {
			}
			prevIdx = result.length - 1;
			if (type(part) == 'codeBlock' && type(result[prevIdx]) == 'codeBlock') {
				result[prevIdx] += '\n    \n' + part;
				continue;
			} 
		}
		result.push(part);
	}
	return result;
}

function mk(text) {
	var preprocessed = untabify(trim(text));
	var parts = split(preprocessed);
	parts = joinCodeBlocks(parts);
	var converted = parts.map(handle);
	return converted.join('\n') + '\n';
}

module.exports = mk;

module.exports.trim = trim;
module.exports.untabify = untabify;
module.exports.split = split;
module.exports.type = type;
module.exports.handle = handle;
module.exports.filterCode = filterCode;
module.exports.filter = filter;
module.exports.codify = codify;
module.exports.boldify = boldify;
module.exports.linkify = linkify;
module.exports.italicize = italicize;

