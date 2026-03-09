try {
    require('./src/index.js');
} catch (e) {
    console.error("CRASH ERROR:", e.stack);
}
