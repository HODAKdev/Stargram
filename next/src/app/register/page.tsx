"use client";

import styles from "./page.module.css";
import Input from "../input/input";
import Button from "../button/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
    const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({
    usernameExists: false,
    emailExists: false,
    passwordMismatch: false,
    requiredFields: false,
    invalidEmail: false,
    shortPassword: false
  });

  const handleInputChange = (name: keyof typeof formData, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // reset errors
    setErrors({
      usernameExists: false,
      emailExists: false,
      passwordMismatch: false,
      requiredFields: false,
      invalidEmail: false,
      shortPassword: false
    });

    console.log(document.cookie);

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors((prevErrors) => ({ ...prevErrors, passwordMismatch: true }));
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // Important for sending and receiving cookies
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Registration successful!");
        router.push("/");
      } else {
        if (data.message === "Username already exists.") {
          setErrors((prevErrors) => ({ ...prevErrors, usernameExists: true }));
        }
        if (data.message === "Email already exists.") {
          setErrors((prevErrors) => ({ ...prevErrors, emailExists: true }));
        }
        if (data.message === "Passwords do not match.") {
          setErrors((prevErrors) => ({ ...prevErrors, passwordMismatch: true }));
        }
        if (data.message === "All fields are required.") {
          setErrors((prevErrors) => ({ ...prevErrors, requiredFields: true }));
        }
        if (data.message === "Invalid email format.") {
          setErrors((prevErrors) => ({ ...prevErrors, invalidEmail: true }));
        }
        if (data.message === "Password is too short.") {
          setErrors((prevErrors) => ({ ...prevErrors, shortPassword: true }));
        }
        console.error("Registration failed:", data.message);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  return (
    <div className={styles.main}>
      <div className={`${styles.group} ${styles.firstGroup}`}>
        <h1 className={styles.mainText}>Create an account</h1>
        <h2 className={styles.text}>
          Already have an account? <span className={styles.highlight}>Login</span>
        </h2>
      </div>
      <div className={`${styles.inputs} ${styles.group}`}>
        {errors.usernameExists && <p className={styles.warn}>Username already exists.</p>}
        {errors.emailExists && <p className={styles.warn}>Email is already registered.</p>}
        {errors.passwordMismatch && <p className={styles.warn}>Passwords do not match.</p>}
        {errors.requiredFields && <p className={styles.warn}>All fields are required.</p>}
        {errors.invalidEmail && <p className={styles.warn}>Invalid email format.</p>}
        {errors.shortPassword && <p className={styles.warn}>Password is too short.</p>}
        <Input
          type="text"
          maxLength={32}
          placeholder="First name"
          value={formData.firstName}
          onChange={(value) => handleInputChange("firstName", value)}
        />
        <Input
          type="text"
          maxLength={32}
          placeholder="Last name"
          value={formData.lastName}
          onChange={(value) => handleInputChange("lastName", value)}
        />
        <Input
          type="text"
          maxLength={32}
          placeholder="Username"
          value={formData.username}
          onChange={(value) => handleInputChange("username", value)}
        />
        <Input
          type="email"
          maxLength={32}
          placeholder="Email"
          value={formData.email}
          onChange={(value) => handleInputChange("email", value)}
        />
        <Input
          type="password"
          maxLength={32}
          placeholder="Password"
          value={formData.password}
          onChange={(value) => handleInputChange("password", value)}
        />
        <Input
          type="password"
          maxLength={32}
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={(value) => handleInputChange("confirmPassword", value)}
        />
      </div>
      <div className={`${styles.group} ${styles.lastGroup}`}>
        <h2 className={styles.text}>
          By registering, you agree to the
          <span className={styles.highlight}> Terms & Conditions </span>
          and
          <span className={styles.highlight}> Privacy Policy </span>
          of the Stargram.
        </h2>
        <Button text="Register" onClick={handleSubmit} />
      </div>
    </div>
  );
}