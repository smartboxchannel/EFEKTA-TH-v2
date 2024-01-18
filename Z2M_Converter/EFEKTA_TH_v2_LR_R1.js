const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const extend = require('zigbee-herdsman-converters/lib/extend');
const e = exposes.presets;
const ea = exposes.access;

const tzLocal = {
    node_config: {
        key: ['reading_interval', 'config_report_enable', 'comparison_previous_data'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                reading_interval: ['genPowerCfg', {0x0201: {value, type: 0x21}}],
				config_report_enable: ['genPowerCfg', {0x0275: {value, type: 0x10}}],
				comparison_previous_data: ['genPowerCfg', {0x0205: {value, type: 0x10}}],
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
			if (msg.data.hasOwnProperty(0x0275)) {
				result.config_report_enable = ['OFF', 'ON'][msg.data[0x0275]];
            }
			if (msg.data.hasOwnProperty(0x0205)) {
				result.comparison_previous_data = ['OFF', 'ON'][msg.data[0x0205]];
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
                result.sensor_identifier = msg.data[0xA19B];
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
        zigbeeModel: ['EFEKTA_TH_v2_LR'],
        model: 'EFEKTA_TH_v2_LR',
        vendor: 'EfektaLab',
        description: 'EFEKTA_TH_v2_LR - Smart temperature and humidity sensors with a signal amplifier. The device is equipped with a remote temperature sensor SHTC3/SHT20/SHT30/SHT40. Thermostat and hygrostat.',
        fromZigbee: [fz.temperature, fz.humidity, fz.battery, fzLocal.termostat_config, fzLocal.hydrostat_config, fzLocal.node_config],
        toZigbee: [tz.factory_reset, tzLocal.termostat_config, tzLocal.hydrostat_config, tzLocal.node_config],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpointOne = device.getEndpoint(1);
            await reporting.bind(endpointOne, coordinatorEndpoint, ['genPowerCfg', 'msTemperatureMeasurement', 'msRelativeHumidity']);
			const overrides1 = {min: 1800, max: 43200, change: 1};
			const overrides2 = {min: 60, max: 1200, change: 1};
			const overrides3 = {min: 120, max: 2400, change: 1};
            await reporting.batteryVoltage(endpointOne, overrides1);
            await reporting.batteryPercentageRemaining(endpointOne, overrides1);
			await reporting.batteryAlarmState(endpointOne, overrides1);
            await reporting.temperature(endpointOne, overrides2);
            await reporting.humidity(endpointOne, overrides3);
        },
        icon: 'data:image/jpeg;base64,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UmVjdExlZnRsb25nAAAAAAAAAA1jcm9wUmVjdFJpZ2h0bG9uZwAAAAAAAAALY3JvcFJlY3RUb3Bsb25nAAAAAAA4QklNA+0AAAAAABAASAAAAAEAAQBIAAAAAQABOEJJTQQmAAAAAAAOAAAAAAAAAAAAAD+AAAA4QklNA/IAAAAAAAoAAP///////wAAOEJJTQQNAAAAAAAEAAAAHjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAAAAAAAAAIAAjhCSU0EAgAAAAAACgAAAAAAAAAAAAA4QklNBDAAAAAAAAUBAQEBAQA4QklNBC0AAAAAAAYAAQAAAAU4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADXwAAAAYAAAAAAAAAAAAAAH0AAAB9AAAAFQB0AGgAdgAyAF8AZABzAC0EMgQ+BEEEQQRCBDAEPQQ+BDIEOwQ1BD0EPgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAfQAAAH0AAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAQAAAAAAAG51bGwAAAACAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExlZnRsb25nAAAAAAAAAABCdG9tbG9uZwAAAH0AAAAAUmdodGxvbmcAAAB9AAAABnNsaWNlc1ZsTHMAAAABT2JqYwAAAAEAAAAAAAVzbGljZQAAABIAAAAHc2xpY2VJRGxvbmcAAAAAAAAAB2dyb3VwSURsb25nAAAAAAAAAAZvcmlnaW5l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Y2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA1LTAxVDE0OjMwOjQ5KzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTAxLTE4VDEzOjU2OjI2KzAzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xOFQxMzo1NjoyNiswMzowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDphNWJiOTk5Zi0wNmVhLTlkNDEtYWI1Yi1kMmNmNDM3NjA5NDkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozYTNjMGIwMy0wZDg0LTM0NGMtYTY0YS1lODljZDE2MjQ5YTgiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMjFmZmMyZC1lNjRhLTU5NGMtOWFhMi01N2E4MzhlOWM0NDkiIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IkFkb2JlIFJHQiAoMTk5OCkiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAyMWZmYzJkLWU2NGEtNTk0Yy05YWEyLTU3YTgzOGU5YzQ0OSIgc3RFdnQ6d2hlbj0iMjAyMy0wNS0wMVQxNDozMDo0OSswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5MjExYjZjZi1hODZhLTMzNGUtOWUzNi0yZDJmYmExYTkyYzUiIHN0RXZ0OndoZW49IjIwMjMtMDUtMDFUMTQ6MzA6NDkrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmMwNzYxNzg4LTdhMGMtYzY0Yi04Mzc3LTUwYjU2ODhmOTI1MSIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0xNlQyMzoyOTo1MiswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoxZmVhNDAwMi1jYjRiLTZmNDEtOTgyMy1iNzIwMDkxZTg2ZjUiIHN0RXZ0OndoZW49IjIwMjQtMDEtMThUMTM6NTY6MjYrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvanBlZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9qcGVnIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphNWJiOTk5Zi0wNmVhLTlkNDEtYWI1Yi1kMmNmNDM3NjA5NDkiIHN0RXZ0OndoZW49IjIwMjQtMDEtMThUMTM6NTY6MjYrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MWZlYTQwMDItY2I0Yi02ZjQxLTk4MjMtYjcyMDA5MWU4NmY1IiBzdFJlZjpkb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NDg5ZDI3MTAtZTYxNS1hMTQ1LWFmOTUtZDM1MTZjM2QwMzkwIiBzdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MDIxZmZjMmQtZTY0YS01OTRjLTlhYTItNTdhODM4ZTljNDQ5Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw/eHBhY2tldCBlbmQ9InciPz7/4gJASUNDX1BST0ZJTEUAAQEAAAIwQURCRQIQAABtbnRyUkdCIFhZWiAHzwAGAAMAAAAAAABhY3NwQVBQTAAAAABub25lAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAA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',
	exposes: [e.temperature(), e.humidity(), e.battery_low(), e.battery(), e.battery_voltage(),
		    exposes.numeric('reading_interval', ea.STATE_SET).withUnit('Seconds').withDescription('Setting the sensor reading interval. Setting the time in seconds, by default 30 seconds')
                .withValueMin(10).withValueMax(360),
			exposes.binary('config_report_enable', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable reporting based on reporting configuration'),
		    exposes.binary('comparison_previous_data', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable сontrol of comparison with previous data'),
		    exposes.binary('enable_temp', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable Temperature Control'),
		    exposes.binary('invert_logic_temp', ea.STATE_SET, 'ON', 'OFF').withDescription('Invert Logic Temperature Control'),
            exposes.numeric('high_temp', ea.STATE_SET).withUnit('C').withDescription('Setting High Temperature Border')
                .withValueMin(-50).withValueMax(120),
            exposes.numeric('low_temp', ea.STATE_SET).withUnit('C').withDescription('Setting Low Temperature Border')
                .withValueMin(-50).withValueMax(120),				
		    exposes.binary('enable_hum', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable Humidity Control'),
		    exposes.binary('invert_logic_hum', ea.STATE_SET, 'ON', 'OFF').withDescription('Invert Logoc Humidity Control'),
            exposes.numeric('high_hum', ea.STATE_SET).withUnit('C').withDescription('Setting High Humidity Border')
                .withValueMin(0).withValueMax(99),
            exposes.numeric('low_hum', ea.STATE_SET).withUnit('C').withDescription('Setting Low Humidity Border')
                .withValueMin(0).withValueMax(99),
			exposes.numeric('sensor_identifier', ea.STATE).withDescription('Sensor type, identifier')],
};

module.exports = definition;
