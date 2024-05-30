var game = new Pixels(document.getElementById("game"));
game.show();

var colorarray = ["bricks", "", "dots", "crescendo", "spin", "jump"];
var posi = 0;

var togglecolor = function(){
    var displays = document.getElementsByClassName("pixels");
    if (colorarray[posi + 1] === undefined) {
        posi = 0;
    } else {
        posi++;
    }
    for (var i = 0; i < displays.length; i++) {
        var cn = displays[i].className.split(" ");
        var nm = [];
        for (var n in cn) {
            if (colorarray.indexOf(cn[n]) === -1) {
                nm.push(cn[n]);
            }
        }
        if (colorarray[posi]) {
            nm.push(colorarray[posi]);
        }
        displays[i].className = nm.join(" ");
    }
};

document.getElementById("colors").addEventListener("click", function(e){
    e.preventDefault();
    togglecolor();
}, true);

var score = document.getElementById("score");
var level = document.getElementById("level");
var lines = document.getElementById("lines");

game.holder.addEventListener("score", function(e){
    score.innerHTML = e.detail;
}, true);

game.holder.addEventListener("lines", function(e){
    lines.innerHTML = e.detail;
}, true);

game.holder.addEventListener("level", function(e){
    level.innerHTML = e.detail;
}, true);

var get = function(data, returnfunction){
    return false;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/scoreboard/tetris?" + data);
    xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
    xhr.setRequestHeader("Content-Type", "application/json");
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.onload = function() {
        if (xhr.status === 200) {
            if (typeof returnfunction === "function") {
                returnfunction(JSON.parse(xhr.responseText));
            }
            //console.log(JSON.parse(xhr.responseText));
        }
    };
    xhr.send(JSON.stringify(data));
};

get("", function(response){
    var scoreboard = document.getElementById("scoreboard");
    if (response.items) {
        for (var i in response.items) {
            var d = document.createElement('div');
            scoreboard.appendChild(d);
            d.innerHTML = '<span class="score">' + response.items[i].score + '</span> : <span class="name">' + response.items[i].name + '</span>\
                <div class="comment">' + response.items[i].comment + '</div>\
                <div class="date">' + response.items[i].added + '</div>';

            if (response.items[i].bricks) {

                var a = document.createElement('a');
                a.setAttribute("href","");
                a.append(document.createTextNode("Choose same layout"));
                d.appendChild(a);

                a.addEventListener("click", (function(i){
                    return function(e){
                        e.preventDefault();
                        game.setBricks(response.items[i].bricks.split(","));
                        setBricks();
                        nextElement.update(next);
                    };
                })(i), true);
            }
        }
    }
});

var send = function(data, returnfunction){
    return false;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/scoreboard/tetris");
    xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.onload = function() {
        if (xhr.status === 200) {
            if (typeof returnfunction === "function") {
                returnfunction(JSON.parse(xhr.responseText));
            }
        }
    };
    xhr.send(JSON.stringify(data));
};

game.holder.addEventListener("finish", function(e){
    var data = {};
    data.score = game.score;
    data.data = game.getBricks().join(",");
    send(data, function(response){
        if (response.id) {
            data.id = response.id;
            var str = "";
            if (response.place) {
                str += "You came in place " + response.place + ".";
            }
            if (!confirm(str + "Do you want to save your score and sht?")) {
                return true;
            }
            data.name = prompt("Type in your name here", "");//Maaaafk
            data.comment = prompt("Comment?", "");
            send(data);
        }
    });
}, true);

var bricks = document.getElementById("bricks");
var preview = [];

var nextElement = (function(){

    var nextElement = bricks.appendChild(document.createElement("div"));
    nextElement.className = "next pixels bricks";
    var r = new Pixels(nextElement);

    r.show(
        "\
        ++++\n\
        ++++\n\
        ++++\n\
        ++++\n\
        "
    );

    var coords = [];

    return {
        update : function(x){

            //position = x;
            r.setName(coords, '');
            var obj = r.strToObj(game.bricks[x][0], game.bricks[x][1]);
            coords = r.objToCoords(obj);
            r.setName(coords);

        }
    }
})();

var allpixels = bricks.appendChild(document.createElement("div"));

var setBricks = function(){

    allpixels.innerHTML = "";

    for (var x=0; x<game.bricks.length; x++) {

        (function(x){

            var b = allpixels.appendChild(document.createElement("div"));
            b.className = "pixels bricks";
            var r = new Pixels(b);
            var name = game.bricks[x][1];

            r
            .show(
                "\
                ++++\n\
                ++++\n\
                ++++\n\
                ++++\n\
                "
            )

            .on("mousedown", function(e){
                var o = this.findCoordByPixel(e.target);
                if (o) {
                    o.name = e.target.className === name ? "" : name;
                    o.pixel.className = o.name;
                }
                game.setBrick(this.objToStr(), x);
                if (next === x) {
                    nextElement.update(next);
                }
            });

            var obj = r.strToObj(game.bricks[x][0], name);
            coords = r.objToCoords(obj);
            r.setName(coords);
        })(x);

    }

};

setBricks();

var next = null;

game.holder.addEventListener("next", function(e){
    next = e.detail;
    nextElement.update(next);
}, true);

game.play();

document.getElementsByTagName("body")[0].addEventListener("touchend", function(e){
    e.preventDefault();
}, true);