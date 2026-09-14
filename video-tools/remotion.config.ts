import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setChromiumOpenGlRenderer("swiftshader");
Config.setChromiumDisableWebSecurity(true);

export default Config;