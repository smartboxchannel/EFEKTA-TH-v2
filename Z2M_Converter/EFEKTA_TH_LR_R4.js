const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const extend = require('zigbee-herdsman-converters/lib/extend');
const e = exposes.presets;
const ea = exposes.access;

const tzLocal = {
    node_config: {
        key: ['reading_interval'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                reading_interval: ['genPowerCfg', {0x0201: {value, type: 0x21}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	termostat_config: {
        key: ['high_temp', 'low_temp', 'enable_temp', 'invert_logic_temp'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                high_temp: ['msTemperatureMeasurement', {0x0221: {value, type: 0x29}}],
                low_temp: ['msTemperatureMeasurement', {0x0222: {value, type: 0x29}}],
				enable_temp: ['msTemperatureMeasurement', {0x0220: {value, type: 0x10}}],
				invert_logic_temp: ['msTemperatureMeasurement', {0x0225: {value, type: 0x10}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	hydrostat_config: {
        key: ['high_hum', 'low_hum', 'enable_hum', 'invert_logic_hum'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                high_hum: ['msRelativeHumidity', {0x0221: {value, type: 0x21}}],
                low_hum: ['msRelativeHumidity', {0x0222: {value, type: 0x21}}],
				enable_hum: ['msRelativeHumidity', {0x0220: {value, type: 0x10}}],
				invert_logic_hum: ['msRelativeHumidity', {0x0225: {value, type: 0x10}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
};

const fzLocal = {
    node_config: {
        cluster: 'genPowerCfg',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0201)) {
                result.reading_interval = msg.data[0x0201];
            }
            return result;
        },
    },
	termostat_config: {
        cluster: 'msTemperatureMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0221)) {
                result.high_temp = msg.data[0x0221];
            }
			if (msg.data.hasOwnProperty(0x0222)) {
                result.low_temp = msg.data[0x0222];
            }
            if (msg.data.hasOwnProperty(0x0220)) {
                result.enable_temp = ['OFF', 'ON'][msg.data[0x0220]];
            }
			if (msg.data.hasOwnProperty(0x0225)) {
                result.invert_logic_temp = ['OFF', 'ON'][msg.data[0x0225]];
            }
			if (msg.data.hasOwnProperty(0xA19B)) {
                result.sensor_serial_id = msg.data[0xA19B];
            }
            return result;
        },
    },
	hydrostat_config: {
        cluster: 'msRelativeHumidity',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0221)) {
                result.high_hum = msg.data[0x0221];
            }
			if (msg.data.hasOwnProperty(0x0222)) {
                result.low_hum = msg.data[0x0222];
            }
            if (msg.data.hasOwnProperty(0x0220)) {
                result.enable_hum = ['OFF', 'ON'][msg.data[0x0220]];
            }
			if (msg.data.hasOwnProperty(0x0225)) {
                result.invert_logic_hum = ['OFF', 'ON'][msg.data[0x0225]];
            }
            return result;
        },
    },
};

const definition = {
        zigbeeModel: ['EFEKTA_TH_LR'],
        model: 'EFEKTA_TH_LR',
        vendor: 'EfektaLab',
        description: 'EFEKTA_TH_LR - temperature and humidity sensors with a signal amplifier. Thermostat and hygrostat.',
        fromZigbee: [fz.temperature, fz.humidity, fz.battery, fzLocal.termostat_config, fzLocal.hydrostat_config, fzLocal.node_config],
        toZigbee: [tz.factory_reset, tzLocal.termostat_config, tzLocal.hydrostat_config, tzLocal.node_config],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpointOne = device.getEndpoint(1);
            await reporting.bind(endpointOne, coordinatorEndpoint, ['genPowerCfg', 'msTemperatureMeasurement', 'msRelativeHumidity']);
			const overrides1 = {min: 0, max: 43200, change: 1};
			const overrides2 = {min: 0, max: 1200, change: 10};
			const overrides3 = {min: 0, max: 2400, change: 10};
            await reporting.batteryVoltage(endpointOne, overrides1);
            await reporting.batteryPercentageRemaining(endpointOne, overrides1);
			await reporting.batteryAlarmState(endpointOne, overrides1);
            await reporting.temperature(endpointOne, overrides2);
            await reporting.humidity(endpointOne, overrides3);
        },
        icon: 'data:image/jpeg;base64,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ZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAHjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAAAAAAAAAIAADhCSU0EAgAAAAAAAgAAOEJJTQQwAAAAAAABAQA4QklNBC0AAAAAAAYAAQAAAAI4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADOQAAAAYAAAAAAAAAAAAAAH0AAAB9AAAAAgBUAEgAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAH0AAAB9AAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxsAAAAAgAAAAZib3VuZHNPYmpjAAAAAQAAAAAAAFJjdDEAAAAEAAAAAFRvcCBsb25nAAAAAAAAAABMZWZ0bG9uZwAAAAAAAAAAQnRvbWxvbmcAAAB9AAAAAFJnaHRsb25nAAAAfQAAAAZzbGljZXNWbExzAAAAAU9iamMAAAABAAAAAAAFc2xpY2UAAAASAAAAB3NsaWNlSURsb25nAAAAAAAAAAdncm91cElEbG9uZwAAAAAAAAAGb3JpZ2luZW51bQAAAAxFU2xpY2VPcmlnaW4AAAANYXV0b0dlbmVyYXRlZAAAAABUeXBlZW51bQAAAApFU2xpY2VUeXBlAAAAAEltZyAAAAAGYm91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czpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTExLTE5VDIzOjM1OjM5KzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIzLTExLTIwVDE3OjMzOjU2KzAzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0xMS0yMFQxNzozMzo1NiswMzowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDplMzU4NDM3Mi1lNjRhLWM0NDItYjI1OS1lY2YwMDZiOTI1ZDEiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4MzEyOTc3Zi1mMDNiLTBiNDgtYjk1Yy02ZTYzMjg5MzVhOWUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkYTkwYTczNi0zNjdmLThmNDctYjI4ZS1kM2E3NGMyMzdjNzMiIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IkFkb2JlIFJHQiAoMTk5OCkiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmRhOTBhNzM2LTM2N2YtOGY0Ny1iMjhlLWQzYTc0YzIzN2M3MyIgc3RFdnQ6d2hlbj0iMjAyMy0xMS0xOVQyMzozNTozOSswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo3ZDA0NGZlZi0yMzcwLTM3NDctOWRjYS0xMjNmM2E4NmRlZGQiIHN0RXZ0OndoZW49IjIwMjMtMTEtMTlUMjM6MzU6MzkrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MzUxMDZkYTQtMzBiMi01YjQ2LWFjNjQtMzBlMTVmZTFjYjdmIiBzdEV2dDp3aGVuPSIyMDIzLTExLTIwVDE3OjMzOjU2KzAzOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBpbWFnZS9wbmcgdG8gaW1hZ2UvanBlZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGltYWdlL2pwZWciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmUzNTg0MzcyLWU2NGEtYzQ0Mi1iMjU5LWVjZjAwNmI5MjVkMSIgc3RFdnQ6d2hlbj0iMjAyMy0xMS0yMFQxNzozMzo1NiswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozNTEwNmRhNC0zMGIyLTViNDYtYWM2NC0zMGUxNWZlMWNiN2YiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2YjExMWIwMi1lOGMzLTg4NDctYTE2ZS1hZWI5YmNhMDAzZDkiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkYTkwYTczNi0zNjdmLThmNDctYjI4ZS1kM2E3NGMyMzdjNzMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0idyI/Pv/iAkBJQ0NfUFJPRklMRQABAQAAAjBBREJFAhAAAG1udHJSR0IgWFlaIAfPAAYAAwAAAAAAAGFjc3BBUFBMAAAAAG5vbmUAAAAAAAAAAAAAAAAAAAAAAAD21gABAAAAANMtQURCRQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmNwcnQAAAD8AAAAMmRlc2MAAAEwAAAAa3d0cHQAAAGcAAAAFGJrcHQAAAGwAAAAFHJUUkMAAAHEAAAADmdUUkMAAAHUAAAADmJUUkMAAAHkAAAADnJYWVoAAAH0AAAAFGdYWVoAAAIIAAAAFGJYWVoAAAIcAAAAFHRleHQAAAAAQ29weXJpZ2h0IDE5OTkgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQAAABkZXNjAAAAAAAAABFBZG9iZSBSR0IgKDE5OTgpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYWVogAAAAAAAA81EAAQAAAAEWzFhZWiAAAAAAAAAAAAAAAAAAAAAAY3VydgAAAAAAAAABAjMAAGN1cnYAAAAAAAAAAQIzAABjdXJ2AAAAAAAAAAECMwAAWFlaIAAAAAAAAJwYAABP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',
		exposes: [e.temperature(), e.humidity(), e.battery_low(), e.battery(), e.battery_voltage(),
		    exposes.numeric('reading_interval', ea.STATE_SET).withUnit('Seconds').withDescription('Setting the sensor reading interval. Setting the time in seconds, by default 60 seconds')
                .withValueMin(1).withValueMax(360),
		    exposes.binary('enable_temp', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable Temperature Control'),
		    exposes.binary('invert_logic_temp', ea.STATE_SET, 'ON', 'OFF').withDescription('Invert Logic Temperature Control'),
            exposes.numeric('high_temp', ea.STATE_SET).withUnit('C').withDescription('Setting High Temperature Border')
                .withValueMin(-5).withValueMax(50),
            exposes.numeric('low_temp', ea.STATE_SET).withUnit('C').withDescription('Setting Low Temperature Border')
                .withValueMin(-5).withValueMax(50),				
		    exposes.binary('enable_hum', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable Humidity Control'),
		    exposes.binary('invert_logic_hum', ea.STATE_SET, 'ON', 'OFF').withDescription('Invert Logoc Humidity Control'),
            exposes.numeric('high_hum', ea.STATE_SET).withUnit('C').withDescription('Setting High Humidity Border')
                .withValueMin(0).withValueMax(99),
            exposes.numeric('low_hum', ea.STATE_SET).withUnit('C').withDescription('Setting Low Humidity Border')
                .withValueMin(0).withValueMax(99),
			exposes.numeric('sensor_serial_id', ea.STATE).withDescription('Serial ID DS18B20')],
};

module.exports = definition;