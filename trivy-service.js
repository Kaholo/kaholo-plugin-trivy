const { docker, helpers } = require("@kaholo/plugin-library");
const {
  asyncExec,
} = require("./helpers");

async function runTrivyScan(params) {
  const {
    workingDirectory = await helpers.analyzePath("./"),
    environmentVariables,
    secretEnvVars,
    jsonOutput,
    additionalArguments,
    dockerImage,
  } = params;

  // entrypoint of docker image already includes 'checkov'
  const commandArgs = [];

  if (additionalArguments) {
    commandArgs.push(additionalArguments.join(" "));
  }

  if (jsonOutput) {
    commandArgs.push("-o json");
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
    },
    onProgressFn: process.stdout.write.bind(process.stdout),
  });
}

module.exports = {
  runTrivyScan,
};
