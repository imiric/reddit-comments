
/**
 * Module dependencies.
 */
var Emitter = require('emitter'),
    events = require('event'),
    classes = require('classes'),
    query = require('query'),
    xhr = require('xhr'),
    render = require('./templates/comments');

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
    return this;
};

RedditComments.prototype.init = function() {
    var self = this
      , el = self.el
      , frame = self.frame;

    frame.innerHTML = self.template;
    return self;
};
