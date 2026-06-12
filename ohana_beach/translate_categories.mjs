import fs from 'fs';
import { translate } from '@vitalets/google-translate-api';

const indexPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\scratch\\ohana_beach\\index.html';

async function main() {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Extract categories
    const catRegex = /<button([^>]*)data-category="([^"]+)"([^>]*)>([^<]+)<\/button>/g;
    const cats = new Set();
    let match;
    while ((match = catRegex.exec(htmlContent)) !== null) {
        cats.add(match[2]);
    }

    const catArray = Array.from(cats);
    console.log(`Translating ${catArray.length} categories...`);

    const translatedCats = {
        en: {}, ru: {}, de: {}
    };

    const textToTranslate = catArray.join(' \n ||| \n ');

    for (const lang of ['en', 'ru', 'de']) {
        try {
            const res = await translate(textToTranslate, { to: lang });
            const translatedBatch = res.text.split(/\s*\|\|\|\s*/);
            for (let j = 0; j < catArray.length; j++) {
                translatedCats[lang][catArray[j]] = translatedBatch[j] ? translatedBatch[j].trim() : catArray[j];
            }
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`Error translating to ${lang}:`, e.message);
            for (let j = 0; j < catArray.length; j++) {
                translatedCats[lang][catArray[j]] = catArray[j];
            }
        }
    }

    // Now update the HTML buttons to include data-i18n
    htmlContent = htmlContent.replace(catRegex, (match, p1, p2, p3, p4) => {
        // We'll use a slugified version for the i18n key or just base64 or a safe string.
        // Let's just use `cat_` + index
        const index = catArray.indexOf(p2);
        return `<button${p1}data-category="${p2}"${p3} data-i18n="cat_${index}">${p4}</button>`;
    });

    // Extract the i18n object string, parse it, add keys, then stringify back
    const i18nRegex = /const i18n\s*=\s*(\{[\s\S]*?\});\s*const menuData/s;
    const i18nMatch = htmlContent.match(i18nRegex);
    if (!i18nMatch) {
        console.error("Could not find i18n");
        return;
    }

    const i18nObj = eval(`(${i18nMatch[1]})`);

    // Add category translations
    for (let i = 0; i < catArray.length; i++) {
        const key = `cat_${i}`;
        const trVal = catArray[i];
        
        // Clean up some weird translations if they happen
        let enVal = translatedCats.en[trVal] || trVal;
        let ruVal = translatedCats.ru[trVal] || trVal;
        let deVal = translatedCats.de[trVal] || trVal;
        
        i18nObj.tr[key] = trVal;
        i18nObj.en[key] = enVal;
        i18nObj.ru[key] = ruVal;
        i18nObj.de[key] = deVal;
    }

    const newI18nStr = `const i18n = ${JSON.stringify(i18nObj, null, 4)};\n\n        const menuData`;
    htmlContent = htmlContent.replace(i18nRegex, newI18nStr);

    fs.writeFileSync(indexPath, htmlContent, 'utf8');
    console.log("Categories translated and HTML updated!");
}

main().catch(console.error);
