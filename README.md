# EFEKTA TH v2 Temperature and Humidity Sensor

Телеграм чат DIY Devices - https://t.me/diy_devices

Продажа DIY Устройств - https://t.me/diydevmart

Описание: http://efektalab.com/TH_v2/

![EFEKTA TH v2 Temperature and humidity sensor](https://raw.githubusercontent.com/smartboxchannel/EFEKTA-TH-v2/main/Images/photo_2023-12-02_19-53-02.jpg) 

![EFEKTA TH v2 Temperature and humidity sensor](https://raw.githubusercontent.com/smartboxchannel/EFEKTA-TH-v2/main/Images/photo_2023-12-02_19-53-02%20(2).jpg) 


Temperature and humidity sensor with external SHTC3/SHT20/SHT30/SHT40 sensor in a sealed capsule, with extended functionality (thermostat, hygrostat). Designed for Zigbee networks. Compatible with Home Assistant via Zigbee2MQTT and ZHA, OpenHAB, ioBroker, MajorDoMo, HOMEd, SLS, Sprut Hub, Yandex Zigbee Hub. Suitable for monitoring temperature and humidity outdoors, in attics, cellars, saunas, baths, etc. (for outdoor monitoring, the 20 dBm signal amplifier version is recommended).

## Properties

| Property | Description |
|----------|-------------|
| **Temperature** | Measured temperature value |
| **Humidity** | Measured humidity value |
| **Battery low** | Flag indicating batteries are nearly depleted |
| **Battery** | Remaining charge in % |
| **Voltage** | Battery voltage |
| **Reading interval** | Sensor reading interval |
| **Config report enable** | Enable/disable report configuration |
| **Comparison previous data** | Enable comparison with previous data |
| **Enable temp/hum** | Enable/disable temperature and humidity reporting |
| **Invert logic temp/hum** | Invert temperature/humidity control logic |
| **High/Low temp/hum** | High and low temperature/humidity thresholds |
| **Sensor identifier** | Identifier of the installed sensor |
| **Linkquality** | Signal quality (LQI) |

## Configuration

### Joining and Leaving the Network
- **Join:** Press and hold the button
- **Reconfiguration in Z2M:** 2-5 button presses
- **Leave:** Hold the button for 10 seconds

### Binding

#### Binding to eWeLink External Socket

The sensor can be bound to an eWeLink external socket for direct control.

### Report Configuration (Zigbee2MQTT)

Reports can be configured through Zigbee2MQTT to customize data transmission intervals and thresholds.

### External Converter Setup
- **Zigbee2MQTT:** [Adding an External Converter](http://efektalab.com/z2m_external_converters)
- **Sprut Hub:** [Adding an External Template](https://clck.ru/362h5z)

## Technical Specifications

| Parameter | Value |
|-----------|-------|
| **Model** | TH v2 |
| **Protocol** | ZigBee 3.0 |
| **Primary sensor** | SHTC3, cable length 1 m |
| **Dimensions** | 8 × 3 × 3 cm |
| **Temperature range** | -40°C ~ +125°C, accuracy 0.2°C |
| **Humidity range** | 0% - 100%, accuracy 2% |
| **Power** | 2 AAA batteries |
