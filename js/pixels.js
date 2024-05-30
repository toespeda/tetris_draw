function Pixels(holder, options) {
    var defaults = {
        holder: typeof holder === "string" ? document.getElementById(holder) : holder,
        coords: [],
        gridSize: null,
        spaceSize: 0,
        coordObj: {},
        width: 0,
        height: 0,
        order: [],
        name: "",
        random: false,
        playing: null,
        brick: null,
        speed: 0,
        brickid: 0,
        score: 0,
        level: 0,
        lines: 0,
        bricks: [
            [
                "\
                -+-\n\
                +++\n\
                ---\n\
                ",
                "tetromino-1"
            ],
            [
                "\
                ++-\n\
                -++\n\
                ---\n\
                ",
                "tetromino-2"
            ],
            [
                "\
                -+--\n\
                -+--\n\
                -+--\n\
                -+--\n\
                ",
                "tetromino-3"
            ],
            [
                "\
                ++\n\
                ++\n\
                ",
                "tetromino-4"
            ],
            [
                "\
                +--\n\
                +++\n\
                ---\n\
                ",
                "tetromino-5"
            ],
            [
                "\
                --+\n\
                +++\n\
                ---\n\
                ",
                "tetromino-6"
            ],
            [
                "\
                -++\n\
                ++-\n\
                ---\n\
                ",
                "tetromino-7"
            ]

        ]
    };

    for (var i in options) {
        defaults[i] = options[i];
    }

    for (var i in defaults) {
        this[i] = defaults[i];
    }

    this.handlers = {};

}
;

Pixels.prototype = {

    objToStr: function () {
        var str = "";
        for (var x = 0; x < this.height; x++) {
            for (var y = 0; y < this.width; y++) {
                var o = this.findCoord(x, y);
                str += o && o.name ? "+" : "-";
            }
            str += "\n";
        }
        return str;
    },

    strToObj: function (t, name, createempty) {
        var coordObj = {};
        var top = 0;
        var left = 0;
        var lines = t.split(/\n/gi);
        for (var i in lines) {
            if (lines[i]) {
                var characters = lines[i].replace(/(\s|\t)*/, '').split("");
                if (characters.length) {
                    for (var j in characters) {
                        var add = characters[j] === "+";
                        if (createempty || add) {
                            if (!coordObj[top]) {
                                coordObj[top] = {};
                            }
                            coordObj[top][left] = {
                                on: false,
                                name: add && name ? name : ''
                            };
                        }
                        left += 1;
                        this.width = Math.max(this.width, left);
                    }
                    top += 1;
                    this.height = Math.max(this.height, top);
                    left = 0;
                }
            }
        }
        return coordObj;
    },

    updateLevel: function (level) {
        this.level = level;

        this.stop();

        this.setSpeed();
        this.brick.move(1, 0);

        this.start();

        var evt = new CustomEvent('level', {detail: this.level});
        this.holder.dispatchEvent(evt);
    },

    updateLines: function (lines) {
        this.lines += lines;
        var evt = new CustomEvent('lines', {detail: this.lines});
        this.holder.dispatchEvent(evt);
    },

    updateScore: function (points) {
        this.score += points;
        var evt = new CustomEvent('score', {detail: this.score});
        this.holder.dispatchEvent(evt);
    },

    trigger: function (e) {
        this.handlers[e].apply(this, arguments[1]);
        return this;
    },

    off: function (e) {
        this.holder.removeEventListener(e, this.handlers[e], false);
        return this;
    },

    on: function (e, f) {
        var o = this;
        this.handlers[e] = function () {
            f.apply(o, arguments);
        };
        this.holder.addEventListener(e, this.handlers[e], false);
        return this;
    },

    clone: function (coords) {
        var clone = [];
        for (var x = 0; x < coords.length; x++) {
            clone.push(JSON.parse(JSON.stringify(coords[x])));
        }
        return clone;
    },

    resizeHolder: function () {
        this.holder.style.width = (this.width * this.gridSize.width) + "px";
        this.holder.style.height = (this.height * this.gridSize.height) + "px";
        return this;
    },

    globalToLocalCoord: function (top, left) {
        return {
            left: left * this.gridSize.width,
            top: top * this.gridSize.height
        };
    },

    localToGlobalCoord: function (top, left) {
        return {
            left: ~~(left / this.gridSize.width),
            top: ~~(top / this.gridSize.height)
        };
    },

    createPixel: function () {
        return this.holder.appendChild(document.createElement("div"));
    },

    setGridSize: function (width, height) {
        if (width !== undefined) {
            this.gridSize = {
                width: width,
                height: height || width
            };
            return this;
        } else {
            return this.gridSize;
        }
    },

    spacesize: function (int) {
        if (int !== undefined) {
            this.spaceSize = int;
            return this;
        } else {
            return this.spaceSize;
        }
    },

    copyCoord: function (from, to, top, left) {
        if (!to[top]) {
            to[top] = {};
        }
        to[top][left] = {
            on: from[top][left].on,
            name: from[top][left].name
        };
        return to[top][left];
    },

    findCoordByPixel: function (pixel) {
        for (var top in this.coordObj) {
            for (var left in this.coordObj[top]) {
                if (pixel === this.coordObj[top][left].pixel) {
                    return this.coordObj[top][left];
                }
            }
        }
        return null;
    },

    findCoord: function (top, left) {
        if (this.coordObj[top]) {
            return this.coordObj[top][left];
        } else {
            return undefined;
        }
    },

    testLines: function (obj) {
        var lines = 0;
        var coords = [];

        for (var top in obj) {
            var line = [];
            for (var left in obj[top]) {
                if (obj[top][left].on) {
                    line.push({
                        top: top,
                        left: left,
                        name: obj[top][left].name
                    });
                }
            }
            if (line.length >= this.width) {

                lines++;

                this.reset(line);
                this.reset(coords);
                this.move(coords, 1, 0);
                this.setName(coords);
                this.setOn(coords, true);

            } else {
                coords = coords.concat(line);
            }
        }

        if (lines) {
            this.updateLines(lines);
            this.updateScore([40, 100, 300, 1200][lines - 1] * (this.level + 1));
            var level = ~~(this.lines / 10);
            if (level !== this.level) {
                this.updateLevel(level);
            }
        }

        return coords;
    },

    objToCoords: function (obj) {
        var coords = [];
        for (var top in obj) {
            for (var left in obj[top]) {
                coords.push({
                    top: top,
                    left: left,
                    name: obj[top][left].name
                });
            }
        }
        return coords;
    },

    testCollision: function (coords, top, left) {
        for (var x = 0; x < coords.length; x++) {
            var coord = coords[x];
            var o = this.findCoord(+coord.top + top, +coord.left + left);
            if (o && o.on) {
                return {
                    top: +coord.top + top,
                    left: +coord.left + left,
                    o: o
                };
            }
        }
        return null;
    },

    setOn: function (coords, on) {
        for (var x = 0; x < coords.length; x++) {
            var coord = coords[x];
            var o = this.findCoord(coord.top, coord.left);
            if (o) {
                o.on = on;
            }
        }
    },

    rotate: function (coords, left, top, angle) {
        var radians = (Math.PI / 180) * angle;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);

        var position = this.params(coords);

        var size = {
            width: position.right - position.left,
            height: position.bottom - position.top
        };

        var max = Math.max(size.width, size.height);

        for (var x = 0; x < coords.length; x++) {

            var coord = coords[x];

            var nx = (cos * (coord.left - left)) + (sin * (coord.top - top)) + left;
            var ny = (cos * (coord.top - top)) - (sin * (coord.left - left)) + top;
            coord.left = Math.round(nx);
            coord.top = Math.round(ny);

        }
    },

    params: function (coords) {
        var p = null;
        for (var x = 0; x < coords.length; x++) {
            var coord = coords[x];
            if (!p) {
                p = {
                    right: +coord.left + 1,
                    bottom: +coord.top + 1,
                    left: coord.left,
                    top: coord.top
                };
            } else {
                p.left = Math.min(p.left, coord.left);
                p.top = Math.min(p.top, coord.top);
                p.right = Math.max(p.right, +coord.left + 1);
                p.bottom = Math.max(p.bottom, +coord.top + 1);
            }
        }
        return p;
    },

    move: function (coord, top, left) {
        if (coord instanceof Array) {
            for (var x = 0; x < coord.length; x++) {
                this.move(coord[x], top, left);
            }
        } else {
            if (Math.abs(top)) {
                coord.top = +coord.top + top;
            }
            if (Math.abs(left)) {
                coord.left = +coord.left + left;
            }
        }
    },

    reset: function (coord) {
        this.setName(coord, '');
        this.setOn(coord, false);
    },

    setName: function (coord, name) {
        if (coord) {
            if (coord instanceof Array) {
                for (var x = 0; x < coord.length; x++) {
                    var o = this.findCoord(coord[x].top, coord[x].left);
                    if (o) {
                        this.setName(o, name !== undefined ? name : coord[x].name);
                    }
                }
            } else {
                coord.name = name;
                coord.pixel.className = coord.name;
            }
        } else {
            for (var top in this.coordObj) {
                for (var left in this.coordObj[top]) {
                    this.setName(this.coordObj[top][left], name !== undefined ? name : coord[x].name);
                }
            }
        }
        return this;
    },

    getBricks: function (position) {
        if (position !== undefined) {
            return this.bricks[position][0];
        } else {
            var a = [];
            for (var x = 0; x < this.bricks.length; x++) {
                a.push(this.bricks[x][0]);//.replace(/\s/gi,'')
            }
            return a;//JSON.stringify(a);
        }
    },

    setBricks: function (bricks) {
        if (typeof bricks === "object") {
            for (var x = 0; x < bricks.length; x++) {
                this.setBrick(bricks[x], x);
            }
        }
    },

    setBrick: function (brick, position) {
        if (position !== undefined) {
            if (true) {
                this.bricks[position][0] = brick;
            } else {
                this.bricks.splice(position, 0, brick);
            }
        } else {
            this.bricks.push(brick);
        }
    },

    getOrder: function () {
        var thisid = this.order[this.brickid];
        var nextid = 0;
        if (this.order[this.brickid + 1] === undefined) {
            this.setOrder();
            this.brickid = 0;
            nextid = this.order[this.brickid];
        } else {
            nextid = this.order[++this.brickid];
        }
        var evt = new CustomEvent('next', {detail: nextid});
        this.holder.dispatchEvent(evt);
        return thisid;
    },

    setSpeed: function () {

        var frames = 0;

        if (this.level >= 29) {
            frames = 1;
        } else if (this.level >= 19) {
            frames = 2;
        } else if (this.level >= 16) {
            frames = 3;
        } else if (this.level >= 13) {
            frames = 4;
        } else if (this.level >= 10) {
            frames = 5;
        } else {
            frames = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6][this.level];
        }

        this.speed = 1000 / 60.0988 * frames;

    },

    setOrder: function () {
        if (this.random) {
            var cI = this.bricks.length;
            for (var x = 0; x < cI; x++) {
                this.order[x] = ~~(Math.random() * cI);
            }
        } else {
            this.shuffle();
        }
    },

    shuffle: function () {

        var cI = this.order.length;
        var tV = null;
        var rI = 0;
        while (cI) {
            rI = ~~(Math.random() * cI);
            cI -= 1;
            tV = this.order[cI];
            this.order[cI] = this.order[rI];
            this.order[rI] = tV;
        }

    },

    start: function () {
        var _this = this;
        this.playing = this.playing || setInterval(function () {
            _this.brick.move(1, 0);
        }, this.speed);
    },

    stop: function () {
        clearInterval(this.playing);
        this.playing = null;
    },

    play: function () {

        var _this = this;

        var step = function (event) {

            if (event.defaultPrevented) {
                return;
            }

            var handled = false;

            if (event.key !== undefined) {

                if (event.keyCode === 32) {
                    if (_this.playing) {
                        _this.stop();
                    } else {
                        _this.start();
                    }

                }

                if (/Arrow(Up|Down|Left|Right)/.exec(event.key)) {
                    switch (RegExp.$1) {
                        case " " :

                            break;
                        case "Down" :
                            _this.updateScore(1);
                            _this.brick.move(1, 0);
                            break;
                        case "Left" :
                            _this.brick.move(0, -1);
                            break;
                        case "Right" :
                            _this.brick.move(0, 1);
                            break;
                        case "Up" :
                            _this.brick.rotate();
                            break;
                    }
                    handled = true;
                }

            } else if (event.keyCode !== undefined) {
                //console.log("event.keyCode", event.keyCode);
            }

            if (handled) {
                event.preventDefault();
            }

        };

        var update = function (coordstr, name) {

            var obj = _this.strToObj(coordstr, name);
            var coords = _this.objToCoords(obj);

            var lastbrick = coords[coords.length - 1];
            var center = {left: ~~((+lastbrick.left + 1) / 2), top: ~~((+lastbrick.top + 1) / 2)};

            _this.move(coords, 0, 3);
            _this.move(center, 0, 3);

            _this.setName(coords);



            var overshoot = false;

            return {

                move: function (top, left) {

                    var params = _this.params(coords);
                    var taken = _this.testCollision(coords, top, left);

                    if (taken && Math.abs(left) && !_this.testCollision(coords, top, 0)) {
                        left = 0;
                        taken = null;
                    }

                    if (overshoot || taken) {

                        if (!params.top) {

                            _this.stop();
                            window.removeEventListener("keydown", step, true);

                            var evt = new CustomEvent('finish', {detail: {}});//bricks : _this.bricks, score:_this.score
                            _this.holder.dispatchEvent(evt);

                        } else {

                            _this.setOn(coords, true);
                            _this.stop();
                            _this.testLines(_this.coordObj);
                            _this.start();
                            _this.brick = update.apply(_this, _this.bricks[_this.getOrder()]);

                        }

                        overshoot = false;

                    } else {

                        if ((params.right + left > _this.width) || (params.left + left < 0)) {
                            left = 0;
                        }

                        if (params.bottom == _this.height) {
                            overshoot = true;
                            top = 0;
                        }

                        _this.setName(coords, '');
                        _this.move(coords, top, left);
                        _this.move(center, top, left);
                        _this.setName(coords);

                    }

                },

                rotate: function () {

                    var clone = _this.clone(coords);

                    _this.rotate(clone, center.left, center.top, 90);

                    var params = _this.params(clone);

                    if ((params.right > _this.width) || (params.left < 0)) {
                        return;
                    }

                    _this.setName(coords, '');
                    _this.rotate(coords, center.left, center.top, 90);
                    _this.setName(coords);

                }

            };
        };

        var cI = this.bricks.length;

        for (var x = 0; x < cI; x++) {
            this.order[x] = x;
        }

        this.setOrder();

        this.brick = update.apply(this, this.bricks[_this.getOrder()]);

        this.setSpeed();

        this.start();



        var touchstart = {};

        this.on("touchstart", function (e) {

            if (e.changedTouches) {
                e = e.changedTouches[0];
            } else if (e.touches) {
                e = e.touches[0];
            }

            touchstart = {
                pageX: e.pageX,
                pageY: e.pageY,
                clientX: e.clientX,
                clientY: e.clientY
            };

        });

        this.on("touchend", function (e) {

            if (e.changedTouches) {
                e = e.changedTouches[0];
            } else if (e.touches) {
                e = e.touches[0];
            }

            var getOffset = function (el) {
                var _x = 0;
                var _y = 0;
                while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
                    _x += el.offsetLeft - el.scrollLeft;
                    _y += el.offsetTop - el.scrollTop;
                    el = el.offsetParent;
                }
                return {top: _y, left: _x};
            };

            if (e.clientY - touchstart.clientY > 5) {
                this.brick.move(1, 0);
            } else if (e.clientY - touchstart.clientY < -5) {
                this.brick.rotate();
            }

            if (e.clientX - touchstart.clientX > 5) {
                this.brick.move(0, 1);
            } else if (e.clientX - touchstart.clientX < -5) {
                this.brick.move(0, -1);
            } else {
                if (e.clientX - getOffset(this.holder).left > (this.width * this.gridSize.width) / 2) {
                    this.brick.move(0, 1);
                } else {
                    this.brick.move(0, -1);
                }
            }

        });

        window.addEventListener("keydown", step, true);
    },

    show: function (coordstr, name, createempty) {

        if (!coordstr) {
            coordstr = "\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ++++++++++\n\
            ";
        }

        this.name = name || "";

        var coordObj = this.strToObj(coordstr, name, createempty);

        for (var top in coordObj) {

            for (var left in coordObj[top]) {

                var o = this.findCoord(top, left) || this.copyCoord(coordObj, this.coordObj, top, left);

                var pixel = this.createPixel();

                pixel.className = o.name;
                o.pixel = pixel;

                if (!this.gridSize) {
                    this.setGridSize(pixel.offsetWidth, pixel.offsetHeight);
                    this.resizeHolder();
                }

                var pos = this.globalToLocalCoord(top, left);

                pixel.style.top = pos.top + "px"
                pixel.style.left = pos.left + "px";

                pixel.style.width = this.gridSize.width - this.spaceSize + "px";
                pixel.style.height = this.gridSize.height - this.spaceSize + "px";

            }
        }

        return this;

    }

};