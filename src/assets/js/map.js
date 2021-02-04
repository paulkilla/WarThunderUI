map_objects = null;
map_info = null;
map_image = new Image();

cookieLifeTime = 60*60*24*1000

map_scale = 1.0
map_pan = [0, 0]

prevMousePos = null
prevScale = null

lastT = null
blinkNormalT = 0.0
blinkHeavyT = 0.0
blinkNormalVal = 0.0
blinkHeavyVal = 0.0

lastPlayerPos = null
isDraggingMap = false
isTransformingMap = false

hammer_opt = {
  hold: false, tap:false, doubletap:false,
  drag:true, dragstart:true, dragend:true, dragup:false, dragdown:false, dragleft:false, dragright:false,
  swipe:false, swipeup:false, swipedown:false, swipeleft:false, swiperight:false,
  transform:true, transformstart:true, transformend:true, rotate:false,
  pinch:false, pinchin:false, pinchout:false,
  prevent_default: true,
  no_mouseevents: true
}

function addWheelHandler(elem, onWheel) {
  if (elem.addEventListener) {
    if ('onwheel' in document) {
      // IE9+, FF17+
      elem.addEventListener("wheel", onWheel, false);
    } else if ('onmousewheel' in document) {
      // obsolete version
      elem.addEventListener("mousewheel", onWheel, false);
    } else {
      // 3.5 <= Firefox < 17
      elem.addEventListener("MozMousePixelScroll", onWheel, false);
    }
  } else { // IE<9
    elem.attachEvent("onmousewheel", onWheel);
  }
}

function clampMapPan() {
  var canvas = document.getElementById('map-canvas')
  map_pan[0] = clamp(map_pan[0], -(map_scale-1.0)*canvas.width, 0)
  map_pan[1] = clamp(map_pan[1], -(map_scale-1.0)*canvas.height, 0)
}


function mapOnWheel(e) {
  e = e || window.event;
  var delta = e.wheelDelta ? e.wheelDelta : (e.deltaY || e.detail)*-40
  delta *= map_scale * 0.8

  var offsX = (e.offsetX!=undefined) ? e.offsetX : (e.pageX-$('#map-canvas').offset().left)
  var offsY = (e.offsetY!=undefined) ? e.offsetY : (e.pageY-$('#map-canvas').offset().top)
  map_scale_new = clamp(map_scale + delta * 0.001, 1.0, 15.0)
  map_pan[0] = offsX - (offsX - map_pan[0])*map_scale_new / map_scale
  map_pan[1] = offsY - (offsY - map_pan[1])*map_scale_new / map_scale
  map_scale = map_scale_new
  clampMapPan()

  redraw_map(0.0)

  e.preventDefault ? e.preventDefault() : (e.returnValue = false);
}

function on_touch_event(e) {
  if (!e.gesture) // ???
    return

  if (e.type == 'dragstart')
    isDraggingMap = true
  else if (e.type == 'transformstart')
    isTransformingMap = true
  else if (e.type == 'dragend')
    isDraggingMap = false
  else if (e.type == 'transformend')
    isTransformingMap = false
  else if (e.type == 'drag' || e.type == 'transform') {
    if (e.type == 'transform') {
      scale0 = map_scale
      map_scale = clamp(map_scale * e.gesture.scale / prevScale, 1.0, 3.0)

      // scale shift
      var offsX = e.gesture.center.pageX - $('#map-canvas').offset().left
      var offsY = e.gesture.center.pageY - $('#map-canvas').offset().top
      map_pan[0] = offsX - (offsX - map_pan[0])*map_scale / scale0
      map_pan[1] = offsY - (offsY - map_pan[1])*map_scale / scale0
    }

    // drag shift
    map_pan[0] += e.gesture.center.pageX - prevMousePos[0]
    map_pan[1] += e.gesture.center.pageY - prevMousePos[1]

    clampMapPan()
    redraw_map(0.0)
  } else {
    console.log('Unexpected event type')
    console.log(e)
    return
  }
  prevMousePos = [e.gesture.center.pageX, e.gesture.center.pageY]
  prevScale = e.gesture.scale
}


function calcMapObjectColor(item) {
  if (('blink' in item) && (item['blink'])) {
    var bv = (item['blink']==2 ? blinkHeavyVal : blinkNormalVal)

    var c0 = item['color[]']
    var c1 = [255, 255, 0]
    var c = rgb_to_hex(Math.floor(lerp(c0[0], c1[0], bv)), Math.floor(lerp(c0[1], c1[1], bv)), Math.floor(lerp(c0[2], c1[2], bv)))
    return c
  } else {
    return item['color']
  }
}

function drawMapGrid(canvas) {
  if (!map_info || !('map_min' in map_info))
    return

  var ctx = canvas.getContext('2d')
  var w = canvas.width
  var h = canvas.height
  var mapMin = map_info['map_min']
  var mapMax = map_info['map_max']
  var scX = w / (mapMax[0] - mapMin[0])
  var scY = h / (mapMax[1] - mapMin[1])

  ctx.lineWidth = 1
  ctx.strokeStyle = '#555'

  ctx.beginPath()
  for (var y = mapMin[1]; y <= mapMax[1]; y += map_info['grid_steps'][1]) {
    var yy = Math.floor((y-mapMin[1])*scY)+0.5
    ctx.moveTo(0, yy)
    ctx.lineTo(w, yy)
  }
  for (var x = mapMin[0]; x <= mapMax[0]; x += map_info['grid_steps'][0]) {
    var xx = Math.floor((x-mapMin[0])*scX)+0.5
    ctx.moveTo(xx, 0)
    ctx.lineTo(xx, h)
  }
  ctx.stroke()

  ctx.fillStyle = '#111'
  ctx.font = 'normal 9pt sans-serif'

  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  for (var y = mapMin[1]+map_info['grid_steps'][1]*0.5, n=0; y <= mapMax[1] && n < 26; y += map_info['grid_steps'][1], ++n) {
    var yy = Math.floor((y-mapMin[1])*scY)+0.5
    ctx.fillText(String.fromCharCode(65+n), 3, yy)
  }

  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'
  for (var x = mapMin[0]+map_info['grid_steps'][0]*0.5, n=1; x <= mapMax[0]; x += map_info['grid_steps'][0], ++n) {
    var xx = Math.floor((x-mapMin[0])*scX)+0.5
    ctx.fillText(n, xx, 3)
  }
}


function drawMapGridScaled(canvas) {
  if (!map_info || !('map_min' in map_info))
    return

  var ctx = canvas.getContext('2d')
  var w = canvas.width
  var h = canvas.height
  var mapMin = map_info['map_min']
  var mapMax = map_info['map_max']
  var gridSteps = map_info['grid_steps']
  var scX = w * map_scale / (mapMax[0] - mapMin[0])
  var scY = h * map_scale / (mapMax[1] - mapMin[1])

  var firstVisCellX = Math.floor((-map_pan[0] / scX) / gridSteps[0])
  var firstVisCellY = Math.floor((-map_pan[1] / scY) / gridSteps[1])
  var xVis0 = mapMin[0] + firstVisCellX * gridSteps[0]
  var yVis0 = mapMin[1] + firstVisCellY * gridSteps[1]
  var xVis1 = mapMin[0] + Math.ceil((w-map_pan[0]) / scX / gridSteps[0]) * gridSteps[0]
  var yVis1 = mapMin[1] + Math.ceil((h-map_pan[1]) / scY / gridSteps[1]) * gridSteps[1]

  ctx.lineWidth = 1
  ctx.strokeStyle = '#555'

  ctx.beginPath()
  for (var y = yVis0; y <= yVis1; y += gridSteps[1]) {
    var yy = Math.floor((y-mapMin[1])*scY+map_pan[1])+0.5
    ctx.moveTo(0, yy)
    ctx.lineTo(w, yy)
  }
  for (var x = xVis0; x <= xVis1; x += gridSteps[0]) {
    var xx = Math.floor((x-mapMin[0])*scX+map_pan[0])+0.5
    ctx.moveTo(xx, 0)
    ctx.lineTo(xx, h)
  }
  ctx.stroke()

  ctx.fillStyle = '#111'
  ctx.font = 'normal 9pt sans-serif'

  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  for (var y = yVis0+map_info['grid_steps'][1]*0.5, n=firstVisCellY; y <= yVis1 && n < 26; y += gridSteps[1], ++n) {
    var yy = Math.floor((y-mapMin[1])*scY+map_pan[1])+0.5
    ctx.fillText(String.fromCharCode(65+n), 3, yy)
  }

  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'
  for (var x = xVis0+map_info['grid_steps'][0]*0.5, n=firstVisCellX; x <= xVis1; x += gridSteps[0], ++n) {
    var xx = Math.floor((x-mapMin[0])*scX+map_pan[0])+0.5
    ctx.fillText(n+1, xx, 3)
  }
}


function draw_airfield(canvas, ctx, item) {
  var sx = canvas.width *item['sx']*map_scale + map_pan[0]
  var sy = canvas.height*item['sy']*map_scale + map_pan[1]
  var ex = canvas.width *item['ex']*map_scale + map_pan[0]
  var ey = canvas.height*item['ey']*map_scale + map_pan[1]

  ctx.lineWidth = 3.0*Math.sqrt(map_scale)
  ctx.strokeStyle = calcMapObjectColor(item)
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(ex, ey)
  ctx.stroke()
}


function draw_player(canvas, ctx, item, dt) {
  var x = item['x']
  var y = item['y']
  var dir = $V([item['dx'], item['dy']])

  if (lastPlayerPos) {
    var x0 = lastPlayerPos['x']
    var y0 = lastPlayerPos['y']
    if (Math.abs(x0 - x) < 0.01)
      x = approach(x0, x, dt, 0.4)
    if (Math.abs(y0 - y) < 0.01)
      y = approach(y0, y, dt, 0.4)

    var dir0 = $V(lastPlayerPos['dir'])
    var angle = dir.signedAngle2DFrom(dir0)

    if (angle > -Math.PI*0.25 && angle < Math.PI*0.25) {
      angle = approach(0.0, angle, dt, 0.4)
      dir = dir0.rotate(angle, [0,0])
    }
  }

  ctx.fillStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#333';
  ctx.beginPath()
  var w = 4.0
  var l = 10.0
  var dx = dir.at(0)
  var dy = dir.at(1)
  var sx = x*canvas.width*map_scale + map_pan[0]
  var sy = y*canvas.height*map_scale + map_pan[1]

  // center arrow
  sx -= l*0.5*dx
  sy -= l*0.5*dy

  ctx.moveTo(sx-w*dy, sy+w*dx)
  ctx.lineTo(sx+w*dy, sy-w*dx)
  ctx.lineTo(sx+l*dx, sy+l*dy)
  //console.log('dx = ' + dx + ', dy = ' + dy)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  return {'x': x, 'y': y, 'dir': dir.elements}
}


function draw_map_object(canvas, ctx, item, rotate) {
  var x = canvas.width*item['x']
  var y = canvas.height*item['y']

  ctx.fillStyle = calcMapObjectColor(item)
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';

  ctx.font = 'bold 18pt Icons'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  var sx = x*map_scale + map_pan[0]
  var sy = y*map_scale + map_pan[1]

  var s = null
  if (item['icon'] == 'Airdefence')
    s = '4'
  else if (item['icon'] == 'Structure')
    s = '5'
  else if (item['icon'] == 'waypoint')
    s = '6'
  else if (item['icon'] == 'capture_zone')
    s = '7'
  else if (item['icon'] == 'bombing_point')
    s = '8'
  else if (item['icon'] == 'defending_point')
    s = '9'
  else if (item['icon'] == 'respawn_base_tank')
    s = '0'
  else if (item['icon'] == 'respawn_base_fighter')
    s = '.'
  else if (item['icon'] == 'respawn_base_bomber')
    s = ':'
  else
    s = item['icon'][0]

  if (rotate)
  {
    ctx.save()
    ctx.translate(sx, sy)
    var heading = Math.atan2(item.dx, -item.dy)
    ctx.rotate(heading)
    ctx.translate(-sx, -sy)
    ctx.fillText(s, sx, sy)
    ctx.strokeText(s, sx, sy)
    ctx.restore()
  }
  else
  {
    ctx.fillText(s, sx, sy)
    ctx.strokeText(s, sx, sy)
  }
}

function redraw_map(dt) {
  var canvas = document.getElementById('map-canvas')
  var ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.setTransform(map_scale, 0, 0, map_scale, map_pan[0], map_pan[1])
  if (map_image.complete && map_image.naturalWidth) {
    ctx.drawImage(map_image, 0, 0, canvas.width, canvas.height)
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  drawMapGridScaled(canvas)
  var player = null
  if ($.isArray(map_objects)) {
    for (var i=0; i<map_objects.length; ++i) {
      var item = map_objects[i];
      if (item['type'] == 'airfield') {
        draw_airfield(canvas, ctx, item)
      } else {
        if (item['icon'] == 'Player') {
          player = item;
        } else {
          var rotate = (item['type'] == 'respawn_base_fighter') || (item['type'] == 'respawn_base_bomber')
          draw_map_object(canvas, ctx, item, rotate)
        }
      }
    }
  }

  if (player) {
    lastPlayerPos = draw_player(canvas, ctx, player, dt)
  } else {
    lastPlayerPos = null
  }
}


function update_timers() {
  var t = new Date().getTime()
  var dt = 0.0
  if (lastT) {
    dt = (t-lastT)*0.001
    blinkNormalT += dt
    blinkHeavyT += dt
    var periodNormal = 2.0
    var periodHeavy = 1.2
    if (blinkNormalT > periodNormal)
      blinkNormalT -= periodNormal*Math.floor(blinkNormalT / periodNormal)
    if (blinkHeavyT > periodHeavy)
      blinkHeavyT -= periodHeavy*Math.floor(blinkHeavyT / periodHeavy)
    blinkNormalVal = Math.exp(-Math.pow(5*blinkNormalT-2, 4))
    blinkHeavyVal = Math.exp(-Math.pow(5*blinkHeavyT-2, 4))
  }
  lastT = t
  return dt
}


function update_object_positions(objects) {
  map_objects = objects
  var dt = update_timers()
  redraw_map(dt)
}


function update_map_info(info) {
  var prevMapGen = (map_info && ('map_generation' in map_info)) ? map_info['map_generation'] : -1
  var newMapGen = (info && ('map_generation' in info)) ? info['map_generation'] : -1

  map_info = info

  if (prevMapGen != newMapGen) {
    const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
    map_image.src = url + '/map.img?gen='+newMapGen
    map_scale = 1.0
    map_pan = [0.0, 0.0]
    redraw_map(0.0)
  }
}

function updateSlow() {
  const url = localStorage.getItem('endpoint') || 'http://localhost:8111';
  if(window.isSiteActive) {
    $.ajax({type: 'GET', url: url + '/map_obj.json', success: update_object_positions});
    $.ajax({type: 'GET', url: url + '/map_info.json', success: update_map_info});
    const div = $('canvas#map-canvas');
    const width = div.width();
    div.css('height', width);
  }
}

function updateFast() {
  var dt = update_timers()
  if (!isDraggingMap && !isTransformingMap)
    redraw_map(dt)
}

function normalizeText(text) {
  return text.replace('<', '&lt;').replace('>', '&gt;');
}


function localize_static() {
  var elems = $('.loc')
  var len = elems.length
  for (var i=0; i<len; ++i) {
    var e = $(elems[i])
    var key = e.text()
    if (key in loc_tbl)
      e.text(loc_tbl[key])
  }
}


function lerp(a, b, k) {
  return a*(1.0-k) + b*k
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(x, hi))
}

function approach(from, to, dt, viscosity) {
  if (viscosity < 1e-9)
    return to;
  else
    return from + (1.0 - Math.exp(-dt / viscosity)) * (to - from);
}

function rgb_to_hex(r, g, b) {
  var rr = r.toString(16)
  var gg = g.toString(16)
  var bb = b.toString(16)
  var str = "#" +
    (rr.length == 1 ? "0" + rr : rr) +
    (gg.length == 1 ? "0" + gg : gg) +
    (bb.length == 1 ? "0" + bb : bb);
  return str
}

// IE support
if (!Array.indexOf) {
  Array.prototype.indexOf = function(obj) {
    for (var i=0; i<this.length; i++) {
      if (this[i]==obj)
        return i;
    }
    return -1;
  }
}

pos_save_elem_ids = {
  '#map-root': ['left', 'top'],
  '#map-canvas': ['width', 'height'],
}

function get_pos_prop(elem, field) {
  if (field == 'width' || field == 'height')
    return elem[field]()
  else
    return elem.offset()[field]
}

function set_pos_prop(elem, field, val) {
  if (field == 'width' || field == 'height')
    return elem[field](val)
  else {
    var offs = elem.offset()
    offs[field] = val
    elem.offset(offs)
  }
}

function load_positions() {
  for (var id in pos_save_elem_ids) {
    var cookieVal = Cookies.get(id)
    if (cookieVal) {
      var elem = $(id)
      var values = cookieVal.split('|')
      for (var vi in values) {
        var kv = values[vi].split(':')
        if (kv.length==2) {
          set_pos_prop(elem, kv[0], kv[1])
        }
      }
    }
  }

  var canvas = $('#map-canvas')
  canvas.get(0).width  = canvas.width()
  canvas.get(0).height = canvas.height()
}


function save_positions() {
  for (var id in pos_save_elem_ids) {
    var elem = $(id)
    var fields = pos_save_elem_ids[id]
    var cookieVal = ''
    for (var idx in fields) {
      if (cookieVal) cookieVal+='|';
      cookieVal += fields[idx]+':'+get_pos_prop(elem, fields[idx])
    }
    if (cookieVal)
      Cookies.set(id, cookieVal, {expires:cookieLifeTime})
  }
}


function init() {
  localize_static();
  var canvasEl = document.getElementById('map-canvas');

  addWheelHandler(canvasEl, mapOnWheel);
  canvasEl.onselectstart = function() {return false;} //== Chrome fix

  var ht = Hammer(canvasEl, hammer_opt);
  var events = ['drag', 'dragstart', 'dragend', 'transform', 'transformstart', 'transformend'];
  for (var ei in events) {
    ht.on(events[ei], on_touch_event);
  }

  load_positions();
  $('#map-root').draggable({handle:'#draghandle', stop: save_positions})

  if (document.location.protocol != 'file:') {
    setInterval(updateSlow, 500);
    setInterval(updateFast, 25);
  }
}

window.onload = init;
