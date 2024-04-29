import React, { useEffect, } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import NavBar from "./components/Navbar.js";
import LoginPage from "./components/LoginPage";
import SummaryTable from "./components/SummaryTable";
import StoppedDevice from "./components/StoppedDevice";
import Packetloss from "./components/Packetloss";
import ZanDeviceData from "./components/ZanDeviceData.js";
import Carparking from "./components/Carparking.js";
import ClientDevicesList from "./components/ClientDevicesList";

// // Move this outside of the App component
// function clearAuthToken(navigate) {
//   // Clear the authentication token from local storage
//   localStorage.removeItem("authToken");
//   // Use the replace option to replace the current entry in the history stack
//   navigate("/", { replace: true });
// }

function App() {
  useEffect(() => {
    const handlePopstate = (event) => {
      console.log("Popstate event triggered:", event);
      const currentPath = window.location.pathname;
      const isLoggedInFromState =
        event.state?.isLoggedIn !== undefined ? event.state.isLoggedIn : false;

      console.log("Current path:", currentPath);
      console.log("isLoggedInFromState:", isLoggedInFromState);

      if (currentPath === "/" && isLoggedInFromState === false) {
        localStorage.removeItem("isLoggedIn");

        // Call your logout function here
        console.log("Logout triggered upon back navigation from /summary to /");
        // Clear other relevant data or tokens
      }
    };
    window.addEventListener("popstate", handlePopstate);

    return () => {
      window.removeEventListener("popstate", handlePopstate);
    };
  }, []);

  console.log("Initial calling");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Routes with NavBar */}
        <Route
          path="/*"
          element={
            localStorage.getItem("isLoggedIn") === "true" ? (
              <>
                <NavBar />
                <Routes>
                  {/* ... (other routes with NavBar) */}
                  <Route path="/summary" element={<SummaryTable />} />
                  <Route path="/stopped" element={<StoppedDevice />} />
                  <Route path="/packetloss" element={<Packetloss />} />
                  <Route path="/zandevice" element={<ZanDeviceData />} />
                  <Route path="/carparking" element={<Carparking />} />
                  <Route
                    path="/clientdevices"
                    element={<ClientDevicesList />}
                  />
                </Routes>
              </>
            ) : (
              <Navigate to="/" replace={true} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
