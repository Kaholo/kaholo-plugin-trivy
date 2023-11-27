# Kaholo Trivy Plugin
Trivy is an all-in-one open source security scanner. Trivy is reliable, fast, and easy to use. Use Trivy to find vulnerabilities & IaC misconfigurations, SBOM discovery, Cloud scanning, Kubernetes security risks,and more.

# Use of Docker
The plugin makes use of a docker image to run Trivy commands on the Kaholo agent. If files on the agent are used in the command, be sure to either specify Working Directory or leave it unspecified to use the agent's default working directory, and in the command if paths are needed, use paths relative to the Working Directory. For example if Working Directory is unspecified and defaults to `/twiddlebug/workspace`, and an output file is wanted in `/twiddlebug/workspace/results/trivyscan.txt`, in the command use `-o results/trivyscan.txt`. This is necessary because the working directory is mounted in the docker container running the command so the absolute path is unlikely to be valid within the container. However, working directory is mounted as a docker volume when running the command so a relative path will work.

Also the docker image used is by default the one with which the plugin was most recently developed and tested, e.g. `aquasec/trivy:0.47.0`. To use another version or a custom docker image please specify in parameter Docker Image. To change this default, modify "default" in param "dockerImage" of method "runTrivyScan" in file `config.json`, repackage the zip file, and re-install the plugin. Further details can be found in INSTALL.md.

## Method: Run Trivy Scan
This method runs any trivy command in a docker container. All parameters other than "Trivy Command" are optional.

### Parameter: Trivy Command
This is the command the scan will run. Trivy runs a wide assortment of scans so the possibilities are many, but for example:

    trivy image python:3.4-alpine

This command runs trivy to scan the image `python:3.4.-alpine`, which would be found in Docker Hub, scanning for both vulnerability and secrets by default. To specify only the vulnerability scan, the command would be:

    trivy image --scanners vuln alpine python:3.4-alpine

or

    trivy image alpine python:3.4-alpine --scanners vuln

The use of the command string `trivy` at the beginning of the command is optional. The command will work the same with or without the initial `trivy`. With each run the command actually used is recorded in the Activity Log of that Kaholo execution.

### Parameter: Working Directory
Especially when working with a file system - e.g., using input or output files, or scanning a file system or repository cloned onto the Kaholo agent, the Working Directory is important. Because the Trivy command is executed inside a docker container, the Working Directory is docker mounted as a volume so that Trivy will have access to the file system. If using a Trivy command that leaves a file outside of the Working Directory, e.g. `trivy image apline -o \tmp\alpine_report.txt`, the file will be unavailable and get destroyed as soon as the command completes. For this reason always use relative paths in Trivy commands, e.g. `trivy image alpine -o reports\alpine_report.txt`.

If all the files involved are inside the default working directory, then the parameter may be left unspecified and the default working directory will be used. On a basic Kaholo Agent that is `/twiddlebug/workspace`. If all actions use only relative paths and the default working directory, it won't matter where exactly the default working directory is.

### Parameter: Environment Variables
Some Trivy commands may require special information that is handled using Environment Variables. For example if scanning an image from a private Nexus repository that listens on HTTP (port 80), the following variables may be needed:

    TRIVY_USERNAME=kaholo
    TRIVY_NON_SSL=true

### Parameter: Secret Environment Variables
For environment variables that Trivy will need but that should not be exposed in the UI, error messages, or logs, use this parameter. The list of variables is the same as for regular Environment Variables, however they are entered into a Kaholo Vault item that is then specified for this parameter. For example a vault item named "Vars Nexus Trivy Login" might be created containing:

    TRIVY_USERNAME=kaholo
    TRIVY_NON_SSL=true
    TRIVY_PASSWORD=2r98yhr3dq398w!

And then in parameter "Secret Environment Variables" select "Vars Nexus Trivy Login" from the vault.

### Parameter: Use JSON Output
This parameter, when selected, adds `-f json -o .tmp_a3c7db29ad4.json` to the command. This instructs Trivy to output JSON to a file named .tmp_a3c7db29ad4.json in the Working Directory. The file name is arbitrarily complex to avoid conflict with other files. If the file already exists it is overwritten.

When the command completes, Kaholo then parses the file and if JSON output is found it is returned as the Kaholo action's Final Result. The file is then deleted. This is a convenience to both easily get a Final Result and to put it in a form that is accessible in code by downstream actions in the pipeline. For example, the code:

    kaholo.actions.trivy1.result.Results[0].Vulnerabilities.length

may provide downstream actions in the pipeline a count of how many vulnerabilities Kaholo Action `trivy1` found when scanning an image.

If enabling this parameter do NOT also specify `-f json` in parameter "Trivy Command". Specifying additional `-o` in the command is allowed but may produce confusing results. If wishing to specify `-f` or `-o` in the command, please disable parameter "Use JSON Output". The JSON Plugin, Text Editor Plugin and File System Plugin may be useful for reading or handling output files generated directly by the command.

### Parameter: Docker Image
Because the `trivy` command is run inside a docker container, some docker image must be specified. By default the plugin will use a Docker Hub image `aquasec/trivy`, a version that was used to develop and test the plugin. To get the latest version or use a custom docker image just specify in this parameter, for example `aquasec/trivy:latest`.

With each run of an action the docker image actually used is recorded in the Kaholo Activity Log of that execution.