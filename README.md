# Artifact Publish Token Action

This action generates a temporary authentication token to publish artifacts to `packages.atlassian.com`

## Inputs

### `output-modes`

The preferred output modes of the publish token. It supports the following values:

* **maven**: Creates the maven settings file (~/.m2/settings.xml) with the credentials for the repository `maven-atlassian-com`

* **npm**: Creates the npm config file (~/.npmrc-public) with the credentials for the repository `npm-public`

* **gradle**: Creates the gradle global properties file (~/.gradle/gradle.properties) including the properties:  `ARTIFACTORY_USERNAME` and `ARTIFACTORY_API_KEY` populated with the temporary credentials

* **environment**: Exports credentials as environment variables: `ARTIFACTORY_USERNAME` and `ARTIFACTORY_API_KEY`

* **output**: Default option if not provided, populates the credentials as step output variables: `artifactUsername` and `artifactApiToken`

## Outputs

### `artifactUsername`
    The temporary publish username
### `artifactApiToken` 
    The temporary publish token


## Example Usage

```yaml
jobs:
# ...
    build:
    # minimal permissions 
        permissions:
            contents: read
            id-token: write
    steps:
        # ...
        - name: Get Artifact Publish Token
          id: publish-token
          uses: atlassian-labs/artifact-publish-token@v1.0.1
          with:
              output-modes: maven
          # ... publish your artifact
      - name: Publish artifact
        run: mvn release:perform
```

* The permissions are required in order to access GitHub OIDC Provider.


## Development

### Testing

`npm run test` will run the units tests

### Release Changes

Commit all your changes and run the following command to bump the version number and publish a new version

```shell
npm run release
```
