import React, { useState, useEffect } from "react";
import BASE_URL from "./URLConfig.js";
import "./ZanDeviceData.css";
import * as XLSX from "xlsx";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faSync } from "@fortawesome/free-solid-svg-icons";

function ZanDeviceData() {
  const [deviceMacId, setDeviceMacId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(); // Define the isLoading state

  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const previousYears = [currentYear - 2, currentYear - 1, currentYear];

  const [selectedDate, setSelectedDate] = useState(
    `${currentYear}-${currentMonth}`
  );

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    console.log(event.target.value);
    // Your formatting logic here
  };

  const handleBlur = () => {
    if (
      deviceMacId.trim() !== "" &&
      year.trim() !== "" &&
      month.trim() !== "" &&
      selectedTopic.trim() !== ""
    ) {
      fetchTableData();
    }
  };

  const [year, month] = selectedDate.split("-");
  const formattedMonth = month.padStart(2, "0");
  const formattedDate = `${year}_${formattedMonth}`;

  useEffect(() => {
    if (deviceMacId && formattedDate) {
      // Fetch available topics based on inputs
      fetch(
        `${BASE_URL}/zanDeviceDataTable/getZanDeviceDataTopic?deviceMacId=${deviceMacId}&yearmonth=${formattedDate}`
      )
        .then((response) => response.json())
        .then((data) => {
          setAvailableTopics(data); // Assuming the response is an array of topics
        })
        .catch((error) => {
          console.error("Error fetching topics:", error);
        });
    }
  }, [deviceMacId, formattedDate]);

  const fetchTableData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/zanDeviceDataTable/getZanDeviceData?deviceMacId=${deviceMacId}&yearmonth=${formattedDate}&topic=${selectedTopic}`
      );
      const data = await response.json();
      setTableData(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching table data:", error);
    }
  };

  const handleRefreshClick = () => {
    fetchTableData();
  };

  useEffect(() => {
    if (deviceMacId && formattedDate && selectedTopic) {
      fetchTableData();
    }
  }, [deviceMacId, formattedDate, selectedTopic]);

  function exportToExcel(data, deviceMacId, formattedDate, selectedTopic) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Raw Data");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Device ${deviceMacId} ${formattedDate} ${selectedTopic}.xlsx`;
    link.click();
  }

  const formatTimeStamp = (dateString) => {
    if (!dateString) {
      return ''; // or any default value you prefer
    }
  
    const isoDate = new Date(dateString);
    const formattedDate = isoDate.toISOString().replace('T', ' ').slice(0, 19);
    return formattedDate;
  };
  return (
    <div>
      <div className="row" id="inputItems">
        <div className="col-md-3">
          <input
            type="text"
            class="form-control"
            value={deviceMacId}
            onChange={(event) => setDeviceMacId(event.target.value)}
            onBlur={() => handleBlur()}
            placeholder="Device Mac ID"
          />
        </div>

        <div className="col-md-3">
          <input
            className="form-control"
            type="month"
            value={selectedDate}
            onChange={handleDateChange}
            min={`${previousYears[0]}-01`}
            max={`${currentYear}-${currentMonth}`}
            placeholder="Select Year and Month"
            disabled={deviceMacId.trim() === ""}
          />
        </div>

        <div className="col-md-4">
          <select
            className="form-control"
            value={selectedTopic}
            onChange={(event) => setSelectedTopic(event.target.value)}
            disabled={deviceMacId.trim() === ""}
          >
            {availableTopics.length === 0 ? (
              <option value="">No topics available</option>
            ) : (
              <>
                <option value="">Select a topic</option>
                {availableTopics.map((topic) => (
                  <option key={topic.topic} value={topic.topic}>
                    {topic.topic}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="col-md-1">
          <button
            className="btn btn-primary"
            disabled={selectedTopic.trim() === ""}
            onClick={() =>
              exportToExcel(
                tableData,
                deviceMacId,
                formattedDate,
                selectedTopic
              )
            }
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
          </button>
        </div>
        <div className="col-md-1">
        <button className="btn btn-primary" onClick={handleRefreshClick} disabled={isLoading}>
        {isLoading ? (
          <FontAwesomeIcon icon={faSync} spin className="mr-1" />
        ) : (
          <FontAwesomeIcon icon={faSync} className="mr-1" />
        )}
        
      </button>
        </div>
      </div>
      {selectedTopic ? (
        <div className="table-container">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <table id="excel-table" className="custom-table table-hover table">
              <thead className="table-light">
                <tr>
                  <th>Device ID</th>
                  <th>Gateway ID</th>
                  <th>Topic</th>
                  <th>SNO</th>
                  <th>Published Time</th>
                  <th>UTC Time</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr key={`${item.deviceMacId}-${index}`}>
                    <td>{item.deviceMacId}</td>
                    <td>{item.gatewayId}</td>
                    <td>{item.topic}</td>
                    <td>{item.sNo}</td>
                    <td>{formatTimeStamp(item.publishedTime)}</td>
                    <td>{formatTimeStamp(item.utcTime)}</td>
                    <td>{item.msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <p>
            * Please enter the full deviceMacId
            <br />
            * Select a year and month,
            <br />* After selecting a topic, table data will be loaded.
          </p>
        </div>
      )}

      {/* Other components and UI elements */}
    </div>
  );
}

export default ZanDeviceData;
