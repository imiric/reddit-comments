/**
 * Reddit as a commenting system backend.
 * @module reddit-comments
 */


/**
 * Module dependencies.
 */
var Emitter = require('emitter'),
    events = require('event'),
    classes = require('classes'),
    query = require('query'),
    xhr = require('xhr'),
    render = require('./templates/comments'),
    cache = require('ls-cache'),
    extend = require('extend'),
    vagueTime = require('vague-time');


exports = module.exports = init;


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


/**
 * Main module object.
 *
 * @param {string} frame - A CSS selector of the element to be populated by comments.
 * @param {Object} options - Module configuration.
 * @param {string} options.subreddit - The subreddit name.
 * @param {string} [options.url=document.URL] - The URL to retrieve comments for.
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
    this.options = extend(defaultOptions, options);
    this.frame = query(frame);
    this.baseApiUrl = 'http://www.reddit.com';
    return this;
};


/**
 * Object initialization function.
 *
 * Displays retrieved comments.
 */
RedditComments.prototype.init = function() {
    var rc = this,
        el = rc.el,
        frame = rc.frame;

    rc.getUrlId(
        rc.baseApiUrl + '/api/info.json?url=' + rc.options.url,
        /**
         * Retrieve the comments for a given a URL.
         *
         * @callback RedditComments~getUrlIdCallback
         * @param {string} urlId - The URL's ID36.
         */
        function(urlId) {
            rc.fetchComments(
                rc.baseApiUrl + '/r/' + rc.options.subreddit + '/comments/' + urlId + '.json',
                /**
                 * Process and render the comments.
                 *
                 * @callback RedditComments~fetchCommentsCallback
                 * @param {Object[]} comments - A list of comments as returned
                 *     by the Reddit API.
                 */
                function(comments) {
                    var cData = [];
                    for (var i = 0; i < comments.length; ++i) {
                        c = comments[i].data;
                        var date = new Date(0), vt;
                        if (c.children && c.children.length) {
                            // TODO: Deal with this
                            cData.push({body: 'NESTED COMMENT'});
                        } else {
                            date.setUTCSeconds(c.created_utc);
                            vt = vagueTime.get({to: date});
                            cData.push({author: c.author,
                                        created_vague: vt,
                                        created_timestamp: date,
                                        body: c.body});
                        }
                    }
                    frame.innerHTML = render({'comments': cData});
                }
            );
        }
    );
};


/**
 * Logs in a Reddit user.
 *
 * @param {string} username
 * @param {string} password
 */
RedditComments.prototype.login = function(username, password) {
};


/**
 * Logs out a Reddit user.
 */
RedditComments.prototype.logout = function() {
};


/**
 * Retrieves the URL's unique ID36.
 *
 * @param {string} url
 * @param {RedditComments~getUrlIdCallback} cb - The callback that handles the
 *     XHR response.
 */
RedditComments.prototype.getUrlId = function(url, cb) {
    var rc = this,
        hash = url.hashCode().toString(),
        urlId = cache.get(hash);

    if (urlId != null) {
        cb(urlId);
        return;
    }

    xhr(url,
        function(req) {
            var data = JSON.parse(req.response || {}).data;
            if (data && data.children.length) {
                var linkData = data.children[0].data;
                if (!(linkData.subreddit == rc.options.subreddit)) {
                    console.log("Post doesn't belong to this subreddit");
                } else {
                    cache.set(hash, linkData.id);
                    cb(linkData.id);
                }
            }
        }, function(err) {
            console.log(err);
        }
    );
};


/**
 * Retrieves the comments associated with an URL.
 *
 * @param {string} url
 * @param {RedditComments~fetchCommentsCallback} cb - The callback that processes
 *     the comments.
 */
RedditComments.prototype.fetchComments = function(url, cb) {
    var rc = this,
        hash = url.hashCode().toString(),
        comments = cache.get(hash);

    if (comments != null) {
        cb(comments);
        return;
    }

    xhr(url,
        function(req) {
            var data = JSON.parse(req.response || {});
            if (data[1].data) {
                comments = data[1].data.children;
                cache.set(hash, comments, rc.options.commentsCacheExpiration);
                cb(comments);
            }
        }, function(err) {
            console.log(err);
        }
    );
};


/**
 * Posts a comment on the Reddit post.
 *
 * @param {string} body - The comment body.
 */
RedditComments.prototype.comment = function(body) {
};
