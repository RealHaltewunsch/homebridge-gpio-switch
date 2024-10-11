var rpio = require("rpio");
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-gpio-switch", "Switch", SwitchAccessory);
}

function SwitchAccessory(log, config) {
  this.log = log;
  this.name = config['name'];
  this.pin = config['pin'];
  this.invert = config['invert'];

  this.service = new Service.Switch(this.name);

  this.infoService = new Service.AccessoryInformation();
  this.infoService
    .setCharacteristic(Characteristic.Manufacturer, "Radoslaw Sporny")
    .setCharacteristic(Characteristic.Model, "RaspberryPi GPIO Switch")
    .setCharacteristic(Characteristic.SerialNumber, "Version 1.2.1");

  // use gpio pin numbering
  rpio.init({
    mapping: 'gpio'
  });
  rpio.open(this.pin, rpio.OUTPUT, this.invert ? rpio.LOW : rpio.HIGH);

  this.service
    .getCharacteristic(Characteristic.On)
    .on('set', this.setPowerState.bind(this));
}

SwitchAccessory.prototype.setPowerState = function(value, callback) {
  this.log("Setting switch to %s", value ? "ON" : "OFF");

  // Check if the switch is inverted
  if (this.invert) value = !value;

  // Write the value to the GPIO pin
  rpio.write(this.pin, value ? rpio.LOW : rpio.HIGH);

  // If the switch is set to ON, set a timeout to revert it back to OFF after 2000ms
  if (value) {
    setTimeout(() => {
      this.log("Reverting switch back to OFF after 2000ms");
      rpio.write(this.pin, this.invert ? rpio.LOW : rpio.HIGH);

      // Update Homebridge characteristic state to OFF
      this.service.getCharacteristic(Characteristic.On).updateValue(false);
    }, 2000);
  }

  callback();
};

SwitchAccessory.prototype.getServices = function() {
  return [this.infoService, this.service];
}

