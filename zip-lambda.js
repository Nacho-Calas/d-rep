const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

async function createLambdaZip(lambdaName, outputDir, deleteLambdaModule, cpNodeModules) {
    const lambdaDir = path.join(outputDir, lambdaName);
    if (deleteLambdaModule == "true" && await fs.pathExists(lambdaDir)) {
      console.warn(`Se borra el contenido de la carpeta ${lambdaDir}`);
      await fs.remove(lambdaDir);
    } 
    await fs.ensureDir(lambdaDir);
  
    // Copia los archivos de dist/lambdas a lambdaDir
    const srcDir = path.join(lambdaDir, `src/lambdas/${lambdaName}`);
    const sourceDir1 = path.resolve(__dirname, `dist/src/lambdas/${lambdaName}`);
    await fs.copy(sourceDir1, srcDir);

    //crear el handler en la raiz
    // Crear la ruta completa del archivo
    const filePath = path.join(lambdaDir, 'handler.js');

    const line1 = `const handler_1 = require("./src/lambdas/${lambdaName}/handler");`
    const lines = [
      `"use strict";`,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
      `exports.handler = void 0;`,
      line1,
      `exports.handler = handler_1.handler;`
    ];
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');

    // Copia el package.json a lambdaDir
    const packageJsonPath = path.resolve(__dirname, `src/lambdas/${lambdaName}/package.json`);
    await fs.copy(packageJsonPath, path.join(lambdaDir, 'package.json'));

    const commonDir = path.join(lambdaDir, 'src/common/');
    await fs.ensureDir(commonDir);
    // Copia el common a lambdaDir
    const sourceDir2 = path.resolve(__dirname, `dist/src/common`);
    await fs.copy(sourceDir2, commonDir);

    if (cpNodeModules == "true") {
        // Copia el node_modules a lambdaDir
        const nodeModulesDir = path.join(lambdaDir, 'node_modules');

        // Limpia el directorio de salida si ya existe
        if (await fs.pathExists(nodeModulesDir)) {
            await fs.remove(nodeModulesDir);
        }
        // Copia el common a lambdaDir
        const sourceDir3 = path.resolve(__dirname, `src/lambdas/${lambdaName}/node_modules`);
        if (await fs.pathExists(sourceDir3)) {
            await fs.ensureDir(nodeModulesDir);
            // Copia el node_modules a lambdaDir
            await fs.copy(sourceDir3, nodeModulesDir, {
            overwrite: true,
            errorOnExist: false,
            recursive: true,
            });
        } else {
            console.warn(`El directorio ${sourceDir3} no existe, se omitirá la copia de node_modules.`);
        }
    } else {
        console.warn(`Se omite la copia del directorio node_modules`);
    }
  
    // Crea el archivo ZIP
    const zipFile = path.join(outputDir, `${lambdaName}.zip`);
    const output = fs.createWriteStream(zipFile);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
  
    output.on('close', () => {
      console.log(`Archivo ZIP creado: ${zipFile} (${archive.pointer()} bytes)`);
    });
  
    archive.on('error', (err) => {
      throw err;
    });
  
    archive.pipe(output);
  
    // Agrega los archivos y carpetas al archivo ZIP
    archive.directory(lambdaDir, false);
  
    await archive.finalize();
  }
  

const lambdaName = process.argv[2] || 'exampleLambda';
const deleteLambdaModule = process.argv[3] || 'true';
const cpNodeModules = process.argv[4] || 'true';

const outputDir = path.resolve(__dirname, 'src/build');

createLambdaZip(lambdaName, outputDir, deleteLambdaModule, cpNodeModules)
  .then(() => console.log('ZIP creado con éxito.'))
  .catch((err) => console.error('Error al crear el ZIP:', err));