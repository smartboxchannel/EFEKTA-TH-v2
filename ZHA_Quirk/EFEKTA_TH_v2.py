# EFEKTA_TH_v2.py
# Quirk for EFEKTA_TH_v2_LR (Temperature and humidity sensors. Simple Thermostat.)

from typing import Final
from enum import IntEnum

from zigpy.profiles import zha
from zigpy.quirks import CustomCluster
from zigpy.quirks.v2 import (
    QuirkBuilder,
    ReportingConfig,
    SensorDeviceClass,
    SensorStateClass,
    EntityType,
    EntityPlatform,
)
from zigpy.quirks.v2.homeassistant.number import NumberDeviceClass
import zigpy.types as t
from zigpy.zcl import ClusterType
from zigpy.zcl.foundation import ZCLAttributeDef
from zigpy.zcl.clusters.general import Basic, PowerConfiguration, Time, OnOff
from zigpy.zcl.clusters.measurement import (
    TemperatureMeasurement,
    RelativeHumidity,
)
from zigpy.quirks.v2.homeassistant import (
    UnitOfTime,
    UnitOfTemperature,
    PERCENTAGE,
)

EFEKTA = "EfektaLab"
    
class TempActionsEnum(IntEnum):
    HEAT = 0
    COOL = 1
    
class RHActionsEnum(IntEnum):
    WET = 0
    DRY = 1

class PowerCfg(PowerConfiguration, CustomCluster):
    class AttributeDefs(PowerConfiguration.AttributeDefs):
        reading_interval: Final = ZCLAttributeDef(id=0x0201, type=t.uint16_t, access="rw")
        smart_sleep: Final = ZCLAttributeDef(id=0x0216, type=t.Bool, access="rw")
        config_report_enable: Final = ZCLAttributeDef(id=0x0275, type=t.Bool, access="rw")
        comparison_previous_data: Final = ZCLAttributeDef(id=0x0205, type=t.Bool, access="rw")
        
class TimeExt(Time, CustomCluster):
    class AttributeDefs(Time.AttributeDefs):
        uptime: Final = ZCLAttributeDef(id=0x0006, type=t.uint32_t, access="r")

class TempMeasurement(TemperatureMeasurement, CustomCluster):
    class AttributeDefs(TemperatureMeasurement.AttributeDefs):
        enabling_temperature_control: Final = ZCLAttributeDef(id=0x0220, type=t.Bool, access="rw")
        temperature_actions: Final = ZCLAttributeDef(id=0x0225, type=t.Bool, access="rw")
        high_temperature: Final = ZCLAttributeDef(id=0x0221, type=t.int16s, access="rw")
        low_temperature: Final = ZCLAttributeDef(id=0x0222, type=t.int16s, access="rw")


class RHMeasurement(RelativeHumidity, CustomCluster):
    class AttributeDefs(RelativeHumidity.AttributeDefs):
        enabling_humidity_control: Final = ZCLAttributeDef(id=0x0220, type=t.Bool, access="rw")
        humidity_actions: Final = ZCLAttributeDef(id=0x0225, type=t.Bool, access="rw")
        high_humidity: Final = ZCLAttributeDef(id=0x0221, type=t.uint16_t, access="rw")
        low_humidity: Final = ZCLAttributeDef(id=0x0222, type=t.uint16_t, access="rw")


(
    QuirkBuilder(EFEKTA, "EFEKTA_TH_v2")
    .replaces(PowerCfg, endpoint_id=1, cluster_type=ClusterType.Server)
    .replaces(TimeExt, endpoint_id=1, cluster_type=ClusterType.Server)
    .replaces(OnOff, endpoint_id=1, cluster_type=ClusterType.Client)
    .replaces(TempMeasurement, endpoint_id=1, cluster_type=ClusterType.Server)
    .replaces(TempMeasurement, endpoint_id=1, cluster_type=ClusterType.Client)
    .replaces(RHMeasurement, endpoint_id=1, cluster_type=ClusterType.Server)
    .replaces(RHMeasurement, endpoint_id=1, cluster_type=ClusterType.Client)
    .adds_endpoint(1)
    .sensor(
        TimeExt.AttributeDefs.uptime.name,
        TimeExt.cluster_id,
        endpoint_id=1,
        state_class=SensorStateClass.MEASUREMENT,
        device_class=SensorDeviceClass.DURATION,
        unit=UnitOfTime.HOURS,
        translation_key="uptime",
        fallback_name="Uptime",
        divisor=3600,
    )
    .number(
        PowerCfg.AttributeDefs.reading_interval.name,
        PowerCfg.cluster_id,
        endpoint_id=1,
        translation_key="reading_interval",
        fallback_name="Reading interval",
        unique_id_suffix="reading_interval",
        min_value=10,
        max_value=360,
        step=1,
        device_class=NumberDeviceClass.DURATION,
        unit=UnitOfTime.SECONDS,
    )
    .switch(
        PowerCfg.AttributeDefs.smart_sleep.name,
        PowerCfg.cluster_id,
        endpoint_id=1,
        translation_key="smart_sleep",
        fallback_name="Smart sleep",
        unique_id_suffix="smart_sleep",
    )
    .switch(
        PowerCfg.AttributeDefs.config_report_enable.name,
        PowerCfg.cluster_id,
        endpoint_id=1,
        translation_key="config_report_enable",
        fallback_name="Config report",
        unique_id_suffix="config_report_enable",
    )
    .switch(
        PowerCfg.AttributeDefs.comparison_previous_data.name,
        PowerCfg.cluster_id,
        endpoint_id=1,
        translation_key="comparison_previous_data",
        fallback_name="Comparison previous data",
        unique_id_suffix="comparison_previous_data",
    )
    .switch(
        TempMeasurement.AttributeDefs.enabling_temperature_control.name,
        TempMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="enabling_temperature_control",
        fallback_name="Enabling temperature control",
        unique_id_suffix="enabling_temperature_control",
    )
    .enum(
        TempMeasurement.AttributeDefs.temperature_actions.name,
        TempActionsEnum,
        TempMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="temperature_actions",
        fallback_name="Temperature actions",
        unique_id_suffix="temperature_actions",
        entity_type=EntityType.CONFIG,
        entity_platform=EntityPlatform.SELECT,
    )
    .number(
        TempMeasurement.AttributeDefs.high_temperature.name,
        TempMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="high_temperature",
        fallback_name="High temperature",
        unique_id_suffix="high_temperature",
        min_value=-40,
        max_value=90,
        step=1,
        device_class=NumberDeviceClass.TEMPERATURE,
        unit=UnitOfTemperature.CELSIUS,
        mode="box",
    )
    .number(
        TempMeasurement.AttributeDefs.low_temperature.name,
        TempMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="low_temperature",
        fallback_name="Low temperature",
        unique_id_suffix="low_temperature",
        min_value=-40,
        max_value=90,
        step=1,
        device_class=NumberDeviceClass.TEMPERATURE,
        unit=UnitOfTemperature.CELSIUS,
        mode="box",
    )
    .switch(
        RHMeasurement.AttributeDefs.enabling_humidity_control.name,
        RHMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="enabling_humidity_control",
        fallback_name="Enabling humidity control",
        unique_id_suffix="enabling_humidity_control",
    )
    .enum(
        RHMeasurement.AttributeDefs.humidity_actions.name,
        RHActionsEnum,
        RHMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="humidity_actions",
        fallback_name="Humidity actions",
        unique_id_suffix="humidity_actions",
        entity_type=EntityType.CONFIG,
        entity_platform=EntityPlatform.SELECT,
    )
    .number(
        RHMeasurement.AttributeDefs.high_humidity.name,
        RHMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="high_humidity",
        fallback_name="High humidity",
        unique_id_suffix="high_humidity",
        min_value=0,
        max_value=99,
        step=1,
        device_class=SensorDeviceClass.HUMIDITY,
        unit=PERCENTAGE,
        mode="box",
    )
    .number(
        RHMeasurement.AttributeDefs.low_humidity.name,
        RHMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="low_humidity",
        fallback_name="Low humidity",
        unique_id_suffix="low_humidity",
        min_value=0,
        max_value=99,
        step=1,
        device_class=SensorDeviceClass.HUMIDITY,
        unit=PERCENTAGE,
        mode="box",
    )
    
    .add_to_registry()
)