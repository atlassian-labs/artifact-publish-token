const core = require('@actions/core');
const http = require('@actions/http-client');
const auth = require('@actions/http-client/lib/auth');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const mustache = require('mustache');
const tokenServer = "https://artifactory-oidc.services.atlassian.com/oidc/token?provider=github";
const maven = "maven",
    gradle = "gradle",
    npm="npm",
    output = "output",
    environment = "environment";
const supportedModes = [maven, gradle, output, environment];

async function retrievePublishToken(idToken) {
    let http_client = new http.HttpClient('github-action', [new auth.BearerCredentialHandler(idToken)]);
    let response = await http_client.postJson(tokenServer, null);
    if (response.statusCode != 200) {
        throw new Error("request failed:" + response.statusCode + "," + response.result);
    }
    return response.result;
}

async function generateNpmConfig(dir, token) {
    const base64Token = Buffer.from(`${token.token}`).toString('base64');

    core.exportVariable('ARTIFACTORY_USERNAME', token.username);
    core.exportVariable('ARTIFACTORY_PASSWORD_BASE64', base64Token);

    await fs.copyFile(`${dir}/.npmrc-public`, `./.npmrc-public`);
}

async function generateMavenSettings(dir, token) {
    // generate maven settings file
    const mavenDir = path.join(dir, '.m2');
    const mavenFile = path.join(mavenDir, 'settings.xml');
    await fs.mkdir(mavenDir, {
        recursive: true
    });
    const template = await fs.readFile(`${__dirname}/settings.xml`, 'utf-8');
    const content = mustache.render(template, {
        username: token.username,
        token: token.token
    });

    await fs.writeFile(mavenFile, content);
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

async function doAction() {
    let outputModes = core.getInput('output-modes').split(/\s*,\s*/);
    outputModes.forEach((e) => {
        if (e && !supportedModes.includes(e)) {
            throw new Error(`Invalid output mode '${e}'. Allowed values ${supportedModes}`);
        }
    });
    let idToken = await core.getIDToken();
    let token = await retrievePublishToken(idToken);
    //ensure the token is masked in logs
    core.setSecret(token.username);
    core.setSecret(token.token);
    if (outputModes.includes(environment)) {
        core.exportVariable('ARTIFACTORY_USERNAME', token.username);
        core.exportVariable('ARTIFACTORY_API_KEY', token.token);
    }
    if (outputModes.includes(maven)) {
        await generateMavenSettings(os.homedir(), token);
    }
    if (outputModes.includes(gradle)) {
        await generateGradleProps(os.homedir(), token);
    }
    if (outputModes.includes(npm)) {
        await generateNpmConfig(os.homedir(), token);
    }
    core.setOutput('artifactoryUsername', token.username);
    core.setOutput('artifactoryApiKey', token.token);

}


module.exports = {
    retrievePublishToken,
    generateMavenSettings,
    generateGradleProps,
    generateNpmConfig,
    doAction
};
