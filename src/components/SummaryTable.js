import React, { useState, useEffect } from "react";

import "./SummaryTable.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowAltCircleLeft,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import BASE_URL from "./URLConfig.js";


function SummaryTable() {
  const [summaryData, setSummaryData] = useState([]);
  const [jsonData, setJsonData] = useState([]);
  const [showTable, setShowTable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [clickedCell, setClickedCell] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortColumn, setSortColumn] = useState("clientname");
  const [exporting, setExporting] = useState(false);


  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
    
      try {
        const response = await fetch(`${BASE_URL}/getSummary/getSummary`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
    
        const data = await response.json();
        setSummaryData(data);
        console.log("Summary Data:", summaryData);

        // Calculate the column sums
        const columnSums = {
          total: 0,
          active: 0,
          stopped: 0,
          notYetReporting: 0,
          bleDevices: 0,
          blegateway: 0,
          intraffic: 0,
          getfeedback: 0,
          occupancyDisplay: 0,
          batteryLow: 0,
          preStopped: 0,
        };

        data.forEach((row) => {
          // Convert strings to integers using parseInt()
          columnSums.total += parseInt(row[0].Total, 10);
          columnSums.active += parseInt(row[0].Active, 10);
          columnSums.stopped += parseInt(row[0].Stopped, 10);
          columnSums.notYetReporting += parseInt(row[0].NotYetReporting, 10);
          columnSums.bleDevices += parseInt(row[0].BleDevices, 10);
          columnSums.blegateway += parseInt(row[0].BLEGateWay, 10);
          columnSums.intraffic += parseInt(row[0].IntrafficDevices, 10);
          columnSums.getfeedback += parseInt(row[0].Feedback, 10);
          columnSums.occupancyDisplay += parseInt(row[0].OccupancyDisplay, 10);
          columnSums.batteryLow += parseInt(row[0].BatteryLow, 10);
          columnSums.preStopped += parseInt(row[0].PreStopped, 10);
        });

        console.log(columnSums.total); // Total sum
        console.log(columnSums.active); // Sum of the "active" column
        console.log(columnSums.stopped);

        setIsLoading(false);
  } catch (error) {
    console.error("Error fetching data:", error);
    setIsLoading(false);
  }
};

    fetchData();
  }, []);

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const handleCellClick = async (RName, clientName, apiEndpoint) => {
    console.log(RName);
    console.log(clientName);
    setIsLoading(true);
    const response = await fetch(apiEndpoint + "?clientname=" + clientName);
    const data = await response.json();
    setJsonData(data);
    setIsLoading(false);
    setClickedCell({ RName, clientName, apiEndpoint });
    toggleTable();
  };

 
  const handleExportSummary = () => {
      setExporting(true);
      const table = document.getElementById("summaryTable");
      const rows = [...table.querySelectorAll("tr")];
      const headerRow = rows.shift();
      const headerCols = [...headerRow.querySelectorAll("th")].map(
        (th) => th.textContent
      );
      const data = rows.map((row) =>
        [...row.querySelectorAll("td")].map((td) => td.textContent)
      );
      const worksheet = XLSX.utils.aoa_to_sheet([headerCols, ...data]);
      const workbook = XLSX.utils.book_new();
  
      XLSX.utils.book_append_sheet(workbook, worksheet);
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
  
      function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i += 1) {
          view[i] = s.charCodeAt(i) & 0xff;
        }
        return buf;
      }
  
      const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Summary.xlsx`;
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExporting(false);
    };
  

  const sortedData = summaryData.sort((a, b) => {
    const aVal = a[0][sortColumn];
    const bVal = b[0][sortColumn];
    if (sortOrder === "asc") {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const onHeaderClick = (column) => {
    if (column === sortColumn) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  return (
    <div>
      {showTable && (
        <div className={`summary-table `}>
          <SummaryTableBody
            summaryData={sortedData} // <-- pass `sortedData` instead of `summaryData`
            onCellClick={handleCellClick}
            handleExportSummary={handleExportSummary}
            loading={isLoading}
            exporting={exporting}
            clickedCell={clickedCell}
            setClickedCell={setClickedCell}
            sortOrder={setSortOrder}
            onHeaderClick={onHeaderClick} // <-- pass `onHeaderClick` function
          />
          {isLoading && <div className="progress-bar">Loading...</div>}
        </div>
      )}
      {!showTable && (
        <SummaryClickDiv
          jsonData={jsonData}
          toggleTable={toggleTable}
          setExporting={setExporting}
          clickedCell={clickedCell}
          sortOrder={setSortOrder}
          onHeaderClick={onHeaderClick}
        />
      )}
    </div>
  );
}
function SummaryTableBody({
  summaryData,
  onCellClick,
  handleExportSummary,
  loading,
  exporting,
  onHeaderClick,
}) {
  // <-- fix here
  return (
    <div id="fullpage" className="sticky-top top-0">
      
      <div id="exportbutton">
        {exporting ? (
          <span>Exporting...</span>
        ) : (
          <button
            id="button1"
            onClick={handleExportSummary}
            className="btn btn-primary"
            disabled={exporting}
          >
            Export Summary
          </button>
        )}
        {exporting && <div className="progress-bar" />}
      </div>
      <div id="firstTable">
        {loading ? (
          <div className="d-flex justify-content-center mt-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <table
            id="summaryTable"
            className="table table-hover table-condensed text-nowrap table-responsive"
          >
            <thead className="sticky-top top-0 table-primary">
              <tr>
                <th onClick={() => onHeaderClick("clientname")}>Client Name</th>
                <th onClick={() => onHeaderClick("total")}>Total</th>
                <th onClick={() => onHeaderClick("active")}>Active</th>
                <th onClick={() => onHeaderClick("stopped")}>Stopped</th>
                <th onClick={() => onHeaderClick("notYetReporting")}>
                  Not Yet
                </th>
                <th onClick={() => onHeaderClick("bleDevices")}>Ble device</th>
                <th onClick={() => onHeaderClick("blegateway")}>Ble gateway</th>
                <th onClick={() => onHeaderClick("intraffic")}>Intraffic</th>
                <th onClick={() => onHeaderClick("getfeedback")}>Feedback</th>
                <th onClick={() => onHeaderClick("occupancyDisplay")}>
                  Occupancy
                </th>
                <th onClick={() => onHeaderClick("batteryLow")}>Low battery</th>
                <th onClick={() => onHeaderClick("preStopped")}>
                  Previous Day
                </th>
                <th>Ble/wavy- increased</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row) => (
                <tr key={row[0].clientname}>
                  <td>{row[0].clientname}</td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Total",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getTotalDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].Total}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Active",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getActiveDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].Active}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Stopped",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getStoppedDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].Stopped}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Not Yet Reporting",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getNotyetDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].NotYetReporting}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "BLE",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getBleDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].BleDevices}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "BLE gateWay",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getBlegatewayDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].BLEGateWay}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Intraffic",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getIntrafficDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].IntrafficDevices}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Feedback",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getfeedbackDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].Feedback}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Occupancy Display",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getoccupancyDisplayDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].OccupancyDisplay}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "Battery Low",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getBatterylowDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].BatteryLow}
                  </td>
                  <td
                    onClick={() =>
                      onCellClick(
                        "preStopped",
                        row[0].clientname,
                        `${BASE_URL}/summaryDevice/getPreStoppedDevices`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {row[0].PreStopped}
                  </td>
                  <td
                    style={{
                      cursor: "pointer",
                      color:
                        row[0].Stopped > row[0].PreStopped
                          ? "red"
                          : row[0].Stopped < row[0].PreStopped
                          ? "green"
                          : "black",
                      fontWeight:
                        row[0].Stopped !== row[0].PreStopped
                          ? "bold"
                          : "normal",
                    }}
                  >
                    {row[0].Stopped - row[0].PreStopped}{" "}
                    {row[0].Stopped > row[0].PreStopped ? (
                      <FontAwesomeIcon icon={faArrowUp} />
                    ) : row[0].Stopped < row[0].PreStopped ? (
                      <FontAwesomeIcon icon={faArrowDown} />
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryClickDiv({
  jsonData,
  toggleTable,
  setExporting,
  exporting,
  clickedCell,
}) {
  const { clientName } = clickedCell || {};
  const { RName } = clickedCell || {};

  const downloadExcel = () => {
    setExporting(true);
    const table = document.getElementById("summary-table");
    const rows = [...table.querySelectorAll("tr")];
    const headerRow = rows.shift();
    const headerCols = [...headerRow.querySelectorAll("th")].map(
      (th) => th.textContent
    );
    const data = rows.map((row) =>
      [...row.querySelectorAll("td")].map((td) => td.textContent)
    );
    const worksheet = XLSX.utils.aoa_to_sheet([headerCols, ...data]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, clientName);
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });

    function s2ab(s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i += 1) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${RName} devices for ${clientName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const clearTable = () => {
    const table = document.getElementById("summary-table");
    const tbody = table.querySelector("tbody");
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }

    toggleTable(); // switch back to SummaryTableBody
  };

  const formatTimeStamp = (dateString) => {
    if (!dateString) {
      return ''; // or any default value you prefer
    }
  
    const isoDate = new Date(dateString);
    const formattedDate = isoDate.toISOString().replace('T', ' ').slice(0, 19);
    return formattedDate;
  };

  

  return (
    <div id="summaryclickdiv">
      <div id="fd"> </div>

      <div id="buttondiv" className="row">
        <div className="col-lg-6">
          {" "}
          <p> {` ${RName} devices for ${clientName}  `} </p>
        </div>
        <div className="col-lg-6">
          {exporting ? (
            <span>Exporting...</span>
          ) : (
            <button
              id="button2"
              onClick={downloadExcel}
              className="btn btn-primary"
              disabled={exporting}
            >
              Download Excel
            </button>
          )}
          {exporting && <div className="progress-bar" />}
          <button onClick={clearTable} className="btn btn-primary rounded-pill">
            <FontAwesomeIcon icon={faArrowAltCircleLeft} className="mr-2" />
          </button>
        </div>
      </div>

      <div id="jsonResult">
        <table
          id="summary-table"
          className="table table-bordered table-hover table-striped table-condensed text-nowrap table-responsive"
        >
          <thead className="sticky-top top-0 table-primary">
            <tr>
              <th>MacID</th>
              <th>Device Name</th>
              <th>Sensor ID</th>
              <th>Building Name</th>
              <th>Floor Name</th>
              <th>Area Name</th>
              <th>Sensor Value</th>
              <th>Battery Value</th>
              <th>Rssi Value</th>
              <th>Error Code </th>
              <th>Error Description </th>
              <th>Last ErrorMsg Time</th>
              <th>Last Reporting Time</th>
            </tr>
          </thead>
          <tbody>
            {jsonData.map((row) => (
              <tr key={row.deviceMacId}>
                <td>{row.deviceMacId}</td>
                <td>{row.deviceName}</td>
                <td>{row.deviceSensorId}</td>
                <td>{row.buildingName}</td>
                <td>{row.floorName}</td>
                <td>{row.areaName}</td>
                <td>{row.sensorValue}</td>
                <td>{row.batteryValue}</td>
                <td>{row.rssiValue}</td>
                <td>{row.errorCode}</td>
                <td>{row.errorDescription}</td>
                <td>{formatTimeStamp(row.lastErrorMsgTime)}</td>
                <td>{formatTimeStamp(row.lastReportingTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SummaryTable;
