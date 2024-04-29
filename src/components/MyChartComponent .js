import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import BASE_URL from './URLConfig.js';

const MyChartComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Make API request to fetch the data
        const response = await fetch(`${BASE_URL}/getSummary`);
        const data = await response.json();

        // Calculate the column sums
        const columnSums = {
          total: 0,
          active: 0,
          stopped: 0,
          notYetReporting: 0,
          bleDevices: 0,
          bleGateway: 0,
          intraffic: 0,
          getFeedback: 0,
          occupancyDisplay: 0,
          batteryLow: 0,
          preStopped: 0,
        };

        data.forEach((row) => {
          // Convert strings to integers using parseInt()
          columnSums.total += parseInt(row[0].total, 10);
          columnSums.active += parseInt(row[0].active, 10);
          columnSums.stopped += parseInt(row[0].stopped, 10);
          columnSums.notYetReporting += parseInt(row[0].notYetReporting, 10);
          columnSums.bleDevices += parseInt(row[0].bledevices, 10);
          columnSums.bleGateway += parseInt(row[0].blegateWay, 10);
          columnSums.intraffic += parseInt(row[0].intrafficDevices, 10);
          columnSums.getFeedback += parseInt(row[0].feedback, 10);
          columnSums.occupancyDisplay += parseInt(row[0].occupancyDisplay, 10);
          columnSums.batteryLow += parseInt(row[0].batteryLow, 10);
          columnSums.preStopped += parseInt(row[0].preStopped, 10);
        });

        // Set the chart data
        const formattedChartData = formatChartData(columnSums);
        setChartData(formattedChartData);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatChartData = (columnSums) => {
    return {
      labels: [
        'Total',
        'Active',
        'Stopped',
        'Not Yet Reporting',
        'BLE Devices',
        'BLE Gateway',
        'In Traffic',
        'Get Feedback',
        'Occupancy Display',
        'Battery Low',
        'Pre Stopped',
      ],
      datasets: [
        {
          label: 'Column Sums',
          backgroundColor: 'rgba(75,192,192,1)',
          borderColor: 'rgba(0,0,0,1)',
          borderWidth: 2,
          data: [
            columnSums.total,
            columnSums.active,
            columnSums.stopped,
            columnSums.notYetReporting,
            columnSums.bleDevices,
            columnSums.bleGateway,
            columnSums.intraffic,
            columnSums.getFeedback,
            columnSums.occupancyDisplay,
            columnSums.batteryLow,
            columnSums.preStopped,
          ],
        },
      ],
    };
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <h2>Column Sums Chart</h2>
          {chartData ? <Bar data={chartData} /> : <p>No data to display</p>}
        </div>
      )}
    </div>
  );
};

export default MyChartComponent;
