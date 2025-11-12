const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { join } = require('path');

async function convertToIco() {
  try {
    // Load the image
    const image = await loadImage(join(__dirname, 'public', 'hinata.jpg'));
    
    // Create canvas
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    
    // Draw image on canvas
    ctx.drawImage(image, 0, 0, 32, 32);
    
    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Write to file
    fs.writeFileSync(join(__dirname, 'public', 'hinataa.ico'), buffer);
    
    console.log('Successfully converted hinata.jpg to hinataa.ico');
  } catch (error) {
    console.error('Error converting image:', error);
  }
}

convertToIco();