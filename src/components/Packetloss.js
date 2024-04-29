import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import BASE_URL from "./URLConfig";

function StoppedDevice() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [data, setData] = useState([{ clients: "" }]);
  const [devices, setDevices] = useState([]);
  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(today);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [exporting, setExporting] = useState(false); // Add a state for tracking export progress

  function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const formatTimeStamp = (dateString) => {
    if (!dateString) {
      return ''; // or any default value you prefer
    }
  
    const isoDate = new Date(dateString);
    const formattedDate = isoDate.toISOString().replace('T', ' ').slice(0, 19);
    return formattedDate;
  };

  useEffect(() => {
    fetch(`${BASE_URL}/Clients/getClients`)
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    const startDateTime = formatDate(startDate);
    const endDateTime = formatDate(endDate);

    if (selectedClient !== null) {
      const fetchDevices = async () => {
        try { 
          setLoading(true);
          const response = await fetch(
            `${BASE_URL}/packetLossReport/getPacketlossReprt?clientName=${selectedClient}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`
          );
          const deviceStatus = await response.json();
          setDevices(deviceStatus);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      };

      fetchDevices();
    }
  }, [selectedClient, startDate, endDate]);

  function deviceStatus(clientName) {
    setSelectedClient(clientName);
  }

  function toggleClientSelection(clientName) {
    console.log("Selected clients before toggle:", selectedClients);
    if (selectedClients.includes(clientName)) {
      // remove client if already selected
      setSelectedClients(selectedClients.filter((name) => name !== clientName));
    } else {
      // add client if not selected
      setSelectedClients([...selectedClients, clientName]);
    }
    console.log("Selected clients after toggle:", selectedClients);
  }

  const exportData = async () => {
    setExporting(true);
    try {
      if (selectedClients.length === 0) {
        console.log("No clients selected.");
        return;
      }

      const startDateTime = formatDate(startDate);
      const endDateTime = formatDate(endDate);

      // make a copy of the selectedClients array
      const selectedClientsCopy = [...selectedClients];

      const clientNames = selectedClientsCopy
        .map((clientName) => clientName.toLowerCase())
        .join(",");

      fetch(
        `${BASE_URL}/packetLossReport/getExportIntoPacketlossRawDataExcelFile?clientNames=${clientNames}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`
      )
        .then((response) => {
          // create a blob from the response
          return response.blob();
        })
        .then((blob) => {
          // create a URL for the blob and download the file
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Packet-loss-report-${clientNames}-${startDateTime}-to-${endDateTime}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setSelectedClients([]);
        })
        .catch((error) => {
          console.error("Export failed:", error);
        })
        .finally(() => {
          setExporting(false); // Set loading to false to hide the loading bar
        });
    } catch (error) {
      console.error(error);
      // Handle error here, e.g. show an error message to the user
    }
  };

  useEffect(() => {
    window.addEventListener("load", () => {
      console.log("Page loaded");
    });

    return () =>
      window.removeEventListener("load", () => {
        console.log("Page loaded");
      });
  }, []);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const devices2 = useMemo(() => {
    if (sortKey) {
      const sorted = devices.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) {
          return sortOrder === "asc" ? -1 : 1;
        } else if (a[sortKey] > b[sortKey]) {
          return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
      });
      return sorted;
    }
    return devices;
  }, [devices, sortKey, sortOrder]);

  const tdCells = document.querySelectorAll("#background");
  tdCells.forEach((td) => {
    td.addEventListener("click", () => {
      // Remove the color from previously clicked cells
      tdCells.forEach((cell) => {
        cell.style.backgroundColor = "";
      });

      // Apply the color to the clicked cell
      const id = td.id;
      if (id === "background") {
        td.style.backgroundColor = "gainsboro";
      }
    });
  });

  const myInputRef = useRef(null);

  // Define the myFunction function here
  // Define the myFunction function using useCallback
  const myFunction = useCallback(() => {
    const input = myInputRef.current;
    const filter = input.value.toUpperCase();
    const table = document.getElementById("devicetable");
    const tr = table.getElementsByTagName("tr");

    for (let i = 0; i < tr.length; i++) {
      if (i === 0) {
        // Skip the header row
        continue;
      }

      let rowContainsFilter = false;

      for (let j = 0; j < tr[i].cells.length; j++) {
        const cell = tr[i].cells[j];
        const txtValue = cell.textContent || cell.innerText;

        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          rowContainsFilter = true;
          break; // Break the inner loop if a match is found in any cell
        }
      }

      if (rowContainsFilter) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }, []);

  useEffect(() => {
    // Attach the function to the input field
    myInputRef.current.addEventListener("input", myFunction);

    // Clean up the event listener when the component unmounts
    return () => {
      // Ensure that myInputRef.current is not null before removing the listener
      if (myInputRef.current) {
        myInputRef.current.removeEventListener("input", myFunction);
      }
    };
  }, []);

  return (
    <div className="full">
      <div className="row" id="tools">
        <div className="col-lg-3">
          <div className="form-group">
            <label
              htmlFor="start-date"
              style={{ display: "inline-block", marginRight: "10px" }}
            >
              Start Date:
            </label>
            <input
              id="start-date"
              type="datetime-local"
              className="form-control"
              value={formatDate(startDate)}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              style={{ display: "inline-block", width: "200px" }}
            />
          </div>
        </div>
        <div className="col-lg-3">
          <div className="form-group">
            <label
              htmlFor="end-date"
              style={{ display: "inline-block", marginRight: "10px" }}
            >
              End Date:
            </label>
            <input
              id="end-date"
              type="datetime-local"
              className="form-control"
              value={formatDate(endDate)}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              style={{ display: "inline-block", width: "200px" }}
            />
          </div>
        </div>
        <div className="col-lg-3" id="searchbox">
          <input
            type="text"
            id="myInput"
            placeholder="Search..."
            onChange={myFunction}
            ref={myInputRef}
          />
        </div>

        <div className="col-lg-3" id="exportbutton">
          {exporting ? (
            <span>Exporting...</span>
          ) : (
            <button
              className="btn btn-primary"
              onClick={exportData}
              disabled={selectedClients.length === 0}
            >
              Export to Excel
            </button>
          )}
          {exporting && <div className="progress-bar" />}
        </div>
      </div>
      <div className="row" style={{ marginBottom: "2px" }}>
        <div className="col-lg-2">
          <table className="table " id="clients">
            <thead>
              <th colSpan="2">Clients</th>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="hoverable">
                  <td>{item.clients}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedClients.includes(item.clientName)}
                      onChange={() => toggleClientSelection(item.clientName)}
                    />
                  </td>
                  <td id="background">
                    <button
                      type="button"
                      id="clientbtn"
                      className="btn"
                      onClick={() => deviceStatus(item.clientName)}
                    >
                      {item.clientName}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-lg-10" style={{ padding: "0px" }}>
          {loading && (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && (
            <table className="table" id="devicetable">
              {devices2.length > 0 && (
                <thead>
                  <tr>
                    <th onClick={() => handleSort("deviceMacId")}>
                      MAC ID
                      {sortKey === "deviceMacId" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("deviceName")}>
                      Device Name
                      {sortKey === "deviceName" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("deviceSensorId")}>
                      Sensor ID
                      {sortKey === "deviceSensorId" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("buildingName")}>
                      Building Name
                      {sortKey === "buildingName" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("floorName")}>
                      Floor Name
                      {sortKey === "floorName" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("areaName")}>
                      Area Name
                      {sortKey === "areaName" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("sensorValue")}>
                      Sensor Value
                      {sortKey === "sensorValue" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("batteryValue")}>
                      Battery Value
                      {sortKey === "batteryValue" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("rssiValue")}>
                      RssiValue Name
                      {sortKey === "rssiValue" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("errorCode")}>
                      Error Code
                      {sortKey === "errorCode" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("deviceTimeStamp")}>
                      Last Reporting Time
                      {sortKey === "deviceTimeStamp" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("exp")}>
                      Excepted
                      {sortKey === "exp" && (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("received")}>
                      Received
                      {sortKey === "received" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th onClick={() => handleSort("lossP")}>
                      Loss %
                      {sortKey === "lossP" &&
                        (sortOrder === "asc" ? " ▲" : " ▼")}
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                {devices.length > 0 ? (
                  devices.map((item, index) => (
                    <tr key={index} className="hoverable">
                      <td>{item.deviceMacId}</td>
                      <td>{item.deviceName}</td>
                      <td>{item.deviceSensorId}</td>
                      <td>{item.buildingName}</td>
                      <td>{item.floorName}</td>
                      <td>{item.areaName}</td>
                      <td>{item.sensorValue}</td>
                      <td>{item.batteryValue}</td>
                      <td>{item.rssiValue}</td>
                      <td>{item.errorCode}</td>
                      <td>{formatTimeStamp(item.deviceTimestamp)}</td>
                      <td>{item.exp}</td>
                      <td>{item.received}</td>
                      <td>{item.lossP}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center"
                      id="alerttablecenter"
                    >
                      Please select a client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoppedDevice;
