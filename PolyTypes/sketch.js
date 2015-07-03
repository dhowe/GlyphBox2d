var world, isStatic = false, font, txt = "p%5", x = 100, y = 150, fontSize = 150;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {

  createCanvas(500,700);
  background(100);
  strokeWeight(.5);
  //noStroke();

  var noHoles = false;
  var libs = [ 'decompose', 'triangulatePoly2Tri', 'triangulateEarcut', 'triangulatePnltri' ];
  for (var h = 0; h < libs.length; h++) {

    var tris = getPolygonTris(libs[h], noHoles), yoff = h * 150, total = 0;
    console.log(tris.length+" glyph");
    for (var k = 0; k < tris.length; k++) {
      var ptlist = tris[k];//k * fontSize*.7;
      push();
      translate(0,yoff);
      console.log(ptlist.length+" polys", ptlist);
      for (var i = 0; i < ptlist.length; i++) {
        fill(random(0,255),random(0,255),random(0,255));
        beginShape();
        for (var j = 0; j < ptlist[i].length; j++) {
          vertex(ptlist[i][j].x, ptlist[i][j].y);
          //console.log(ptlist[j].x, ptlist[j].y);
        }
        endShape(CLOSE);
      }
      pop();
    }

    stroke(255);
    line(0, y+yoff,width, y+yoff);
    fill(255);
    noStroke();
    text(libs[h].replace('triangulate',''), x-50, y+yoff);
  }
}

function getPolygonTris(trilib, noHoles) { // returns set of 2d[] of tris

  var result = [], glyphs = font._getGlyphs(txt), xoff = 0;

  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], x + xoff, y, fontSize);

    // then get polygons and pts
    for (var j = 0; j < polys.length; j++) {

      polys[j].simplify();
      polys[j][trilib](noHoles);
      result.push(polys[j].triangles);
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }

  return result;
}
