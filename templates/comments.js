module.exports = function anonymous(obj) {

  function escape(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  function section(obj, prop, negate, tokens) {
    var val = obj[prop];
  
    function processTokens(ob, toks) {
      var out = '';
      for (var i = 0; i < toks.length; ++i) {
        var tok = toks[i];
        if (tok[0] == '{') {
          out += ob[tok.slice(1)];
        } else {
          out += tok;
        }
      }
      return out;
    }
  
    if (Array.isArray(val)) {
      var out = '';
      for (var i = 0; i < val.length; ++i) {
        out += processTokens(val[i], tokens);
      }
      return out;
    }
    if ('function' == typeof val) return val.call(obj, tokens.join(''));
    if (negate) val = !val;
    if (val) return processTokens(obj, tokens);
    return '';
  };

var out = "";out += section(obj, "comments", false, ["\n<div class=\"reddit-comment\">\n    <div class=\"rc-vote\">\n        <button class=\"rc-arrow rc-arrow-up\" />\n        <button class=\"rc-arrow rc-arrow-down\" />\n    </div>\n    <div class=\"rc-header\">\n        <span class=\"rc-author\">", "{author", "</span> &bull;\n        <span class=\"rc-score\">", "{score", "</span> points &bull;\n        around <span class=\"rc-created\" title=\"", "{created_timestamp", "\">", "{created_vague", "</span>\n    </div>\n    <p class=\"rc-comment\">", "{body", "</p>\n</div>\n"]);out += "\n";return out;
}