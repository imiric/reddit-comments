
/**
 * Module dependencies.
 */
var Emitter = require('emitter')
  , domify = require('domify')
  , events = require('event')
  , classes = require('classes')
  , query = require('query');

exports = module.exports = RedditComments;

function RedditComments(frame, options) {
    options = options || {};
    this.template = require('./template.html');
    this.el = domify(this.template);
    this.frame = query(frame);
    this.options = options;
};

RedditComments.prototype.init = function() {
    var self = this
      , el = self.el
      , frame = self.frame;

    frame.innerHTML = self.template;
    return self;
};
