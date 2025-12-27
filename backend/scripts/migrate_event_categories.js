const { Event } = require('../models');

const categoryMap = {
    'Workshop': 'Atölye',
    'Seminar': 'Seminer',
    'Conference': 'Konferans',
    'Social': 'Sosyal',
    'Sports': 'Spor',
    'Cultural': 'Kültürel',
    'Other': 'Diğer',
    'Kariyer': 'Seminer', // Map legacy specific ones to nearest generic
    'Teknoloji': 'Atölye',
    'Tören': 'Kültürel',
    'Eğitim': 'Atölye'
};

async function migrateCategories() {
    try {
        const events = await Event.findAll();
        console.log(`Found ${events.length} events to check.`);

        for (const event of events) {
            const currentCat = event.category;
            const newCat = categoryMap[currentCat] || currentCat; // Default to current if no map found

            if (currentCat !== newCat) {
                console.log(`Updating Event "${event.title}": ${currentCat} -> ${newCat}`);
                await event.update({ category: newCat });
            }
        }
        console.log('Category migration completed.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateCategories();
