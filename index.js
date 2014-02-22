
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

function ConfigurationException(value, message) {
   this.value = value;
   this.message = message;
   this.toString = function() {
      return this.constructor.name + ': ' + this.value + this.message
   };
}

function RedditComments(frame, options) {
    var defaultOptions = {
        url: document.URL,
        commentsCacheExpiration: 5
    };
    if (!(options || {}).hasOwnProperty('subreddit')) {
        throw new ConfigurationException('"subreddit"', ' is missing');
    }
    this.options = extend(defaultOptions, options);
    this.frame = query(frame);
    this.baseApiUrl = 'http://www.reddit.com';
    return this;
};

RedditComments.prototype.init = function() {
    var rc = this,
        el = rc.el,
        frame = rc.frame;

    rc.getSubId(
        rc.baseApiUrl + '/api/info.json?url=' + rc.options.url,
        function(subId) {
            rc.fetchComments(
                rc.baseApiUrl + '/r/' + rc.options.subreddit + '/comments/' + subId + '.json',
                function(comments) {
                    var cData = [];
                    for (var i=0; i<comments.length; ++i) {
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

RedditComments.prototype.login = function() {
};

RedditComments.prototype.logout = function() {
};

RedditComments.prototype.getSubId = function(url, cb) {
    var rc = this,
        hash = url.hashCode().toString(),
        subId = cache.get(hash);

    if (subId != null) {
        cb(subId);
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
                    cache.set(hash, linkData.id, 1440);
                    cb(linkData.id);
                }
            }
        }, function(err) {
            console.log(err);
        }
    );
};

RedditComments.prototype.fetchComments = function(url, cb) {
    var hash = url.hashCode().toString(),
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
                cache.set(hash, comments, 5);
                cb(comments);
            }
        }, function(err) {
            console.log(err);
        }
    );
};

RedditComments.prototype.subredditExists = function(subreddit) {
};

RedditComments.prototype.comment = function() {
};
