// SeasonReplay - low cost soil sensor (starter code for the engineer)
//
// Hardware:
//   - ESP32 dev board
//   - Capacitive soil moisture sensor v1.2 (analog out -> GPIO 34)
//   - DS18B20 waterproof temperature probe (data -> GPIO 4, 4.7k pull-up to 3.3V)
//
// It serves the latest reading as JSON at http://<esp32-ip>/reading
// in the format of docs/data-format.md, so the app can read it in "Live sensor URL".
//
// Libraries (Arduino Library Manager): OneWire, DallasTemperature

#include <WiFi.h>
#include <WebServer.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <time.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* DEVICE_ID = "field-01";

const int MOISTURE_PIN = 34;
const int TEMP_PIN = 4;

// Calibration: read the raw value with the probe in dry air and in a glass of water,
// then put the numbers here. Volumetric water content goes roughly from 0 % (air) to ~45 % (saturated soil).
const int RAW_DRY = 3200;
const int RAW_WET = 1400;
const float VWC_SATURATED = 45.0;

OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);
WebServer server(80);

float readMoisturePct() {
  long sum = 0;
  for (int i = 0; i < 20; i++) { sum += analogRead(MOISTURE_PIN); delay(5); }
  float raw = sum / 20.0;
  float ratio = (RAW_DRY - raw) / float(RAW_DRY - RAW_WET);   // 0 = dry, 1 = water
  ratio = constrain(ratio, 0.0, 1.0);
  return ratio * VWC_SATURATED;
}

float readTemperatureC() {
  tempSensor.requestTemperatures();
  return tempSensor.getTempCByIndex(0);
}

String isoTimestamp() {
  struct tm t;
  if (!getLocalTime(&t, 100)) return "1970-01-01T00:00:00Z";
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &t);
  return String(buf);
}

void handleReading() {
  String json = "{";
  json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  json += "\"timestamp\":\"" + isoTimestamp() + "\",";
  json += "\"soil_moisture_pct\":" + String(readMoisturePct(), 1) + ",";
  json += "\"temperature_c\":" + String(readTemperatureC(), 1);
  json += "}";
  server.sendHeader("Access-Control-Allow-Origin", "*");  // let the web app read it
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  tempSensor.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.printf("\nConnected, open http://%s/reading\n", WiFi.localIP().toString().c_str());

  configTime(0, 0, "pool.ntp.org");  // UTC
  server.on("/reading", handleReading);
  server.begin();
}

void loop() {
  server.handleClient();
}
