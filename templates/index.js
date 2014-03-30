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

var out = "";out += "<!doctype html>\n<html>\n  <head>\n    <title>Reddit Comments</title>\n    <link rel=\"stylesheet\" href=\"";out += escape(obj.cssHref);out += "\"/>\n  </head>\n  <body>\n    ";out += section(obj, "authenticated", true, ["\n    <a href=\"#login\">login</a>\n    "]);out += "\n    ";out += obj.comments;out += "\n  </body>\n</html>\n";return out;
}