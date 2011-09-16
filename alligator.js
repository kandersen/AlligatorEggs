// alligator.js -*- coding: utf-8 -*-
//
// Copyright (c) 2011 Takashi Yamamiya <tak@metatoys.org>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

// ---------- User Interface ----------

function out(aString) {
  var transcript = $("#transcript");
  transcript.text(transcript.text() + aString + "\r\n");
}

function showIt() {
  var expression = document.getElementById('exp').value;
  document.location.hash = "#!/" + encodeURIComponent(expression);
  var term = parse(expression);
  if (!term) out("Syntax error");
  else termEval(term);
  document.body.scrollTop = document.body.scrollHeight;
  return false;
}

var stage;
var alligator;
var egg;
var close;

var getNewId = function() {
  var id = 0;
  return function () { return "id" + (++id); };
} ();

// ---------- Initialization ----------

$(function() {
  $('#stage').svg({ onLoad: loadSVG });

  $("#stage svg").click(function(event) {
    var x = event.pageX - this.offsetLeft;
    var y = event.pageY - this.offsetTop;
    showAlligator(x, y);
  });
  initExp();
  runViewTest();
});

function loadSVG() {
  stage = $('#stage').svg('get');
  var defs = stage.defs();

  alligator = stage.svg(defs);
  stage.load("open.svg", {parent: alligator, changeSize: true});

  egg = stage.svg(defs);
  stage.load("egg.svg", {parent: egg, changeSize: true});

  close = stage.svg(defs);
  stage.load("close.svg", {parent: close, changeSize: true});
}

function initExp() {
  var query= getQuery();
  if (query == "") return;
  $("#exp").val(query);
}

window.onhashchange = initExp;

// ---------- View Data Structures ----------

function Egg(idx) {
  this.idx = idx;
}

Egg.prototype.toString = function () {
  return "Egg(" + this.idx + ")";
};

function Eggs(terms) {
  this.terms = terms;
}

Eggs.prototype.toString = function () {
  var inner = this.terms.map(function(e) {
                               return e.toString();
                             }).join(",");
  return "Eggs[" + inner + "]";
};

function Sleep(term) {
  this.term = term;
}

Sleep.prototype.toString = function () {
  return "Sleep(" + this.term.toString() + ")";
};

function Awake(name, term) {
  this.name = name;
  this.term = term;
}

Awake.prototype.toString = function () {
  return "Awake(" + this.name + "," + this.term.toString() + ")";
};

function termToView(term, ctx) {
  switch (term[0]) {
  case Var:
    if (typeof term[1] == "number" && term[1] < ctx.length) return new Egg(ctx[term[1]]);
    if (typeof term[1] == "number") return new Egg("?" + term[1]);
    return new Egg(term[1]);
  case Abs:
    var pair = pickFreshName(ctx, term[1]);
    return new Awake(pair[1], termToView(term[2], pair[0]));
  case App:
    return termToEggs(term);
  }
  throw	"unknown tag:" + term[0];
}

function termToEggs(term, ctx) {
  switch (term[0]) {
  case Var:
  case Abs:
    return new Eggs([termToView(term, ctx)]);
  case App:
    var t1 = term[1];
    var t2 = term[2];
    var show1 = termToEggs(t1, ctx);
    var show2 = termToView(t2, ctx);
    return new Eggs(show1.terms.concat(show2));
  }
  throw	"unknown tag:" + term[0];
}


function runViewTest() {
  out("-- termToView test --");
  testEq(termToView(parseTerm("x",["x"])[1],["x"]), new Egg("x"));
  testEq(termToView(parse("x"),[]), new Egg("x"));
  testEq(termToView(parse("λx.x"),[]), new Awake("x", new Egg("x")));
  testEq(termToView(parse("x y"),[]), new Eggs([new Egg("x"), new Egg("y")]));
  testEq(termToView(parse("x x x"),[]), new Eggs([new Egg("x"), new Egg("x"), new Egg("x")]));
  testEq(termToView(parse("x (x x)"),[]),
         new Eggs([new Egg("x"), new Eggs([new Egg("x"), new Egg("x")])]));
  testEq(termToView(parse("(x x) (x x)"),[]),
         new Eggs([new Egg("x"), new Egg("x"), new Eggs([new Egg("x"), new Egg("x")])]));
}

// ----------


var colours = ['purple', 'red', 'orange', 'yellow', 'lime', 'green', 'blue', 'navy', 'black'];

function showAlligator(x0, y0) {
  var cx = 228;
  var cy = 70;

  var x = x0 - cx;
  var y = y0 - cy;

  var a = $("#alligator", alligator)[0];
  var newImg = stage.clone(a)[0];
  newImg.id = getNewId();

  var hue = random(360);
  stage.style("#" + newImg.id + " .border { fill: hsl(" + hue + ",100%,25%) }"
            + "#" + newImg.id + " .skin { fill: hsl(" + hue + ",100%,65%) }" );

  var translate = "translate(" + x + "," + y + ")";
  var rotate0 = "rotate(0, " + cx + "," + cy + ")";
  var rotate1 = "rotate(360, " + cx + "," + cy + ")";

  stage.change(newImg, {transform: translate + rotate0});
  stage.change($("#face", newImg)[0], {transform: "rotate(35, 200, 100)"});

  $(newImg).animate({svgTransform: translate + rotate1}, 1000,
    function() { $("#face", newImg).animate({svgTransform: "rotate(0, 200, 100)"}, 200); });
}

function image () {
  showAlligator(random(400), random(300));
}

function random(range) {
  return Math.floor(Math.random() * range);
}