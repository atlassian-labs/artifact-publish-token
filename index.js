const core = require('@actions/core');
const http = require('@actions/http-client');
const auth = require('@actions/http-client/auth');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const tokenServer = "https://artifactory-oidc.services.atlassian.com/oidc/token?provider=github";
const maven = "maven",
    gradle = "gradle",
    output = "output",
    environment = "environment";
const supportedTypes = [maven, gradle, output, environment];

async function retrievePublishToken(idToken) {
    let http_client = new http.HttpClient('github-action', [new auth.BearerCredentialHandler(idToken)]);
    let response = await http_client.postJson(tokenServer, null);
    if (response.statusCode != 200) {
        throw new Error("request failed:" + response.statusCode + "," + response.result);
    }
    return response.result;
}

async function generateMavenSettings(dir, token) {
    // generate maven settings file
    const mavenDir = path.join(dir, '.m2');
    const mavenFile = path.join(mavenDir, 'settings.xml');
    await fs.mkdir(mavenDir, {
        recursive: true
    });
    await fs.writeFile(mavenFile,
        `<settings>
<servers>
<server>
<id>maven-atlassian-com</id>
<username>${token.username}</username>
<password>${token.token}</password>
</server>
</servers>
</settings>`);
}

async function generateGradleProps(dir, token) {
    const gradleDir = path.join(dir, '.gradle');
    const gradleFile = path.join(gradleDir, 'gradle.properties');

    await fs.mkdir(gradleDir, {
        recursive: true
    });
    await fs.writeFile(gradleFile,
        `
ARTIFACTORY_USERNAME=${token.username}
ARTIFACTORY_API_KEY=${token.token}
`);
}

(async function() {
    try {
        let output_modes = core.getInput('output-mode').split('\s*,\s*');
        output_modes.forEach((e) => {
            if (e && !supportedTypes.includes(e)) {
                throw new Error(`Invalid 'output-mode' value! Allowed values ${supportedTypes}`);
            }
        });
        let id_token = await core.getIDToken();
        let token = await retrievePublishToken(id_token);
        if (output_modes.includes(environment)) {
            core.exportVariable('ARTIFACT_USERNAME', token.username);
            core.exportVariable('ARTIFACT_API_TOKEN', token.token);
        }
        if (output_modes.includes(maven)) {
            await generateMavenSettings(os.homedir(), token);
        }
        if (output_modes.includes(gradle)) {
            await generateGradleProps(os.homedir(), token);
        }
        core.setOutput('artifactUsername', token.username);
        core.setOutput('artifactApiToken', token.token);
    } catch (error) {
        core.setFailed(error.message);
    }
})();

module.exports = {
    retrievePublishToken,
    generateMavenSettings,
    generateGradleProps
};
