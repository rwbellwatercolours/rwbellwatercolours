/* ==========================================================================
   Robert W. Bell Watercolours — site behaviour

   Builds the header, footer, painting grid, and lightbox from the data in
   content/site.js and content/artworks.js.

   You should not need to edit this file to add or change paintings.
   ========================================================================== */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var ARTWORKS = window.ARTWORKS || [];

  var NAV = [
    { id: "watercolours", label: "Watercolours", href: "index.html" },
    { id: "about", label: "About", href: "about.html" },
  ];

  /* ---------------------------------------------------------------- helpers */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function param(name) {
    var match = new RegExp("[?&]" + name + "=([^&]*)").exec(
      window.location.search
    );
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : null;
  }

  /* Web and email addresses typed into paragraph text become links, so the
     content files stay plain text with no HTML in them. A trailing full stop
     or bracket is left outside the link. */
  var LINK_PATTERN =
    /(?:https?:\/\/[^\s<>"]+)|(?:[a-z0-9][a-z0-9._-]*@[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+)|(?:(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|ca|org|net|io|co|uk|art|gallery)(?:\/[^\s<>"]*)?)/i;

  function linkify(text) {
    var fragment = document.createDocumentFragment();
    var pattern = new RegExp(LINK_PATTERN.source, "gi");
    var cursor = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      var found = match[0].replace(/[.,;:!?)\]]+$/, "");
      if (!found) continue;

      fragment.appendChild(
        document.createTextNode(text.slice(cursor, match.index))
      );

      var link = el("a", "prose__link", found);
      if (found.indexOf("@") > -1 && found.indexOf("/") === -1) {
        link.href = "mailto:" + found;
      } else {
        link.href = /^https?:\/\//i.test(found) ? found : "https://" + found;
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      fragment.appendChild(link);

      cursor = match.index + found.length;
      pattern.lastIndex = cursor;
    }

    fragment.appendChild(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  /* Spread paintings across N columns so the columns finish at roughly the
     same height — otherwise one side trails off into a long gap.

     `sizes` is a list of {width, height}. Returns a list of index lists.
     Within each column the indices stay in list order, so paintings still
     read top to bottom in the order they appear in artworks.js. */
  function packColumns(sizes, columnCount) {
    var n = sizes.length;
    if (columnCount < 2 || n === 0) {
      return [
        sizes.map(function (_, i) {
          return i;
        }),
      ];
    }

    // Each painting's height as a fraction of the column width, plus a gap.
    var costs = sizes.map(function (size) {
      return (Number(size.height) || 3) / (Number(size.width) || 4) + 0.12;
    });

    var assigned = new Array(n);
    var heights = new Array(columnCount).fill(0);

    // First pass: put each painting in whichever column is shortest so far.
    for (var i = 0; i < n; i++) {
      var pick = 0;
      for (var c = 1; c < columnCount; c++) {
        if (heights[c] < heights[pick]) pick = c;
      }
      assigned[i] = pick;
      heights[pick] += costs[i];
    }

    // Second pass: greedy alone can end up lopsided (a run of tall paintings
    // lands on one side). Repeatedly take the single move or swap that most
    // reduces the tallest-to-shortest gap, until nothing helps.
    function spread(hs) {
      return Math.max.apply(null, hs) - Math.min.apply(null, hs);
    }

    var swapsAffordable = n <= 200;
    for (var pass = 0; pass < 40; pass++) {
      var best = spread(heights);
      var move = null;

      for (var a = 0; a < n; a++) {
        var from = assigned[a];
        for (var to = 0; to < columnCount; to++) {
          if (to === from) continue;
          heights[from] -= costs[a];
          heights[to] += costs[a];
          if (spread(heights) < best - 1e-9) {
            best = spread(heights);
            move = { kind: "move", a: a, to: to };
          }
          heights[from] += costs[a];
          heights[to] -= costs[a];
        }
      }

      if (swapsAffordable) {
        for (var x = 0; x < n; x++) {
          for (var y = x + 1; y < n; y++) {
            if (assigned[x] === assigned[y]) continue;
            var cx = assigned[x];
            var cy = assigned[y];
            var delta = costs[y] - costs[x];
            heights[cx] += delta;
            heights[cy] -= delta;
            if (spread(heights) < best - 1e-9) {
              best = spread(heights);
              move = { kind: "swap", a: x, b: y };
            }
            heights[cx] -= delta;
            heights[cy] += delta;
          }
        }
      }

      if (!move) break;

      if (move.kind === "move") {
        heights[assigned[move.a]] -= costs[move.a];
        heights[move.to] += costs[move.a];
        assigned[move.a] = move.to;
      } else {
        var ca = assigned[move.a];
        var cb = assigned[move.b];
        heights[ca] += costs[move.b] - costs[move.a];
        heights[cb] += costs[move.a] - costs[move.b];
        assigned[move.a] = cb;
        assigned[move.b] = ca;
      }
    }

    var columns = [];
    for (var k = 0; k < columnCount; k++) columns.push([]);
    for (var j = 0; j < n; j++) columns[assigned[j]].push(j);
    return columns;
  }

  /* ----------------------------------------------------------------- header */

  function currentPage() {
    return document.body.getAttribute("data-page") || "";
  }

  function buildHeader() {
    var mount = document.querySelector("[data-header]");
    if (!mount) return;

    var page = currentPage();

    var container = el("div", "header-container");
    var gutter = el("div", "gutter");
    var header = el("div", "header");

    var h1 = el("h1");
    var titleLink = el("a", "header__title", SITE.name || "Portfolio");
    titleLink.href = "index.html";
    h1.appendChild(titleLink);

    var navbar = el("div", "navbar");
    NAV.forEach(function (item) {
      var isSelected = item.id === page;
      var link = el(
        "a",
        "navbar__link" + (isSelected ? " is-selected" : ""),
        item.label
      );
      link.href = item.href;
      if (isSelected) link.setAttribute("aria-current", "page");
      navbar.appendChild(link);
    });

    var menuButton = el("button", "menu-button");
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "Open menu");
    menuButton.setAttribute("aria-haspopup", "dialog");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.innerHTML =
      '<svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">' +
      '<rect y="0" width="20" height="1.5" fill="currentColor"/>' +
      '<rect y="6.25" width="20" height="1.5" fill="currentColor"/>' +
      '<rect y="12.5" width="20" height="1.5" fill="currentColor"/></svg>';

    // The magnifier sits to the right of the page links; the field it opens
    // is a full-width bar on its own row underneath.
    var search = buildSearch(page);
    header.appendChild(h1);
    header.appendChild(navbar);
    header.appendChild(search.toggle);
    header.appendChild(menuButton);
    gutter.appendChild(header);
    gutter.appendChild(search.bar);
    container.appendChild(gutter);
    mount.appendChild(container);

    buildMobileMenu(menuButton, page);
  }

  /* Magnifier in the menu bar, on every page. Only the Watercolours grid can
     actually be filtered, so on any other page the magnifier takes you there
     with the field already open. `onSearch` is the live filter, registered by
     renderWatercolours. */
  var onSearch = null;
  var searchControl = null;

  function buildSearch(page) {
    var filtersHere = page === "watercolours";

    var toggle = el("button", "search-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Search paintings by title");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
      '<circle cx="7.5" cy="7.5" r="6" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5"/><path d="M12 12l5 5" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round"/></svg>';

    // Its own row under the header, the full width of the gutter.
    var bar = el("div", "search-bar");
    bar.setAttribute("data-open", "false");

    var field = el("input", "search-bar__field");
    field.type = "search";
    field.placeholder = "Search paintings by title";
    field.setAttribute("aria-label", "Search paintings by title");

    var clear = el("button", "search-bar__clear");
    clear.type = "button";
    clear.setAttribute("aria-label", "Close search");
    clear.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M1 1l14 14M15 1L1 15" stroke="currentColor" ' +
      'stroke-width="1.5" fill="none"/></svg>';

    bar.appendChild(field);
    bar.appendChild(clear);

    function setOpen(open) {
      bar.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.classList.toggle("is-active", open);
      if (open) field.focus();
    }

    function close() {
      field.value = "";
      if (onSearch) onSearch("");
      setOpen(false);
    }

    toggle.addEventListener("click", function () {
      if (!filtersHere) {
        // Hand off to the page that has the paintings, already open.
        window.location.href = "index.html?search=1";
        return;
      }
      if (bar.getAttribute("data-open") === "true") close();
      else setOpen(true);
    });

    clear.addEventListener("click", function () {
      close();
      toggle.focus();
    });

    field.addEventListener("input", function () {
      if (onSearch) onSearch(field.value);
    });

    field.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      close();
      toggle.focus();
    });

    searchControl = {
      openWith: function (value) {
        field.value = value || "";
        setOpen(true);
        if (onSearch) onSearch(field.value);
      },
    };

    return { toggle: toggle, bar: bar };
  }

  function buildMobileMenu(menuButton, page) {
    var menu = el("div", "mobile-menu");
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "Menu");
    menu.setAttribute("data-open", "false");

    var gutter = el("div", "gutter");

    var bar = el("div", "mobile-menu__bar");
    bar.appendChild(el("div", "mobile-menu__title", SITE.name || "Portfolio"));

    var close = el("button", "menu-button");
    close.type = "button";
    close.style.display = "inline-flex";
    close.setAttribute("aria-label", "Close menu");
    close.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
      '<path d="M1 1l16 16M17 1L1 17" stroke="currentColor" stroke-width="1.5"/></svg>';
    bar.appendChild(close);

    var items = el("div", "mobile-menu__items");
    NAV.forEach(function (item) {
      var isSelected = item.id === page;
      var link = el(
        "a",
        "mobile-menu__link" + (isSelected ? " is-selected" : ""),
        item.label
      );
      link.href = item.href;
      items.appendChild(link);
    });

    gutter.appendChild(bar);
    gutter.appendChild(items);
    menu.appendChild(gutter);
    document.body.appendChild(menu);

    function setOpen(open) {
      menu.setAttribute("data-open", open ? "true" : "false");
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    }

    menuButton.addEventListener("click", function () {
      setOpen(true);
    });
    close.addEventListener("click", function () {
      setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ----------------------------------------------------------------- footer */

  function navGroup(title, links) {
    var group = el("div", "footer__nav-group");
    group.appendChild(el("h3", "footer__nav-title", title));
    var list = el("div", "footer__nav-items");
    links.forEach(function (item) {
      var link = el("a", "footer__nav-item", item.label);
      link.href = item.url;
      if (item.external) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      list.appendChild(link);
    });
    group.appendChild(list);
    return group;
  }

  function buildFooter() {
    var mount = document.querySelector("[data-footer]");
    if (!mount) return;

    var container = el("div", "footer-container");
    var gutter = el("div", "gutter");

    var top = el("div", "footer__top");

    var contact = el("div", "footer__contact");
    var personal = el("div", "footer__personal");
    personal.appendChild(el("div", "footer__title", SITE.name || "Portfolio"));
    if (SITE.email) {
      var email = el("a", "footer__email", SITE.email);
      email.href = "mailto:" + SITE.email;
      personal.appendChild(email);
    }
    contact.appendChild(personal);

    var groups = el("div", "footer__nav-groups");
    groups.appendChild(
      navGroup(
        "Menu",
        NAV.map(function (item) {
          return { label: item.label, url: item.href };
        })
      )
    );

    if (SITE.social && SITE.social.length) {
      groups.appendChild(
        navGroup(
          "Social",
          SITE.social.map(function (item) {
            return { label: item.label, url: item.url, external: true };
          })
        )
      );
    }

    top.appendChild(contact);
    top.appendChild(groups);

    var bottom = el("div", "footer__bottom");
    bottom.appendChild(el("span", "footer__note", SITE.footerNote || ""));

    gutter.appendChild(top);
    gutter.appendChild(bottom);
    container.appendChild(gutter);
    mount.appendChild(container);
  }

  /* ------------------------------------------------------------------- grid */

  /* Screen-reader text for a painting: an explicit `alt` description wins,
     then the title, then a generic fallback. */
  function altFor(item) {
    if (item.alt) return item.alt;
    if (item.title) return item.title + (item.year ? ", " + item.year : "");
    return "Painting by " + (SITE.name || "the artist");
  }

  /* `showCaption` is false on the front page, where the images stand alone —
     there the title is revealed over the painting on hover instead. Album
     pages set it true and print the title underneath. */
  function artworkTile(item, index, onOpen, showCaption) {
    var button = el("button", "work-item");
    button.type = "button";

    var frame = el("div", "work-item__frame");

    var img = el("img", "work-item__image");
    img.src = item.src;
    img.alt = altFor(item);
    if (item.width) img.width = item.width;
    if (item.height) img.height = item.height;
    img.loading = index < 4 ? "eager" : "lazy";
    img.decoding = "async";
    frame.appendChild(img);

    if (!showCaption && item.title) {
      var overlay = el("div", "work-item__reveal");
      overlay.appendChild(el("span", "work-item__reveal-title", item.title));
      frame.appendChild(overlay);
    }

    button.appendChild(frame);

    if (showCaption) {
      if (item.title) {
        button.appendChild(el("div", "work-item__caption", item.title));
      }
      var meta = [item.medium, item.year].filter(Boolean).join(" · ");
      if (meta) button.appendChild(el("div", "work-item__meta", meta));
    }

    button.addEventListener("click", function () {
      onOpen(index);
    });
    return button;
  }

  /* How many columns each kind of grid uses at a given screen width. These
     must match the breakpoints for .work-grid in site.css. */
  var COLUMNS = {
    // Big plates: one column on phones so paintings read in list order.
    roomy: function (w) {
      return w <= 640 ? 1 : 2;
    },
    // Small thumbnails, packed tighter. Caps at four across so the paintings
    // keep a usable size on a wide screen.
    compact: function (w) {
      if (w <= 640) return 2;
      if (w <= 900) return 3;
      return 4;
    },
  };

  /* `sizeOf` returns the {width, height} used to balance the columns;
     `makeTile` turns an item plus its position in the flat list into a node;
     `afterDraw` gets the finished grid once it is in the document. */
  function renderPacked(mount, items, sizeOf, makeTile, afterDraw, density) {
    var rendered = null;
    var current = items;
    var columnsAt = COLUMNS[density] || COLUMNS.roomy;

    function draw() {
      var count = columnsAt(window.innerWidth);
      // A resize that doesn't change the column count needs no repacking.
      if (count === rendered) return;
      rendered = count;
      paint(count);
    }

    function paint(count) {
      mount.innerHTML = "";
      var grid = el(
        "div",
        "work-grid" + (density === "compact" ? " work-grid--compact" : "")
      );
      grid.style.gridTemplateColumns =
        "repeat(" + count + ", minmax(0px, 1fr))";

      packColumns(current.map(sizeOf), count).forEach(function (indices) {
        var column = el("div", "work-grid__column");
        indices.forEach(function (i) {
          column.appendChild(makeTile(current[i], i));
        });
        grid.appendChild(column);
      });

      mount.appendChild(grid);
      if (afterDraw) afterDraw(grid);
    }

    draw();
    window.addEventListener("resize", draw);

    return {
      // Swap the list and repack straight away — used by the search filter.
      setItems: function (next) {
        current = next;
        rendered = columnsAt(window.innerWidth);
        paint(rendered);
      },
    };
  }

  /* Reading order as the eye sees it: whichever tile starts higher comes
     first, and tiles level with each other go left to right. Because the
     columns are packed by height, this is NOT the order of artworks.js. */
  function visualOrder(grid) {
    var tiles = [].slice.call(grid.querySelectorAll("[data-index]"));
    tiles.sort(function (a, b) {
      var gap = a.offsetTop - b.offsetTop;
      if (Math.abs(gap) > 4) return gap;
      return a.offsetLeft - b.offsetLeft;
    });
    return tiles.map(function (tile) {
      return Number(tile.getAttribute("data-index"));
    });
  }

  /* `openList(paintings, position)` opens the viewer. The list handed over is
     in on-screen order, so paging through the viewer follows the grid rather
     than the order of artworks.js. */
  function renderGrid(mount, items, openList, options) {
    var settings = options || {};
    var visible = items;
    var order = visible.map(function (_, i) {
      return i;
    });

    function openAt(index) {
      var position = order.indexOf(index);
      openList(
        order.map(function (i) {
          return visible[i];
        }),
        position < 0 ? 0 : position
      );
    }

    var packed = renderPacked(
      mount,
      visible,
      function (item) {
        return item;
      },
      function (item, i) {
        var tile = artworkTile(item, i, openAt, settings.captions);
        tile.setAttribute("data-index", i);
        return tile;
      },
      function (grid) {
        order = visualOrder(grid);
      },
      settings.density
    );

    return {
      setItems: function (next) {
        visible = next;
        order = next.map(function (_, i) {
          return i;
        });
        packed.setItems(next);
      },
    };
  }

  function renderEmpty(mount, message) {
    mount.innerHTML = "";
    var box = el("div", "empty-state");
    box.innerHTML = message;
    mount.appendChild(box);
  }

  /* --------------------------------------------------------------- lightbox */

  var lightbox = null;

  function buildLightbox() {
    var root = el("div", "lightbox");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Painting viewer");
    root.setAttribute("data-open", "false");

    var stage = el("div", "lightbox__stage");
    var img = el("img", "lightbox__image");
    stage.appendChild(img);

    var bar = el("div", "lightbox__bar");
    var caption = el("div", "lightbox__caption");
    var meta = el("div", "lightbox__meta");
    var notes = el("div", "lightbox__notes");
    bar.appendChild(caption);
    bar.appendChild(meta);
    bar.appendChild(notes);

    function control(className, label, svg) {
      var button = el("button", "lightbox__control " + className);
      button.type = "button";
      button.setAttribute("aria-label", label);
      button.innerHTML = svg;
      return button;
    }

    var close = control(
      "lightbox__close",
      "Close",
      '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">' +
        '<path d="M2 2l22 22M24 2L2 24" stroke="currentColor" stroke-width="1.5" ' +
        'fill="none"/></svg>'
    );
    var prev = control(
      "lightbox__prev",
      "Previous painting",
      '<svg width="42" height="18" viewBox="0 0 42 18" aria-hidden="true">' +
        '<path d="M41 9H1M9 1L1 9l8 8" stroke="currentColor" stroke-width="1.5" ' +
        'fill="none" stroke-linecap="square" stroke-linejoin="miter"/></svg>'
    );
    var next = control(
      "lightbox__next",
      "Next painting",
      '<svg width="42" height="18" viewBox="0 0 42 18" aria-hidden="true">' +
        '<path d="M1 9h40M33 1l8 8-8 8" stroke="currentColor" stroke-width="1.5" ' +
        'fill="none" stroke-linecap="square" stroke-linejoin="miter"/></svg>'
    );

    root.appendChild(stage);
    root.appendChild(bar);
    root.appendChild(close);
    root.appendChild(prev);
    root.appendChild(next);
    document.body.appendChild(root);

    var items = [];
    var current = 0;
    var lastFocus = null;

    /* The ends are hard stops rather than wrapping around, which is what the
       greyed-out arrows are telling you. */
    function show(i) {
      current = Math.max(0, Math.min(i, items.length - 1));
      var item = items[current];
      img.src = item.src;
      img.alt = altFor(item);
      caption.textContent = item.title || "";
      meta.textContent = [item.medium, item.year].filter(Boolean).join(" · ");
      notes.textContent = item.notes || "";
      prev.hidden = items.length < 2;
      next.hidden = items.length < 2;
      prev.disabled = current === 0;
      next.disabled = current === items.length - 1;
    }

    function open(list, i) {
      items = list;
      lastFocus = document.activeElement;
      show(i);
      root.removeAttribute("data-closing");
      root.setAttribute("data-open", "true");
      close.focus();
    }

    function hide() {
      root.setAttribute("data-closing", "true");
      window.setTimeout(function () {
        root.setAttribute("data-open", "false");
        root.removeAttribute("data-closing");
        img.removeAttribute("src");
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }, 180);
    }

    close.addEventListener("click", hide);
    prev.addEventListener("click", function () {
      show(current - 1);
    });
    next.addEventListener("click", function () {
      show(current + 1);
    });
    /* The <img> is stretched over the whole stage so small paintings can scale
       up, which means the dark margin beside a painting is still the image
       element. Work out where the painting is actually drawn and treat
       anything outside it as scrim. */
    function onPainting(e) {
      var box = img.getBoundingClientRect();
      var nw = img.naturalWidth;
      var nh = img.naturalHeight;
      if (!nw || !nh) return true;

      var scale = Math.min(box.width / nw, box.height / nh);
      var drawnW = nw * scale;
      var drawnH = nh * scale;
      var left = box.left + (box.width - drawnW) / 2;
      var top = box.top + (box.height - drawnH) / 2;

      return (
        e.clientX >= left &&
        e.clientX <= left + drawnW &&
        e.clientY >= top &&
        e.clientY <= top + drawnH
      );
    }

    // Anywhere in the scrim closes: the stage padding, the caption row, the
    // backdrop itself, and the empty margin either side of the painting.
    root.addEventListener("click", function (e) {
      if (e.target === img) {
        if (!onPainting(e)) hide();
        return;
      }
      if (e.target === root || e.target === stage || e.target === bar) hide();
    });

    /* The arrows are hidden on phones, so swiping is the way through. */
    var swipeFrom = null;
    stage.addEventListener(
      "touchstart",
      function (e) {
        swipeFrom = e.touches.length === 1 ? e.touches[0].clientX : null;
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchend",
      function (e) {
        if (swipeFrom === null || !e.changedTouches.length) return;
        var travelled = e.changedTouches[0].clientX - swipeFrom;
        swipeFrom = null;
        if (Math.abs(travelled) < 40) return;
        show(travelled < 0 ? current + 1 : current - 1);
      },
      { passive: true }
    );

    document.addEventListener("keydown", function (e) {
      if (root.getAttribute("data-open") !== "true") return;
      if (e.key === "Escape") hide();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });

    return { open: open };
  }

  function openViewer(paintings, position) {
    if (!lightbox) lightbox = buildLightbox();
    lightbox.open(paintings, position);
  }

  /* ------------------------------------------------------------------ pages */

  function setTitle(prefix) {
    var name = SITE.name || "Portfolio";
    var tagline = SITE.tagline || "";
    // Don't repeat the tagline — the Watercolours page would otherwise read
    // "Watercolours — Robert W. Bell — Watercolours".
    var repeats =
      prefix && tagline && prefix.toLowerCase() === tagline.toLowerCase();
    var tail = tagline && !repeats ? name + " — " + tagline : name;
    document.title = prefix ? prefix + " — " + tail : tail;
    var meta = document.querySelector('meta[name="description"]');
    if (meta && SITE.description) meta.setAttribute("content", SITE.description);
  }

  function renderWatercolours(mount) {
    var items = ARTWORKS.filter(function (a) {
      return a.watercolours === true;
    });
    // The front page, so the browser tab reads "Robert W. Bell — Watercolours"
    // rather than repeating the word.
    setTitle("");
    if (!items.length) {
      renderEmpty(
        mount,
        "Nothing here yet. Add <code>watercolours: true</code> to a painting in <code>content/artworks.js</code> and it will appear on this page."
      );
      return;
    }
    var gridMount = el("div");
    var nothing = el("div", "empty-state");
    nothing.hidden = true;
    mount.appendChild(gridMount);
    mount.appendChild(nothing);

    var grid = renderGrid(gridMount, items, openViewer, {
      captions: false,
      density: "compact",
    });

    /* Filter by title as the visitor types in the menu-bar search. */
    onSearch = function (query) {
      var needle = String(query || "").trim().toLowerCase();
      var matches = needle
        ? items.filter(function (a) {
            return (a.title || "").toLowerCase().indexOf(needle) > -1;
          })
        : items;

      gridMount.hidden = matches.length === 0;
      nothing.hidden = matches.length !== 0;
      if (!matches.length) {
        nothing.textContent =
          'No paintings match "' + query.trim() + '".';
        return;
      }
      grid.setItems(matches);
    };
  }

  function renderAbout(mount) {
    setTitle("About");
    var about = SITE.about || {};
    mount.innerHTML = "";

    var wrap = el("div", "about");

    // No heading: the statement leads the page, as on the reference site.
    var body = el("div", "about__body");

    var prose = el("div", "prose about__bio");
    (about.paragraphs || []).forEach(function (text) {
      var paragraph = el("p");
      paragraph.appendChild(linkify(text));
      prose.appendChild(paragraph);
    });
    body.appendChild(prose);

    /* Contact first, then the art bio — all one ruled list, so every heading
       lines up in the left column and its entries in the right. */
    var rows = [];

    if (SITE.email) {
      rows.push({
        label: "Email",
        link: { text: SITE.email, url: "mailto:" + SITE.email },
      });
    }
    (SITE.social || []).forEach(function (item) {
      rows.push({
        label: item.label,
        link: {
          text: item.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
          url: item.url,
          external: true,
        },
      });
    });
    (about.cv || []).forEach(function (section) {
      if (!section || !section.heading) return;
      rows.push({ label: section.heading, items: section.items || [] });
    });

    if (rows.length) {
      var list = el("div", "about__attributes");
      rows.forEach(function (row) {
        var line = el("div", "about__attribute");

        var labelRow = el("div", "about__attribute-labelRow");
        labelRow.appendChild(el("div", "about__attribute-label", row.label));

        var content = el("div", "about__attribute-content");
        if (row.link) {
          var link = el("a", "about__attribute-link", row.link.text);
          link.href = row.link.url;
          if (row.link.external) {
            link.target = "_blank";
            link.rel = "noreferrer";
          }
          content.appendChild(link);
        } else {
          var entries = el("ul", "about__entries");
          row.items.forEach(function (entry) {
            entries.appendChild(el("li", "about__entry", entry));
          });
          content.appendChild(entries);
        }

        line.appendChild(labelRow);
        line.appendChild(content);
        list.appendChild(line);
      });
      body.appendChild(list);
    }

    wrap.appendChild(body);

    // Photographs run down the right-hand side, one under the next. They use
    // the same tile as the paintings, so they get the hover title and open in
    // the same full-screen viewer.
    var portraits = (about.portraits || []).filter(function (photo) {
      return photo && photo.src;
    });

    if (portraits.length) {
      var column = el("div", "about__portraits");
      portraits.forEach(function (photo, i) {
        var tile = artworkTile(
          photo,
          i,
          function (index) {
            openViewer(portraits, index);
          },
          false
        );
        tile.className += " about__portrait";
        column.appendChild(tile);
      });
      wrap.appendChild(column);
    }

    mount.appendChild(wrap);
  }

  /* ------------------------------------------------------------------- boot */

  function boot() {
    buildHeader();

    var mount = document.querySelector("[data-content]");
    if (mount) {
      var page = currentPage();
      if (page === "watercolours") renderWatercolours(mount);
      else if (page === "about") renderAbout(mount);

      /* Arriving from the magnifier on another page: open the field straight
         away, carrying any term across. Done after the grid renders so the
         filter has something to act on. */
      if (page === "watercolours" && searchControl) {
        var carried = param("q");
        if (carried || param("search")) searchControl.openWith(carried || "");
      }
    }

    buildFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
