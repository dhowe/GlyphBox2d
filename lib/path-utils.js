var tmpPoint1 = [], tmpPoint2 = [];

function pointsFromPath(pathDataStr, simplify, numSamples) {

  var cmds = parsePathString(pathDataStr),
    len = getTotalLength(cmds),
    samples = numSamples || len / 4,
    sampleLen = len / samples,
    pts = [];

    var minX = minY = Number.MAX_VALUE;
    var maxX = maxY = -Number.MAX_VALUE;

    for ( var i = 0; i < len; i += sampleLen) {

        var pt = getPointAtLength(cmds, i);

        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;

        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;

        pts.push(pt);
    }

    if (simplify) {

      var count = removeCollinears(pts, .2);
      console.log('removed '+count+' pts');
    }

    var width = maxX-minX;
    var height = maxY-minY;

    return { points: pts,
      bounds: {
        x: minX,
        y: minY,
        x2: maxX,
        y2: maxY,
        w: width,
        h: height,
        cx: minX + width/2,
        cy: minY + height/2
      }
    };
    //return pts;
}

function pointInPoly(path, x, y, bbox) {

    return pointInRect(bbox, x, y) && pathHelper
        (path, [["M", x, y], ["H", bbox.x2 + 10]], true) % 2 == 1;
}

function pointInRect(bbox, x, y) { // takes x,y,x2,y2 (CORNERS)

    return x >= bbox.x && x <= bbox.x2 && y >= bbox.y && y <= bbox.y2;
};

function polyInPoly(path1, path2, justCount) {

    path1 = path2curve(path1);
    path2 = path2curve(path2);

    var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
        res = justCount ? 0 : [];

    for (var i = 0, ii = path1.length; i < ii; i++) {

        var pi = path1[i];

        if (pi[0] == "M") {
            x1 = x1m = pi[1];
            y1 = y1m = pi[2];

        } else {

            if (pi[0] == "C") {
                bez1 = [x1, y1].concat(pi.slice(1));
                x1 = bez1[6];
                y1 = bez1[7];
            } else {
                bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                x1 = x1m;
                y1 = y1m;
            }

            for (var j = 0, jj = path2.length; j < jj; j++) {

                var pj = path2[j];
                if (pj[0] == "M") {
                    x2 = x2m = pj[1];
                    y2 = y2m = pj[2];
                } else {
                    if (pj[0] == "C") {
                        bez2 = [x2, y2].concat(pj.slice(1));
                        x2 = bez2[6];
                        y2 = bez2[7];
                    } else {
                        bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                        x2 = x2m;
                        y2 = y2m;
                    }

                    var intr = interHelper(bez1, bez2, justCount);
                    if (justCount) {
                        res += intr;
                    } else {
                        for (var k = 0, kk = intr.length; k < kk; k++) {
                            intr[k].segment1 = i;
                            intr[k].segment2 = j;
                            intr[k].bez1 = bez1;
                            intr[k].bez2 = bez2;
                        }
                        res = res.concat(intr);
                    }
                }
            }
        }
    }
    return res;
}

function interHelper(bez1, bez2, justCount) {
    var bbox1 = bezierBBox(bez1),
        bbox2 = bezierBBox(bez2);
    if (!isBBoxIntersect(bbox1, bbox2)) {
        return justCount ? 0 : [];
    }
    var l1 = bezlen.apply(0, bez1),
        l2 = bezlen.apply(0, bez2),
        n1 = Math.max(~~(l1 / 5), 1),
        n2 = Math.max(~~(l2 / 5), 1),
        dots1 = [],
        dots2 = [],
        xy = {},
        res = justCount ? 0 : [];
    for (var i = 0; i < n1 + 1; i++) {
        var p = findDotsAtSegment.apply(R, bez1.concat(i / n1));
        dots1.push({x: p.x, y: p.y, t: i / n1});
    }
    for (i = 0; i < n2 + 1; i++) {
        p = findDotsAtSegment.apply(R, bez2.concat(i / n2));
        dots2.push({x: p.x, y: p.y, t: i / n2});
    }
    for (i = 0; i < n1; i++) {
        for (var j = 0; j < n2; j++) {
            var di = dots1[i],
                di1 = dots1[i + 1],
                dj = dots2[j],
                dj1 = dots2[j + 1],
                ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
            if (is) {
                if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                    continue;
                }
                xy[is.x.toFixed(4)] = is.y.toFixed(4);
                var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                    t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                if (t1 >= 0 && t1 <= 1.001 && t2 >= 0 && t2 <= 1.001) {
                    if (justCount) {
                        res++;
                    } else {
                        res.push({
                            x: is.x,
                            y: is.y,
                            t1: Math.min(t1, 1),
                            t2: Math.min(t2, 1)
                        });
                    }
                }
            }
        }
    }
    return res;
}

function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
    if (!R.is(p1x, "array")) {
        p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
    }
    var bbox = curveDim.apply(null, p1x);
    return {
        x: bbox.min.x,
        y: bbox.min.y,
        x2: bbox.max.x,
        y2: bbox.max.y,
        width: bbox.max.x - bbox.min.x,
        height: bbox.max.y - bbox.min.y
    };
}

function isBBoxIntersect(bbox1, bbox2) {
    var i = isPointInsideBBox;
    return i(bbox2, bbox1.x, bbox1.y)
        || i(bbox2, bbox1.x2, bbox1.y)
        || i(bbox2, bbox1.x, bbox1.y2)
        || i(bbox2, bbox1.x2, bbox1.y2)
        || i(bbox1, bbox2.x, bbox2.y)
        || i(bbox1, bbox2.x2, bbox2.y)
        || i(bbox1, bbox2.x, bbox2.y2)
        || i(bbox1, bbox2.x2, bbox2.y2)
        || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
        && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
}

/*
 * Remove collinear points from a set of vertices
 * @param  {Number} [precision] The threshold angle to use when determining
 *     whether two edges are collinear. Use zero for finest precision.
 * @return {Number}           The number of points removed
 */
function removeCollinears(pts, precision) {

    var num = 0;
    for (var i=pts.length-1; pts.length>3 && i>=0; --i) {
        if (collinear(at(pts, i-1), at(pts,i), at(pts,i+1), precision)) {

            // Remove the middle point
            pts.splice(i%pts.length,1);
            i--; // Jump one point forward to avoid chain removals
            num++;
        }
    }
    return num;
}

function at(v, i) {
    var s = v.length;
    return v[ i < 0 ? i % s + s : i % s ];
}

function collinear(a,b,c,thresholdAngle) {

    if(!thresholdAngle) return areaTriangle(a, b, c) == 0;

    var ab = tmpPoint1, bc = tmpPoint2;

    ab.x = b.x-a.x;
    ab.y = b.y-a.y;
    bc.x = c.x-b.x;
    bc.y = c.y-b.y;

    var dot = ab.x*bc.x + ab.y*bc.y,
        magA = Math.sqrt(ab.x*ab.x + ab.y*ab.y),
        magB = Math.sqrt(bc.x*bc.x + bc.y*bc.y),
        angle = Math.acos(dot/(magA*magB));

    return angle < thresholdAngle;
};

function areaTriangle(a,b,c) {

    return (((b[0] - a[0])*(c[1] - a[1]))-((c[0] - a[0])*(b[1] - a[1])));
}

function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
    var t1 = 1 - t,
        t13 = pow(t1, 3),
        t12 = pow(t1, 2),
        t2 = t * t,
        t3 = t2 * t,
        x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
        y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
        mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
        my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
        nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
        ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
        ax = t1 * p1x + t * c1x,
        ay = t1 * p1y + t * c1y,
        cx = t1 * c2x + t * p2x,
        cy = t1 * c2y + t * p2y,
        alpha = (90 - Math.atan2(mx - nx, my - ny) * 180 / PI);
    (mx > nx || my < ny) && (alpha += 180);
    return {
        x: x,
        y: y,
        m: {x: mx, y: my},
        n: {x: nx, y: ny},
        start: {x: ax, y: ay},
        end: {x: cx, y: cy},
        alpha: alpha
    };
}

function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {

    if (length == null) {
        return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
    } else {
        return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTatLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
    }
}

function getLengthFactory(istotal, subpath) {

    return function (path, length, onlystart) {
        path = path2curve(path);
        var x, y, p, l, sp = "", subpaths = {}, point,
            len = 0;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = +p[1];
                y = +p[2];
            } else {
                l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                if (len + l > length) {
                    if (subpath && !subpaths.start) {
                        point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                        sp += ["C" + point.start.x, point.start.y, point.m.x, point.m.y, point.x, point.y];
                        if (onlystart) {return sp;}
                        subpaths.start = sp;
                        sp = ["M" + point.x, point.y + "C" + point.n.x, point.n.y, point.end.x, point.end.y, p[5], p[6]].join();
                        len += l;
                        x = +p[5];
                        y = +p[6];
                        continue;
                    }
                    if (!istotal && !subpath) {
                        point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                        return {x: point.x, y: point.y, alpha: point.alpha};
                    }
                }
                len += l;
                x = +p[5];
                y = +p[6];
            }
            sp += p.shift() + p;
        }
        subpaths.end = sp;
        point = istotal ? len : subpath ? subpaths : R.findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
        point.alpha && (point = {x: point.x, y: point.y, alpha: point.alpha});
        return point;
    };
}

function parsePathString(pathString) {

    var pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig, pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig,
    paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
    data = [];

    if (!data.length) {
        String(pathString).replace(pathCommand, function (a, b, c) {
            var params = [],
            name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            if (name == "m" && params.length > 2) {
                data.push([b].concat(params.splice(0, 2)));
                name = "l";
                b = b == "m" ? "l" : "L";
            }
            if (name == "r") {
                data.push([b].concat(params));
            } else
            {
                while (params.length >= paramCounts[name]) {
                    data.push([b].concat(params.splice(0, paramCounts[name])));
                    if (!paramCounts[name]) {
                        break;
                    }
                }
            }
        });
    }

    return data;
}


var getTotalLength = getLengthFactory(1),
    getPointAtLength = getLengthFactory(),
    getSubpathsAtLength = getLengthFactory(0, 1);

function pathToAbsolute(pathArray) {

  var res = [],
    x = 0,
    y = 0,
    mx = 0,
    my = 0,
    start = 0;

  if (pathArray[0][0] == "M") {
    x = +pathArray[0][1];
    y = +pathArray[0][2];
    mx = x;
    my = y;
    start++;
    res[0] = ["M", x, y];
  }

  var crz = pathArray.length == 3 && pathArray[0][0] == "M" && pathArray[1][0].toUpperCase() == "R" && pathArray[2][0].toUpperCase() == "Z";
  for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
    res.push(r = []);
    pa = pathArray[i];
    if (pa[0] != String.prototype.toUpperCase.call(pa[0])) {
      r[0] = String.prototype.toUpperCase.call(pa[0]);
      switch (r[0]) {
        case "A":
          r[1] = pa[1];
          r[2] = pa[2];
          r[3] = pa[3];
          r[4] = pa[4];
          r[5] = pa[5];
          r[6] = +(pa[6] + x);
          r[7] = +(pa[7] + y);
          break;
        case "V":
          r[1] = +pa[1] + y;
          break;
        case "H":
          r[1] = +pa[1] + x;
          break;
        case "R":
          var dots = [x, y].concat(pa.slice(1));
          for (var j = 2, jj = dots.length; j < jj; j++) {
            dots[j] = +dots[j] + x;
            dots[++j] = +dots[j] + y;
          }
          res.pop();
          res = res.concat(catmullRom2bezier(dots, crz));
          break;
        case "M":
          mx = +pa[1] + x;
          my = +pa[2] + y;
        default:
          for (j = 1, jj = pa.length; j < jj; j++) {
            r[j] = +pa[j] + ((j % 2) ? x : y);
          }
      }
    }
    else if (pa[0] == "R") {
      dots = [x, y].concat(pa.slice(1));
      res.pop();
      res = res.concat(catmullRom2bezier(dots, crz));
      r = ["R"].concat(pa.slice(-2));
    } else {
      for (var k = 0, kk = pa.length; k < kk; k++) {
        r[k] = pa[k];
      }
    }
    switch (r[0]) {
      case "Z":
        x = mx;
        y = my;
        break;
      case "H":
        x = r[1];
        break;
      case "V":
        y = r[1];
        break;
      case "M":
        mx = r[r.length - 2];
        my = r[r.length - 1];
      default:
        x = r[r.length - 2];
        y = r[r.length - 1];
    }
  }

  return res;
}

function path2curve(path, path2) {

  var p = pathToAbsolute(path),
    p2 = path2 && pathToAbsolute(path2),
    attrs = {
      x: 0,
      y: 0,
      bx: 0,
      by: 0,
      X: 0,
      Y: 0,
      qx: null,
      qy: null
    },
    attrs2 = {
      x: 0,
      y: 0,
      bx: 0,
      by: 0,
      X: 0,
      Y: 0,
      qx: null,
      qy: null
    },

    processPath = function(path, d, pcom) {
      var nx, ny, tq = {
        T: 1,
        Q: 1
      };
      if (!path) {
        return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
      }!(path[0] in tq) && (d.qx = d.qy = null);
      switch (path[0]) {
        case "M":
          d.X = path[1];
          d.Y = path[2];
          break;
        case "A":
          path = ["C"].concat(a2c[apply](0, [d.x, d.y].concat(path.slice(1))));
          break;
        case "S":
          if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
            nx = d.x * 2 - d.bx; // And reflect the previous
            ny = d.y * 2 - d.by; // command's control point relative to the current point.
          } else { // or some else or nothing
            nx = d.x;
            ny = d.y;
          }
          path = ["C", nx, ny].concat(path.slice(1));
          break;
        case "T":
          if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
            d.qx = d.x * 2 - d.qx; // And make a reflection similar
            d.qy = d.y * 2 - d.qy; // to case "S".
          } else { // or something else or nothing
            d.qx = d.x;
            d.qy = d.y;
          }
          path = ["C"].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
          break;
        case "Q":
          d.qx = path[1];
          d.qy = path[2];
          path = ["C"].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
          break;
        case "L":
          path = ["C"].concat(l2c(d.x, d.y, path[1], path[2]));
          break;
        case "H":
          path = ["C"].concat(l2c(d.x, d.y, path[1], d.y));
          break;
        case "V":
          path = ["C"].concat(l2c(d.x, d.y, d.x, path[1]));
          break;
        case "Z":
          path = ["C"].concat(l2c(d.x, d.y, d.X, d.Y));
          break;
      }
      return path;
    },

    fixArc = function(pp, i) {
      if (pp[i].length > 7) {
        pp[i].shift();
        var pi = pp[i];
        while (pi.length) {
          pcoms1[i] = "A"; // if created multiple C:s, their original seg is saved
          p2 && (pcoms2[i] = "A"); // the same as above
          pp.splice(i++, 0, ["C"].concat(pi.splice(0, 6)));
        }
        pp.splice(i, 1);
        ii = Math.max(p.length, p2 && p2.length || 0);
      }
    },

    fixM = function(path1, path2, a1, a2, i) {
      if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
        path2.splice(i, 0, ["M", a2.x, a2.y]);
        a1.bx = 0;
        a1.by = 0;
        a1.x = path1[i][1];
        a1.y = path1[i][2];
        ii = Math.max(p.length, p2 && p2.length || 0);
      }
    },

    pcoms1 = [], // path commands of original path p
    pcoms2 = [], // path commands of original path p2
    pfirst = "", // temporary holder for original path command
    pcom = ""; // holder for previous path command of original path

  for (var i = 0, ii = Math.max(p.length, p2 && p2.length || 0); i < ii; i++) {
    p[i] && (pfirst = p[i][0]); // save current path command

    if (pfirst != "C") // C is not saved yet, because it may be result of conversion
    {
      pcoms1[i] = pfirst; // Save current path command
      i && (pcom = pcoms1[i - 1]); // Get previous path command pcom
    }
    p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

    if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
    // which may produce multiple C:s
    // so we have to make sure that C is also C in original path

    fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1

    if (p2) { // the same procedures is done to p2
      p2[i] && (pfirst = p2[i][0]);
      if (pfirst != "C") {
        pcoms2[i] = pfirst;
        i && (pcom = pcoms2[i - 1]);
      }
      p2[i] = processPath(p2[i], attrs2, pcom);

      if (pcoms2[i] != "A" && pfirst == "C") pcoms2[i] = "C";

      fixArc(p2, i);
    }
    fixM(p, p2, attrs, attrs2, i);
    fixM(p2, p, attrs2, attrs, i);
    var seg = p[i],
      seg2 = p2 && p2[i],
      seglen = seg.length,
      seg2len = p2 && seg2.length;
    attrs.x = seg[seglen - 2];
    attrs.y = seg[seglen - 1];
    attrs.bx = parseFloat(seg[seglen - 4]) || attrs.x;
    attrs.by = parseFloat(seg[seglen - 3]) || attrs.y;
    attrs2.bx = p2 && (parseFloat(seg2[seg2len - 4]) || attrs2.x);
    attrs2.by = p2 && (parseFloat(seg2[seg2len - 3]) || attrs2.y);
    attrs2.x = p2 && seg2[seg2len - 2];
    attrs2.y = p2 && seg2[seg2len - 1];
  }

  return p2 ? [p, p2] : p;
}

// http://schepers.cc/getting-to-the-point
function catmullRom2bezier(crp, z) {
  var d = [];
  for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
    var p = [{
      x: +crp[i - 2],
      y: +crp[i - 1]
    }, {
      x: +crp[i],
      y: +crp[i + 1]
    }, {
      x: +crp[i + 2],
      y: +crp[i + 3]
    }, {
      x: +crp[i + 4],
      y: +crp[i + 5]
    }];
    if (z) {
      if (!i) {
        p[0] = {
          x: +crp[iLen - 2],
          y: +crp[iLen - 1]
        };
      } else if (iLen - 4 == i) {
        p[3] = {
          x: +crp[0],
          y: +crp[1]
        };
      } else if (iLen - 2 == i) {
        p[2] = {
          x: +crp[0],
          y: +crp[1]
        };
        p[3] = {
          x: +crp[2],
          y: +crp[3]
        };
      }
    } else {
      if (iLen - 4 == i) {
        p[3] = p[2];
      } else if (!i) {
        p[0] = {
          x: +crp[i],
          y: +crp[i + 1]
        };
      }
    }
    d.push(["C", (-p[0].x + 6 * p[1].x + p[2].x) / 6, (-p[0].y + 6 * p[1].y + p[2].y) / 6, (p[1].x + 6 * p[2].x - p[3].x) / 6, (p[1].y + 6 * p[2].y - p[3].y) / 6,
      p[2].x,
      p[2].y
    ]);
  }

  return d;
}

function l2c(x1, y1, x2, y2) {
    return [x1, y1, x2, y2, x2, y2];
}


function q2c(x1, y1, ax, ay, x2, y2) {
    var _13 = 1 / 3,
        _23 = 2 / 3;
    return [
            _13 * x1 + _23 * ax,
            _13 * y1 + _23 * ay,
            _13 * x2 + _23 * ax,
            _13 * y2 + _23 * ay,
            x2,
            y2
        ];
}

function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
    if (z == null) {
        z = 1;
    }
    z = z > 1 ? 1 : z < 0 ? 0 : z;
    var z2 = z / 2,
        n = 12,
        Tvalues = [-0.1252,0.1252,-0.3678,0.3678,-0.5873,0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],
        Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
        sum = 0;
    for (var i = 0; i < n; i++) {
        var ct = z2 * Tvalues[i] + z2,
            xbase = base3(ct, x1, x2, x3, x4),
            ybase = base3(ct, y1, y2, y3, y4),
            comb = xbase * xbase + ybase * ybase;
        sum += Cvalues[i] * Math.sqrt(comb);
    }
    return z2 * sum;
}

function getTatLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
    if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
        return;
    }
    var t = 1,
        step = t / 2,
        t2 = t - step,
        l,
        e = .01;
    l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
    while (abs(l - ll) > e) {
        step /= 2;
        t2 += (l < ll ? 1 : -1) * step;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
    }
    return t2;
}

function base3(t, p1, p2, p3, p4) {
    var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
        t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
    return t * t2 - 3 * p1 + 3 * p2;
}
