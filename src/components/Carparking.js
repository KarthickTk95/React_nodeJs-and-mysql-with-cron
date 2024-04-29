import React, { useState, useEffect } from "react";
import BASE_URL from "./URLConfig.js";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@popperjs/core";
import "bootstrap";
import "./Carparking.css";
import "react-datepicker/dist/react-datepicker.css";
import MultiDatePicker from "react-multi-date-picker"; // Use a unique name for the import
import DatePanel from "react-multi-date-picker/plugins/date_panel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

function Carparking() {
  const [data, setData] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [parkingBuildings, setParkingBuildings] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [dataToday, setDataToday] = useState([]); // State to store fetched data
  const [dataYesterDay, setDataYesterDay] = useState([]); // State to store fetched data
  const [counts, setCounts] = useState({ inCount: 0, outCount: 0 });
  const [percentage, setPercentage] = useState(0); // Provide an initial value for percentage
  const [todaycounts, setTodayCounts] = useState({ inCount: 0, outCount: 0 });
  const [todaypercentage, setTodayPercentage] = useState(0);
  const [, setTimeZone] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [dataMulti, setDataMulti] = useState([]); // Example
  const [multicounts, setMultiCounts] = useState({ inCount: 0, outCount: 0 });
  const [multipercentage, setMultiPercentage] = useState(0);
  const [exporting, setExporting] = useState(false); // Add a state for tracking export progress


  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const yesterdayYear = yesterday.getFullYear();
  const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
  const yesterdayDay = String(yesterday.getDate()).padStart(2, "0");

  const formattedYesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

  const handleDateChange = (dates) => {
    setSelectedDates(dates);
  };

  useEffect(() => {
    fetch(`${BASE_URL}/carParking/getParkingClients`)
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      const formattedClientId = selectedClientId.toLowerCase(); // Convert to lowercase
      fetch(
        `${BASE_URL}/carParking/getParkingBuildings?parkingClient=${formattedClientId}`
      )
        .then((response) => response.json())
        .then((data) => setParkingBuildings(data))
        .catch((error) => console.log(error));
    }
  }, [selectedClientId]);

  const handleBuildingCheckboxChange = (buildingName, isChecked) => {
    if (isChecked) {
      setSelectedBuildings([...selectedBuildings, buildingName]);
    } else {
      setSelectedBuildings(
        selectedBuildings.filter((name) => name !== buildingName)
      );
    }
  };

  const formattedStartDate = startDate.toISOString().split("T")[0];
  useEffect(() => {
    if (selectedBuildings.length > 0 && selectedClientId) {
      const formattedClientId = selectedClientId.toLowerCase(); // Convert to lowercase

      fetch(
        `${BASE_URL}/carParking/synopsys-summary?dates=${formattedStartDate}&parkingClient=${formattedClientId}&parkingBuildings=${selectedBuildings}`
      )
        .then((response) => response.json())
        .then((data) => {
          fetch(
            `${BASE_URL}/carParking/getBuildingInfo?parkingClient=${formattedClientId}&parkingBuildings=${selectedBuildings}`
          ) // Replace with your API endpoint
            .then((response) => response.json())
            .then((timeZoneData) => {
              setTimeZone(timeZoneData);

              data.forEach((item) => {
                const matchingTimeZone = timeZoneData.find(
                  (tz) => tz.buildingName === item.buildingName
                );
                if (matchingTimeZone) {
                  item.clientTime = matchingTimeZone.clientTime;
                }
              });

              setDataToday(data);
              // Process the API response if needed
              const TodaynewCounts = data.reduce(
                (acc, entry) => {
                  if (entry.entrenceType === "IN") {
                    acc.inCount += parseInt(entry.count, 10);
                  } else if (entry.entrenceType === "OUT") {
                    acc.outCount += parseInt(entry.count, 10);
                  }
                  return acc;
                },
                { inCount: 0, outCount: 0 }
              );

              const TodaynewPercentage = Math.round(
                100 - (TodaynewCounts.outCount / TodaynewCounts.inCount) * 100
              );

              setTodayCounts(TodaynewCounts);
              setTodayPercentage(TodaynewPercentage);
            })
            .catch((error) => {
              // Handle errors
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    }
    // This will trigger the API call whenever selectedBuildings or selectedClientId changes
  }, [selectedBuildings, selectedClientId, formattedStartDate]);

  useEffect(() => {
    if (selectedBuildings.length > 0 && selectedClientId) {
      const formattedClientId = selectedClientId.toLowerCase(); // Convert to lowercase

      fetch(
        `${BASE_URL}/carParking/synopsys-summary?dates=${formattedYesterday}&parkingClient=${formattedClientId}&parkingBuildings=${selectedBuildings}`
      )
        .then((response) => response.json())
        .then((data) => {
          fetch(
            `${BASE_URL}/carParking/getBuildingInfo?parkingClient=${formattedClientId}&parkingBuildings=${selectedBuildings}`
          ) // Replace with your API endpoint
            .then((response) => response.json())
            .then((timeZoneData) => {
              setTimeZone(timeZoneData);

              data.forEach((item) => {
                const matchingTimeZone = timeZoneData.find(
                  (tz) => tz.buildingName === item.buildingName
                );
                if (matchingTimeZone) {
                  item.clientTime = matchingTimeZone.clientTime;
                }
              });

              setDataYesterDay(data);

              const newCounts = data.reduce(
                (acc, entry) => {
                  if (entry.entrenceType === "IN") {
                    acc.inCount += parseInt(entry.count, 10);
                  } else if (entry.entrenceType === "OUT") {
                    acc.outCount += parseInt(entry.count, 10);
                  }
                  return acc;
                },
                { inCount: 0, outCount: 0 }
              );

              const newPercentage = Math.round(
                100 - (newCounts.outCount / newCounts.inCount) * 100
              );

              setCounts(newCounts);
              setPercentage(newPercentage); // Set the state values here
            })
            .catch((error) => {
              // Handle errors
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    }
    // This will trigger the API call whenever selectedBuildings or selectedClientId changes
  }, [selectedBuildings, selectedClientId, formattedYesterday]);

  useEffect(() => {
    if (selectedBuildings.length > 0 && selectedClientId) {
      const formattedClientId = selectedClientId.toLowerCase();
      selectedDates.forEach((date) => {
        const formattedDate = date.format("YYYY-MM-DD");

        fetch(
          `${BASE_URL}/carParking/synopsys-summary?dates=${formattedDate}&parkingClient=${formattedClientId}&parkingBuildings=${selectedBuildings}`
        )
          .then((response) => response.json())
          .then((data) => {
            fetch(
              `${BASE_URL}/carParking/getBuildingInfo?parkingClient=${formattedClientId}&parkingBuildings=${selectedBuildings}`
            )
              .then((response) => response.json())
              .then((timeZoneData) => {
                setTimeZone(timeZoneData);

                data.forEach((item) => {
                  const matchingTimeZone = timeZoneData.find(
                    (tz) => tz.buildingName === item.buildingName
                  );
                  if (matchingTimeZone) {
                    item.clientTime = matchingTimeZone.clientTime;
                  }
                });

                // Process the API response if needed
                const TodaynewCounts = data.reduce(
                  (acc, entry) => {
                    if (entry.entrenceType === "IN") {
                      acc.inCount += parseInt(entry.count, 10);
                    } else if (entry.entrenceType === "OUT") {
                      acc.outCount += parseInt(entry.count, 10);
                    }
                    return acc;
                  },
                  { inCount: 0, outCount: 0 }
                );

                const TodaynewPercentage = Math.round(
                  100 - (TodaynewCounts.outCount / TodaynewCounts.inCount) * 100
                );

                // Update state for this specific date
                setMultiCounts((prevCounts) => ({
                  ...prevCounts,
                  [formattedDate]: TodaynewCounts,
                }));
                setMultiPercentage((prevPercentages) => ({
                  ...prevPercentages,
                  [formattedDate]: TodaynewPercentage,
                }));
                setDataMulti((prevData) => ({
                  ...prevData,
                  [formattedDate]: data,
                }));
              })
              .catch((error) => {
                // Handle errors
                console.error(error);
              });
          })
          .catch((error) => {
            console.error(error);
          });
      });
    }
  }, [selectedBuildings, selectedClientId, selectedDates]);

  const handleDownload = async () => {
    setExporting(true);
  
    try {
      const formattedClientId = selectedClientId && selectedClientId.toLowerCase();
      const url = `${BASE_URL}/carParking/exportToExcelSeprateBuilding?dates=${selectedDates}&parkingClient=${formattedClientId}&parkingBuildings=${selectedBuildings}`;
  
      const response = await fetch(url);
      const blob = await response.blob();
  
      const filename = `carparking_data-${formattedClientId}-${selectedBuildings}-${selectedDates}.xlsx`;
  
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
  
      // Append the link to the body and trigger the download
      document.body.appendChild(link);
      link.click();
  
    } catch (error) {
      console.error("Error handling download:", error);
  
    } finally {
      setExporting(false);
    }
  };
  

  return (
    <div id="parkingweb">
      <div className="row" id="buttonsdiv">
        <div className="col-md-3">
          <div className="form-group">
            <label htmlFor="clientSelect"></label>
            <select
              id="clientSelect"
              className="form-control"
              value={selectedClientId}
              onChange={(e) => {
                const clientId = e.target.value;
                setSelectedClientId(clientId);
                const selectedClientObject = data.find(
                  (client) => client.id === parseInt(clientId)
                );

                if (selectedClientObject) {
                  setSelectedClient(selectedClientObject);
                } else {
                  setSelectedClient(null);
                }
              }}
            >
              {!selectedClient && <option value="">Select a Client</option>}
              {data.length > 0 &&
                data.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.client}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="col-md-3" id="buildingDropdown">
          <label htmlFor="buildingSelect"></label>
          <div className="dropdown">
            <button
              className="btn dropdown-toggle"
              type="button"
              id="buildingDropdown"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              disabled={!selectedClientId} // Disable the button if no client is selected
            >
              Select Buildings
            </button>
            <div className="dropdown-menu" aria-labelledby="buildingDropdown">
              {parkingBuildings.length > 0 &&
                parkingBuildings.map((building, index) => (
                  <div key={index} className="form-check">
                    <input
                      type="checkbox"
                      id={`buildingCheck${index}`}
                      className="form-check-input"
                      value={building.buildingName}
                      checked={selectedBuildings.includes(building.buildingName)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;

                        handleBuildingCheckboxChange(building.buildingName, isChecked);
                      }}
                    />
                    <label
                      htmlFor={`buildingCheck${index}`}
                      className="form-check-label"
                    >
                      {building.buildingName}
                    </label>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div>
            <MultiDatePicker
              multiple
              plugins={[<DatePanel />]}
              value={selectedDates}
              onChange={handleDateChange}
              maxDate={today}
              placeholder="select a multiple dates"
              style={{ height: "38px" }}
              disabled={!selectedBuildings || !selectedClientId}
            />
          </div>
        </div>
        <div className="col-md-3">
        {exporting ? (
    <span>Exporting...</span>
  ) : (
          <button
            className="btn"
            onClick={handleDownload}
            disabled={selectedDates.length === 0}
          >
            <FontAwesomeIcon icon={faDownload} /> Download
          </button>
           )}
           {exporting && <div className="progress-bar" />}
        </div>
      </div>
      
      {selectedClientId && (
      <div className="row" id="parkingTables">
        <div className="col-md-6" id="yesterdayTables">
          <div className="table table-hover table-bordered">
            <thead>
              <th colSpan={7} id="colspan">
                YESTERDAY {formattedYesterday}
              </th>
              <tr>
                <th>BuildingName</th>
                <th>areaId</th>
                <th>entrenceNumber</th>
                <th>entrenceType</th>
                <th>lastDeductionTime</th>
                <th>lastReportingTime</th>
                <th>count</th>
              </tr>
            </thead>

            <tbody>
              {dataYesterDay.map((item, index) => {
                // Parse the time strings into JavaScript Date objects
                const clientTime = new Date(item.clientTime);
                const lastReportingTime = new Date(item.lastReportingTime);

                // Calculate the time difference in milliseconds
                const timeDifferenceMs = clientTime - lastReportingTime;

                // Convert the time difference to minutes
                const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
                // Determine the color class based on the time difference
                const colorClass =
                  Math.abs(timeDifferenceMinutes) > 180
                    ? "table-danger"
                    : "table-success";

                return (
                  <tr key={index} className={colorClass}>
                    <td>{item.buildingName}</td>
                    <td>{item.areaId}</td>
                    <td>{item.entrenceNumber}</td>
                    <td>{item.entrenceType}</td>
                    <td>{item.LastDeductionTime}</td>
                    <td>{item.LastReportingTime}</td>
                    <td>{item.count}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="7">
                  <b>IN COUNT:</b> {counts.inCount}, <b>OUT COUNT:</b>{" "}
                  {counts.outCount}, <b>DIFFERENCE:</b> {percentage}%
                </td>
              </tr>
            </tbody>
          </div>
        </div>
        <div className="col-md-6" id="TodayTables">
          <div className="table table-hover table-bordered">
            <thead>
              <th colSpan={7} id="colspan">
                TODAY {formattedStartDate}
              </th>
              <tr>
                <th>BuildingName</th>
                <th>areaId</th>
                <th>entrenceNumber</th>
                <th>entrenceType</th>
                <th>lastDeductionTime</th>
                <th>lastReportingTime</th>
                <th>count</th>
              </tr>
            </thead>

            <tbody>
              {dataToday.map((item, index) => {
                // Parse the time strings into JavaScript Date objects
                const clientTime = new Date(item.clientTime);
                const lastReportingTime = new Date(item.lastReportingTime);

                // Check for NaN values in clientTime and lastReportingTime
                const isClientTimeNaN = isNaN(clientTime);
                const isLastReportingTimeNaN = isNaN(lastReportingTime);

                // Calculate the time difference in milliseconds
                const timeDifferenceMs = lastReportingTime - clientTime;

                // Convert the time difference to minutes
                const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
                // Determine the color class based on the time difference
                // Determine the color class based on the time difference and NaN values
                let colorClass = "";
                if (isClientTimeNaN || isLastReportingTimeNaN) {
                  colorClass = "table-danger";
                } else {
                  colorClass =
                    Math.abs(timeDifferenceMinutes) > 180
                      ? "table-danger"
                      : "table-success";
                }

                return (
                  <tr key={index} className={colorClass}>
                    <td>{item.buildingName}</td>
                    <td>{item.areaId}</td>
                    <td>{item.entrenceNumber}</td>
                    <td>{item.entrenceType}</td>
                    <td>{item.LastDeductionTime}</td>
                    <td>{item.LastReportingTime}</td>
                    <td>{item.count}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="7">
                  <b>IN COUNT:</b> {todaycounts.inCount}, <b>OUT COUNT:</b>{" "}
                  {todaycounts.outCount}, <b>DIFFERENCE:</b> {todaypercentage}%
                </td>
              </tr>
            </tbody>
          </div>
        </div>
       
      </div>
            )}
         
       

      <div className="row">
        {selectedDates.map((date) => {
          const formattedDate = date.format("YYYY-MM-DD"); // Format the date here

          // Filter data for the current date
          const filteredData = dataMulti[formattedDate] || [];

          return (
            <div key={formattedDate} className="col-md-6">
              <table className="table table-hover table-bordered border-primary">
                <thead class="table-light border-primary">
                  <tr>
                    <th colSpan={7} id="colspan">
                      {/* Render the date for the current table */}
                      {formattedDate}
                    </th>
                  </tr>
                  <tr>
                    <th>BuildingName</th>
                    <th>areaId</th>
                    <th>entrenceNumber</th>
                    <th>entrenceType</th>
                    <th>lastDeductionTime</th>
                    <th>count</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.buildingName}</td>
                      <td>{item.areaId}</td>
                      <td>{item.entrenceNumber}</td>
                      <td>{item.entrenceType}</td>
                      <td>{item.LastDeductionTime}</td>
                      <td>{item.count}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="7">
                      <b>IN COUNT:</b>{" "}
                      {multicounts[formattedDate]?.inCount || 0},{" "}
                      <b>OUT COUNT:</b>{" "}
                      {multicounts[formattedDate]?.outCount || 0},{" "}
                      <b>DIFFERENCE:</b>{" "}
                      {multipercentage[formattedDate]?.toFixed(2) || 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Carparking;
