/**
 * Reddit as a commenting system backend.
 * @module reddit-comments
 */


/**
 * Module dependencies.
 */
var Reddit = require('reddit-api'),
    Emitter = require('emitter'),
    events = require('event'),
    $ = require('helix'),
    render = require('./templates/comment'),
    cache = require('ls-cache'),
    extend = require('extend'),
    vagueTime = require('vague-time');


exports = module.exports = init;

var api = new Reddit();


/**
 * Module initialization function.
 *
 * @borrows RedditComments as init
 * @alias module:reddit-comments
 * @public
 */
function init(frame, options) {
    try {
        var rc = new RedditComments(frame, options);
    } catch (e) {
        console.log(e.toString());
        return;
    }
    rc.init();
    return rc;
}


/**
 * Generate a hash code from a string.
 *
 * @link http://stackoverflow.com/a/7616484
 * @return {number}
 */
String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0, l = this.length; i < l; i++) {
        char  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};


Object.defineProperty($().constructor.prototype, "addEventListener", {
    value: function (event, callback, useCapture) {
        useCapture = ( !! useCapture) | false;
        for (var i = 0; i < this.length; ++i) {
            if (this[i] instanceof Node) {
                this[i].addEventListener(event, callback, useCapture);
            }
        }
        return this;
    }
});


/**
 * Main module object.
 *
 * @param {String} frame - A CSS selector of the element to be populated by comments.
 * @param {Object} options - Module configuration.
 * @param {String} options.subreddit - The subreddit name.
 * @param {String} [options.url=document.URL] - The URL to retrieve comments for.
 * @param {number} [options.commentsCacheExpiration=5] - Expiration time for
 *     retrieved comments in the `localStorage` cache.
 * @constructor
 * @private
 */
function RedditComments(frame, options) {
    var defaultOptions = {
        url: document.URL,
        commentsCacheExpiration: 5
    };
    if (!('subreddit' in (options || {}))) {
        throw new TypeError('Must specify a "subreddit"');
    }
    api.subreddit = options.subreddit;
    this.options = extend(defaultOptions, options);
    this.frame = $(frame);
    return this;
};


/**
 * Object initialization function.
 *
 * Displays retrieved comments.
 */
RedditComments.prototype.init = function() {
    var rc = this;

    rc.getUrlId(rc.options.url).then(function(urlId) {
        return rc.getComments(urlId);
    }).then(function(comments) {
        rc.renderComments(comments);

        // Setup click handlers
        function toggleComment(e) {
            e.preventDefault();
            rc.toggleComment(e.target.parentElement);
        }
        events.bind($('.rc-collapse'), 'click', toggleComment);

        // Prepend Reddit's URL to links beginning with '/r/' and '/u/'
        var specialLinks = rc.frame.find('a[href^="/r/"], a[href^="/u/"]');
        for (var i = 0; i < specialLinks.length; ++i) {
            var t = $(specialLinks[i]);
            t.attr('href', 'http://www.reddit.com' + t.attr('href'));
        }
    });
};


/**
 * Logs in a Reddit user.
 *
 * @param {String} username
 * @param {String} password
 */
RedditComments.prototype.login = function(username, password) {
};


/**
 * Logs out a Reddit user.
 */
RedditComments.prototype.logout = function() {
};


/**
 * Posts a comment on the Reddit post.
 *
 * @param {String} body - The comment body.
 */
RedditComments.prototype.comment = function(body) {
};


/**
 * Get the comments associated with a URL.
 *
 * @param {String} urlId - Reddit's ID36 of a URL.
 */
RedditComments.prototype.getComments = function(urlId) {
    var rc = this,
        hash = urlId.hashCode().toString(),
        comments = cache.get(hash);

    if (comments != null) {
        // Fake Promise to match the API
        return {
            then: function(resolve, reject) {return resolve(comments);}
        }
    }

    return api.getComments(urlId).then(function(res) {
        var data = JSON.parse(res || {}),
            comments = rc.extractComments(data);
        cache.set(hash, comments, rc.options.commentsCacheExpiration);
        return comments;
    });
};


/**
 * Extract the comment data from Reddit's response and process it for
 * rendering.
 *
 * @param {Object} data - The data as returned by the Reddit API.
 */
RedditComments.prototype.extractComments = function(data) {
    var rc = this,
        cData = [];

    function cleanCommentBody(body) {
        // Unescape the HTML
        var el = document.createElement('div');
        el.innerHTML = c.body_html;
        var unescapedHTML = el.childNodes.length === 0 ?
                                '' : el.childNodes[0].nodeValue;

        // Reddit's API returns the comment's HTML body wrapped in a
        // `<div class="md"></div>` element. We unwrap it here.
        var el = document.createElement('div');
        el.innerHTML = unescapedHTML;
        var unwrappedHTML = el.childNodes.length === 0 ?
                                '' : el.childNodes[0].innerHTML;
        return unwrappedHTML;
    }

    data = (data[1] || data);
    if (!data.data.children) return cData;
    data = data.data.children;
    for (var i = 0; i < data.length; ++i) {
        if (data[i].kind != "t1") continue;
        var replies = [],
            c = data[i].data,
            date = new Date(0),
            cleanBody = cleanCommentBody(c.body_html),
            vt;
        if (c.replies) {
            replies = rc.extractComments(c.replies);
        }
        date.setUTCSeconds(c.created_utc);
        vt = vagueTime.get({to: date});
        cData.push({author: c.author,
                    created_vague: vt,
                    created_timestamp: date,
                    replies: replies,
                    score: c.ups - c.downs, // XXX: Where is c.score?
                    body: cleanBody});
    }
    return cData;
};


/**
 * Given a URL, get its ID36.
 *
 * ID36 is the unique ID used by Reddit.
 * @see http://www.reddit.com/dev/api#fullnames
 *
 * @param {String} url
 */
RedditComments.prototype.getUrlId = function(url) {
    var rc = this,
        hash = url.hashCode().toString(),
        urlId = cache.get(hash);

    if (urlId != null) {
        // Fake Promise to match the API
        return {
            then: function(resolve, reject) {return resolve(urlId);}
        }
    }

    return api.getInfo({url: url}).then(function(res) {
        var data = JSON.parse(res || {}).data,
            urlId = rc.extractUrlId(data);
        cache.set(hash, urlId);
        return urlId;
    });
};


/**
 * Extract the URL's ID36 from Reddit's response.
 *
 * @param {Object} data - The data as returned by the Reddit API.
 */
RedditComments.prototype.extractUrlId = function(data) {
    var rc = this;

    if (data && data.children.length) {
        var linkData = data.children[0].data;
        if (!(linkData.subreddit == rc.options.subreddit)) {
            console.log("Post doesn't belong to this subreddit");
        } else {
            return linkData.id;
        }
    }
};


/**
 * Render a list of comments.
 *
 * @param {Array} comments - A collection of comments as returned by
 *     `extractComments()`.
 */
RedditComments.prototype.renderComments = function(comments) {
    var rc = this,
        frame = rc.frame,
        out = '';
    for (var i = 0; i < comments.length; ++i) {
        out += rc.renderComment(comments[i]);
    };
    frame.html(out);
};

/**
 * Render a single comment.
 *
 * If there are nested comments, this function will call itself recursively.
 *
 * @param {Object} c - A comment object.
 */
RedditComments.prototype.renderComment = function(c) {
    var rc = this, replies = '';
    for (var i = 0; i < c.replies.length; ++i) {
        replies += rc.renderComment(c.replies[i]);
    };
    c.replies = replies;
    return render(c);
};


/**
 * Display or hide a comment.
 *
 * @param {Object} c - A comment object.
 */
RedditComments.prototype.toggleComment = function(c) {
    var $c = $(c);
    // XXX: This acts like find(). See https://github.com/imiric/helix/issues/1
    $c.children('.rc-comment, .rc-vote').toggle();
    $c.children('.rc-collapse').toggleClass('rc-icon-vert');
    $c.find('.reddit-comment').toggle();
};
