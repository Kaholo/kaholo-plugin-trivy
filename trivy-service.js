const { docker, helpers } = require("@kaholo/plugin-library");

const { asyncExec } = require("./helpers");

async function runTrivyScan(params) {
  const {
    command,
    workingDirectory = await helpers.analyzePath("./"),
    environmentVariables,
    secretEnvVars,
    jsonOutput,
    dockerImage,
  } = params;

  // entrypoint of docker image already includes 'checkov'
  const commandArgs = command;
  if (commandArgs[0].substring(0,6)==="trivy "){
    commandArgs[0] = commandArgs[0].slice(6); 
  }

  if (jsonOutput) {
    if (commandArgs.join(" ").includes("-f json")){
      throw new Error("Please disable \"Use JSON Output\" parameter when explicitly adding \"-f json\" to the command.");
    }
    // this file will land in WorkingDirectory whether specified or not.
    commandArgs.push("-f json -o .tmp_a3c7db29ad4.json");
  }

  const dockerCommandBuildOptions = {
    command: `${commandArgs.join(" ")}`,
    image: dockerImage,
  };

  console.info(`The Trivy command is: trivy ${dockerCommandBuildOptions.command}\n`);
  console.info(`Running in docker container using image ${dockerCommandBuildOptions.image}\n`);

  const workingDirVolumeDefinition = docker.createVolumeDefinition(workingDirectory.absolutePath);

  const dockerEnvVars = {
    ...environmentVariables,
    ...secretEnvVars,
    [workingDirVolumeDefinition.path.name]: workingDirVolumeDefinition.path.value,
    [workingDirVolumeDefinition.mountPoint.name]: workingDirVolumeDefinition.mountPoint.value,
  };

  dockerCommandBuildOptions.workingDirectory = workingDirVolumeDefinition.mountPoint.value;
  dockerCommandBuildOptions.volumeDefinitionsArray = [workingDirVolumeDefinition];
  dockerCommandBuildOptions.environmentVariables = dockerEnvVars;

  const dockerCommand = docker.buildDockerCommand(dockerCommandBuildOptions);

  return asyncExec({
    command: dockerCommand,
    options: {
      env: dockerEnvVars,
      jsonOutput,
    },
    onProgressFn: process.stdout.write.bind(process.stdout),
  });
}

module.exports = {
  runTrivyScan,
};
