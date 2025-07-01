// Copyright 2023 James Dewar. All rights reserved.
"use strict";
const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const shallowCopyObject = (object) => {
    const copy = {};
    Object.entries(object).forEach(([key, value]) => {
        copy[key] = value;
    });
    return copy;
};
const shallowCopyArray = (array) => {
    return array.map((value) => value);
};
const shuffleArray = (arrayIn) => {
    let array = [];
    for (let i = 0; i < arrayIn.length; ++i) {
        array.push(arrayIn[i]);
    }
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};
const randomArrayElement = (array) => {
    const i = Math.floor(Math.random() * array.length);
    return array[i];
};
const randomIntegerInclusive = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
const mapObject = (o, callback) => {
    const r = {};
    Object.entries(o).forEach(([k, v]) => {
        r[k] = callback(k, v);
    });
    return r;
};
const objectFromSet = (set) => {
    const a = Array.from(set);
    const t = {};
    a.forEach(i => {
        t[i] = true;
    });
    return t;
};
const setOFromA = (a) => {
    const r = {};
    a.forEach(i => {r[i] = true; });
    return r;
};
const unionSetsO = (a, b) => {
    return setOFromA(Object.keys(a).concat(Object.keys(b)));
};
const intersectSetsO = (a, b) => {
    const ra = Object.keys(a).filter(i => b[i] !== undefined);
    return setOFromA(ra);
};
const removeAllChildElements = (e) => {
    while (e.firstChild) {
        e.removeChild(e.firstChild);
    }
};
const addOrRemoveClass = (e, class_, add) => {
    if (add) {
        e.classList.add(class_);
    } else {
        e.classList.remove(class_);
    }
};
const downloadContent = (content, fileName, contentType) => {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
};
const handlePortraitOrLandscape = (width, height) => {
    const isPortrait = () => {
        if (typeof(window.orientation) == "number") {
            if (window.orientation == -90 || window.orientation == 90) {
                return false;
            }
            return true;
        } else {
            return screen.width < screen.height;
        }
    };
    const viewport = document.querySelector('meta[name="viewport"]');
    const rest = ",user-scalable=no";
    if (isPortrait()) {
        viewport.content = `width=${width}${rest}`;
    } else {
        viewport.content = `height=${height}${rest}`;
    }
    window.addEventListener("orientationchange", () => {
        handlePortraitOrLandscape(width, height);
    });
};
const getElementTransformTranslate = (element) => { // this code is from ChatGPT...
    const style = window.getComputedStyle(element);
    const transform = style.transform;
    // Check if transform is set (it might return 'none' when no transform is applied)
    if (transform === 'none') {
        return [0, 0];
    }
    // Extract translate values from the transform matrix
    const matrix = transform.match(/^matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^,]+)\)$/);
    if (matrix) {
        const translateX = parseFloat(matrix[5]);
        const translateY = parseFloat(matrix[6]);
        return [translateX, translateY];
    } else {
        // In case of other transform types like translate3d, you can adjust the regex accordingly
        console.log('Transform is not a matrix or is not in expected format.');
        return [0, 0];
    }
};
const replaceStringCharAt = (s, index, replacement) => {
    return s.substring(0, index) + replacement + s.substring(index + replacement.length);
};
const capitalizeFirstLetter = (s) => {
    if (s.length < 1) { return s; }
    return s[0].toUpperCase() + s.slice(1);
};
const reverseString = (s) => {
    return s.split("").reverse().join("");
};
const escapeRegExp = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};
const cycleBetween = (current, list_, reverse = false) => {
    const list = reverse === true ? shallowCopyArray(list_).reverse() : list_;
    for (let i = 0; i < list.length; i += 1) {
        const j = i == list.length - 1 ? 0 : i + 1;
        if (current === list[i]) {
            return list[j];
        }
    }
    return list[0];
};
const cycleArray = (array, n) => {
    if (array.length === 0) {
        return undefined;
    }
    const index = Math.abs(n) % array.length;
    return array[index];
};
const msToTimeString = (totalMs) => {
    let t = totalMs;
    const hours = Math.floor(t / 1000 / 60 / 60);
    t -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(t / 1000 / 60);
    t -= minutes * 1000 * 60;
    const seconds = Math.floor(t / 1000);
    t -= seconds * 1000;
    const milliseconds = t;

    const secondsS = ('00'+seconds).slice(-2);
    if (hours > 0) {
        const hoursS = `${hours}`;
        const minutesS = ('00'+minutes).slice(-2);
        return `${hoursS}:${minutesS}:${secondsS}`;
    } else {
        const minutesS = `${minutes}`;
        return `${minutesS}:${secondsS}`;
    }
};
const lerp = (from, to, t) => from + (to - from) * t;
const lerpArray = (from, to, t) => {
    const r = [];
    const len = Math.max(from.length, to.length);
    for (let i = 0; i < len; ++i) {
        const a = from[i];
        const b = to[i];
        if (a === undefined && b === undefined) {
            r.push(undefined);
        } else if (a === undefined) {
            r.push(b);
        } else if (b === undefined) {
            r.push(a);
        } else {
            r.push(lerp(a, b, t));
        }
    }
    return r;
};
const indexFromRowColumn = (row, column, numRows, numColumns) => row * numColumns + column;
const factorial = (n) => {
    let f = 1;
    for (let i = 1; i <= n; ++i) {
        f *= i;
    }
    return f;
};
const numCombinations = (n, r) => {
    return factorial(n) / (factorial(r) * factorial(n - r));
};
const permutations = (a) => {
    let result = [];
    const permute = (arr, m = []) => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }
    permute(a)
    return result;
};
const combinations = (a, n) => {
    if (n === 0) {
        return [[]];
    }
    const r = [];
    for (let i = 0; i < a.length; ++i) {
        const m = a[i];
        const a_ = a.slice(i + 1);
        const combos = combinations(a_, n - 1);
        combos.forEach(combo => {
            r.push([m].concat(combo));
        });
    }
    return r;
};
const powerSet = (a) => {
    // set of all subsets
    let r = [];
    for (let i = 0; i <= a.length; ++i) {
        const combos = combinations(a, i);
        r = r.concat(combos);
    }
    return r;
};
const clamp = (value, min, max) => {
    if (value < min) { 
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
};
