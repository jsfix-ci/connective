hljs.initHighlightingOnLoad();

function showOverlay(overlay, time) {
  overlay.classList.add('active');
  overlay.timeout = setTimeout(function(){ hideOverlay(overlay); }, time);
}

function hideOverlay(overlay) {
  clearTimeout(overlay.timeout);
  overlay.classList.remove('active');
}

//
// a minor polyfill
//
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

window.addEventListener('load', function() {
  var copyConfirm = document.getElementById('copy-confirm');

  //
  // copy whole code (like install instructions)
  //
  new ClipboardJS('pre[copy] code', {
      text: function(trigger) {
        showOverlay(copyConfirm, 2000);
        return trigger.textContent;
      }
  });

  document.querySelectorAll('.overlay').forEach(function(node) {
    node.addEventListener('click', function(){hideOverlay(node)});
  });


  //
  // break javascript code into distinct lines
  // make each line copiable
  //
  document.querySelectorAll('pre:not([copy]) code').forEach(function(node) {
    let lines = node.innerHTML.split('\n');
    node.innerHTML = '';
    for (var i = 0; i < lines.length; i++)
      if (lines[i].trim().length > 0)
        node.innerHTML += '<div class="line">' + lines[i] + '</div>';
      else node.innerHTML += '<br>';
  });

  new ClipboardJS('code .line', {
      text: function(trigger) {
        showOverlay(copyConfirm, 2000);
        return trigger.textContent;
      }
  });

  //
  // make the links of titles copiable
  //
  new ClipboardJS('h1[id], h2[id], h3[id]', {
    text: function(trigger) {
      showOverlay(copyConfirm, 2000);
      return location.protocol+'//'+location.host+location.pathname+'#'+trigger.getAttribute('id');
    }
  });

  //
  // make the toc
  //
  var div = document.createElement('div');
  var titles = document.querySelectorAll('h1[id], h2[id], h3[id]');
  var tocels = {};
  titles.forEach(function(node) {
    var a = document.createElement('a');
    a.setAttribute('href', location.protocol+'//'+location.host+location.pathname+'#'+node.getAttribute('id'));
    a.textContent = node.textContent;
    a.classList.add(node.tagName.toLowerCase());
    tocels[node.getAttribute('id')] = a;
    div.appendChild(a);
    div.appendChild(document.createElement('br'));
  });
  document.getElementById('toc').appendChild(div);
  window.addEventListener('scroll', function() {
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    var current = undefined;
    titles.forEach(function(node) { if (node.offsetTop <= scrollTop + window.innerHeight) current = node; });
    titles.forEach(function(node) {
      var tocel = tocels[node.getAttribute('id')];
      if ((node.offsetTop >= scrollTop &&
        node.offsetTop <= scrollTop + window.innerHeight) || node == current)
        tocel.classList.add('visible');
      else
        tocel.classList.remove('visible');
    });
  });

  //
  // nav toggle
  //
  var navtoggle = document.getElementById('navtoggle');
  var nav = document.getElementById('nav');
  navtoggle.addEventListener('click', function() {
    if (navtoggle.classList.contains('active')) {
      navtoggle.classList.remove('active');
      nav.classList.remove('active');
    }
    else {
      navtoggle.classList.add('active');
      nav.classList.add('active');
    }
  });

  //
  // nav prev/next
  //
  var navlinks = document.querySelectorAll('#nav a');
  var prevnext = document.getElementById('prevnext');
  if (prevnext) {
    (function() {
      var prev = document.getElementById('prev');
      var next = document.getElementById('next');

      navlinks.forEach(function(node, index, list) {
        if (node.getAttribute('href') == location.pathname) {
          if (index > 0) {
            var preva = list[index - 1];
            prev.innerHTML = '<a href="' + preva.getAttribute('href') + '">' + preva.textContent + '</a>';
            prev.classList.add('active');
            prev.addEventListener('click', function() {
              preva.click();
            });
          }

          if (index < list.length - 1) {
            var nexta = list[index + 1];
            next.innerHTML = '<a href="' + nexta.getAttribute('href') + '">' + nexta.textContent + '</a>';
            next.classList.add('active');
            next.addEventListener('click', function() {
              nexta.click();
            });
          }
        }
      });
    })();
  }

  //
  // nav search
  //
  (function() {
    var navsearchicon = document.getElementById('navsearchicon');

    var ajax = rxjs.ajax.ajax;
    var debounceTime = rxjs.operators.debounceTime;
    var fromEvent = rxjs.fromEvent;
    var wrap = connective.wrap;
    var pipe = connective.pipe;
    var map = connective.map;
    var filter = connective.filter;
    var value = connective.value;

    var res = connective.pin();
    var inp = document.getElementById('navsearch');
    var cache = {};

    var url = 'https://api.github.com/search/code?';
    var params = '+in:file+path:docs/templates+extension:njk+repo:CONNECT-platform/connective';

    var q = wrap(fromEvent(inp, 'input'))
    .to(map(function() {
      navsearchicon.classList.add('loading');
      return inp.value;
    }))
    .to(pipe(debounceTime(1000)));

    q.to(filter(function(q) { return q == ''; })).to(value('no-search')).to(res);
    q.to(filter(function(q) { return q.length > 0}))
      .to(map(function(q, done, error) {
        if (cache[q]) done(cache[q]);
        else {
          ajax.getJSON(url + 'q=' + encodeURIComponent(q) + params)
            .subscribe(
              function(resp) { cache[q] = resp; done(resp); },
              function(err) { error(err); }
            );
        }
      }))
      .to(map(function(res) {
        console.log(res);
        var list = [];
        var items = res.items || [];
        for (var i = 0; i < items.length; i++) {
          var path = items[i].path;
          list.push('/' + path.substr(0, path.length - 4).replace('/templates', ''));
        }

        return list;
      }))
      .to(res);

    res.subscribe(function(list) {
      navsearchicon.classList.remove('loading');
      navlinks.forEach(function(node) {
        if (list == 'no-search') {
          node.classList.remove('highlight');
          node.classList.remove('faded');
        }
        else {
          if (list.indexOf(node.getAttribute('href')) != -1) {
            node.classList.add('highlight');
            node.classList.remove('faded');
          }
          else {
            node.classList.remove('highlight');
            node.classList.add('faded');
          }
        }
      });
    });
  })();
});
