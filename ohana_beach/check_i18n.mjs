import fs from 'fs';

const indexPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\scratch\\ohana_beach\\index.html';
const htmlContent = fs.readFileSync(indexPath, 'utf8');

// Find all data-i18n attributes
const regex = /data-i18n="([^"]+)"/g;
const keysInHtml = new Set();
let match;
while ((match = regex.exec(htmlContent)) !== null) {
    keysInHtml.add(match[1]);
}

// Extract i18n object
const i18nMatch = htmlContent.match(/const i18n\s*=\s*(\{[\s\S]*?\});\s*const menuData/s);
if (!i18nMatch) {
    console.error("Could not find i18n object");
    process.exit(1);
}

const i18nObj = eval(`(${i18nMatch[1]})`);
const trKeys = Object.keys(i18nObj['tr'] || {});

const missingInDict = [];
keysInHtml.forEach(key => {
    if (!trKeys.includes(key)) {
        missingInDict.push(key);
    }
});

console.log("Keys in HTML but missing in i18n:", missingInDict);

// Now check if category buttons have data-i18n
const catRegex = /<button[^>]*data-category="([^"]+)"[^>]*>([^<]+)<\/button>/g;
let catMatch;
let missingI18nOnCats = 0;
while ((catMatch = catRegex.exec(htmlContent)) !== null) {
    if (!catMatch[0].includes('data-i18n')) {
        missingI18nOnCats++;
    }
}
console.log(`Category buttons missing data-i18n: ${missingI18nOnCats}`);
