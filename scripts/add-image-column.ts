import sql from '../db';

async function addImageColumnToBrands() {
    try {
        console.log('Adding image column to brands table...');

        // Check if column already exists
        const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='brands' AND column_name='image'
    `;

        if (checkColumn.length > 0) {
            console.log('✓ Image column already exists in brands table');
            return;
        }

        // Add the image column
        await sql`
      ALTER TABLE brands 
      ADD COLUMN image TEXT
    `;

        console.log('✓ Successfully added image column to brands table');

    } catch (error) {
        console.error('Error adding image column:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

addImageColumnToBrands();
