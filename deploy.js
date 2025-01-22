const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

// Ruta al archivo JSON con las rutas de las carpetas Lambda
const lambdasFile = path.join(__dirname, 'lambdas.json');
let profile = "";
let env = "dev";
let defaultLambda = "";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question) => {
  return new Promise((resolve) => rl.question(question, resolve));
};

// Funcion para leer los nombres de las lambdas desde el archivo JSON
const getLambdaNames = () => {
    const rawData = fs.readFileSync(lambdasFile);
    let lambdaNames = [];
    lambdaNames = JSON.parse(rawData).names;
    return lambdaNames;
  };

// Funcion para crear las rutas de los archivos lambdas
const getLambdaPaths = (lambdasNames) => {
  return lambdasNames.map(relativeName => path.resolve(__dirname, `./src/lambdas/${relativeName}`));
};

// Funcion para ejecutar un comando y esperar su finalización
const execCommand = (command, dir) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        reject(`Error ejecutando el comando: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
};

// Funcion para instalar dependencias en cada carpeta de Lambda
const installDependencies = async (lambdaPaths) => {
  for (const folderPath of lambdaPaths) {
    console.log(`Instalando dependencias en ${folderPath}`);
    try {
      await execCommand('npm install', folderPath);
      console.log(`Dependencias instaladas en ${folderPath}`);
    } catch (error) {
      console.error(`Error instalando dependencias en ${folderPath}: ${error}`);
    }
  }
};

// Funcion para instalar dependencias en cada carpeta de Lambda
const buildLambdas = async (lambdasNames) => {
    //ejecutar tsc
    const dirDefault = path.join(__dirname, '.');dirDefault
    try {
      console.log(`Ejecutando tsc en ${dirDefault}`);
      await execCommand('npm run build',dirDefault);
      console.log(`Listo tsc`);
    } catch (error) {
      console.error(`Error en tsc: ${error}`);
    }
    for (const lambda of lambdasNames) {
      console.log(`Armando build ${lambda}`);
      try {
        await execCommand(`node zip-lambda.js ${lambda}`, dirDefault);
        console.log(`Build listo de  ${lambda}`);
      } catch (error) {
        console.error(`Error ${lambda}: ${error}`);
      }
    }
  };

// Funcion para desplegar con Serverless
const deployAllServerless = async () => {
  console.log(`Desplegando con Serverless: stage-> ${env}, aws-profile-> ${profile}`);
  try {
    await execCommand(`serverless deploy --stage ${env} --aws-profile ${profile}`, path.join(__dirname, '.'));
    console.log(`Despliegue completado`);
  } catch (error) {
    console.error(`Error en el despliegue: ${error}`);
  }
};

const deployFunctionServerless = async (lambdaName) => {
  console.log(`Desplegando con Serverless: stage-> ${env}, aws-profile-> ${profile}, function-> ${lambdaName}`);
  try {
    await execCommand(`serverless deploy --stage ${env} --aws-profile ${profile} -f ${lambdaName}`, path.join(__dirname, '.'));
    console.log(`Despliegue completado`);
  } catch (error) {
    console.error(`Error en el despliegue: ${error}`);
  }
};

const changeProfileAndEnv = async () => {
  console.log(`El ambiente a desplegar es -> ${env}`);
  console.log('Modificar ambiente?');
  console.log('1. Modificar ambiente');
  console.log('2. Continuar');
  let choice = await askQuestion('Ingrese la opcion: ');

  if (choice == '1') {
    const newEnv = await askQuestion('Ingrese el nuevo ambiente: ');
    env = newEnv;
  };

  console.log(`El perfil de aws es -> ${profile}`);
  console.log('Modificar perfil aws?');
  console.log('1. Modificar perfil');
  console.log('2. Continuar');

  choice = await askQuestion('Ingrese la opcion: ');
  if (choice == '1') {
    const newProfile = await askQuestion('Ingrese el nuevo perfil: ');
    profile = newProfile
  };
  return;
}

const createFunction = async () => {
  console.log("Recuerde sumar la nueva lambda a lambdas.json");
  const lambdasNames = getLambdaNames();
  const lambda = await askQuestion('Ingrese el nombre de la lambda: ');
  if (!lambdasNames.includes(lambda)) {
    console.log("Recuerde sumar la nueva lambda a lambdas.json, luego volver a ejecutar la funcion");
    return;
  };
  const lambdaPaths = getLambdaPaths(lambdasNames);
  await installDependencies(lambdaPaths);
  await buildLambdas(lambdasNames);
  //deploy lambdas
  await changeProfileAndEnv();
  await deployAllServerless()
  return;

};

const uploadFunction = async () => {
  await changeProfileAndEnv();
  const lambdaName = await askQuestion('Ingrese el nombre de la lambda: ');
  const lambdaPath = path.resolve(__dirname, `./src/lambdas/${lambdaName}`);
  console.log('Instalar dependencias?');
  console.log('1. SI');
  console.log('2. NO');
  choice = await askQuestion('Ingrese la opcion: ');
  if (choice == '1') {
    await installDependencies([lambdaPath]);
  };
  await buildLambdas([lambdaName]);
  await deployFunctionServerless(lambdaName);
  return;

};

const createUploadResources = async () => {
  const lambdasNames = getLambdaNames();
  const lambdaPaths = getLambdaPaths(lambdasNames);
  await installDependencies(lambdaPaths);
  await buildLambdas(lambdasNames);
  //deploy lambdas
  await changeProfileAndEnv();
  await deployAllServerless()
  return;

};

const mainMenu = async () => {
  while (true) {
    console.log('----------------------------------------');
    console.log('Seleccione una opcion:');
    console.log('1. Crear nueva lambda en aws');
    console.log('2. Actualizar lambda en aws');
    console.log('3. Actualizar/Crear recursos en aws');
    console.log('4. Salir');

    const choice = await askQuestion('Ingrese la opcion: ');

    switch (choice) {
      case '1':
        console.log('----------------------------------------');
        await createFunction();
        break;
      case '2':
        console.log('----------------------------------------');
        await uploadFunction();
        break;
      case '3':
        console.log('----------------------------------------');
        await createUploadResources();
        break;
      case '4':
        rl.close();
        return;
      default:
        console.log('Opcion no valida');
    }
  }
};

mainMenu();