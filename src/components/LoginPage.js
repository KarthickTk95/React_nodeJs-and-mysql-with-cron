import React, { useState,} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "./LoginPage.css";
import login_graphics from "./login_graphics.png";
import { useNavigate } from "react-router-dom";

import BASE_URL from "./URLConfig.js";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = () => {
    console.log("Login");
    if (username && password) {
      setIsLoading(true);
      fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json(); // Parse response body as JSON
          } else {
            throw new Error("Invalid username or password. Please try again.");
          }
        })
        .then((data) => {
          console.log("Data from server:", data);
          const authToken = data.token;
          const previousPath = window.location.pathname;

          // Inside the handleLogin function in LoginPage
          window.history.pushState(
            { isLoggedIn: true, previousPath },
            "",
            "/summary"
          );
          console.log("State after pushState:", window.history.state);

          // Store the token in local storage or a secure storage mechanism
          localStorage.setItem("authToken", authToken);
          // Update the state or do other things based on successful login
          localStorage.setItem("isLoggedIn", "true");
          // setIsLoggedIn(true);
          navigate("/summary"); // Use useNavigate directly here
        })
        .catch((error) => {
          console.error("Login failed:", error.message);
          alert(error.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      alert("Invalid username or password. Please try again.");
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  return (
    <div className="row">
      <div
        className="login-page2 col-lg-6"
        style={{ backgroundImage: `url(${login_graphics})` }}
      >
        {/* Your content for the left side of the page */}
      </div>
      <div className="login-page col-lg-6">
        <p>Login</p>
        <div id="idlogin" className="form-group border border-primary rounded">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={handleUsernameChange}
          />
          <FontAwesomeIcon icon={faUser} className="icon" />
        </div>
        <br />
        <div id="idlogin" className="form-group border border-primary rounded">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
          />
          <FontAwesomeIcon
            icon={showPassword ? faEyeSlash : faEye}
            onClick={togglePasswordVisibility}
          />
        </div>
        <br />
        <form>
          <button
            id="loginbutton"
            type="submit"
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
