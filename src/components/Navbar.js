import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { Dropdown } from "react-bootstrap";

import "./NavBar.css";

import logo from "./logo.png";

function NavBar() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');

  const location = useLocation();
  const pathName = location.pathname;
  const navigate = useNavigate();



  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    navigate('/');
  };

   // Print to console when on the login page
   

  useEffect(() => {
    if (!isLoggedIn && pathName !== "") {
      navigate("/");
    }
  }, [isLoggedIn, pathName]);
  
  const routeToPageName = {
    
    "/summary": "SUMMARY TABLE",
    "/stopped": "STOPPED DEVICE REPORT",
    "/packetloss": "PACKET LOSS REPORT",
    "/zandevice": "ZAN DEVICE DATA",
    "/carparking": "CAR PARKING DATA",
    "/clientdevices": "255 DEVICES LIST",
  };

  const currentPageName = routeToPageName[pathName] || "Unknown Page";
  
   // Print to console when on the login page
useEffect(() => {
  if (currentPageName === "/") {
    console.log('User is on the login page!');
  }
}, [currentPageName]);
 


  return (
    <nav>
      <img
        src={logo}
        alt="My Logo"
        style={{ marginRight: "10px", height: "50px" }}
      />
    
        <p style={{ fontSize: "20px", color: "#333", fontStyle: "normal" }}>
          {currentPageName}
        </p>
    
      <ul>
        
          <>
            <li>
              <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  REPORTS
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/summary">
                    SummaryTable
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/stopped">
                    Stopped Device Report
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/packetloss">
                    Packet Loss Report
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/zandevice">
                    ZanDeviceData
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/carparking">
                    Car parking Report
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/clientdevices">
                    255 Devices List
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </li>
            <li>
              <button className="btn btn-primary" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </li>
          </>
        
      </ul>
     
    </nav>
  );
}



export default NavBar;
