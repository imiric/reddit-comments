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

var out = "";out += "<div class=\"reddit-comment\">\n    <div class=\"rc-vote\">\n        <button class=\"rc-arrow rc-arrow-up\"></button>\n        <button class=\"rc-arrow rc-arrow-down\"></button>\n    </div>\n    <button class=\"rc-collapse rc-icon-horiz\"></button>\n    <div class=\"rc-header\">\n        <span class=\"rc-author\">";out += escape(obj.author);out += "</span> &bull;\n        <span class=\"rc-score\">";out += escape(obj.score);out += "</span> points &bull;\n        around <span class=\"rc-created\" title=\"";out += escape(obj.created_timestamp);out += "\">";out += escape(obj.created_vague);out += "</span>\n    </div>\n    <div class=\"rc-comment\">";out += obj.body;out += "</div>\n    ";out += obj.replies;out += "\n</div>\n";return out;
}