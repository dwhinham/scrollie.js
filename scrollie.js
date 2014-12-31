/*  ****************************************
      Scrolling graphics demo (JavaScript)
      (c) 2014 Dale Whinham
    ****************************************

    Friendly warning: attempt to understand this code -at your peril-!
    (Yes, I did actually write this, and yes, the code is atrocious.)

    This is a JavaScript port of a C/SDL graphics demo I wrote a couple of years ago
    when I was first learning the C programming language.

    The main purpose of writing this was to further my understanding of JavaScript,
    the DOM, and just to see what I could do with an HTML5 canvas.

    The code isn't very well structured at all, and some nasty things have been
    done to try and optimise the speed. There are various commented-out
    things that were experiments; I've left them in for my own future reference.

    Anyway, if you're reading this, enjoy!
*/

// Shim layer for requestAnimationFrame() with setTimeout() fallback
// (originally by Paul Irish: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating)
window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Constants:
var CANVAS_WIDTH = 320;
var CANVAS_HEIGHT = 240;
var BG_COLUMNS_TO_SCROLL = 3;	        // How many columns (in pixels) to shift the background by each frame
var TEXT_COLUMNS_TO_SCROLL = 2;		// How many columns (in pixels) to shift the scrolltext by each frame (must be a power of 2)

var CLOUDS_FRAMES_TO_WAIT = 10;		// How many frames to wait before shifting the clouds
var GRASS1_FRAMES_TO_WAIT = 4;		// How many frames to wait before shifting the grass1 layer
var GRASS2_FRAMES_TO_WAIT = 2;		// How many frames to wait before shifting the grass2 layer
var GRASS3_FRAMES_TO_WAIT = 1;		// How many frames to wait before shifting the grass2 layer

var SINE_DEGREE_INCREMENT1 = 6;		// How many degrees to increment
var SINE_DEGREE_INCREMENT2 = 1;
var SINE_TAB_TEXT = new Array();        // Sine table for scroll text (array of sine values)
var SINE_TAB_LISSA = new Array();	// Sine table for lissajous effect

var FONT_CHAR_WIDTH = 32;
var FONT_CHAR_HEIGHT = 24;
var FONT_CHAR_TAB = [    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', '!', '?', ':', ';',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '"', '(', ')', ',', '-', '.', '\'', ' '            ];


// The '%' character can be used to insert a command:
//    > %pn  - pause for n * 100 frames
//    > %f   - increase scroll speed
//    > %s   - decrease scroll speed
var SCROLL_TEXT =
    "hello!   %p2dale at the keys, welcoming you to a html 5 sine-wave scroller u" +
    "sing -canvas-  %p3and some javascript magic. this demo is inspired by the gr" +
    "aphics demos of the 16-bit era - cutting edge stuff back then! we use direct" +
    " pixel data manipulation for plotting the text so that everything runs %ffaa" +
    "aaaaaaaaaaaaaaaaaaaast! :)           %s the background graphics were borrowe" +
    "d from the video game pokemon ruby, copyright nintendo.      end of text...." +
    "..              ";

// Images are encoded here in base64 as opposed to file references.
// This prevents cross-origin security problems caused by loading them from disk.

// Original: res/bg-sky-6x152.png
var BG_SKY_IMAGE = "data:image/png;base64," +
    "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" +
    "RupHrUfPjPmM3Xqx9MXwy4yX0+OFvyn+tveV0auffnf7vWdiycTwa9HrmT9K3qi+OfrW9m3nZOjk" +
    "03dp76anit6rvj/2gf2h+2P0x5Hp7E/4T5WfjT93fAn88ngmbWbm3/eE8/syOll+AAAACXBIWXMA" +
    "AAsTAAALEwEAmpwYAAAEImlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxu" +
    "czp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJE" +
    "RiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMi" +
    "PgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0" +
    "aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhp" +
    "Zj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmRjPSJo" +
    "dHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6eG1wPSJo" +
    "dHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVu" +
    "aXQ+MTwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwv" +
    "dGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJl" +
    "c29sdXRpb24+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+" +
    "CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAg" +
    "ICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NjwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAg" +
    "IDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhl" +
    "bFlEaW1lbnNpb24+MTUyPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgICAgPGRjOnN1Ympl" +
    "Y3Q+CiAgICAgICAgICAgIDxyZGY6QmFnLz4KICAgICAgICAgPC9kYzpzdWJqZWN0PgogICAgICAg" +
    "ICA8eG1wOk1vZGlmeURhdGU+MjAxNC0wNS0wN1QwMDowNTo5MDwveG1wOk1vZGlmeURhdGU+CiAg" +
    "ICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+UGl4ZWxtYXRvciAzLjA8L3htcDpDcmVhdG9yVG9vbD4K" +
    "ICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cg1rU1gA" +
    "AADPSURBVEgN7ZaxCsMwDEQdEdoupUt+tp/Yf+lSOjlTT71IVkKHBgxZZLD8dCjJcXjIcH/Usl6y" +
    "brVLyTLJJDIJS8DOvBOZhCVgZ96J/UnczvZMKWDBflUlLLKwj7VNudphqn2RpBa+S30Zt/MYaQp5" +
    "gQX7WQtVsrCPtU252mEKUSxfJHk0UI8Jxx0Q1ASTYa++6JgquUMS/6VKN5j95YsOYz0mwutJPbAC" +
    "BPSetWdVKfbk7RTUDlP0oe+Kjsg9wxl5G/BiX+N0cV5gmOv2p/kDABmgy/RHAoEAAAAASUVORK5C" +
    "YII=";

// Original: res/bg-clouds-320x46.png
var BG_CLOUDS_IMAGE = "data:image/png;base64," +
    "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" +
    "RupHrUfPjPmM3Xqx9MXwy4yX0+OFvyn+tveV0auffnf7vWdiycTwa9HrmT9K3qi+OfrW9m3nZOjk" +
    "03dp76anit6rvj/2gf2h+2P0x5Hp7E/4T5WfjT93fAn88ngmbWbm3/eE8/syOll+AAAACXBIWXMA" +
    "AAsTAAALEwEAmpwYAAADp2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxu" +
    "czp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJE" +
    "RiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMi" +
    "PgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4" +
    "bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9" +
    "Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJo" +
    "dHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4y" +
    "MDE0LTA1LTA3VDAwOjA1OjA2PC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpDcmVhdG9y" +
    "VG9vbD5QaXhlbG1hdG9yIDMuMDwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpPcmll" +
    "bnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpDb21wcmVzc2lvbj41" +
    "PC90aWZmOkNvbXByZXNzaW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4xPC90aWZm" +
    "OlJlc29sdXRpb25Vbml0PgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVz" +
    "b2x1dGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+" +
    "CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4zMjA8L2V4aWY6UGl4ZWxYRGltZW5zaW9u" +
    "PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAg" +
    "PGV4aWY6UGl4ZWxZRGltZW5zaW9uPjQ2PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9y" +
    "ZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+ChqtmfQAAAsMSURBVHgB" +
    "7Vw9syS3DTwpsBLJmRPLkRL9/5+jRJEdObOdnJOTuq5a6sUDQHCW5MzO8lVd8QsEGk2wl2/vpG8+" +
    "7Z+3YuBf//z85a9/+5jyf/796dOP//jum48re2YzcF8GdsHf92wfMouE78Ho98FVhNDivQouy9ce" +
    "vzYDWwBf+/xK6K2YVDadJTjACnzeKxXzZ+FC7P1zPwa2AN7vTB8yoqDoZCQuaoP+KrHpxfjDd/tX" +
    "dXtWe3yMgS2Ax3hbvst7xbUEyhMWAr+CCP7y6+cv3/+FiB7bDF8r70dPe7QZiBnYAhhzc4kVT/gs" +
    "sEgQMgGEj0xkbAyOo1hcr7aZ+NFHhm+/AsnSbp9h4NtnNu+9cxmASGQiwOiw+e/nz19U8LRPuxGt" +
    "F+uI3+jlp74gtvhjf7w5a7PHm4EKA/sFWGHpJBsVsYoQAiZfaLo3gx/5hZ9ojf6OvsKq2BgHrWLx" +
    "BHD/Ex5la/erDGwBrDK12M77FVFFIILjiUNky3nrlz7sPO3Zwu6I8EQCqPGIgbGiVvfA5qgoR/5H" +
    "zyN3ixkxjnI5Gt+7+XtbAbSFeLUCzEQCWKNLNLqAvTgao1dwsrzUL/otEYyw9WKycWeMbb1FMa5W" +
    "hxHOu8y/3XeAKESvGHGZ7PdoVzxkih/FwbajMdO/5zdb8+yzuR5fOKtI/BCD54hXdBZz1ZpXb1Hs" +
    "V6nDCP+rzb/FCxAFaA8mu0BXeEF4mDUH4IdosNW1lf2RvwIDtz0XK4x2PcrV7juCM/LdM++dY08O" +
    "Z+HuyfGVbW8tgN73aDysrAhxec4uvAw7c+hpbb5WIHp8ebY9fHmi4PkE5irOan49OBUTMHsxMn9Z" +
    "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";

// Original: res/bg-sea-320x16.png
var BG_SEA_IMAGE = "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAAUAAAAAQCAIAAADoCzG+AAAACXBIWXMAAAsTAAALEwEAmpwYAAAB" +
    "pUlEQVRoge2ZO27DMAyG6SJzO2lysvSwvU2BXqBXyZJk0hSfoIMKQ5D1oN5S+3+TQUeipPADHWf5" +
    "vt6IiIheBRHRJn+v1YXrlh7RP2/E/TNbpwoOUXFPRv5iEjIakx+H6HHrPJ5croxEvhPQd71nt+If" +
    "5dky2Y7Ruhc6VAXnoPQPx1aXK96lnl1H4Vln5t6Xr/smHyRWkg/znliJyBLnkDa2Rka1Nc/d5IxF" +
    "eBfPbrnzuMq3XqmD3+Y49Vy89oxRy8fnFjfB/0acW2QZzeo2rsp7gyR/jVPvBUwGp8jyJTeEae9z" +
    "cWMhZyVOt35Pj7NzWe1xT7Gmud3A5yLGJliK8ssEHTgal7ccmCVu9bxqH94nt5pcr3/uhwmT04DA" +
    "0TBLje85sy3rapWVOdh+jyvkKw0zqwKBi5Hcma0y+K3elcsxmfnYnNl+jWOBz2WBwMWILU2X8FG/" +
    "kxu8H1brcWkMIfsCgasT25mDHa/GX1nJbda1O4jdBghcnYKlrGyp90oJ1k0HBB6XnNfdpTJC6cGB" +
    "wOMCeUCQl94LAACkA4EBmBgIDMDE/AAaOxOebeTyfgAAAABJRU5ErkJggg==";

// Original: res/bg-grass1-64x6.png
var BG_GRASS1_IMAGE = "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAAAGCAIAAAD8Cg/4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA" +
    "lUlEQVQ4jWPMnPSJYaiBb5cKufT6ISQTmgScRBYh1XTK3YdH/NulwsAGdjjJ9O1SIRwhSyCLYDUX" +
    "zbdoppPtE0wTMJ3HwMCgkcrHwMAQ2MDOuOFJFkFD1zf8hKiGMCAAwoULwrlwLRARLr1+uMvg8Q73" +
    "G6YIpglwEayAKA9QAuB+RvawRiqfpvRPZFfCRUgFNPcArQEA+sCZG5sCnAEAAAAASUVORK5CYII=";

// Original: res/bg-grass2-128x2.png
var BG_GRASS2_IMAGE = "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAAIAAAAACCAIAAAAfJENPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA" +
    "RUlEQVQokWPc8CSLYUDB9afsmtI/ISTx6mntKiIBkY5HVoammIn2jsQOzp9kh5DILiNGF1wlMepp" +
    "BPA4Hi4FJzFDH1kWAKgZQ/u3k6VRAAAAAElFTkSuQmCC";

// Original: res/bg-grass3-64x64.png
var BG_GRASS3_IMAGE = "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB" +
    "CElEQVRoge2SvQ2DMBBGgxsyRJZIlZ3SZYJMFClrUFGygNmBdCmMLtYZFJAQT0jfq8z5/p5F9Y73" +
    "02Hp+jp0fV1GJ887bLM2eYinMMRfZduM0RTp+nqIi7rP3Vqfv4U2K4/MNc8XC7Zx2j53SEkWmWxn" +
    "L1Huah3KWzvY0jbLkm2iK3eqIW+Uk0ecm1vd5ae00t8tV759PtqalOVuYvV8Pfzu85wvY9n19mmb" +
    "On2m8/Im2xJWZbtndn8twjqBScrfb082EGCRAI0EaCRAIwEaCdBIgEYCNBKgkQCNBGgkQCMBGgnQ" +
    "SIBGAjQSoJEAjQRoJEAjARoJ0EiARgI0EqCRAI0EaCRAc3iBLyLwtVmEuXQdAAAAAElFTkSuQmCC";

// Original: res/angelsfont.png
var FONT_IMAGE = "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAABkAAAAAZCAMAAABegxKQAAAAAXNSR0IArs4c6QAAAARnQU1BAACx" +
    "jwv8YQUAAAMAUExURQAAAEBAQGBgQAAAwICAgKCgpMDcwP///wAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAN3QpHgAAAEAdFJOU///////" +
    "////////////////////////////////////////////////////////////////////////////" +
    "////////////////////////////////////////////////////////////////////////////" +
    "////////////////////////////////////////////////////////////////////////////" +
    "////////////////////////////////////////////////////////////////////////////" +
    "/////////////////////////////wBT9wclAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGnRFWHRT" +
    "b2Z0d2FyZQBQYWludC5ORVQgdjMuNS4xMUfzQjcAABVXSURBVHjazV3dmuSqCh1WAb7/E3su/ENF" +
    "TGpmd5+6mK8nRkVAUFiaP9n5saqKMCjnrCklVWFmFq3/EWEWYaL6PkGEmaW9oCL1ZWQRkV6tvpFU" +
    "a+ujfn0taWm8toRr+7f6owC9P01JRUSYYUatSaWMEjn+2Te99qUSKarPWkVhKEB/iOsAzevEzCLS" +
    "Oba22fnj8DeSX17l91V9Qin1+X+uL6rKLn+sfLxyqEppji3/NWnRCzH1b/K5y+9Av9G/SH/O49f8" +
    "z35DgK0LO706FdvjhUBXvIcBGGVcJ9P8ZDIAp+ldifemv6ZUGFstgG4DsQqo4qp3WG4ld5muBFEt" +
    "5Eme9UVEVXf2/tzvuf36l78/njXTKjJQzkWrhljN9K8WjaDJzKmk5W1NKYEyqlYXB6LDBbTqrf7Q" +
    "s2aMqjzi9m/1e/9Gtl1TJ3lzMUBy1wL7ptc+qgVTxZNWUUbHDIAbr5gFxr2yqGrT+bnNwR+Pv6/k" +
    "9019iMowABv//frFFCiTyx8rH6ccwqnMYp74z5pURJOwqX+TzwP5eeM3+hfrT8Q/+VfuoyuAFvWx" +
    "08tQsT1eCHTVwx2AaWifTPOTyQA40ztDdawP9/IuzD6+ZSCjvmibOob+a/kkuXi6UlO9lMRyt+iL" +
    "JsYvepDn9uu/dSDQ6vNFBDlzU6DK/6o/0lfJhCphoyjdvlMGTEWj4NLWfK1+W/8WJlQFomv7t/qt" +
    "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";

// Original: res/smile.png
var SMILEY_IMAGE = "data:image/png;base64," +
    "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" +
    "YII=";

var debug = 1;		// Flag to enable debug output
var disabled = 0;	// Flag to determine whether demo is running (used to pause it)

var console = document.getElementById("console");			// Debug console
var outCtx = document.getElementById("output").getContext("2d");	// Canvas 2D rendering context

var skyCanvas = document.createElement("canvas");
var skyCtx = skyCanvas.getContext("2d");

var cloudsCanvas = document.createElement("canvas");
var cloudsCtx = cloudsCanvas.getContext("2d");

var seaCanvas = document.createElement("canvas");
var seaCtx = seaCanvas.getContext("2d");

var grass1Canvas = document.createElement("canvas");
var grass1Ctx = grass1Canvas.getContext("2d");

var grass2Canvas = document.createElement("canvas");
var grass2Ctx = grass2Canvas.getContext("2d");

var grass3Canvas = document.createElement("canvas");
var grass3Ctx = grass3Canvas.getContext("2d");

var fontCanvas = document.createElement("canvas");
var fontCtx = fontCanvas.getContext("2d");

var smileyCanvas = document.createElement("canvas");
var smileyCtx = smileyCanvas.getContext("2d");

var scrollbufCanvas = document.createElement("canvas");
var scrollbufCtx = scrollbufCanvas.getContext("2d");

var scrollTextFinalCanvas = document.createElement("canvas");
var scrollTextFinalCtx = scrollTextFinalCanvas.getContext("2d");

var cloudsWait = 0;
var cloudsShift = 0;
var grass1Wait = 0;
var grass1Shift = 0;
var grass2Wait = 0;
var grass2Shift = 0;
var grass3Wait = 0;
var grass3Shift = 0;

var scrollCounter = FONT_CHAR_WIDTH;
var scrolling = 1;		// Toggles scrolling (used for pauses)
var delayCounter = 0;
var textCounter = 0;
var sineDegree1 = 0;
var sineDegree2 = 0;

var frameCounter = document.getElementById("framecounter");		// Frame counter
var degreesValue = document.getElementById("degreesvalue");
var sineValueText = document.getElementById("sinevaluetext");
var sineValueLissa = document.getElementById("sinevaluelissa");
var fpsValue = document.getElementById("fps");
var scrollSpeedValue = document.getElementById("scrollspeed");

var sky = new Image();
var clouds = new Image();
var sea = new Image();
var grass1 = new Image();
var grass2 = new Image();
var grass3 = new Image();
var smiley = new Image();

var scrollTextFinalData = outCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);

var scrollTextFinalDataRaw = scrollTextFinalData.data;

var tmpBgCol = new Array();	// Temporary array for holding column for background scrolling

var font = new Image();

// This... ahem... 'loader' is absolutely rotten.
// Please pretend this isn't here.
sky.onload = function () {
    println("Sky image successfully loaded (size: " + sky.width + "x" + sky.height + ")");
    // Initialise the sky
    skyCanvas.width = CANVAS_WIDTH;
    skyCanvas.height = sky.height;

    for (var i = 0; i < CANVAS_WIDTH; i += sky.width) {
        skyCtx.drawImage(sky, i, 0);
    }

    clouds.onload = function () {
        println("Clouds image successfully loaded (size: " + clouds.width + "x" + clouds.height + ")");
        cloudsCanvas.width = clouds.width;
        cloudsCanvas.height = clouds.height;
        cloudsCtx.drawImage(clouds, 0, 0);
        sea.onload = function () {
            println("Sea image successfully loaded (size: " + sea.width + "x" + sea.height + ")");
            seaCanvas.width = sea.width;
            seaCanvas.height = sea.height;
            seaCtx.drawImage(sea, 0, 0);
            grass1.onload = function () {
                println("Grass1 image successfully loaded (size: " + grass1.width + "x" + grass1.height + ")");
                grass1Canvas.width = CANVAS_WIDTH;
                grass1Canvas.height = grass1.height;
                for (var i = 0; i < CANVAS_WIDTH; i += grass1.width) {
                    grass1Ctx.drawImage(grass1, i, 0);
                }
                grass2.onload = function () {
                    println("Grass2 image successfully loaded (size: " + grass2.width + "x" + grass2.height + ")");
                    grass2Canvas.width = CANVAS_WIDTH;
                    grass2Canvas.height = grass2.height;
                    for (var i = 0; i < CANVAS_WIDTH; i += grass2.width) {
                        grass2Ctx.drawImage(grass2, i, 0);
                    }
                    grass3.onload = function () {
                        println("Grass3 image successfully loaded (size: " + grass3.width + "x" + grass3.height + ")");
                        grass3Canvas.width = CANVAS_WIDTH;
                        grass3Canvas.height = grass3.height;
                        for (var i = 0; i < CANVAS_WIDTH; i += grass3.width) {
                            grass3Ctx.drawImage(grass3, i, 0);
                        }
                        font.onload = function () {
                            println("Font image successfully loaded (size: " + font.width + "x" + font.height + ")");
                            fontCanvas.width = font.width;
                            fontCanvas.height = font.height;
                            fontCtx.drawImage(font, 0, 0);

                            // Scrolltext buffer is the width of the canvas plus the width of one character.
                            scrollbufCanvas.width = CANVAS_WIDTH + FONT_CHAR_WIDTH;
                            scrollbufCanvas.height = FONT_CHAR_HEIGHT;
                            scrollbufImageData = outCtx.createImageData(CANVAS_WIDTH + FONT_CHAR_WIDTH, FONT_CHAR_HEIGHT);
                            scrollbufImageDataRaw = scrollbufImageData.data;
                            smiley.onload = function () {
                                println("Smiley image successfully loaded (size: " + smiley.width + "x" + smiley.height + ")");
                                smileyCanvas.width = smiley.width;
                                smileyCanvas.height = smiley.height;
                                smileyCtx.drawImage(smiley, 0, 0);
                                smileyImageData = smileyCtx.getImageData(0, 0, smileyCanvas.width, smileyCanvas.height);
                                smileyImageDataRaw = smileyImageData.data;
                                setup();
                                redraw();
                            };
                            smiley.src = SMILEY_IMAGE;
                        };
                        font.src = FONT_IMAGE;
                    };
                    grass3.src = BG_GRASS3_IMAGE;
                };
                grass2.src = BG_GRASS2_IMAGE;
            };
            grass1.src = BG_GRASS1_IMAGE;
        };
        sea.src = BG_SEA_IMAGE;
    };
    clouds.src = BG_CLOUDS_IMAGE;
};
sky.src = BG_SKY_IMAGE;

function bitBlit(srcImgRawData, dstImgRawData, srcImgWidth, srcImgHeight, x, y) {
    // For every row...
    for (var srcy = 0; srcy < srcImgHeight; srcy++) {
        // For every column...
        for (var srcx = 0; srcx < srcImgWidth; srcx++) {
            ROW_SRC_OFFSET = srcy * srcImgWidth * 4 + srcx * 4;
            ROW_DST_OFFSET = srcy * CANVAS_WIDTH * 4 + y * CANVAS_WIDTH * 4 + x * 4 + srcx * 4;

            if (srcImgRawData[ROW_SRC_OFFSET + 3] == 255) {
                dstImgRawData[ROW_DST_OFFSET    ] = srcImgRawData[ROW_SRC_OFFSET    ];
                dstImgRawData[ROW_DST_OFFSET + 1] = srcImgRawData[ROW_SRC_OFFSET + 1];
                dstImgRawData[ROW_DST_OFFSET + 2] = srcImgRawData[ROW_SRC_OFFSET + 2];
                dstImgRawData[ROW_DST_OFFSET + 3] = 255;
            }
        }
    }
    return dstImgRawData;
}

function setup() {
    // Disable debug
    debug = false;

    // Generate sine tables (as integers for use in pixel plotting)
    for (var i = 0; i <= 360; i++) {
        SINE_TAB_TEXT[i] = Math.round(Math.sin(Math.PI / 180 * i) * 25);
        SINE_TAB_LISSA[i] = Math.round(Math.sin(Math.PI / 180 * i) * 50);
    }

    // Set up canvas to hold plotted scrolltext
    scrollTextFinalCanvas.width = CANVAS_WIDTH;
    scrollTextFinalCanvas.height = CANVAS_HEIGHT;
}

// Draw animation frame
function redraw() {
    // Arm callback for when browser wants to redraw
    if (!disabled) requestAnimFrame(redraw);

    // Background scrolling
    var ROW_WIDTH = clouds.width * 4;

//  // For every row...
//	for (var y = 0; y < CANVAS_HEIGHT; y++) {
//  var ROW_DST_OFFSET = y * ROW_WIDTH + ROW_WIDTH - 4 * BG_COLUMNS_TO_SCROLL;
//
//		// Copy leftmost pixel(s) into temporary buffer
//		var ROW_SRC_OFFSET = y * ROW_WIDTH;
//
//		for (var x = 0; x < 4 * BG_COLUMNS_TO_SCROLL; x++) {
//			tmpBgCol[x] = bgImageDataLayer2Raw[ROW_SRC_OFFSET + x];
//		}
//
//		// Shift everything else to the left
//		for (var x = 0; x < ROW_WIDTH - 4 * BG_COLUMNS_TO_SCROLL; x++) {
//			bgImageDataLayer2Raw[ROW_SRC_OFFSET + x] = bgImageDataLayer2Raw[ROW_SRC_OFFSET + x + 4 * BG_COLUMNS_TO_SCROLL];
//		}
//
//		// Copy temporary buffer pixels into the end of the row
//		for (var x = 0; x < 4 * BG_COLUMNS_TO_SCROLL; x++) {
//			bgImageDataLayer2Raw[ROW_DST_OFFSET + x] = tmpBgCol[x];
//		}
//	}

    // Draw sky layer
    outCtx.drawImage(skyCanvas, 0, 0);

    // Draw clouds layer
    outCtx.drawImage(cloudsCanvas, cloudsShift, 48);
    outCtx.drawImage(cloudsCanvas, -CANVAS_WIDTH + cloudsShift, 48);

    // Shift the clouds
    if (++cloudsWait == CLOUDS_FRAMES_TO_WAIT) {
        cloudsShift++;
        cloudsShift = cloudsShift % CANVAS_WIDTH;
        cloudsWait = 0;
    }

    // Draw sea layer
    outCtx.drawImage(seaCanvas, 0, sky.height);

    // Draw grass1 layer
    outCtx.drawImage(grass1Canvas, grass1Shift, sky.height + sea.height);
    outCtx.drawImage(grass1Canvas, -CANVAS_WIDTH + grass1Shift, sky.height + sea.height);

    // Shift grass1
    if (++grass1Wait == GRASS1_FRAMES_TO_WAIT) {
        grass1Shift++;
        grass1Shift %= CANVAS_WIDTH;
        grass1Wait = 0;
    }

    // Draw grass2 layer
    outCtx.drawImage(grass2Canvas, grass2Shift, sky.height + sea.height + grass1.height);
    outCtx.drawImage(grass2Canvas, -CANVAS_WIDTH + grass2Shift, sky.height + sea.height + grass1.height);

    // Shift grass2
    if (++grass2Wait == GRASS2_FRAMES_TO_WAIT) {
        grass2Shift++;
        grass2Shift %= CANVAS_WIDTH;
        grass2Wait = 0;
    }

    // Draw grass3 layer
    outCtx.drawImage(grass3Canvas, grass3Shift, sky.height + sea.height + grass1.height + grass2.height);
    outCtx.drawImage(grass3Canvas, -CANVAS_WIDTH + grass3Shift, sky.height + sea.height + grass1.height + grass2.height);

    // Shift grass3
    if (++grass3Wait == GRASS3_FRAMES_TO_WAIT) {
        grass3Shift++;
        grass3Shift %= CANVAS_WIDTH;
        grass3Wait = 0;
    }

    // Have we shifted a full char yet? If so, fetch the next one
    if (!(textCounter < SCROLL_TEXT.length)) textCounter = 0;

    // Handle a scroll delay in progress
    if (delayCounter > 0) {
        delayCounter--;
    } else if (scrolling == 0) {
        scrolling = 1;
        println("Scrolling re-enabled.");
        SINE_DEGREE_INCREMENT1 += 3;
    }

    // Interpret commands embedded in the scrolltext
    if (SCROLL_TEXT[textCounter] == '%') {
        switch (SCROLL_TEXT[++textCounter]) {
            case 'p':
                scrolling = 0;		// disable scrolling for a while
                delayCounter = SCROLL_TEXT[++textCounter] * 100;
                println("Scrolling disabled, delaying for " + delayCounter + " frames.");
                SINE_DEGREE_INCREMENT1 -= 3;
                nextChar()
                break;
            case 'f':
                if (TEXT_COLUMNS_TO_SCROLL * 2 <= 8) {
                    TEXT_COLUMNS_TO_SCROLL *= 2;
                }
                nextChar();
                updateScrollSpeedLabel();
                break;
            case 's':
                if (TEXT_COLUMNS_TO_SCROLL / 2 >= 1) {
                    TEXT_COLUMNS_TO_SCROLL /= 2;
                }
                nextChar();
                updateScrollSpeedLabel();
                break;
            default:
                break;
        }
    }

    // Fetch the next character if we've shifted the width of one character
    if (scrollCounter <= 0) {
        // Print a new character at the end
        var srcX = getCharOffset(SCROLL_TEXT[textCounter]);

        // Draw into scroll buffer
        tmpChar = fontCtx.getImageData(srcX, 0, FONT_CHAR_WIDTH, FONT_CHAR_HEIGHT);
        scrollbufCtx.putImageData(tmpChar, CANVAS_WIDTH, 0);
        nextChar();
    }

    // Fetch image data from scroll buffer
    scrollbufImageData = scrollbufCtx.getImageData(0, 0, CANVAS_WIDTH + FONT_CHAR_WIDTH, FONT_CHAR_HEIGHT);
    scrollbufImageDataRaw = scrollbufImageData.data;

    // Shift scrollbuffer image data to the left
    var ROW_WIDTH = (CANVAS_WIDTH + FONT_CHAR_WIDTH) * 4;
    var ROW_DST_OFFSET = y * ROW_WIDTH + ROW_WIDTH - 4 * BG_COLUMNS_TO_SCROLL;
    if (scrolling == 1) {
        for (var y = 0; y < FONT_CHAR_HEIGHT; y++) {		// For every row...
            // Copy leftmost pixel(s) into temporary buffer
            var ROW_SRC_OFFSET = y * ROW_WIDTH;

            for (var x = 0; x < 4 * TEXT_COLUMNS_TO_SCROLL; x++) {
                tmpBgCol[x] = scrollbufImageDataRaw[ROW_SRC_OFFSET + x];
            }

            // Shift everything else to the left
            for (var x = 0; x < ROW_WIDTH - 4 * TEXT_COLUMNS_TO_SCROLL; x++) {
                scrollbufImageDataRaw[ROW_SRC_OFFSET + x] = scrollbufImageDataRaw[ROW_SRC_OFFSET + x + 4 * TEXT_COLUMNS_TO_SCROLL];
            }

            // Copy temporary buffer pixels into the end of the row
            for (var x = 0; x < 4 * TEXT_COLUMNS_TO_SCROLL; x++) {
                scrollbufImageDataRaw[ROW_DST_OFFSET + x] = tmpBgCol[x];
            }
        }
        scrollCounter -= TEXT_COLUMNS_TO_SCROLL;
    }

    // Put the shifted data back into the canvas
    scrollbufImageData.data = scrollbufImageDataRaw;
    scrollbufCtx.putImageData(scrollbufImageData, 0, 0)

    // Clear the final scrollbuffer image data
    scrollTextFinalData = scrollbufCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    scrollTextFinalDataRaw = scrollTextFinalData.data;

    // Lissajous sprites!
    for (var i = 0; i < 16; i += 1) {
        scrollTextFinalDataRaw = bitBlit(smileyImageDataRaw, scrollTextFinalDataRaw, smiley.width, smiley.height,
                getSine(SINE_TAB_LISSA, sineDegree2, i * 6) * 2 + 160 - 16,
                64 + getSine(SINE_TAB_LISSA, sineDegree2 * 4, i * 32)); // + Math.round(getSine(sineDegree2, 0) / 2)));
    }

    /* For every row of smiley pixel data...
     for (var y = 0; y < smiley.height; y++) {
     // For every column...

     for (var x = 0; x < 360; x++) {
     ROW_SRC_OFFSET = y * smiley.width * 4 + (x % smiley.width) * 4;
     //ROW_DST_OFFSET = y * CANVAS_WIDTH * 4 + x * 4;
     ROW_DST_OFFSET = CANVAS_WIDTH * 4 * (SINE_MAX + getSine(sineDegree2 * 3) + y) + (getSine(sineDegree2 , x) + 160) * 4;// + x * 4;
     //ROW_DST_OFFSET = CANVAS_WIDTH * 4 * (SINE_MAX + y) + (getSine(sineDegree2, x) * 1 + 160) * 4;// + x * 4;

     if (smileyImageData.data[ROW_SRC_OFFSET + 3] == 255) {
     scrollTextFinalData.data[ROW_DST_OFFSET    ] = smileyImageData.data[ROW_SRC_OFFSET    ];
     scrollTextFinalData.data[ROW_DST_OFFSET + 1] = smileyImageData.data[ROW_SRC_OFFSET + 1];
     scrollTextFinalData.data[ROW_DST_OFFSET + 2] = smileyImageData.data[ROW_SRC_OFFSET + 2];
     scrollTextFinalData.data[ROW_DST_OFFSET + 3] = 255;
     }
     }
     }*/

    // Plot scrolltext with sinus transformation
    var ROW_WIDTH = (CANVAS_WIDTH + FONT_CHAR_WIDTH) * 4;
    // For every row of scrolltext pixel data...
    for (var y = 0; y < FONT_CHAR_HEIGHT; y++) {
        // For every column...
        for (var x = 0; x < CANVAS_WIDTH; x++) {
            ROW_SRC_OFFSET = y * ROW_WIDTH + x * 4;
            ROW_DST_OFFSET = CANVAS_WIDTH * 4 * (184 + getSine(SINE_TAB_TEXT, sineDegree1, x) + y) + x * 4;

            if (scrollbufImageDataRaw[ROW_SRC_OFFSET + 3] == 255) {
                scrollTextFinalDataRaw[ROW_DST_OFFSET    ] = scrollbufImageDataRaw[ROW_SRC_OFFSET    ];
                scrollTextFinalDataRaw[ROW_DST_OFFSET + 1] = scrollbufImageDataRaw[ROW_SRC_OFFSET + 1];
                scrollTextFinalDataRaw[ROW_DST_OFFSET + 2] = scrollbufImageDataRaw[ROW_SRC_OFFSET + 2];
                scrollTextFinalDataRaw[ROW_DST_OFFSET + 3] = 255;
            }
            //ROW_SRC_OFFSET = ROW_WIDTH * y;
            //ROW_DST_OFFSET = CANVAS_WIDTH * 4;
            //                          _______________________     ______________________________________     ________________     _______
            //                         /   Vertical centering  \   /           Sinusoid y-shift           \   /    Row shift   \   /X shift\
            //scrollTextFinalData.data[ROW_DST_OFFSET * SINE_MAX + ROW_DST_OFFSET * getSine(sineDegree1, x) + ROW_DST_OFFSET * y + x * 4    ] = scrollbufImageData.data[ROW_SRC_OFFSET + x * 4];
            //scrollTextFinalData.data[ROW_DST_OFFSET * SINE_MAX + ROW_DST_OFFSET * getSine(sineDegree1, x) + ROW_DST_OFFSET * y + x * 4 + 1] = scrollbufImageData.data[ROW_SRC_OFFSET + x * 4 + 1];
            //scrollTextFinalData.data[ROW_DST_OFFSET * SINE_MAX + ROW_DST_OFFSET * getSine(sineDegree1, x) + ROW_DST_OFFSET * y + x * 4 + 2] = scrollbufImageData.data[ROW_SRC_OFFSET + x * 4 + 2];
            //scrollTextFinalData.data[ROW_DST_OFFSET * SINE_MAX + ROW_DST_OFFSET * getSine(sineDegree1, x) + ROW_DST_OFFSET * y + x * 4 + 3] = scrollbufImageData.data[ROW_SRC_OFFSET + x * 4 + 3];
        }
    }

    // Update scrolltext canvas with plotted text
    scrollTextFinalData.data = scrollTextFinalDataRaw;
    scrollTextFinalCtx.putImageData(scrollTextFinalData, 0, 0);

    // Draw scrolltext onto output canvas
    outCtx.drawImage(scrollTextFinalCanvas, 0, 0);

    // Increment sine counters
    sineDegree1 += SINE_DEGREE_INCREMENT1;
    sineDegree1 = sineDegree1 % 360;

    sineDegree2 += SINE_DEGREE_INCREMENT2;
    sineDegree2 = sineDegree2 % 360;

    // Update debug stats if enabled
    if (debug) {
        frameCounter.innerHTML++;
        degreesValue.innerHTML = sineDegree1;
        sineValueText.innerHTML = getSine(SINE_TAB_TEXT, sineDegree1, 0);
        sineValueLissa.innerHTML = getSine(SINE_TAB_LISSA, sineDegree1, 0);
        fps.update();
        fps.display();
    }
}

// Sets counters up for working with the next character
function nextChar() {
    textCounter++;
    // Reset text counter if we've reached the end of the string.
    if (!(textCounter < SCROLL_TEXT.length)) textCounter = 0;
    scrollCounter = FONT_CHAR_WIDTH;
}

// Prints string of text to console
function println(text) {
    if (debug) {
        console.value += text + '\n';
        console.scrollTop = console.scrollHeight;
    }
}

// Map characters to positions in the font sheet bitmap
function getCharOffset(letter) {
    var charoffset = 0;
    for (var i = 0; i < FONT_CHAR_TAB.length; i++) {
        if (letter == FONT_CHAR_TAB[i]) {
            charoffset = i * FONT_CHAR_WIDTH;
            break;
        }
    }
    return charoffset;
}

function getSine(array, degrees, offset) {
    return array[(degrees + offset) % 360];
}

function startStop() {
    disabled = !disabled;
    if (!disabled) {
        document.getElementById("startstop").className = "btn btn-success";
        redraw();
    } else {
        document.getElementById("startstop").className = "btn btn-danger";
    }
}

// Set the scrolltext speed (1-5)
function setScrollSpeed(speed) {
    newSpeed = TEXT_COLUMNS_TO_SCROLL * Math.pow(2, speed);
    if (newSpeed >= 1 && newSpeed <= 8) {
        TEXT_COLUMNS_TO_SCROLL = newSpeed;
    }
    updateScrollSpeedLabel();
}

function updateScrollSpeedLabel() {
        scrollSpeedValue.innerHTML = "Scroll speed: " + TEXT_COLUMNS_TO_SCROLL;
}

// FPS counter functions
// (adapted from code originally from Sam Lancashire: http://html5gamedev.samlancashire.com/how-to-add-an-fps-counter-to-your-game)
var fps = {
    current: 0,
    last: 0,
    lastUpdated: Date.now(),
    display: function () {
        fpsValue.innerHTML = fps.last + "fps";
    },
    update: function () {
        fps.current++;
        if (Date.now() - fps.lastUpdated >= 1000) {
            fps.last = fps.current;
            fps.current = 0;
            fps.lastUpdated = Date.now();
        }
    }
}
