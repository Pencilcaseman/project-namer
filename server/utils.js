const download = require('download');
const fs = require('fs');

// A list of logo subjects
const subjects = [
    'Maths',
    'Science',
    'Animals',
    'Music',
    'Sports'
];

// List of logo color styles
const logoColorStyles = [
    '2-Color',
    '3-Color',
    '6-Color',
    'Black and White',
    'Colorful',
    'Monochrome'
];

// A list of themes and their descriptions (for the AI image generation)
const themes = {
    light: 'A light theme with generally brighter colours and a white background',
    dark: 'A dark theme with generally darker colours and a black background',
    bumblebee: 'A light theme focusing yellows, oranges and blacks',
    synthwave: 'A dark theme focusing on blues and pinks, with white accents',
    retro: 'A light theme with a pastel palette and somewhat hard edges',
    cyberpunk: 'A highly saturated theme using a lot of yellow, blue and pink. Edges are very hard',
    valentine: 'A very soft, light theme, with red, pink and purple hues',
    halloween: 'A dark theme using mainly orange, purple and black. Other colours are allowed',
    forest: 'A gentle dark theme, using shades of green and blue with dark backgrounds and light accents',
    aqua: 'Uses shades of blue and purple',
    pastel: 'A light theme using pastel colours',
    luxury: 'A dark theme using expensive colours such as gold, silver and purple on a black background',
    dracula: 'A pleasant dark theme with many purple hues, though other colours are also present',
    business: 'A very smart and formal theme with hard edges, using mostly greys, blacks and whites, with small amounts of other colours',
    night: 'A subtle dark theme using primarily blues and purples and whites',
    dim: 'A pleasant dark theme using mostly oranges, greens and grays on a gray background',
    sunset: 'A pleasant dark theme using mostly pinks, oranges and grays on a very deep blue background'
};

// A simple string hash taken from https://stackoverflow.com/a/52171480/11564403
// We will always use a seed of zero, since we need reproducable results
const hashString = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed; let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// Given a URL and a path, download the file at the URL and save it to the path
function downloadFile (url, path) {
    (async () => {
        fs.writeFileSync(path, await download(url));
    })();
}

module.exports = {
    subjects,
    logoColorStyles,
    themes,
    hashString,
    downloadFile
};
