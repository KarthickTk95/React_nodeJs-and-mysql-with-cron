import React, { useEffect, useState } from "react";
import "./ClientDevicesList.css";
import BASE_URL from "./URLConfig";

function ClientDevicesList() {
  const [clientDevicesList, setClientDevicesList] = useState([]);
  const [filteredDevicesList, setFilteredDevicesList] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    setLoadingDevices(true);

    // If data is not found in the cache, make the API request
    fetch(`${BASE_URL}/reporting255/getAllClientDevicesList`)
      .then((response) => response.json())
      .then((data) => {
        setLoadingDevices(false);
        // Store the fetched data in the cache
        setClientDevicesList(data);
        setFilteredDevicesList(data);
      })
      .catch((error) => console.log(error));
  }, []);

  const handleClientChange = (event) => {
    const clientName = event.target.value;
    setSelectedClient(clientName);

    if (clientName === "") {
      setFilteredDevicesList(clientDevicesList);
    } else {
      const filteredList = clientDevicesList.filter(
        (device) => device.clientname === clientName
      );
      setFilteredDevicesList(filteredList);
    }
  };

  return (
    <div className="allClientsDiv">
      <div className="dropdown mb-1">
        <select
          className="form-select"
          value={selectedClient}
          onChange={handleClientChange}
        >
          <option value="">All Clients</option>
          {clientDevicesList.map((device, index) => (
            <option key={index} value={device.clientname}>
              {device.clientname}
            </option>
          ))}
        </select>
      </div>

      <div className="tableContainer">
        {loadingDevices ? (
          <div className="text-center loadingSpinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <table className="table table-responsive">
            <thead>
              <tr>
                <th>CLIENTS</th>
                <th>DEVICE MACID </th>
                <th>DEVICE NAME </th>
                <th> DEVICE SENSORID</th>
                <th> BUILDING NAME</th>
                <th> FLOOR NAME</th>
                <th> AREA NAME</th>
                <th> LAST REPORTING TIME</th>
                <th> ERROR CODE</th>
                <th> ERROR DESCRIPTION</th>
                <th> LAST ERROR MSGTIME</th>
                <th> SENSOR VALUE</th>
                <th> BATTERY VALUE</th>
                <th> RSSI VALUE</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevicesList.map((device, index) => (
                <tr key={index}>
                  <td>{device.clientname}</td>
                  <td>{device.deviceMacId}</td>
                  <td>{device.deviceName}</td>
                  <td>{device.deviceSensorId}</td>
                  <td>{device.buildingName}</td>
                  <td>{device.floorName}</td>
                  <td>{device.areaName}</td>
                  <td>{device.lastReportingTime}</td>
                  <td>{device.errorCode}</td>
                  <td>{device.errorDescription}</td>
                  <td>{device.lastErrorMsgTime}</td>
                  <td>{device.sensorValue}</td>
                  <td>{device.batteryValue}</td>
                  <td>{device.rssiValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ClientDevicesList;
