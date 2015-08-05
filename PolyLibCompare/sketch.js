var world, letter, isStatic = false, font, txts = ['%','p%','o%'], x = 100, y = 150, fontSize = 150;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {

  createCanvas(500,700);
  background(100);
  strokeWeight(.3);
  //noStroke();

  var noHoles = false;
  //var libs = [ 'tessDecomp', 'tessPoly2Tri', 'tessEarcut', 'tessPnltri' ];
  var libs = [ 'tessPoly2Tri', 'tessEarcut', 'tessPnltri' ];
  //libs = [ 'tessEarcut', 'tessEarcut','tessEarcut'];
  for (var h = 0; h < libs.length; h++) {
    var txt = 'p%';//txts[h];
    var tris = getPolygonTris(libs[h], txt, noHoles), yoff = h * 160, total = 0;
    for (var k = 0; k < tris.length; k++)
    {
      var ptlist = tris[k];
      push();
      stroke(0);
      noFill();
      translate(0,yoff);
      //console.log(ptlist.length+" polys", ptlist);
      for (var i = 0; i < ptlist.length; i++) {
        fill(random(0,255),random(0,255),random(0,255));
        beginShape();
        for (var j = 0; j < ptlist[i].length; j++) {
          vertex(ptlist[i][j].x, ptlist[i][j].y);
          //ellipse(ptlist[i][j].x, ptlist[i][j].y,3,3);
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
    text(libs[h].replace('tess',''), x-50, y+yoff);
  }
}

function getPolygonTris(trilib, txt, noHoles) { // returns set of 2d[] of tris

  var result = [], glyphs = font._getGlyphs(txt), xoff = 0;

  for (var i = 0; i < glyphs.length; i++) {

    var polys = glyphToPolys(glyphs[i], x + xoff, y, fontSize);

    console.log(glyphs[i].name+': '+polys.length+' poly(s)');
    letter = glyphs[i].name;
//if (i==0) continue;

    // then get polygons and pts
    for (var j = 0; j < polys.length; j++) {

      polys[j].simplify();

    //  if (i>0&&j!==2)
        console.log('  #'+(j+1)+') '+polys[j].points.length+' points, '+
          (polys[j].holes ? polys[j].holes.length : 0) +
          ' hole(s)');//polys[j].points.length);

      if (polys[j].holes) {
        var s = '';
        for (var k = 0; k < polys[j].holes[0].length; k++) {
          if (i>0&&j==1) {
            var px = polys[j].holes[0][k].x+94.95000000000004;
            var py = polys[j].holes[0][k].y;
            s += px+', '+py;
          }
        }
        //console.log(s);
      }

      polys[j][trilib](noHoles);
      result.push(polys[j].triangles);
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }

  return result;
}
