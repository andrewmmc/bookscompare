const { withPodfile } = require('expo/config-plugins');

const marker = '# bookscompare: minimum deployment target for all Pod targets';
const postInstall = '  post_install do |installer|';

// React Native adjusts library targets, but resource bundles can retain older minimums.
module.exports = function withIosPodDeploymentTarget(config) {
  return withPodfile(config, (config) => {
    if (config.modResults.contents.includes(marker)) {
      return config;
    }
    if (!config.modResults.contents.includes(postInstall)) {
      throw new Error('Cannot configure Pod deployment targets: post_install hook was not found.');
    }

    config.modResults.contents = config.modResults.contents.replace(
      postInstall,
      `${postInstall}
    ${marker}
    minimum_ios_version = Gem::Version.new(podfile_properties.fetch('ios.deploymentTarget'))
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current_target = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_target.nil? || Gem::Version.new(current_target) < minimum_ios_version
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum_ios_version.to_s
        end
      end
    end
`
    );
    return config;
  });
};
