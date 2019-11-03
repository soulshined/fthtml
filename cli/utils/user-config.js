(function () {
  const freq = require('./frequent');
  const path = require('path');

  const filepath = path.resolve(process.cwd(),'fthtmlconfig.json');
  let config = {
    rootDir : null,
    keepTreeStructure : false,
    excluded : [],
    importDir : null,
    exportDir : null,
    templateDir : null
  };

  if (freq.fileExists(filepath)) {
    const parsed = freq.getJSONFromFile(filepath);

    if (freq.isTypeOfAndNotEmpty(parsed.rootDir, 'string')) config.rootDir = path.resolve(parsed.rootDir);
    if (freq.isTypeOf(parsed.keepTreeStructure, 'boolean')) config.keepTreeStructure = parsed.keepTreeStructure;
    if (Array.isArray(parsed.excluded)) {
      if (freq.isTypesOfAndNotEmpty(parsed.excluded, 'string')) config.excluded = parsed.excluded;
    } 
    if (freq.isTypeOfAndNotEmpty(parsed.importDir, 'string')) config.importDir = path.resolve(parsed.importDir);
    if (freq.isTypeOfAndNotEmpty(parsed.exportDir, 'string')) config.exportDir = path.resolve(parsed.exportDir);
    if (freq.isTypeOfAndNotEmpty(parsed.templateDir, 'string')) config.templateDir = path.resolve(parsed.templateDir);
  }

  module.exports = () => config;
})();

