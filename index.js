const core = require('@actions/core');
const http = require('@actions/http-client');
const auth = require('@actions/http-client/auth');
const fs = require('fs');
const os = require('os');
const tokenServer = "https://artifactory-oidc.services.atlassian.com/oidc/token?provider=github";

async function checkDomain() {
    const dns = require('dns');
    await dns.lookup('artifactory-oidc.services.atlassian.com', (err, result) => {
        console.log('err:', err);
        console.log('dns:', result);
    });
}

async function retrievePublishToken(idToken) {
    await checkDomain();
    let http_client = new http.HttpClient('github-action', [new auth.BearerCredentialHandler(idToken)]);
    let response = await http_client.postJson(tokenServer, null);
    if (response.statusCode != 200) {
        throw new Error("request failed:" + response.statusCode + "," + response.result);
    }
    return response.result;
}

async function generateMavenSettings(dir, token) {
    // generate maven settings file
    await fs.mkdir(dir + "/.m2", (err) => {
        if (err && err.code !== 'EEXIST') throw new Error(`Failed to create ${dir}/.m2 dir:${err}`);
    });
    await fs.writeFile(dir + "/.m2/settings.xml",
        `<settings>
<servers>
<server>
<id>maven-atlassian-com</id>
<username>${token.username}</username>
<password>${token.token}</password>
</server>
</servers>
</settings>`,
        (err) => {
            if (err) throw new Error(`Failed to create settings.xml :${err}`);
        });
}

async function generateGradleProps(dir, token) {
    // generate gradle properties
    await fs.mkdir(dir + '/.gradle', (err) => {
        if (err && err.code !== 'EEXIST') throw new Error(`Failed to create ~/.gradle dir: ${err}`);
    });
    await fs.writeFile(dir + '/.gradle/gradle.properties',
        `
ARTIFACTORY_USERNAME=${token.username}
ARTIFACTORY_API_KEY=${token.token}
`, (err) => {
            if (err) throw new Error(`Failed to create ~/.gradle/gradle.properties:${err}`);
        });
}

(async function() {
    try {
        let output_type = core.getInput('output-mode');
        let id_token = await core.getIDToken();
        let token = await retrievePublishToken(id_token);
        switch (output_type) {
            case "environment":
                core.exportVariable('ARTIFACT_USERNAME', token.username);
                core.exportVariable('ARTIFACT_API_TOKEN', token.token);
                break;
            case "maven":
                await generateMavenSettings(homedir(), token);
                break;
            case "gradle":
                await generateGradleProps(homedir(), token);
                break;
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
