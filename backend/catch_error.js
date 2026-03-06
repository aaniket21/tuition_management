try {
    require('./src/index.js');
    console.log("Server module loaded successfully");
} catch (e) {
    console.error("CRITICAL ERROR:");
    console.error(e.stack);
}
