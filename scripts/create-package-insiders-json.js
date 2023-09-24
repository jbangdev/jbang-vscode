//Copied from https://github.com/microsoft/vscode-maven/blob/main/scripts/create-package-insiders-json.js
const fs = require("fs");

const json = JSON.parse(fs.readFileSync("./package.json").toString());
const stableVersion = json.version.match(/(\d+)\.(\d+)\.(\d+)/);
const major = stableVersion[1];
const minor = stableVersion[2];

function prependZero(number) {
    if (number > 99) {
        throw new Exception("Unexpected value to prepend with zero");
    }
    return `${number < 10 ? "0" : ""}${number}`;
}

const date = new Date();
const month = date.getMonth() + 1;
const day = date.getDate();
const hours = date.getHours();
const minutes = date.getMinutes();

//Can't use minutes and seconds to prevent failures from 2 build running in the same minute
//because each number must be in the range to 2147483647
//1% of the minutes in a day = 14.4 minutes. So we can publish about every 15 min.
const minutesElapsed = hours * 60 + minutes;
const percentage = Math.floor((minutesElapsed / 1440) * 100);
patch = `${date.getFullYear()}${prependZero(month)}${prependZero(day)}${prependZero(percentage)}`;

const insiderPackageJson = Object.assign(json, {
    version: `${major}.${minor}.${patch}`,
});

fs.writeFileSync("./package.insiders.json", JSON.stringify(insiderPackageJson));