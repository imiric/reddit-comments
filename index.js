
/**
 * Module dependencies.
 */
var Emitter = require('emitter'),
    events = require('event'),
    classes = require('classes'),
    query = require('query'),
    xhr = require('xhr'),
    render = require('./templates/comments'),
    vagueTime = require('vague-time');

exports = module.exports = init;

function init(frame, options) {
    var rc = new RedditComments(frame, options);
    rc.init();
    return rc;
}

function RedditComments(frame, options) {
    options = options || {};
    this.frame = query(frame);
    this.options = options;
    // TODO: Throw exception if no subreddit supplied
    this.subreddit = options.subreddit;
    this.url = options.url || document.URL;
    this.baseApiUrl = 'http://www.reddit.com/';
    return this;
};

RedditComments.prototype.init = function() {
    var rc = this,
        el = rc.el,
        frame = rc.frame;

    rc.fetchComments(
        this.baseApiUrl + 'api/info.json?url=' + rc.url,
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
};

RedditComments.prototype.login = function() {
};

RedditComments.prototype.logout = function() {
};

RedditComments.prototype.fetchComments = function(url, cb) {
    var rc = this;

    xhr(url, function(req) {
        var data = JSON.parse(req.response || {}).data;
        if (data && data.children.length) {
            var linkData = data.children[0].data;
            if (!(linkData.subreddit == rc.subreddit)) {
                console.log("Post doesn't belong to this subreddit");
            } else {
                // Fetch all comments
                xhr(rc.baseApiUrl + '/r/' + rc.subreddit + '/comments/' + linkData.id + '.json',
                    function(req) {
                        var data = JSON.parse(req.response || {});
                        if (data[1].data) {
                            cb(data[1].data.children);
                        }
                    },
                    function(err) {
                        console.log(err);
                });
            }
        }
    }, function(err) {
        console.log(err);
    });
};

RedditComments.prototype.subredditExists = function(subreddit) {
};

RedditComments.prototype.comment = function() {
};
