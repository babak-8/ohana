import fs from 'fs';
import { translate } from '@vitalets/google-translate-api';

const indexPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\scratch\\ohana_beach\\index.html';

async function main() {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Extract menuData
    const menuDataRegex = /const menuData\s*=\s*(\{[\s\S]*?\});\s*let currentLang/s;
    const match = htmlContent.match(menuDataRegex);
    if (!match) {
        console.error("Could not find menuData in index.html");
        process.exit(1);
    }

    const menuData = JSON.parse(match[1]);

    // Collect all strings
    const stringSet = new Set();
    Object.values(menuData).forEach(items => {
        items.forEach(item => {
            if (item.name.tr) stringSet.add(item.name.tr);
            if (item.desc.tr) stringSet.add(item.desc.tr);
        });
    });

    const strings = Array.from(stringSet).filter(s => s.trim().length > 0);
    console.log(`Total unique strings to translate: ${strings.length}`);

    const translations = {
        en: {},
        ru: {},
        de: {}
    };

    // Batch translate
    const batchSize = 40;
    for (const lang of ['en', 'ru', 'de']) {
        console.log(`Translating to ${lang}...`);
        for (let i = 0; i < strings.length; i += batchSize) {
            const batch = strings.slice(i, i + batchSize);
            const textToTranslate = batch.join(' \n ||| \n ');
            
            try {
                const res = await translate(textToTranslate, { to: lang });
                const translatedBatch = res.text.split(/\s*\|\|\|\s*/);
                
                for (let j = 0; j < batch.length; j++) {
                    translations[lang][batch[j]] = translatedBatch[j] ? translatedBatch[j].trim() : batch[j];
                }
                
                // Be nice to the API
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.error(`Error translating batch to ${lang}:`, e.message);
                // Fallback
                for (let j = 0; j < batch.length; j++) {
                    translations[lang][batch[j]] = batch[j];
                }
            }
        }
    }

    // Apply translations
    Object.values(menuData).forEach(items => {
        items.forEach(item => {
            const nameTr = item.name.tr;
            if (nameTr && translations.en[nameTr]) {
                item.name.en = translations.en[nameTr] || nameTr;
                item.name.ru = translations.ru[nameTr] || nameTr;
                item.name.de = translations.de[nameTr] || nameTr;
            }
            const descTr = item.desc.tr;
            if (descTr && translations.en[descTr]) {
                item.desc.en = translations.en[descTr] || descTr;
                item.desc.ru = translations.ru[descTr] || descTr;
                item.desc.de = translations.de[descTr] || descTr;
            }
        });
    });

    // Write back
    const newMenuDataStr = `const menuData = ${JSON.stringify(menuData, null, 4)};\n\n        let currentLang`;
    htmlContent = htmlContent.replace(menuDataRegex, newMenuDataStr);
    fs.writeFileSync(indexPath, htmlContent, 'utf8');

    console.log("Translations successfully applied to index.html");
}

main().catch(console.error);
