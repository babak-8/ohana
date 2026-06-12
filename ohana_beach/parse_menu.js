const fs = require('fs');

const htmlPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\a539c85b-76fa-4d76-9f34-12206013881b\\.system_generated\\steps\\36\\content.md';
const indexPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\scratch\\ohana_beach\\index.html';

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract categories JSON
const catMatch = htmlContent.match(/window\.categories\s*=\s*(\[.*?\]);/s);
// Extract products JSON
const prodMatch = htmlContent.match(/const rawProducts\s*=\s*(\[.*?\]);/s);

if (!catMatch || !prodMatch) {
    console.error("Could not find categories or rawProducts in HTML");
    process.exit(1);
}

const categories = JSON.parse(catMatch[1]);
const rawProducts = JSON.parse(prodMatch[1]);

// Map category ID to Name
const catMap = {};
categories.forEach(c => {
    catMap[c.id] = c.name;
});

// Group products
const menuData = {};
// Sort categories so they appear in order? The rawProducts are already somewhat ordered or we can group them
rawProducts.forEach(p => {
    const catName = catMap[p.category_id] || "Diğer";
    if (!menuData[catName]) {
        menuData[catName] = [];
    }
    
    // We will just use the same text for all languages for now, to ensure it works
    const nameStr = p.name ? p.name.trim() : "";
    const descStr = p.description ? p.description.trim() : "";
    
    menuData[catName].push({
        name: {
            tr: nameStr,
            en: nameStr, // ideally translated
            ru: nameStr,
            de: nameStr
        },
        desc: {
            tr: descStr,
            en: descStr,
            ru: descStr,
            de: descStr
        },
        price: "₺" + parseFloat(p.price).toString()
    });
});

// Now we need to update index.html
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace menuData block
const menuDataRegex = /const menuData\s*=\s*\{[\s\S]*?\};\s*let currentLang/s;
const newMenuDataStr = `const menuData = ${JSON.stringify(menuData, null, 4)};\n\n        let currentLang`;

indexContent = indexContent.replace(menuDataRegex, newMenuDataStr);

// We also need to update the category buttons in HTML to match the new categories
// Let's get unique categories that have products
const activeCategories = Object.keys(menuData);
let categoryButtonsHtml = '';
activeCategories.forEach((cat, index) => {
    const activeClass = index === 0 ? 'bg-coral-400 text-white' : 'bg-coral-50 text-coral-700 hover:bg-coral-100';
    categoryButtonsHtml += `                            <button class="flex-shrink-0 px-4 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${activeClass} category-btn" data-category="${cat}">${cat}</button>\n`;
});

// Replace the categories in index.html
const catContainerRegex = /<div class="flex gap-2 overflow-x-auto no-scrollbar pb-2" id="menu-categories">[\s\S]*?<\/div>/s;
const newCatContainer = `<div class="flex gap-2 overflow-x-auto no-scrollbar pb-2" id="menu-categories">\n${categoryButtonsHtml}                        </div>`;

indexContent = indexContent.replace(catContainerRegex, newCatContainer);

// Update default currentCategory to the first category
const firstCat = activeCategories[0];
indexContent = indexContent.replace(/let currentCategory = '.*?';/, `let currentCategory = '${firstCat}';`);

fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log("Successfully updated index.html with real menu data!");
console.log("Categories found:", activeCategories.length);
console.log("Products found:", rawProducts.length);
