// Run against built workspace packages or packages installed in a consumer fixture.
const fs = require('fs');
const path = require('path');
const { toJSONSchema } = require('zod');
const workspace = path.resolve(__dirname, '..');
const packages = fs.readdirSync(path.join(workspace, 'packages')).sort();
const config = {
  host: 'https://example.com', orgUrl: 'https://example.com', subdomain: 'dummy',
  auth: { username: 'dummy', password: 'dummy', oauthToken: 'dummy' },
  baseUrl: 'https://example.com', token: 'dummy', apiKey: 'dummy',
  domain: 'example.com', database: 'dummy', port: 5432
};
(async () => {
  const contracts = {};
  for (const name of packages) {
    const manifest = require(path.join(workspace, 'packages', name, 'package.json'));
    const modulePath = process.env.QUIX_CONSUMER
      ? require.resolve(manifest.name, { paths: [process.env.QUIX_CONSUMER] })
      : path.join(workspace, 'packages', name, 'dist');
    const exports = require(modulePath);
    const factories = Object.keys(exports).filter(key => /^create.*ToolsExport$/.test(key));
    if (factories.length !== 1) throw new Error(`${name}: expected one toolkit factory, got ${factories}`);
    contracts[name] = {};
    for (const restrictedModeEnabled of [false, true]) {
      const toolkit = await exports[factories[0]]({ ...config, restrictedModeEnabled });
      if (!toolkit.toolConfigs.length) throw new Error(`${name}: no tools`);
      contracts[name][String(restrictedModeEnabled)] = toolkit.toolConfigs.map(({ tool, operations, isSupportedInRestrictedMode }) => ({
        name: tool.name, description: tool.description, operations, isSupportedInRestrictedMode,
        schema: toJSONSchema(tool.schema, { io: 'input' })
      }));
    }
  }
  process.stdout.write(JSON.stringify(contracts, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
