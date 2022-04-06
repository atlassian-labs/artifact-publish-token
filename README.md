# Artifact Publish Token Action

This action generates a temporary authentication token to publish artifacts to `packages.atlassian.com`

## Inputs

### `output-mode`

The preferred output mode of the publish token. It supports the following values:
* **maven** Generates ~/.m2/settings.xml with the credentials for repository `maven-atlassian-com`
* **gradle** Generate ~/.gradle/gradle.properties with `ARTIFACTORY_USERNAME` and `ARTIFACTORY_API_KEY` populated with the temporary credentials
* **environment** Exports credentials as environment variables: `ARTIFACT_USERNAME` and `ARTIFACT_API_TOKEN`
* **output** Default option if not provided, populates the credentials as step output variables: `artifactUsername` and `artifactApiToken`

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
          uses: atlassian-labs/artifact-publish-token@v1.0.0
          with:
              output-mode: maven
          # ... publish your artifact
      - name: Publish artifact
        run: mvn release:perform
```


## Development

### Testsing

`npm run test` will run units tests

### Release Changes

Commit all your changes and run the following command to bump the version number and publish a new version
`npm run release`
