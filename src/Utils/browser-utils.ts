import { proto } from '../../WAProto/index.js'
import type { BrowsersMap } from '../Types'

export const Browsers: BrowsersMap = {
	ubuntu: browser => ['Ubuntu', browser, '22.04.4'],
	macOS: browser => ['Mac OS', browser, '14.4.1'],
	baileys: browser => ['Baileys', browser, '6.5.0'],
	windows: browser => ['Windows', browser, '10.0.22631'],
}

export const getPlatformId = (browser: string) => {
	const platformType = proto.DeviceProps.PlatformType[browser.toUpperCase() as any]
	return platformType ? platformType.toString() : '1' //chrome
}
