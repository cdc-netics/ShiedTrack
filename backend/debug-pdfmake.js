const pdfmake = require('pdfmake');
console.log('Type of pdfmake:', typeof pdfmake);
console.log('Keys:', Object.keys(pdfmake));
console.log('Is constructor?', typeof pdfmake === 'function' && /^\s*class\s+/.test(pdfmake.toString()));
console.log('pdfmake prototype:', pdfmake.prototype);

try {
    new pdfmake({});
    console.log('Success: new pdfmake({}) worked');
} catch (e) {
    console.log('Error calling new pdfmake:', e.message);
}
